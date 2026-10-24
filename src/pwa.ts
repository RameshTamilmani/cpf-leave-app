import type { VersionInfo } from './hooks/useAppUpdate';

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
    const close = () => { clearTimeout(timer); channel.port1.close(); };
    const timer = window.setTimeout(() => { close(); reject(new Error('The update worker did not respond. Please try again.')); }, 10000);
    channel.port1.onmessage = event => { close(); resolve(event.data); };
    try { worker.postMessage({ type }, [channel.port2]); } catch (error) { close(); reject(error); }
  });
}

export interface DownloadedRelease { worker: ServiceWorker; info: VersionInfo; }
export async function downloadedRelease(reg: ServiceWorkerRegistration, currentBuildId?: string): Promise<DownloadedRelease | null> {
  const candidates = [reg.waiting, reg.installing?.state === 'installed' ? reg.installing : null, reg.active];
  for (const worker of candidates) {
    if (!worker || worker.state === 'redundant') continue;
    const info = await workerMessage<VersionInfo>(worker, 'GET_RELEASE');
    if (typeof info.buildId === 'string' && info.buildId !== currentBuildId) return { worker, info };
  }
  return null;
}

// Attach listeners BEFORE update(), then wait for a fully installed release.
// A timeout or failed install is an error, never evidence that the app is current.
export function downloadRelease(reg: ServiceWorkerRegistration, currentBuildId?: string, expected?: VersionInfo | null, timeoutMs = 60000): Promise<DownloadedRelease | null> {
  return new Promise((resolve, reject) => {
    let finished = false;
    let checked = false;
    let quietTimer: number | undefined;
    const workers = new Set<ServiceWorker>();
    const cleanup = () => {
      clearTimeout(timer); clearTimeout(quietTimer);
      reg.removeEventListener('updatefound', watch);
      workers.forEach(worker => worker.removeEventListener('statechange', changed));
    };
    const finish = (release: DownloadedRelease | null, error?: unknown) => {
      if (finished) return;
      finished = true; cleanup();
      if (error) reject(error); else resolve(release);
    };
    const probe = async () => {
      if (finished || !checked) return;
      const installing = reg.installing;
      if (installing && !['installed', 'activated', 'redundant'].includes(installing.state)) return;
      try {
        const ready = await downloadedRelease(reg, currentBuildId);
        if (finished) return;
        if (ready && (!expected?.buildId || ready.info.buildId === expected.buildId || ready.info.buildTime >= expected.buildTime)) { finish(ready); return; }
        if (expected?.buildId && expected.buildId !== currentBuildId) return;
        if (!reg.installing && quietTimer === undefined) {
          quietTimer = window.setTimeout(() => { finish(null); }, 100);
        }
      } catch (error) { finish(null, error); }
    };
    const changed = (event: Event) => {
      const worker = event.target as ServiceWorker;
      if (worker.state === 'redundant' && (!reg.installing || reg.installing === worker)) {
        finish(null, new Error('Update download failed. Reconnect and check again.')); return;
      }
      void probe();
    };
    const watch = () => {
      clearTimeout(quietTimer); quietTimer = undefined;
      if (reg.installing && !workers.has(reg.installing)) {
        workers.add(reg.installing);
        reg.installing.addEventListener('statechange', changed);
      }
      void probe();
    };
    const timer = window.setTimeout(() => finish(null, new Error('The update is not ready yet. Check again when the download finishes.')), timeoutMs);
    reg.addEventListener('updatefound', watch); watch();
    reg.update().then(() => { checked = true; watch(); }).catch(async error => {
      try {
        const ready = await downloadedRelease(reg, currentBuildId);
        if (ready) finish(ready); else finish(null, new Error('Could not check for updates. Reconnect and try again.', { cause: error }));
      } catch (failure) { finish(null, failure); }
    });
  });
}

export function waitForActivation(worker: ServiceWorker) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); worker.removeEventListener('statechange', changed); };
    const changed = () => {
      if (worker.state === 'activated') { cleanup(); resolve(); }
      else if (worker.state === 'redundant') { cleanup(); reject(new Error('This update was replaced. Check for updates again.')); }
    };
    const timer = window.setTimeout(() => { cleanup(); reject(new Error('Update activation timed out. Please try again.')); }, 15000);
    worker.addEventListener('statechange', changed); changed();
  });
}
