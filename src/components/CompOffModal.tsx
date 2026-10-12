import React from 'react';
import { useLeave } from '../context/LeaveContext';

export const CompOffModal: React.FC = () => {
  const {
    isCompOffModalOpen,
    setIsCompOffModalOpen,
    coAvailable,
    autoCompOffEarned,
    saturdayCompOffHolidays,
    manualCompOffCredits,
    addManualCompOffCredit,
    cycleStartDateStr,
    cycleEndDateStr,
    setIsEditCycleModalOpen,
    setIsAddSpecialHolidayOpen,
    openApplyModal,
    settings
  } = useLeave();

  if (!isCompOffModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-surface-card rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-surface-container animate-in slide-in-from-bottom-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-leave-compoff">more_time</span>
            <div>
              <h2 className="font-title-md text-title-md text-on-surface font-bold">
                Comp-off Ledger &amp; Expiry Tracker
              </h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Cycle: {settings.cycle}
                </span>
                <button
                  onClick={() => setIsEditCycleModalOpen(true)}
                  className="text-[11px] font-semibold text-primary hover:underline bg-primary-fixed/30 px-2 py-0.2 rounded-full cursor-pointer"
                >
                  Edit Cycle
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsCompOffModalOpen(false)}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          {/* Active Balance Card */}
          <div className="p-4 rounded-xl bg-leave-compoff-container text-leave-compoff-on-container flex items-center justify-between">
            <div>
              <span className="font-label-sm text-label-sm uppercase font-semibold">Available Comp-Off</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-headline-lg font-bold">
                  {Number.isInteger(coAvailable) ? coAvailable : coAvailable.toFixed(1)}
                </span>
                <span className="font-title-sm font-semibold">Days</span>
              </div>
              <span className="font-label-sm text-label-sm opacity-80 block mt-0.5">
                {autoCompOffEarned} Auto from Saturday PH + {manualCompOffCredits} Manual credits
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/70 flex items-center justify-center text-leave-compoff">
              <span className="material-symbols-outlined text-[28px]">update</span>
            </div>
          </div>

          {/* MOM Saturday PH Rule explanation & Auto-calculated listing */}
          <div className="bg-surface-container-high text-alert-warning rounded-xl p-4 flex flex-col gap-2.5 border border-surface-container">
            <div className="flex items-center justify-between">
              <span className="font-title-sm text-title-sm font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">event_available</span>
                MOM Saturday Auto-Accrual Policy
              </span>
              <span className="font-label-sm text-label-sm bg-surface-container-lowest px-2 py-0.5 rounded-full text-on-surface-variant font-medium">
                MOM 3-Mo Window
              </span>
            </div>

            {saturdayCompOffHolidays.length > 0 ? (
              <div className="bg-surface-container-lowest rounded-lg p-3 text-on-surface flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-title-sm text-title-sm font-semibold text-leave-compoff flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>{saturdayCompOffHolidays.length} Saturday Holiday Credit{saturdayCompOffHolidays.length !== 1 ? 's' : ''} in Cycle</span>
                  </span>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-leave-compoff-container text-leave-compoff font-bold">
                    +{saturdayCompOffHolidays.length} Days
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 pt-1 border-t border-surface-container text-body-sm">
                  {saturdayCompOffHolidays.map((h) => (
                    <div key={h.date} className="flex items-center justify-between py-1 border-b border-surface-container/40 last:border-none">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{h.emoji || '🇸🇬'}</span>
                        <div className="flex flex-col">
                          <span className="font-title-sm text-title-sm font-medium text-on-surface leading-tight">
                            {h.name}
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            Saturday, {h.date}
                          </span>
                        </div>
                      </div>
                      <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-leave-compoff-container text-leave-compoff font-bold">
                        +1 Day
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-lg p-3.5 text-on-surface flex flex-col items-center justify-center text-center gap-1.5">
                <span className="material-symbols-outlined text-[28px] text-on-surface-variant opacity-75">check_circle</span>
                <span className="font-title-sm text-title-sm font-semibold text-on-surface">No Gazetted Saturday Holidays in Cycle</span>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs leading-snug">
                  When a gazetted public holiday or special holiday falls on a Saturday during your active Leave Year Cycle, a 1-day comp-off credit automatically accrues.
                </p>
              </div>
            )}

            <div className="flex items-start gap-1.5 pt-0.5 text-on-surface-variant">
              <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5">info</span>
              <p className="font-label-sm text-label-sm leading-tight text-on-surface-variant">
                Under Singapore MOM Employment Act Section 88, employees on 5-day workweeks automatically receive +1 day off-in-lieu for public holidays on a Saturday.
              </p>
            </div>
          </div>

          {/* Quick claim overtime/weekend duty action */}
          <div className="bg-surface-container-low rounded-xl p-3.5 border border-surface-container flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[22px] text-primary">add_task</span>
              <div>
                <span className="font-title-sm text-title-sm text-on-surface font-semibold block">Record Weekend Work</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Claim +1 compensatory rest day
                </span>
              </div>
            </div>
            <button
              onClick={() => addManualCompOffCredit('+1 Comp-off credit added for weekend duty')}
              className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:opacity-95 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              + Log Duty
            </button>
          </div>

          {/* Take Comp Off CTA */}
          <button
            onClick={() => {
              setIsCompOffModalOpen(false);
              openApplyModal({ initialType: 'CO' });
            }}
            className="w-full py-3 rounded-full bg-leave-compoff-container text-leave-compoff-on-container font-label-lg text-label-lg font-semibold hover:bg-leave-compoff-container/80 transition-colors flex items-center justify-center gap-2 cursor-pointer border border-leave-compoff/20"
          >
            <span className="material-symbols-outlined text-[20px]">beach_access</span>
            <span>Book Leave Using Comp-Off Credit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
