let registration: Promise<ServiceWorkerRegistration | null> | undefined;
export function registerAppWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return Promise.resolve(null);
  return registration ??= navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
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
