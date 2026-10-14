import React from 'react';
import { useLeave } from '../context/LeaveContext';

export const Header: React.FC = () => {
  const {
    currentTab,
    settings,
    setIsNotificationsOpen,
    setCurrentTab,
    hasNewNotification,
    markNotificationsAsViewed
  } = useLeave();

  const getSubtitle = () => {
    switch (currentTab) {
      case 'home':
        return '';
      case 'calendar':
        return 'Leave Calendar';
      case 'history':
        return 'Leave History';
      case 'settings':
        return 'Settings & Policy';
      default:
        return '';
    }
  };

  const subtitle = getSubtitle();

  return (
    <header className="fixed top-0 w-full z-40 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="w-full h-24 flex flex-col justify-between pt-safe px-margin max-w-xl mx-auto">
        {/* Android system status bar mock */}
        <div className="flex items-center justify-between h-5 pt-1 text-on-surface-variant font-label-sm text-label-sm tracking-normal">
          <span className="font-semibold text-on-surface pl-1">09:41</span>
          <div className="flex items-center gap-space-xs pr-1">
            <span className="material-symbols-outlined text-[16px]">wifi</span>
            <span className="material-symbols-outlined text-[16px]">signal_cellular_alt</span>
            <span className="material-symbols-outlined text-[18px]">battery_full</span>
          </div>
        </div>

        {/* App Title & Header Actions */}
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-space-sm cursor-pointer" onClick={() => setCurrentTab('home')}>
            <img
              alt="CutiSG Logo"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4Hl0qrsn587Y7Cprf9V95gPRRXHNBEHoY_354UOCIO9hnegSPiO4s84KI57aT4LMg_voPaVKC6gYKLinolYM4QhWtsz6BVYjYptRSI4aAdGppWCDxjL4U8D5BSWgJce47C47aItGnFh4pkBPBt8qIrisV53ucEhoFknvP3iFRLoO8tBtptl2__xAWIUlRGEoUEsV9mfKbqomTMPUZOHULzS-2Td7zCWkSUEh9xDggefMeSyge1xik"
            />
            <div className="flex items-center gap-space-xs">
              <span className="font-title-md text-title-md text-on-surface leading-tight font-semibold">CutiSG</span>
              {subtitle && (
                <>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">•</span>
                  <span className="font-title-sm text-title-sm text-on-surface-variant">{subtitle}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-space-xs">
            <button
              onClick={() => {
                setIsNotificationsOpen(true);
                markNotificationsAsViewed();
              }}
              aria-label="Notifications"
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors relative cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">notifications</span>
              {hasNewNotification && (
                <>
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-holiday-public rounded-full animate-ping opacity-75" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-holiday-public rounded-full" />
                </>
              )}
            </button>
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
      </div>
    </header>
  );
};
