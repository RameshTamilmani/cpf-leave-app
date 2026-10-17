import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import { formatDateDDMMYYYY } from '../data/singaporeHolidays2026';

export const PublicHolidaysModal: React.FC = () => {
  const {
    isHolidaysModalOpen,
    setIsHolidaysModalOpen,
    setSelectedCalendarDate,
    setCurrentTab,
    allHolidays,
    upcomingHolidays,
    todayDateStr,
    deleteSpecialHoliday
  } = useLeave();

  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'special'>('upcoming');

  if (!isHolidaysModalOpen) return null;

  const filtered = allHolidays.filter((h) => {
    if (activeTab === 'upcoming') {
      const effectiveDate = h.observedDate && h.observedDate >= todayDateStr ? h.observedDate : h.date;
      return effectiveDate >= todayDateStr;
    }
    if (activeTab === 'special') return Boolean(h.isSpecial);
    return true;
  }).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-surface-card rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-surface-container animate-in slide-in-from-bottom-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-holiday-public">flag</span>
            <div>
              <h2 className="font-title-md text-title-md text-on-surface font-bold">
                Singapore Public Holidays
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                MOM Gazetted &amp; Special Proclamations
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsHolidaysModalOpen(false)}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Action & Filter Sub-bar */}
        <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2 border-b border-surface-container bg-surface-card">
          <div className="flex items-center gap-1.5 bg-surface-container-low p-1 rounded-full text-label-sm">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                activeTab === 'all' ? 'bg-primary text-on-primary font-bold shadow-2xs' : 'text-on-surface-variant'
              }`}
            >
              All ({allHolidays.length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                activeTab === 'upcoming' ? 'bg-primary text-on-primary font-bold shadow-2xs' : 'text-on-surface-variant'
              }`}
            >
              Upcoming ({upcomingHolidays.length})
            </button>
            <button
              onClick={() => setActiveTab('special')}
              className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                activeTab === 'special' ? 'bg-primary text-on-primary font-bold shadow-2xs' : 'text-on-surface-variant'
              }`}
            >
              Special ({allHolidays.filter((h) => h.isSpecial).length})
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex flex-col gap-2.5">
          {filtered.map((holiday) => {
            const dateObj = new Date(holiday.date + 'T00:00:00');
            const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });
            const dayNum = String(dateObj.getDate()).padStart(2, '0');
            const isPast = holiday.date < todayDateStr && (!holiday.observedDate || holiday.observedDate < todayDateStr);
            const isSat = dateObj.getDay() === 6 || Boolean(holiday.isCompOffEligible);

            const dToday = new Date(todayDateStr + 'T00:00:00');
            const diffDays = Math.ceil((dateObj.getTime() - dToday.getTime()) / (1000 * 60 * 60 * 24));
            const countdownLabel = !isPast ? (diffDays === 0 ? 'Today! 🎉' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`) : 'Past';

            return (
              <div
                key={holiday.date}
                onClick={() => {
                  setSelectedCalendarDate(holiday.date);
                  setIsHolidaysModalOpen(false);
                  setCurrentTab('calendar');
                }}
                className={`bg-surface-container-lowest hover:bg-surface-container-low rounded-xl p-3 shadow-xs border border-surface-container flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] ${
                  isPast ? 'opacity-65' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-holiday-public-container text-holiday-public-on-container flex flex-col items-center justify-center shrink-0">
                    <span className="font-label-sm text-label-sm font-bold uppercase leading-none">{monthShort}</span>
                    <span className="font-title-md text-title-md font-bold leading-tight">{dayNum}</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-title-sm text-title-sm font-semibold text-on-surface">{holiday.name}</h4>
                      <span className="text-sm">{holiday.emoji || '🇸🇬'}</span>
                      {holiday.isSpecial && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary-fixed text-on-primary-fixed">
                          Special
                        </span>
                      )}
                      {!isPast && (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant">
                          {countdownLabel}
                        </span>
                      )}
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {holiday.dayOfWeek} • {formatDateDDMMYYYY(holiday.date)}
                      {holiday.observedDate ? ` (Observed ${formatDateDDMMYYYY(holiday.observedDate)})` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-holiday-public-container text-holiday-public-on-container font-semibold">
                      0 leave needed
                    </span>
                    {isSat ? (
                      <span className="font-label-sm text-label-sm text-alert-warning font-semibold">
                        +1 Comp-Off Day
                      </span>
                    ) : holiday.isLongWeekend ? (
                      <span className="font-label-sm text-label-sm text-leave-compoff font-medium">
                        Long Weekend 🎉
                      </span>
                    ) : null}
                  </div>

                  {holiday.isSpecial && holiday.id && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSpecialHoliday(holiday.id!);
                      }}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-error hover:bg-error-container transition-colors cursor-pointer"
                      title="Remove special holiday"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-6 text-center text-on-surface-variant text-body-sm">
              No holidays found matching this filter.
            </div>
          )}
        </div>

        <div className="p-3 bg-surface-container-low border-t border-surface-container text-center">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Official Ministry of Manpower gazetted public holidays and special declarations for your leave planning.
          </p>
        </div>
      </div>
    </div>
  );
};
