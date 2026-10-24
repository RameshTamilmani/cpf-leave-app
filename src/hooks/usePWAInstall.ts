import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __deferredPrompt?: BeforeInstallPromptEvent | null;
  }
}

const PWA_INSTALLED_KEY = 'cutisg_pwa_installed';
const PWA_BANNER_SNOOZE_KEY = 'cutisg_pwa_banner_snooze';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__deferredPrompt) {
      return window.__deferredPrompt;
    }
    return null;
  });

  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isSamsungBrowser, setIsSamsungBrowser] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
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

    // 2. Platform and Browser detection
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      const isIPhoneOrIPad =
        /iphone|ipad|ipod/.test(ua) ||
        (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
      const isAndroidDevice = /android/.test(ua);
      const isSamsung = /samsungbrowser/i.test(ua);
      const isChromium = /chrome|chromium|crios/i.test(ua) && !isSamsung && !/edg|opr/i.test(ua);

      setIsIOS(isIPhoneOrIPad);
      setIsAndroid(isAndroidDevice);
      setIsSamsungBrowser(isSamsung);
      setIsChrome(isChromium);

      // Check banner snooze
      try {
        const snoozeUntil = localStorage.getItem(PWA_BANNER_SNOOZE_KEY);
        if (snoozeUntil && Date.now() < Number(snoozeUntil)) {
          setIsBannerDismissed(true);
        }
      } catch {}
    }

    // 3. Capture native Chromium/Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handlePromptReady = () => {
      if (window.__deferredPrompt) {
        setDeferredPrompt(window.__deferredPrompt);
      }
    };

    // 4. Detect when installation successfully finishes
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__deferredPrompt = null;
      setShowGuideModal(false);
      try {
        localStorage.setItem(PWA_INSTALLED_KEY, 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('cutisg-prompt-ready', handlePromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Initial check in case it was stored before this effect ran
    if (window.__deferredPrompt && !deferredPrompt) {
      setDeferredPrompt(window.__deferredPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('cutisg-prompt-ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  // Request native install prompt if available, or trigger guide modal
  const install = useCallback(async (): Promise<boolean> => {
    const activePrompt = deferredPrompt || (typeof window !== 'undefined' ? window.__deferredPrompt : null);

    if (activePrompt) {
      try {
        await activePrompt.prompt();
        const { outcome } = await activePrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          if (typeof window !== 'undefined') window.__deferredPrompt = null;
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
      // If no native prompt is captured (e.g. iOS Safari, Samsung Browser, or beforeinstallprompt pending), show tailored guide modal
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
    isInstallable: Boolean(deferredPrompt || (typeof window !== 'undefined' && window.__deferredPrompt)),
    isInstalled,
    isIOS,
    isAndroid,
    isSamsungBrowser,
    isChrome,
    isBannerDismissed,
    showGuideModal,
    install,
    openGuide,
    closeGuide,
    dismissBanner,
  };
}
