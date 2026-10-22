import { useState, useEffect, useCallback } from 'react';

export interface VersionInfo {
  version: string;
  buildTime: number;
  releaseDate?: string;
  releaseNotes?: string;
}

// Current bundled client build version
export const CURRENT_APP_VERSION = '1.2.1';
export const CURRENT_BUILD_TIME = 1729472400000;

const SNOOZE_STORAGE_KEY = 'cutisg_update_snooze_until';
const APPLIED_VERSION_STORAGE_KEY = 'cutisg_applied_version';

export function useAppUpdate() {
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  // Core update check logic against /version.json and active ServiceWorker
  const checkForUpdate = useCallback(async (isManual = false): Promise<{ hasUpdate: boolean; info?: VersionInfo }> => {
    // 1. Check if user snoozed the update within the last 6 hours
    try {
      const snoozeUntil = localStorage.getItem(SNOOZE_STORAGE_KEY);
      if (snoozeUntil && Date.now() < Number(snoozeUntil) && !isManual) {
        return { hasUpdate: false };
      }
    } catch {}

    setIsChecking(true);
    let foundUpdate = false;
    let fetchedInfo: VersionInfo | null = null;

    try {
      // 2. Check Service Worker registration for waiting workers (production / Vercel)
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            // Check if there is an existing worker waiting to activate
            if (reg.waiting) {
              foundUpdate = true;
              setWaitingWorker(reg.waiting);
            }
            // Trigger an explicit update check on the server
            reg.update().catch(() => {});
          }
        } catch (swErr) {
          console.warn('SW update check error:', swErr);
        }
      }

      // 3. Check /version.json with cache-busting timestamp
      const response = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });

      if (response.ok) {
        const data: VersionInfo = await response.json();
        fetchedInfo = data;

        // Check if user already updated to this version
        let alreadyApplied = false;
        try {
          const appliedVer = localStorage.getItem(APPLIED_VERSION_STORAGE_KEY);
          if (appliedVer && appliedVer === data.version) {
            alreadyApplied = true;
          }
        } catch {}

        // Compare versions or buildTime strictly
        if (!alreadyApplied && data.version && (data.version !== CURRENT_APP_VERSION || data.buildTime > CURRENT_BUILD_TIME)) {
          foundUpdate = true;
          setUpdateInfo(data);
        }
      }
    } catch (err) {
      console.warn('Version check error:', err);
    } finally {
      setIsChecking(false);
    }

    if (foundUpdate) {
      setHasUpdate(true);
      if (isManual) {
        setIsDismissed(false);
      }
      return { hasUpdate: true, info: fetchedInfo || undefined };
    }

    return { hasUpdate: false };
  }, []);

  // Listen for Service Worker updatefound & statechange events
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;

      if (reg.waiting) {
        setWaitingWorker(reg.waiting);
        setHasUpdate(true);
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version installed and waiting
            setWaitingWorker(newWorker);
            setHasUpdate(true);
          }
        });
      });
    }).catch(() => {});

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // Periodic and on-focus checks
  useEffect(() => {
    // Initial check after 4 seconds of stable loading
    const timer = setTimeout(() => {
      checkForUpdate(false);
    }, 4000);

    // Check when user switches back to the tab/app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Regular polling every 30 minutes
    const interval = setInterval(() => {
      checkForUpdate(false);
    }, 30 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdate]);

  // Apply update immediately and record that this version was successfully applied
  const applyUpdate = useCallback(() => {
    try {
      const versionToRecord = updateInfo?.version || CURRENT_APP_VERSION;
      localStorage.setItem(APPLIED_VERSION_STORAGE_KEY, versionToRecord);
      localStorage.removeItem(SNOOZE_STORAGE_KEY);
    } catch {}

    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    // Clear caches and reload
    if (typeof caches !== 'undefined') {
      caches.keys().then((names) => {
        Promise.all(names.map((name) => caches.delete(name))).finally(() => {
          window.location.reload();
        });
      }).catch(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }, [waitingWorker, updateInfo]);

  // Snooze update for 6 hours across browser sessions
  const dismissUpdate = useCallback(() => {
    try {
      const sixHoursFromNow = Date.now() + 6 * 60 * 60 * 1000;
      localStorage.setItem(SNOOZE_STORAGE_KEY, sixHoursFromNow.toString());
    } catch {}
    setIsDismissed(true);
  }, []);

  return {
    hasUpdate: hasUpdate && !isDismissed,
    isChecking,
    updateInfo,
    currentVersion: CURRENT_APP_VERSION,
    checkForUpdate,
    applyUpdate,
    dismissUpdate,
  };
}
