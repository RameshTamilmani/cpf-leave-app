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
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed and running standalone, hide the prompt
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
      await install();
      setIsInstalling(false);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  // If not running in standalone, and is either installable via beforeinstallprompt or on iOS Safari:
  const canPrompt = isInstallable || isIOS;
  if (!canPrompt) {
    // Desktop/browser without beforeinstallprompt or already handled
    if (variant === 'card') {
      return (
        <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">install_mobile</span>
            </div>
            <div>
              <p className="font-title-sm text-title-sm text-on-surface font-semibold">Install CutiSG</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">Install via browser menu &ldquo;Add to Home screen&rdquo;</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

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

        {showIOSGuide && (
          <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
        )}
      </>
    );
  }

  // Card variant for Settings or Home
  if (variant === 'card') {
    return (
      <>
        <div className={`p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-fixed flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[22px]">install_mobile</span>
            </div>
            <div className="min-w-0">
              <p className="font-title-sm text-title-sm text-on-surface font-semibold truncate">Install CutiSG PWA</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px] truncate">
                {isIOS ? 'Add to iPhone / iPad Home Screen' : 'Offline MOM holiday calendar & fast access'}
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
            <span>{isIOS ? 'How to Install' : isInstalling ? 'Installing...' : 'Install'}</span>
          </button>
        </div>

        {showIOSGuide && (
          <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
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
        <span>{isIOS ? 'Install on iOS' : isInstalling ? 'Installing...' : 'Install CutiSG App'}</span>
      </button>

      {showIOSGuide && (
        <IOSInstallModal onClose={() => setShowIOSGuide(false)} />
      )}
    </>
  );
};

// Modal for iOS Safari users with step-by-step guidance
const IOSInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
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
            <h3 className="font-title-md text-title-md font-bold text-on-surface">Install on iPhone / iPad</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          Apple iOS Safari allows installation directly from the Safari toolbar without going through the App Store:
        </p>

        <div className="space-y-2.5 bg-surface-container-low p-3 rounded-xl border border-surface-container">
          <div className="flex items-start gap-2.5 text-body-sm">
            <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center shrink-0">1</span>
            <div>
              <p className="font-medium text-on-surface">Tap the <strong>Share</strong> button</p>
              <p className="text-[12px] text-on-surface-variant">Located at the bottom of the Safari screen (square with arrow up).</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-body-sm">
            <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center shrink-0">2</span>
            <div>
              <p className="font-medium text-on-surface">Select <strong>Add to Home Screen</strong></p>
              <p className="text-[12px] text-on-surface-variant">Scroll down the sharing options sheet and tap &ldquo;Add to Home Screen&rdquo;.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-body-sm">
            <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center shrink-0">3</span>
            <div>
              <p className="font-medium text-on-surface">Tap <strong>Add</strong></p>
              <p className="text-[12px] text-on-surface-variant">CutiSG will appear as an app icon with standalone full-screen access.</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
