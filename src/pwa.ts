let registration: Promise<ServiceWorkerRegistration | null> | undefined;
export function registerAppWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return Promise.resolve(null);
  return registration ??= navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(error => {
    registration = undefined;
    throw error;
  });
}
export function workerMessage<T>(worker: ServiceWorker, type: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => { channel.port1.close(); reject(new Error('Update worker did not respond. Please try again.')); }, 10000);
    channel.port1.onmessage = event => {
      clearTimeout(timer);
      channel.port1.close();
      resolve(event.data);
    };
    worker.postMessage({ type }, [channel.port2]);
  });
}

export function waitForWorkerDownload(registration: ServiceWorkerRegistration, timeoutMs = 8000): Promise<void> {
  if (registration.waiting) {
    return Promise.resolve();
  }

  const waitWorkerState = (worker: ServiceWorker, remainingMs: number): Promise<void> => {
    if (worker.state === 'installed' || worker.state === 'activated') {
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      let resolved = false;
      const timer = window.setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve();
        }
      }, remainingMs);

      const cleanup = () => {
        clearTimeout(timer);
        worker.removeEventListener('statechange', changed);
      };

      const changed = () => {
        if (worker.state === 'installed' || worker.state === 'activated') {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve();
          }
        } else if (worker.state === 'redundant') {
          if (!resolved) {
            resolved = true;
            cleanup();
            reject(new Error('Update download failed. Please reconnect and try again.'));
          }
        }
      };

      worker.addEventListener('statechange', changed);
      changed();
    });
  };

  if (registration.installing) {
    return waitWorkerState(registration.installing, timeoutMs);
  }

  // If installing worker hasn't attached yet, wait for 'updatefound'
  return new Promise<void>((resolve) => {
    const startTime = Date.now();
    let resolved = false;

    const timer = window.setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve();
      }
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      registration.removeEventListener('updatefound', onUpdateFound);
    };

    const onUpdateFound = () => {
      cleanup();
      resolved = true;
      const newWorker = registration.installing;
      if (newWorker) {
        const remaining = Math.max(1000, timeoutMs - (Date.now() - startTime));
        void waitWorkerState(newWorker, remaining).then(resolve).catch(() => resolve());
      } else {
        resolve();
      }
    };

    registration.addEventListener('updatefound', onUpdateFound);
  });
}

