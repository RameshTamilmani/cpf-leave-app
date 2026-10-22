import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'button' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
}) => {
  const { isInstalled, isIOS, install, openGuide } = usePWAInstall();

  // Once installed, installer is never shown
  if (isInstalled) {
    return null;
  }

  const handleClick = () => {
    if (isIOS) {
      openGuide();
    } else {
      install();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-primary/20 ${className}`}
    >
      <span className="material-symbols-outlined text-[16px]">
        {isIOS ? 'add_to_home_screen' : 'get_app'}
      </span>
      <span>{isIOS ? 'Add to Home Screen' : 'Install App'}</span>
    </button>
  );
};
