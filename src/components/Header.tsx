import React from 'react';
import { useLeave } from '../context/LeaveContext';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const Header: React.FC = () => {
  const {
    settings,
    setCurrentTab
  } = useLeave();

  const { isInstalled, isIOS, isAndroid, openGuide, install } = usePWAInstall();

  const handleHeaderInstall = () => {
    if (isIOS) {
      openGuide();
    } else {
      install();
    }
  };

  return (
    <header className="fixed top-0 w-full z-40 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="w-full h-16 flex items-center justify-between px-margin max-w-xl mx-auto">
        {/* App Title & Header Actions */}
        <div className="flex items-center gap-space-sm cursor-pointer" onClick={() => setCurrentTab('home')}>
          <img
            alt="CutiSG Logo"
            className="h-8 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4Hl0qrsn587Y7Cprf9V95gPRRXHNBEHoY_354UOCIO9hnegSPiO4s84KI57aT4LMg_voPaVKC6gYKLinolYM4QhWtsz6BVYjYptRSI4aAdGppWCDxjL4U8D5BSWgJce47C47aItGnFh4pkBPBt8qIrisV53ucEhoFknvP3iFRLoO8tBtptl2__xAWIUlRGEoUEsV9mfKbqomTMPUZOHULzS-2Td7zCWkSUEh9xDggefMeSyge1xik"
          />
          <div className="flex items-center gap-space-xs">
            <span className="font-title-md text-title-md text-on-surface leading-tight font-semibold">CutiSG</span>
          </div>
        </div>

        <div className="flex items-center gap-space-xs">
          {/* Suggest Install on Home Screen (ONLY shown when accessing via URL; hidden once installed) */}
          {!isInstalled && (
            <button
              type="button"
              onClick={handleHeaderInstall}
              className="h-8.5 px-2.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors border border-primary/20 active:scale-95 shadow-2xs mr-0.5"
              title={isAndroid ? 'Install CutiSG App on Home Screen' : isIOS ? 'Add CutiSG to iPhone Home Screen' : 'Install App'}
              aria-label="Install App"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isIOS ? 'add_to_home_screen' : 'get_app'}
              </span>
              <span className="text-[11.5px] font-bold">
                {isIOS ? 'Add to Home' : 'Install App'}
              </span>
            </button>
          )}


          <button
            onClick={() => setCurrentTab('settings')}
            aria-label="User profile"
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity overflow-hidden border border-primary-fixed shadow-xs"
            title={settings.userName || 'Settings'}
          >
            {settings.avatarUrl ? (
              <img src={settings.avatarUrl} alt="User" className="w-full h-full object-cover" />
            ) : settings.userName ? (
              <span className="text-on-primary font-bold text-sm">
                {settings.userName.slice(0, 1).toUpperCase()}
              </span>
            ) : (
              <span className="material-symbols-outlined text-[20px] text-on-primary">
                person
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
