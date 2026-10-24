import { useModalScrollLock } from '../hooks/useModalScrollLock';
import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import { generateNotifications, AppNotification } from '../utils/notifications';

export const NotificationsModal: React.FC = () => {
  const {
    isNotificationsOpen,
    setIsNotificationsOpen,
    setCurrentTab,
    markNotificationsAsViewed,
    settings,
    specialHolidays,
    allHolidays,
    records,
    todayDateStr
  } = useLeave();

  const [filterType, setFilterType] = useState<'ALL' | 'WISHES' | 'HOLIDAYS'>('ALL');

  React.useEffect(() => {
    if (isNotificationsOpen) {
      markNotificationsAsViewed();
    }
  }, [isNotificationsOpen, markNotificationsAsViewed]);

  useModalScrollLock(isNotificationsOpen);

  if (!isNotificationsOpen) return null;

  const allNotifications = generateNotifications(
    settings,
    specialHolidays,
    allHolidays,
    records,
    todayDateStr
  );

  const filteredNotifications = allNotifications.filter((n) => {
    if (filterType === 'WISHES') {
      return n.type === 'anniversary' || n.type === 'weekend';
    }
    if (filterType === 'HOLIDAYS') {
      return n.type === 'special_holiday' || n.type === 'public_holiday';
    }
    return true;
  });

  const celebrationNotifs = allNotifications.filter((n) => n.isCelebration);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4"
      onClick={() => setIsNotificationsOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-surface-card rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-surface-container animate-in slide-in-from-bottom-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-container text-on-primary-fixed flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-title-md text-title-md text-on-surface font-bold leading-tight">
                  Notifications &amp; Wishes
                </h2>
                <span className="px-2 py-0.2 rounded-full bg-surface-container-highest text-on-surface text-[11px] font-bold">
                  {allNotifications.length}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Anniversaries, Weekends &amp; Holiday Notices
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsNotificationsOpen(false)}
            aria-label="Close notifications"
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-low/70 border-b border-surface-container text-label-sm overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer shrink-0 ${
              filterType === 'ALL'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            All Alerts ({allNotifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('WISHES')}
            className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              filterType === 'WISHES'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span>🎉 Wishes &amp; Weekends</span>
            <span className="text-[10px] opacity-80">
              ({allNotifications.filter((n) => n.type === 'anniversary' || n.type === 'weekend').length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('HOLIDAYS')}
            className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              filterType === 'HOLIDAYS'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span>🇸🇬 Holidays</span>
            <span className="text-[10px] opacity-80">
              ({allNotifications.filter((n) => n.type === 'special_holiday' || n.type === 'public_holiday').length})
            </span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-3 flex-1">
          {/* Active Celebratory Highlight Banner if Anniversary or Weekend */}
          {celebrationNotifs.length > 0 && filterType === 'ALL' && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary-container/70 via-surface-card to-amber-500/15 border border-primary/20 shadow-xs flex items-center gap-3">
              <span className="text-3xl shrink-0">
                {celebrationNotifs[0].emoji || '🎊'}
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-title-sm text-title-sm font-bold text-on-surface block leading-tight">
                  {celebrationNotifs[0].title}
                </span>
                <span className="text-body-sm text-on-surface-variant text-[12px] line-clamp-2 mt-0.5">
                  {celebrationNotifs[0].subtitle}
                </span>
              </div>
            </div>
          )}

          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif: AppNotification) => {
              const isAnniv = notif.type === 'anniversary';
              const isWeekend = notif.type === 'weekend';
              const isSpecial = notif.type === 'special_holiday';
              const isPH = notif.type === 'public_holiday';

              const cardBg = isAnniv
                ? 'bg-amber-500/10 border-amber-500/25'
                : isWeekend
                ? 'bg-emerald-500/10 border-emerald-500/25'
                : isSpecial
                ? 'bg-purple-500/10 border-purple-500/25'
                : isPH
                ? 'bg-holiday-public-container text-holiday-public-on-container border-holiday-public/25'
                : 'bg-surface-container-low border-surface-container';

              const iconColor = isAnniv
                ? 'text-amber-600'
                : isWeekend
                ? 'text-emerald-600'
                : isSpecial
                ? 'text-purple-600'
                : isPH
                ? 'text-holiday-public'
                : 'text-primary';

              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border flex flex-col gap-2 transition-all ${cardBg}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-surface-card/80 flex items-center justify-center shrink-0 shadow-2xs">
                        {notif.emoji ? (
                          <span className="text-lg">{notif.emoji}</span>
                        ) : (
                          <span className={`material-symbols-outlined text-[20px] ${iconColor}`}>
                            {notif.icon}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-title-sm text-title-sm font-bold text-on-surface block truncate">
                          {notif.title}
                        </span>
                        <span className="text-xs text-on-surface-variant font-medium block truncate">
                          {notif.subtitle}
                        </span>
                      </div>
                    </div>

                    {notif.badgeText && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          notif.badgeClass || 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        {notif.badgeText}
                      </span>
                    )}
                  </div>

                  <p className="text-body-sm text-on-surface-variant leading-relaxed text-[12.5px] pl-0.5">
                    {notif.message}
                  </p>

                  {notif.actionText && notif.actionTab && (
                    <div className="pt-1.5 flex justify-end border-t border-surface-container/60">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          if (notif.actionTab) setCurrentTab(notif.actionTab);
                        }}
                        className="px-3 py-1 rounded-lg bg-surface-card hover:bg-surface-container text-primary font-label-sm text-label-sm font-semibold border border-surface-container transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <span>{notif.actionText}</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center flex flex-col items-center justify-center text-on-surface-variant gap-2">
              <span className="material-symbols-outlined text-[32px] opacity-40">notifications_off</span>
              <p className="font-body-sm text-body-sm">No notifications found in this category.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-surface-container-low border-t border-surface-container flex items-center justify-between">
          <span className="text-[11px] text-on-surface-variant font-medium">
            Automated Wishes Active
          </span>
          <button
            onClick={() => setIsNotificationsOpen(false)}
            className="px-4 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
