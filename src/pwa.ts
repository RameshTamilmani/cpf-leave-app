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

export function waitForWorkerDownload(registration: ServiceWorkerRegistration) {
  const worker = registration.installing;
  if (!worker) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); worker.removeEventListener('statechange', changed); };
    const changed = () => {
      if (worker.state === 'installed' || worker.state === 'activated') { cleanup(); resolve(); }
      else if (worker.state === 'redundant') { cleanup(); reject(new Error('Update download failed. Please reconnect and try again.')); }
    };
    const timer = window.setTimeout(() => { cleanup(); reject(new Error('The update is still downloading. Please try again shortly.')); }, 30000);
    worker.addEventListener('statechange', changed);
    changed();
  });
}
