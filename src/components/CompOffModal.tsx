import React from 'react';
import { useLeave } from '../context/LeaveContext';
import { addDaysToDate, formatDateDDMMYYYY } from '../data/singaporeHolidays2026';
import { useModalScrollLock } from '../hooks/useModalScrollLock';

export const CompOffModal: React.FC = () => {
  const {
    isCompOffModalOpen, setIsCompOffModalOpen, coAvailable, coUsed,
    autoCompOffEarned, manualCompOffCredits, crossedSaturdayHolidays, records, compOffCreditUsage,
    futureSaturdayHolidays, excludedHolidayDates, todayDateStr,
    cycleStartDateStr, cycleEndDateStr,
  } = useLeave();
  useModalScrollLock(isCompOffModalOpen);
  if (!isCompOffModalOpen) return null;

  const credited = crossedSaturdayHolidays.filter(h => !excludedHolidayDates.includes(h.date));
  const upcoming = futureSaturdayHolidays.filter(h => !excludedHolidayDates.includes(h.date));
  const totalCredited = autoCompOffEarned + manualCompOffCredits;
  const number = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="compoff-ledger-title" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg max-h-[88dvh] rounded-t-3xl sm:rounded-2xl bg-surface-card shadow-2xl border border-surface-container flex flex-col overflow-hidden">
        <header className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-b border-surface-container bg-surface-container-low">
          <div className="min-w-0">
            <h2 id="compoff-ledger-title" className="text-base font-bold text-on-surface">Comp-Off Ledger</h2>
            <p className="mt-1 text-xs text-on-surface-variant">{formatDateDDMMYYYY(cycleStartDateStr)} – {formatDateDDMMYYYY(cycleEndDateStr)}</p>
          </div>
          <button type="button" onClick={() => setIsCompOffModalOpen(false)} aria-label="Close modal" className="w-8 h-8 shrink-0 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer">
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </header>

        <div data-testid="ledger-scroll" className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 flex flex-col gap-4">
          <div className="rounded-xl bg-leave-compoff-container text-leave-compoff-on-container p-4">
            <p className="text-xs font-semibold">Available balance</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{number(coAvailable)} <span className="text-sm font-medium">day{coAvailable === 1 ? '' : 's'}</span></p>
            <p className="mt-1 text-xs">{number(coUsed)} used · Upcoming credits are not included.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300"><span aria-hidden="true" className="material-symbols-outlined text-[16px]">check_circle</span>Credited</p>
              <p className="mt-1 text-2xl font-bold text-on-surface tabular-nums">{number(totalCredited)}</p>
              <p className="mt-1 text-[11px] text-on-surface-variant">Already earned</p>
            </div>
            <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/20 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 dark:text-blue-300"><span aria-hidden="true" className="material-symbols-outlined text-[16px]">schedule</span>Upcoming</p>
              <p className="mt-1 text-2xl font-bold text-on-surface tabular-nums">{upcoming.length}</p>
              <p className="mt-1 text-[11px] text-on-surface-variant">Not yet credited</p>
            </div>
          </div>

          <section aria-label="Credited comp-offs" className="rounded-xl border border-emerald-200 dark:border-emerald-800/40 overflow-hidden shrink-0">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-800/40">
              <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Credited Comp-Offs</h3>
              <p className="mt-1 text-xs text-on-surface-variant">Earned credits. Each holiday can be selected once for a full-day application.</p>
            </div>
            <ul className="divide-y divide-surface-container">
              {credited.map(h => {
                const end = addDaysToDate(h.date, 90);
                const booking=records.find(r=>r.id===compOffCreditUsage.get(h.date));
                const usedDate=booking?.compOffCredits?.find(c=>c.holidayDate===h.date)?.leaveDate||booking?.startDate;
                return <li key={h.date} className="p-3 bg-surface-container-low flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 text-sm font-semibold text-on-surface break-words">{h.name}</p>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">+1 Credited</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Holiday: {formatDateDDMMYYYY(h.date)}</p>
                  {usedDate&&<p className="text-xs text-on-surface font-medium">Used for {formatDateDDMMYYYY(usedDate)}{booking?.days===0.5?' · Half Day':''}</p>}
                  <p className="text-[11px] text-on-surface-variant">90-day leave window: {formatDateDDMMYYYY(h.date)} – {formatDateDDMMYYYY(end)}{end <= todayDateStr ? ' · Window ended' : ''}</p>
                </li>;
              })}
              {manualCompOffCredits > 0 && <li className="p-3 text-sm text-on-surface">Manual credits: {number(manualCompOffCredits)}</li>}
            </ul>
            {credited.length === 0 && manualCompOffCredits === 0 && <p className="p-3 text-xs text-on-surface-variant">No comp-offs have been credited yet.</p>}
          </section>

          <section aria-label="Upcoming comp-offs" className="rounded-xl border border-blue-200 dark:border-blue-800/40 overflow-hidden shrink-0">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-800/40">
              <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300">Upcoming Comp-Offs</h3>
              <p className="mt-1 text-xs text-on-surface-variant">Scheduled holidays. These do not increase your available balance yet.</p>
            </div>
            <ul className="divide-y divide-surface-container">
              {upcoming.map(h => <li key={h.date} className="p-3 bg-surface-container-low flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-sm font-semibold text-on-surface break-words">{h.name}</p>
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">Upcoming</span>
                </div>
                <p className="text-xs text-on-surface-variant">Holiday: {formatDateDDMMYYYY(h.date)}</p>
                <p className="text-[11px] text-on-surface-variant">+1 credit after {formatDateDDMMYYYY(h.date)}.</p>
              </li>)}
            </ul>
            {upcoming.length === 0 && <p className="p-3 text-xs text-on-surface-variant">No upcoming comp-offs in this leave cycle.</p>}
          </section>
        </div>
        <footer className="shrink-0 px-5 py-3 border-t border-surface-container">
          <button type="button" onClick={() => setIsCompOffModalOpen(false)} className="w-full py-2.5 rounded-full bg-surface-container-high text-on-surface text-sm font-semibold cursor-pointer">Close</button>
        </footer>
      </div>
    </div>
  );
};
