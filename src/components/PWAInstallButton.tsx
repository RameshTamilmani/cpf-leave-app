import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'button' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'button',
  className = ''
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed and running in standalone mode
  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-leave-compoff-container text-leave-compoff flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
            <div>
              <p className="font-title-sm text-title-sm text-on-surface font-semibold">CutiSG App Installed</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">Running in standalone home screen mode</p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-leave-compoff-container text-leave-compoff">
            Active PWA
          </span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        const accepted = await install();
        if (!accepted) {
          setShowInstallGuide(true);
        }
      } catch {
        setShowInstallGuide(true);
      } finally {
        setIsInstalling(false);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  // Header compact pill variant
  if (variant === 'header') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          aria-label="Install CutiSG App"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-container text-on-primary-fixed hover:bg-primary-fixed transition-all active:scale-95 text-xs font-semibold shadow-xs cursor-pointer ${className}`}
          title="Install CutiSG App to Home Screen"
        >
          <span className="material-symbols-outlined text-[16px]">download_for_offline</span>
          <span>Install App</span>
        </button>

        {showInstallGuide && (
          <UniversalInstallModal onClose={() => setShowInstallGuide(false)} isIOS={isIOS} />
        )}
      </>
    );
  }

  // Card variant for Settings
  if (variant === 'card') {
    return (
      <>
        <div className={`p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-fixed flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[22px]">install_mobile</span>
            </div>
            <div className="min-w-0">
              <p className="font-title-sm text-title-sm text-on-surface font-semibold truncate">Install CutiSG App</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px] truncate">
                {isIOS ? 'Add to iPhone / iPad Home Screen' : 'Offline MOM holiday calendar & instant access'}
              </p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isIOS ? 'ios_share' : 'download'}
            </span>
            <span>{isInstalling ? 'Installing...' : 'Install'}</span>
          </button>
        </div>

        {showInstallGuide && (
          <UniversalInstallModal onClose={() => setShowInstallGuide(false)} isIOS={isIOS} />
        )}
      </>
    );
  }

  // Default button variant
  return (
    <>
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer ${className}`}
      >
        <span className="material-symbols-outlined text-[18px]">
          {isIOS ? 'ios_share' : 'download'}
        </span>
        <span>{isInstalling ? 'Installing...' : 'Install CutiSG App'}</span>
      </button>

      {showInstallGuide && (
        <UniversalInstallModal onClose={() => setShowInstallGuide(false)} isIOS={isIOS} />
      )}
    </>
  );
};

// Modal providing guided install instructions across devices & browsers
const UniversalInstallModal: React.FC<{ onClose: () => void; isIOS: boolean }> = ({ onClose, isIOS }) => {
  const isInIframe = window.self !== window.top;

  const handleOpenDirectTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface-card p-5 shadow-2xl border border-surface-container flex flex-col gap-3.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-surface-container pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-primary">install_mobile</span>
            <h3 className="font-title-md text-title-md font-bold text-on-surface">Install CutiSG</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {isInIframe && (
          <div className="p-3 rounded-xl bg-primary-fixed/20 border border-primary/20 text-on-surface text-xs space-y-1.5">
            <p className="font-semibold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              Running in Web Preview
            </p>
            <p className="text-on-surface-variant">
              Browser security restricts PWA installation inside embedded iframes. Open the app in its own browser tab to install directly:
            </p>
            <button
              onClick={handleOpenDirectTab}
              className="w-full py-1.5 rounded-lg bg-primary text-on-primary font-semibold hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-1"
            >
              <span>Open in New Browser Window</span>
              <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
            </button>
          </div>
        )}

        {isIOS ? (
          <div className="space-y-2 bg-surface-container-low p-3 rounded-xl border border-surface-container">
            <p className="font-label-sm font-semibold text-on-surface mb-1">For iPhone / iPad (Safari):</p>
            <div className="flex items-start gap-2.5 text-body-sm">
              <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <div>
                <p className="font-medium text-on-surface">Tap <strong>Share</strong> button</p>
                <p className="text-[12px] text-on-surface-variant">Located at the bottom toolbar (square with upward arrow).</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-body-sm">
              <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <div>
                <p className="font-medium text-on-surface">Tap <strong>Add to Home Screen</strong></p>
                <p className="text-[12px] text-on-surface-variant">Scroll down in the share sheet and tap &ldquo;Add to Home Screen&rdquo;.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-body-sm">
              <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center shrink-0">3</span>
              <div>
                <p className="font-medium text-on-surface">Tap <strong>Add</strong></p>
                <p className="text-[12px] text-on-surface-variant">CutiSG will install on your home screen for instant offline access.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 bg-surface-container-low p-3 rounded-xl border border-surface-container">
            <p className="font-label-sm font-semibold text-on-surface mb-0.5">Desktop &amp; Android (Chrome / Edge):</p>
            <div className="flex items-start gap-2.5 text-body-sm">
              <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center shrink-0">1</span>
              <div>
                <p className="font-medium text-on-surface">Browser Menu or Address Bar</p>
                <p className="text-[12px] text-on-surface-variant">
                  Click the <strong>Install CutiSG</strong> icon in the address bar, or tap the three dots <strong>⋮</strong> menu.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-body-sm">
              <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center shrink-0">2</span>
              <div>
                <p className="font-medium text-on-surface">Select <strong>Install App</strong></p>
                <p className="text-[12px] text-on-surface-variant">
                  Choose &ldquo;Install CutiSG&rdquo; or &ldquo;Add to Home screen&rdquo; and click Confirm.
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-full bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
