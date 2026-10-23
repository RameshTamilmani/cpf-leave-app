import { useState, useEffect, useCallback, useRef } from 'react';

export interface ReleaseHighlight {
  title: string;
  description: string;
  icon?: string;
  color?: string;
}

export interface VersionInfo {
  version: string;
  buildTime: number;
  releaseDate?: string;
  releaseNotes?: string;
  highlights?: ReleaseHighlight[];
}

// Current bundled client build version
export const CURRENT_APP_VERSION = '1.3.0';
export const CURRENT_BUILD_TIME = 1729680000000;

const SNOOZE_STORAGE_KEY = 'cutisg_update_snooze_until';
const APPLIED_VERSION_STORAGE_KEY = 'cutisg_applied_version';
const UPDATE_IN_PROGRESS_KEY = 'cutisg_update_in_progress';

export function useAppUpdate() {
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const userInitiatedUpdateRef = useRef<boolean>(false);

  // Check if snooze is currently active (6 hours)
  const isSnoozed = useCallback(() => {
    try {
      const snoozeUntil = localStorage.getItem(SNOOZE_STORAGE_KEY);
      if (snoozeUntil && Date.now() < Number(snoozeUntil)) {
        return true;
      }
    } catch {}
    return false;
  }, []);

  // Core update check logic against /version.json and active ServiceWorker
  const checkForUpdate = useCallback(async (isManual = false): Promise<{ hasUpdate: boolean; info?: VersionInfo }> => {
    // 1. If snoozed and not a manual check, do not show any pop-up
    if (!isManual && isSnoozed()) {
      setHasUpdate(false);
      return { hasUpdate: false };
    }

    setIsChecking(true);
    let foundUpdate = false;
    let fetchedInfo: VersionInfo | null = null;

    try {
      // 2. Fetch /version.json with cache-busting timestamp (never cached)
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

        // STRICT CHECK: An update is ONLY valid if:
        // - Server version is NOT equal to CURRENT_APP_VERSION
        // - Server buildTime is strictly greater than CURRENT_BUILD_TIME
        // - Version has not already been marked as applied
        const isStrictlyNewer =
          Boolean(data.version) &&
          data.version !== CURRENT_APP_VERSION &&
          data.buildTime > CURRENT_BUILD_TIME &&
          !alreadyApplied;

        if (isStrictlyNewer) {
          foundUpdate = true;
          setUpdateInfo(data);
        } else {
          // If already on latest or same version, ensure update is marked false
          foundUpdate = false;
          setUpdateInfo(null);
        }
      }

      // 3. Inspect Service Worker without falsely assuming every SW install is a new version
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && reg.waiting) {
            setWaitingWorker(reg.waiting);
            // Only flag update if /version.json confirmed a strictly newer version
            if (foundUpdate) {
              setWaitingWorker(reg.waiting);
            }
          }
        } catch (swErr) {
          console.warn('[Update] SW check error:', swErr);
        }
      }
    } catch (err) {
      console.warn('[Update] Version check error:', err);
    } finally {
      setIsChecking(false);
    }

    if (foundUpdate && (!isSnoozed() || isManual)) {
      setHasUpdate(true);
      if (isManual) {
        setIsDismissed(false);
      }
      return { hasUpdate: true, info: fetchedInfo || undefined };
    }

    setHasUpdate(false);
    return { hasUpdate: false };
  }, [isSnoozed]);

  // Listen for Service Worker updatefound & statechange events
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;
    const handleControllerChange = () => {
      const inProgress = sessionStorage.getItem(UPDATE_IN_PROGRESS_KEY) === 'true';
      if (userInitiatedUpdateRef.current || inProgress) {
        if (!refreshing) {
          refreshing = true;
          sessionStorage.removeItem(UPDATE_IN_PROGRESS_KEY);
          window.location.reload();
        }
      }
    };
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            // Re-verify against /version.json before displaying any modal
            checkForUpdate(false);
          }
        });
      });
    }).catch(() => {});

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [checkForUpdate]);

  // Periodic and on-focus checks
  useEffect(() => {
    // Initial check after 3 seconds
    const timer = setTimeout(() => {
      checkForUpdate(false);
    }, 3000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      checkForUpdate(false);
    }, 30 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdate]);

  // Apply update ONLY when user explicitly clicks "Update Now"
  const applyUpdate = useCallback(() => {
    userInitiatedUpdateRef.current = true;
    try {
      sessionStorage.setItem(UPDATE_IN_PROGRESS_KEY, 'true');
      const versionToRecord = updateInfo?.version || CURRENT_APP_VERSION;
      localStorage.setItem(APPLIED_VERSION_STORAGE_KEY, versionToRecord);
      localStorage.removeItem(SNOOZE_STORAGE_KEY);
    } catch {}

    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }

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

  // Snooze update for exactly 6 hours
  const dismissUpdate = useCallback(() => {
    try {
      const sixHoursFromNow = Date.now() + 6 * 60 * 60 * 1000;
      localStorage.setItem(SNOOZE_STORAGE_KEY, sixHoursFromNow.toString());
    } catch {}
    setIsDismissed(true);
    setHasUpdate(false);
  }, []);

  return {
    hasUpdate: hasUpdate && !isDismissed && !isSnoozed(),
    isChecking,
    updateInfo,
    currentVersion: CURRENT_APP_VERSION,
    checkForUpdate,
    applyUpdate,
    dismissUpdate,
  };
}
