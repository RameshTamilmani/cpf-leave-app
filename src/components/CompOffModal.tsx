import React from 'react';
import { useLeave } from '../context/LeaveContext';
import { addDaysToDate, formatDateDDMMYYYY } from '../data/singaporeHolidays2026';

export const CompOffModal: React.FC = () => {
  const {
    isCompOffModalOpen,
    setIsCompOffModalOpen,
    coAvailable,
    autoCompOffEarned,
    expiredCompOffCount,
    oldCycleSaturdayHolidays,
    futureSaturdayHolidays,
    todayDateStr,
    cycleStartDateStr,
    cycleEndDateStr
  } = useLeave();

  if (!isCompOffModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-surface-card rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden border border-surface-container animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-leave-compoff">more_time</span>
            <div>
              <h2 className="font-title-md text-title-md text-on-surface font-bold">
                Comp-Off Ledger
              </h2>
              <div className="text-body-sm text-on-surface-variant">
                <span>{formatDateDDMMYYYY(cycleStartDateStr)} – {formatDateDDMMYYYY(cycleEndDateStr)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsCompOffModalOpen(false)}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex flex-col gap-3.5">
          {/* Main Available Balance Banner */}
          <div className="p-4 rounded-xl bg-leave-compoff-container text-leave-compoff-on-container flex items-center justify-between shadow-xs">
            <div>
              <span className="font-label-sm text-label-sm uppercase font-semibold opacity-90">Available Comp-Off Balance</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-headline-lg font-bold">
                  {Number.isInteger(coAvailable) ? coAvailable : coAvailable.toFixed(1)}
                </span>
                <span className="font-title-sm font-semibold">Days Available</span>
              </div>
              <span className="font-label-sm text-label-sm opacity-90 block mt-1">
                Leaves can be applied for both expired and non-expired comp-off days
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/70 flex items-center justify-center text-leave-compoff shrink-0">
              <span className="material-symbols-outlined text-[26px]">update</span>
            </div>
          </div>

          {/* Ledger Key Status Metrics */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-surface-container-low rounded-xl p-3 border border-surface-container flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">No. of Comp-Off Expired</span>
                <span className="material-symbols-outlined text-[18px] text-error">history_toggle_off</span>
              </div>
              <div className="mt-1">
                <span className="font-title-lg font-bold text-on-surface">{expiredCompOffCount}</span>
                <span className="text-xs text-on-surface-variant ml-1">Day{expiredCompOffCount !== 1 ? 's' : ''}</span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-0.5 leading-tight">
                Expired in cycle • Eligible for leave
              </span>
            </div>

            <div className="bg-surface-container-low rounded-xl p-3 border border-surface-container flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant">No. of Comp-Off Available</span>
                <span className="material-symbols-outlined text-[18px] text-leave-compoff">event_available</span>
              </div>
              <div className="mt-1">
                <span className="font-title-lg font-bold text-leave-compoff">{coAvailable}</span>
                <span className="text-xs text-on-surface-variant ml-1">Day{coAvailable !== 1 ? 's' : ''}</span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-0.5 leading-tight">
                Ready for leave application
              </span>
            </div>
          </div>

          {/* Section 1: Default Comp-Offs (Cycle Start Date to Current Date) */}
          <div className="bg-surface-container-low rounded-xl p-3.5 border border-surface-container flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">verified</span>
                <div>
                  <span className="font-title-sm text-title-sm font-semibold text-on-surface block leading-tight">
                    Default Comp-Offs in Cycle
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    {formatDateDDMMYYYY(cycleStartDateStr)} to {formatDateDDMMYYYY(todayDateStr)}
                  </span>
                </div>
              </div>

              <span className="font-label-sm text-label-sm font-bold bg-surface-container text-on-surface px-2.5 py-0.5 rounded-full">
                {oldCycleSaturdayHolidays.length} Credited Day{oldCycleSaturdayHolidays.length !== 1 ? 's' : ''}
              </span>
            </div>

            {oldCycleSaturdayHolidays.length > 0 ? (
              <div className="flex flex-col gap-1.5 pt-1">
                {oldCycleSaturdayHolidays.map((h) => {
                  const validityEnd = addDaysToDate(h.date, 90);
                  const isPreCycle = h.date < cycleStartDateStr;
                  return (
                    <div
                      key={h.date}
                      className="p-2.5 rounded-lg bg-surface-card border border-surface-container flex items-center justify-between text-body-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{h.emoji || '🇸🇬'}</span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-title-sm text-title-sm font-medium text-on-surface truncate">
                            {h.name}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            Holiday: {formatDateDDMMYYYY(h.date)} • 90-day Validity: Expired {formatDateDDMMYYYY(validityEnd)}
                            {isPreCycle && ` (Valid past cycle start ${formatDateDDMMYYYY(cycleStartDateStr)})`}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
                          Expired (Usable)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-surface-card text-xs text-on-surface-variant text-center">
                No Saturday holidays passed between {formatDateDDMMYYYY(cycleStartDateStr)} and {formatDateDDMMYYYY(todayDateStr)}.
              </div>
            )}
          </div>

          {/* Section 2: Future Saturday Holidays (Added based on SG calendar) */}
          <div className="bg-surface-container-low rounded-xl p-3.5 border border-surface-container flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-leave-compoff">calendar_month</span>
                <div>
                  <span className="font-title-sm text-title-sm font-semibold text-on-surface block leading-tight">
                    Future Saturday Holidays
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    Added automatically based on SG calendar after date passes
                  </span>
                </div>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium bg-surface-container px-2 py-0.5 rounded-full">
                SG Calendar
              </span>
            </div>

            {futureSaturdayHolidays.length > 0 ? (
              <div className="flex flex-col gap-2">
                {futureSaturdayHolidays.map((h) => {
                  const isCNY = h.name.toLowerCase().includes('chinese new year');
                  const hasPassed = h.date < todayDateStr;

                  return (
                    <div
                      key={h.date}
                      className="p-3 rounded-lg bg-surface-card border border-surface-container flex flex-col gap-2 text-body-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xl shrink-0">{h.emoji || '🇸🇬'}</span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-title-sm text-title-sm font-medium text-on-surface truncate flex items-center gap-1.5">
                              {h.name}
                              {isCNY && (
                                <span className="text-[10px] bg-primary-fixed text-on-primary-fixed px-1.5 py-0.1 rounded font-semibold shrink-0">
                                  2027
                                </span>
                              )}
                            </span>
                            <span className="font-label-sm text-label-sm text-on-surface-variant">
                              Holiday Date: {formatDateDDMMYYYY(h.date)}
                            </span>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="shrink-0 flex items-center">
                          {hasPassed ? (
                            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-leave-compoff-container text-leave-compoff font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">verified</span>
                              +1 Credited
                            </span>
                          ) : (
                            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              Upcoming
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-1 border-t border-surface-container/60 text-xs">
                        <span className="text-on-surface-variant">
                          {hasPassed
                            ? 'Credited automatically by app based on SG calendar'
                            : `Will be credited automatically after passing ${formatDateDDMMYYYY(h.date)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-body-sm text-on-surface-variant py-2 text-center">
                No future Saturday holidays in the remainder of this leave year cycle.
              </p>
            )}
          </div>

          {/* Close Action */}
          <button
            onClick={() => setIsCompOffModalOpen(false)}
            className="w-full py-2.5 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-variant active:scale-98 transition-all flex items-center justify-center cursor-pointer mt-1"
          >
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
