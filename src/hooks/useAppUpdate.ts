import { useState, useEffect, useCallback } from 'react';
import { registerAppWorker, workerMessage, waitForWorkerDownload } from '../pwa';

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
    const worker = reg.waiting || (reg.installing?.state === 'installed' ? reg.installing : null) || reg.active;
    if (!worker) return { hasUpdate: false };
    const info = await workerMessage<VersionInfo>(worker, 'GET_RELEASE');
    const newer = !!info.buildId && info.buildId !== CURRENT_RELEASE.buildId;
    setTarget(newer ? worker : null);
    setUpdateInfo(newer ? info : null);
    setVisible(newer && (manual || !snoozed()));
    return { hasUpdate: newer, info: newer ? info : undefined };
  }, []);
  const checkForUpdate = useCallback(async (manual = false): Promise<{ hasUpdate: boolean; info?: VersionInfo; error?: string }> => {
    setIsChecking(true);
    try {
      if (manual) { try { localStorage.removeItem(SNOOZE_KEY); } catch {} }

      // 1. Fetch server release metadata directly
      let serverRelease: VersionInfo | null = null;
      try {
        const response = await fetch(`/version.json?_t=${Date.now()}`, { cache: 'no-store' });
        if (response.ok) {
          serverRelease = await response.json();
        }
      } catch {}

      const isServerNewer = Boolean(
        serverRelease && (
          (serverRelease.buildId && serverRelease.buildId !== CURRENT_RELEASE.buildId) ||
          (serverRelease.version && serverRelease.version !== CURRENT_RELEASE.version) ||
          (serverRelease.buildTime && serverRelease.buildTime > CURRENT_RELEASE.buildTime)
        )
      );

      const reg = await registerAppWorker();
      if (!reg) {
        if (isServerNewer && serverRelease) {
          setUpdateInfo(serverRelease);
          setVisible(true);
          return { hasUpdate: true, info: serverRelease };
        }
        return { hasUpdate: false };
      }

      if (navigator.onLine) {
        try {
          await reg.update();
        } catch {}
        await waitForWorkerDownload(reg, 6000);
      } else {
        const downloaded = await inspect(reg, manual);
        return downloaded.hasUpdate ? downloaded : { hasUpdate: false, error: 'Connect to the internet to check for updates.' };
      }

      const downloaded = await inspect(reg, manual);
      if (downloaded.hasUpdate) {
        return downloaded;
      }

      // If server has newer release, show it even if background worker is still finalizing
      if (isServerNewer && serverRelease) {
        if (reg.waiting) setTarget(reg.waiting);
        setUpdateInfo(serverRelease);
        setVisible(true);
        return { hasUpdate: true, info: serverRelease };
      }

      return { hasUpdate: false };
    } catch (error) {
      console.warn('Update check unavailable:', error);
      return { hasUpdate: false, error: error instanceof Error ? error.message : 'Update check failed. Please try again.' };
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

      // Automatically check for updates on app startup if online
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        void checkForUpdate(false);
      }
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
    const reg = await registerAppWorker();
    const activeTarget = target || reg?.waiting || (reg?.installing?.state === 'installed' ? reg.installing : null);

    if (activeTarget) {
      try {
        await workerMessage(activeTarget, 'APPROVE_UPDATE');
        if (activeTarget.state !== 'activated') {
          await new Promise<void>((resolve) => {
            const timer = window.setTimeout(() => { cleanup(); resolve(); }, 4000);
            const changed = () => {
              if (activeTarget.state === 'activated' || activeTarget.state === 'redundant') {
                cleanup();
                resolve();
              }
            };
            const cleanup = () => {
              clearTimeout(timer);
              activeTarget.removeEventListener('statechange', changed);
            };
            activeTarget.addEventListener('statechange', changed);
            changed();
          });
        }
      } catch (err) {
        console.warn('Worker approval fallback:', err);
      }
    }

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
