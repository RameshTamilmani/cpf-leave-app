import { useState, useEffect, useCallback } from 'react';
import { registerAppWorker, workerMessage } from '../pwa';

export interface ReleaseHighlight { title: string; description: string; icon?: string; color?: string; }
export interface VersionInfo {
  version: string; buildTime: number; buildId?: string;
  releaseDate?: string; releaseNotes?: string; highlights?: ReleaseHighlight[];
}
const CURRENT_RELEASE: VersionInfo = __APP_RELEASE__;
export const CURRENT_APP_VERSION = CURRENT_RELEASE.version;
export const CURRENT_BUILD_TIME = CURRENT_RELEASE.buildTime;
const SNOOZE_KEY = 'cutisg_update_snooze_until';
function snoozed() {
  try { return Date.now() < Number(localStorage.getItem(SNOOZE_KEY)); } catch { return false; }
}
export function useAppUpdate() {
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [visible, setVisible] = useState(false);
  const [target, setTarget] = useState<ServiceWorker | null>(null);
  const inspect = useCallback(async (reg: ServiceWorkerRegistration, manual = false) => {
    // A new worker can already be active after every app window was closed.
    // Its approved-release pointer still serves the old app until acceptance.
    const worker = reg.waiting || reg.active;
    if (!worker) return { hasUpdate: false };
    const info = await workerMessage<VersionInfo>(worker, 'GET_RELEASE');
    const newer = !!info.buildId && info.buildId !== CURRENT_RELEASE.buildId;
    setTarget(newer ? worker : null);
    setUpdateInfo(newer ? info : null);
    setVisible(newer && (manual || !snoozed()));
    return { hasUpdate: newer, info: newer ? info : undefined };
  }, []);
  const checkForUpdate = useCallback(async (manual = false) => {
    setIsChecking(true);
    try {
      const reg = await registerAppWorker();
      if (!reg) return { hasUpdate: false };
      if (navigator.onLine) await reg.update().catch(() => {});
      return await inspect(reg, manual);
    } catch (error) {
      console.warn('Update check unavailable:', error);
      return { hasUpdate: false };
    } finally { setIsChecking(false); }
  }, [inspect]);
  useEffect(() => {
    let disposed = false;
    const cleanups: (() => void)[] = [];
    registerAppWorker().then(reg => {
      if (!reg || disposed) return;
      const check = () => { void inspect(reg).catch(() => {}); };
      const watch = () => {
        const installing = reg.installing;
        if (!installing) return;
        const changed = () => { if (installing.state === 'installed') check(); };
        installing.addEventListener('statechange', changed);
        cleanups.push(() => installing.removeEventListener('statechange', changed));
      };
      reg.addEventListener('updatefound', watch);
      cleanups.push(() => reg.removeEventListener('updatefound', watch));
      watch(); check();
    }).catch(() => {});
    const check = () => { if (document.visibilityState === 'visible') void checkForUpdate(); };
    const timer = window.setInterval(check, 30 * 60 * 1000);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('online', check);
    return () => {
      disposed = true; clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('online', check);
      cleanups.forEach(cleanup => cleanup());
    };
  }, [checkForUpdate, inspect]);
  const applyUpdate = useCallback(async () => {
    if (!target) throw new Error('Update is not downloaded yet. Please try again.');
    const reg = await registerAppWorker();
    if (!reg) throw new Error('Offline updates are unavailable in this browser.');
    await workerMessage(target, 'APPROVE_UPDATE');
    // Wait for this exact worker to activate before navigating to its approved shell.
    if (target.state !== 'activated') await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => { cleanup(); reject(new Error('Update activation timed out. Please retry.')); }, 10000);
      const changed = () => {
        if (target.state === 'activated') { cleanup(); resolve(); }
        else if (target.state === 'redundant') { cleanup(); reject(new Error('A newer update is available. Reopen the app and retry.')); }
      };
      const cleanup = () => { clearTimeout(timer); target.removeEventListener('statechange', changed); };
      target.addEventListener('statechange', changed); changed();
    });
    try { localStorage.removeItem(SNOOZE_KEY); } catch {}
    window.location.reload();
  }, [target]);
  const dismissUpdate = useCallback(() => {
    try { localStorage.setItem(SNOOZE_KEY, String(Date.now() + 6 * 60 * 60 * 1000)); } catch {}
    setVisible(false);
  }, []);
  return { hasUpdate: visible, updateInfo, isChecking, currentVersion: CURRENT_APP_VERSION,
    checkForUpdate, applyUpdate, dismissUpdate };
}
