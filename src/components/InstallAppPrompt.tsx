import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppPromptProps {
  className?: string;
}

export const InstallAppPrompt: React.FC<InstallAppPromptProps> = ({ className = '' }) => {
  const {
    isInstalled,
    isInstallable,
    isIOS,
    isAndroid,
    isBannerDismissed,
    showGuideModal,
    install,
    openGuide,
    closeGuide,
    dismissBanner,
  } = usePWAInstall();

  // Once installed (running in standalone mode or after installation), installer is never shown
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = () => {
    if (isIOS) {
      openGuide();
    } else {
      install();
    }
  };

  return (
    <>
      {/* 1. Smart Suggestion Banner for URL Access */}
      {!isBannerDismissed && (
        <div
          className={`w-full max-w-xl mx-auto px-margin mb-3.5 animate-in fade-in slide-in-from-top-2 duration-300 ${className}`}
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary-container/40 to-surface-container-highest border border-primary/20 p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Background festive glow */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-primary/10 blur-xl pointer-events-none" />

            {/* Left Info: App Icon & Suggestion Text */}
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-white shadow-xs p-1.5 shrink-0 flex items-center justify-center border border-surface-container">
                <img
                  src="/pwa-192x192.png"
                  alt="CutiSG Logo"
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    // Fallback to logo or icon
                    (e.currentTarget as HTMLImageElement).src = '/icon.svg';
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-title-sm text-title-sm font-bold text-on-surface">
                    {isAndroid
                      ? 'Install CutiSG App'
                      : isIOS
                      ? 'Add to iPhone Home Screen'
                      : 'Install CutiSG on Home Screen'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold tracking-wide uppercase">
                    {isAndroid ? 'Android' : isIOS ? 'iPhone' : 'App'}
                  </span>
                </div>

                <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px] leading-snug mt-0.5">
                  {isAndroid
                    ? 'Install this as an app on your home screen for quick offline access and holiday alerts.'
                    : isIOS
                    ? 'Add the URL to your home screen to access CutiSG with instant full-screen experience.'
                    : 'Add to your home screen for instant access and full-screen leave management.'}
                </p>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => dismissBanner(24)}
                className="px-3 py-1.5 rounded-full text-on-surface-variant hover:bg-surface-container font-label-sm text-label-sm font-medium transition-colors cursor-pointer"
                title="Dismiss banner for 24 hours"
              >
                Later
              </button>

              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3.5 py-1.5 rounded-full bg-primary hover:opacity-95 active:scale-95 text-on-primary font-label-md text-label-md font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[17px]">
                  {isIOS ? 'add_to_home_screen' : 'get_app'}
                </span>
                <span>{isIOS ? 'Add to Home' : 'Install App'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Step-by-Step Installation Modal for Android & iPhone */}
      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={closeGuide}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-2xl border border-surface-container flex flex-col gap-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-container text-primary flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[26px]">
                    {isIOS ? 'apple' : isAndroid ? 'android' : 'install_mobile'}
                  </span>
                </div>
                <div>
                  <h3 className="font-title-md text-title-md font-bold text-on-surface">
                    {isIOS
                      ? 'Add to iPhone Home Screen'
                      : isAndroid
                      ? 'Install on Android'
                      : 'Install CutiSG App'}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">
                    {isIOS ? 'Quick 3-step setup in Safari' : 'Easy 1-tap installation'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeGuide}
                aria-label="Close guide"
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Device-Specific Steps */}
            {isIOS ? (
              /* iPhone / iPad Safari Instructions */
              <div className="space-y-3 bg-surface-container-low p-4 rounded-2xl border border-surface-container">
                <p className="text-[12px] font-semibold text-on-surface">
                  To add CutiSG to your iPhone Home Screen:
                </p>

                <div className="space-y-2.5 text-xs text-on-surface">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-primary text-on-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <span className="font-semibold">Tap the Share button</span>
                      <p className="text-on-surface-variant text-[11.5px] mt-0.5 flex items-center gap-1">
                        Tap the <span className="material-symbols-outlined text-[16px] text-primary">ios_share</span> icon in the Safari navigation bar at the bottom.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-primary text-on-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <span className="font-semibold">Select &ldquo;Add to Home Screen&rdquo;</span>
                      <p className="text-on-surface-variant text-[11.5px] mt-0.5 flex items-center gap-1">
                        Scroll down the menu and choose <span className="material-symbols-outlined text-[16px] text-primary">add_box</span> <strong>Add to Home Screen</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-primary text-on-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <span className="font-semibold">Tap &ldquo;Add&rdquo;</span>
                      <p className="text-on-surface-variant text-[11.5px] mt-0.5">
                        Tap <strong>Add</strong> in the top-right corner. CutiSG will appear on your home screen!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Android / Chromium / Desktop Instructions */
              <div className="space-y-3 bg-surface-container-low p-4 rounded-2xl border border-surface-container">
                <p className="text-[12px] font-semibold text-on-surface">
                  Install CutiSG as an app on your device:
                </p>

                <div className="space-y-2.5 text-xs text-on-surface">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-primary text-on-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <span className="font-semibold">
                        {isInstallable ? 'Direct 1-Tap Install' : 'Open Browser Menu'}
                      </span>
                      <p className="text-on-surface-variant text-[11.5px] mt-0.5">
                        {isInstallable
                          ? 'Tap the button below to prompt native installation immediately.'
                          : 'Tap the three dots (⋮) in your Chrome or browser address bar.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-primary text-on-primary font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <span className="font-semibold">Select &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;</span>
                      <p className="text-on-surface-variant text-[11.5px] mt-0.5">
                        Confirm the installation to place CutiSG directly onto your Android home screen.
                      </p>
                    </div>
                  </div>
                </div>

                {isInstallable && (
                  <button
                    type="button"
                    onClick={async () => {
                      const success = await install();
                      if (success) {
                        closeGuide();
                      }
                    }}
                    className="w-full mt-2 py-2.5 rounded-full bg-primary hover:opacity-95 text-on-primary font-label-md text-label-md font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    <span>Install Now</span>
                  </button>
                )}
              </div>
            )}

            {/* Footer Close Button */}
            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={closeGuide}
                className="w-full py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-colors cursor-pointer text-center"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
