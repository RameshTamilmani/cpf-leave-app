import { useState, useEffect, useCallback, useRef } from 'react';
import { registerAppWorker, downloadedRelease, downloadRelease, waitForActivation, workerMessage, type DownloadedRelease } from '../pwa';

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
interface CheckResult { hasUpdate: boolean; info?: VersionInfo; error?: string; }

export function useAppUpdate() {
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [visible, setVisible] = useState(false);
  const [target, setTarget] = useState<DownloadedRelease | null>(null);
  const inFlight = useRef<Promise<CheckResult> | null>(null);
  const showManually = useRef(false);
  const publish = useCallback((release: DownloadedRelease | null) => {
    setTarget(release); setUpdateInfo(release?.info || null);
    setVisible(!!release && (showManually.current || !snoozed()));
    return { hasUpdate: !!release, info: release?.info };
  }, []);

  const checkForUpdate = useCallback((manual = false): Promise<CheckResult> => {
    if (manual) {
      showManually.current = true;
      try { localStorage.removeItem(SNOOZE_KEY); } catch {}
    }
    if (inFlight.current) return inFlight.current;
    setIsChecking(true);
    const operation = async (): Promise<CheckResult> => {
      try {
        const reg = await registerAppWorker();
        if (!reg) return { hasUpdate: false, error: 'Update checks are available in the deployed app.' };
        if (!navigator.onLine) {
          const ready = await downloadedRelease(reg, CURRENT_RELEASE.buildId);
          return ready ? publish(ready) : { hasUpdate: false, error: 'Connect to the internet to check for updates.' };
        }
        let expected: VersionInfo | null = null;
        try {
          const response = await fetch(`/version.json?_t=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
          if (response.ok) {
            const data = await response.json();
            if (typeof data.buildId === 'string' && typeof data.version === 'string' && Number.isFinite(data.buildTime)) expected = data;
          }
        } catch {}
        // Server metadata tells us what to wait for; it never enables Update Now
        // until the worker has actually cached that release.
        const ready = await downloadRelease(reg, CURRENT_RELEASE.buildId, expected);
        return publish(ready);
      } catch (error) {
        return { hasUpdate: false, error: error instanceof Error ? error.message : 'Update check failed. Please try again.' };
      } finally {
        setIsChecking(false); inFlight.current = null; showManually.current = false;
      }
    };
    inFlight.current = operation();
    return inFlight.current;
  }, [publish]);

  useEffect(() => {
    let disposed = false;
    const cleanups: (() => void)[] = [];
    registerAppWorker().then(reg => {
      if (!reg || disposed) return;
      const check = () => { void checkForUpdate(); };
      const watch = () => {
        const worker = reg.installing;
        if (!worker) return;
        const changed = () => { if (worker.state === 'installed') check(); };
        worker.addEventListener('statechange', changed);
        cleanups.push(() => worker.removeEventListener('statechange', changed));
      };
      reg.addEventListener('updatefound', watch);
      cleanups.push(() => reg.removeEventListener('updatefound', watch));
      watch(); check();
    }).catch(() => {});
    const check = () => { if (document.visibilityState === 'visible') void checkForUpdate(); };
    const timer = window.setInterval(check, 30 * 60 * 1000);
    document.addEventListener('visibilitychange', check); window.addEventListener('online', check);
    window.addEventListener('appinstalled', check);
    return () => {
      disposed = true; clearInterval(timer);
      document.removeEventListener('visibilitychange', check); window.removeEventListener('online', check);
      window.removeEventListener('appinstalled', check); cleanups.forEach(cleanup => cleanup());
    };
  }, [checkForUpdate]);

  const applyUpdate = useCallback(async () => {
    if (!target) throw new Error('The update has not finished downloading. Check for updates again.');
    const info = await workerMessage<VersionInfo>(target.worker, 'GET_RELEASE');
    if (info.buildId !== target.info.buildId) throw new Error('The update changed. Check for updates again.');
    const result = await workerMessage<{ approved?: boolean; error?: string }>(target.worker, 'APPROVE_UPDATE');
    if (!result.approved) throw new Error(result.error || 'Update approval failed. Please try again.');
    await waitForActivation(target.worker);
    try { localStorage.removeItem(SNOOZE_KEY); } catch {}
    window.location.reload();
  }, [target]);
  const dismissUpdate = useCallback(() => {
    try { localStorage.setItem(SNOOZE_KEY, String(Date.now() + 6 * 60 * 60 * 1000)); } catch {}
    setVisible(false);
  }, []);
  return { hasUpdate: visible, updateInfo, isChecking, currentVersion: CURRENT_APP_VERSION, checkForUpdate, applyUpdate, dismissUpdate };
}
