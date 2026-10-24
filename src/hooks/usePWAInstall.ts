import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const PWA_INSTALLED_KEY = 'cutisg_pwa_installed';
const PWA_BANNER_SNOOZE_KEY = 'cutisg_pwa_banner_snooze';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    // 1. Detect if running in standalone (installed PWA) mode
    const checkIsStandalone = (): boolean => {
      if (typeof window === 'undefined') return false;

      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      const isAndroidApp = document.referrer.includes('android-app://');
      const isOverlay = window.matchMedia('(display-mode: window-controls-overlay)').matches;

      return Boolean(isStandaloneMedia || isIOSStandalone || isAndroidApp || isOverlay);
    };

    const standalone = checkIsStandalone();
    setIsInstalled(standalone);

    if (standalone) {
      try {
        localStorage.setItem(PWA_INSTALLED_KEY, 'true');
      } catch {}
    }

    // 2. Platform detection
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      const isIPhoneOrIPad =
        /iphone|ipad|ipod/.test(ua) ||
        (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
      const isAndroidDevice = /android/.test(ua);

      setIsIOS(isIPhoneOrIPad);
      setIsAndroid(isAndroidDevice);

      // 3. Check banner snooze
      try {
        const snoozeUntil = localStorage.getItem(PWA_BANNER_SNOOZE_KEY);
        if (snoozeUntil && Date.now() < Number(snoozeUntil)) {
          setIsBannerDismissed(true);
        }
      } catch {}
    }

    // 4. Capture native Chromium/Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 5. Detect when installation successfully finishes
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowGuideModal(false);
      try {
        localStorage.setItem(PWA_INSTALLED_KEY, 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Request native install prompt if available, or trigger guide modal
  const install = useCallback(async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          setShowGuideModal(false);
          try {
            localStorage.setItem(PWA_INSTALLED_KEY, 'true');
          } catch {}
          return true;
        }
        return false;
      } catch (err) {
        console.warn('Native install prompt failed, opening guide modal:', err);
        setShowGuideModal(true);
        return false;
      }
    } else {
      // Show device-specific instruction modal (Android or iOS)
      setShowGuideModal(true);
      return false;
    }
  }, [deferredPrompt]);

  const dismissBanner = useCallback((hours = 24) => {
    try {
      const snoozeTime = Date.now() + hours * 60 * 60 * 1000;
      localStorage.setItem(PWA_BANNER_SNOOZE_KEY, snoozeTime.toString());
    } catch {}
    setIsBannerDismissed(true);
  }, []);

  const openGuide = useCallback(() => {
    setShowGuideModal(true);
  }, []);

  const closeGuide = useCallback(() => {
    setShowGuideModal(false);
  }, []);

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    isAndroid,
    isBannerDismissed,
    showGuideModal,
    install,
    openGuide,
    closeGuide,
    dismissBanner,
  };
}

