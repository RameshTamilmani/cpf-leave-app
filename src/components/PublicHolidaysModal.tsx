import { useModalScrollLock } from '../hooks/useModalScrollLock';
import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import { formatDateDDMMYYYY } from '../data/singaporeHolidays2026';

export const PublicHolidaysModal: React.FC = () => {
  const { isHolidaysModalOpen, setIsHolidaysModalOpen, setSelectedCalendarDate, setCurrentTab,
    allHolidays, upcomingHolidays, todayDateStr, deleteSpecialHoliday } = useLeave();
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'special'>('upcoming');
  useModalScrollLock(isHolidaysModalOpen);
  if (!isHolidaysModalOpen) return null;

  const filtered = allHolidays.filter(h => {
    if (activeTab === 'upcoming') {
      const effectiveDate = h.observedDate && h.observedDate >= todayDateStr ? h.observedDate : h.date;
      return effectiveDate >= todayDateStr;
    }
    return activeTab === 'special' ? Boolean(h.isSpecial) : true;
  }).sort((a, b) => a.date.localeCompare(b.date));
  const filters = [
    { id: 'all', label: 'All', count: allHolidays.length },
    { id: 'upcoming', label: 'Upcoming', count: upcomingHolidays.length },
    { id: 'special', label: 'Special', count: allHolidays.filter(h => h.isSpecial).length },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs sm:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="public-holidays-title" className="w-full max-w-lg bg-surface-card rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90dvh] min-h-0 overflow-hidden border border-surface-container">
        <header className="flex items-start gap-3 px-4 sm:px-5 pt-5 pb-4 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-holiday-public-container text-holiday-public-on-container flex items-center justify-center shrink-0">
            <span aria-hidden="true" className="material-symbols-outlined text-[22px]">calendar_month</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="public-holidays-title" className="text-base font-bold leading-6 text-on-surface">Singapore Public Holidays</h2>
            <p className="text-xs leading-5 text-on-surface-variant">Official dates &amp; special holidays</p>
          </div>
          <button type="button" aria-label="Close public holidays" onClick={() => setIsHolidaysModalOpen(false)} className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0 cursor-pointer">
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </header>

        <div className="px-4 sm:px-5 pb-4 border-b border-surface-container shrink-0">
          <div role="group" aria-label="Filter holidays" className="grid grid-cols-3 gap-1 rounded-xl bg-surface-container-low p-1">
            {filters.map(filter => (
              <button key={filter.id} type="button" aria-pressed={activeTab === filter.id} onClick={() => setActiveTab(filter.id)} className={`min-w-0 px-1 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${activeTab === filter.id ? 'bg-primary text-on-primary shadow-2xs' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                {filter.label} <span className="opacity-80 tabular-nums">({filter.count})</span>
              </button>
            ))}
          </div>
        </div>

        <div data-testid="holiday-list" className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3">
          {filtered.map(holiday => {
            const dateObj = new Date(holiday.date + 'T00:00:00');
            const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });
            const dayNum = String(dateObj.getDate()).padStart(2, '0');
            const isPast = holiday.date < todayDateStr && (!holiday.observedDate || holiday.observedDate < todayDateStr);
            const isSat = dateObj.getDay() === 6 || Boolean(holiday.isCompOffEligible);
            const diffDays = Math.ceil((dateObj.getTime() - new Date(todayDateStr + 'T00:00:00').getTime()) / 86400000);
            const countdown = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`;
            const removable = holiday.isSpecial && holiday.id;

            return (
              <article key={`${holiday.date}-${holiday.name}`} className={`relative rounded-2xl border border-surface-container bg-surface-container-lowest shadow-xs ${isPast ? 'opacity-65' : ''}`}>
                <button type="button" onClick={() => {
                  setSelectedCalendarDate(holiday.date);
                  setIsHolidaysModalOpen(false);
                  setCurrentTab('calendar');
                }} className="w-full grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-3 p-3 sm:p-3.5 text-left rounded-2xl hover:bg-surface-container-low transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary">
                  <time dateTime={holiday.date} className="w-12 rounded-xl bg-holiday-public-container text-holiday-public-on-container flex flex-col items-center py-2 shrink-0 tabular-nums">
                    <span className="text-[10px] font-semibold leading-4">{monthShort}</span>
                    <span className="text-[22px] font-bold leading-6">{dayNum}</span>
                    <span className="text-[10px] leading-4 opacity-80">{dateObj.getFullYear()}</span>
                  </time>
                  <div className="min-w-0 space-y-2">
                    <div className={removable ? 'pr-8' : ''}>
                      <h3 className="text-sm font-semibold leading-5 text-on-surface break-words">{holiday.name} <span aria-hidden="true" className="whitespace-nowrap">{holiday.emoji || '🇸🇬'}</span></h3>
                      <p className="mt-1 text-xs leading-4 text-on-surface-variant">{holiday.dayOfWeek} · {formatDateDDMMYYYY(holiday.date)}</p>
                      {holiday.observedDate && <p className="mt-1 text-xs leading-4 text-on-surface-variant">Substitute: {formatDateDDMMYYYY(holiday.observedDate)}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] leading-4">
                      {!isPast && <span className="font-medium text-on-surface-variant">{countdown}</span>}
                      <span className="rounded-md bg-surface-container px-2 py-0.5 text-on-surface-variant">0 leave needed</span>
                      {holiday.isSpecial && <span className="rounded-md bg-primary-fixed px-2 py-0.5 text-on-primary-fixed font-medium">Special</span>}
                    </div>
                    {isSat ? <p className="text-[11px] leading-4 font-semibold text-alert-warning">+1 Comp-Off Day</p>
                      : holiday.isLongWeekend ? <p className="text-[11px] leading-4 font-medium text-leave-compoff">Long Weekend</p> : null}
                  </div>
                </button>
                {removable && <button type="button" aria-label={`Remove ${holiday.name}`} title="Remove special holiday" onClick={() => deleteSpecialHoliday(holiday.id!)} className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error-container cursor-pointer">
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px]">delete</span>
                </button>}
              </article>
            );
          })}
          {filtered.length === 0 && <p className="py-10 px-3 text-center text-sm text-on-surface-variant">No holidays found for this filter.</p>}
        </div>

        <footer className="px-5 py-3 border-t border-surface-container shrink-0 bg-surface-container-low">
          <p className="text-[11px] leading-4 text-center text-on-surface-variant">MOM public holidays and special dates. Tap a holiday to view it in Calendar.</p>
        </footer>
      </div>
    </div>
  );
};
