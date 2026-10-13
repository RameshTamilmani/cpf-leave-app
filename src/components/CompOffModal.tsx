import React from 'react';
import { useLeave } from '../context/LeaveContext';

export const CompOffModal: React.FC = () => {
  const {
    isCompOffModalOpen,
    setIsCompOffModalOpen,
    coAvailable,
    autoCompOffEarned,
    saturdayCompOffHolidays,
    excludedHolidayDates,
    toggleHolidayCompOff,
    carryForwardCompOff,
    setCarryForwardCompOff,
    cycleStartDateStr,
    cycleEndDateStr,
    setIsEditCycleModalOpen,
    openApplyModal,
    settings
  } = useLeave();

  if (!isCompOffModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-surface-card rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-surface-container animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-leave-compoff">more_time</span>
            <div>
              <h2 className="font-title-md text-title-md text-on-surface font-bold">
                Comp-Off Ledger
              </h2>
              <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                <span>{cycleStartDateStr} – {cycleEndDateStr}</span>
                <button
                  onClick={() => setIsEditCycleModalOpen(true)}
                  className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  Edit
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

        {/* Content */}
        <div className="p-5 overflow-y-auto flex flex-col gap-3.5">
          {/* Available Comp-Off Summary Card */}
          <div className="p-4 rounded-xl bg-leave-compoff-container text-leave-compoff-on-container flex items-center justify-between shadow-xs">
            <div>
              <span className="font-label-sm text-label-sm uppercase font-semibold opacity-90">Available Balance</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-headline-lg font-bold">
                  {Number.isInteger(coAvailable) ? coAvailable : coAvailable.toFixed(1)}
                </span>
                <span className="font-title-sm font-semibold">Days</span>
              </div>
              <span className="font-label-sm text-label-sm opacity-80 block mt-0.5">
                {autoCompOffEarned} from Saturday PH{carryForwardCompOff > 0 ? ` + ${carryForwardCompOff} Carried Forward` : ''}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/70 flex items-center justify-center text-leave-compoff shrink-0">
              <span className="material-symbols-outlined text-[26px]">update</span>
            </div>
          </div>

          {/* Saturday Public Holidays List */}
          <div className="bg-surface-container-low rounded-xl p-3.5 border border-surface-container flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-title-sm text-title-sm font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-leave-compoff">event_available</span>
                <span>Saturday Holidays in Cycle</span>
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium bg-surface-container px-2 py-0.5 rounded-full">
                MOM Sec 88
              </span>
            </div>

            {saturdayCompOffHolidays.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {saturdayCompOffHolidays.map((h) => {
                  const isExcluded = excludedHolidayDates?.includes(h.date);
                  const isCNY = h.name.toLowerCase().includes('chinese new year');
                  return (
                    <div
                      key={h.date}
                      className="p-2.5 rounded-lg bg-surface-card border border-surface-container flex items-center justify-between text-body-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{h.emoji || '🇸🇬'}</span>
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
                            {h.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isExcluded ? (
                          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
                            Excluded
                          </span>
                        ) : (
                          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-leave-compoff-container text-leave-compoff font-bold">
                            +1 Day
                          </span>
                        )}
                        <button
                          onClick={() => toggleHolidayCompOff(h.date)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                            isExcluded
                              ? 'bg-primary text-on-primary hover:opacity-90'
                              : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                          }`}
                        >
                          {isExcluded ? 'Include' : 'Exclude'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-body-sm text-on-surface-variant py-2 text-center">
                No gazetted Saturday holidays in the current leave year cycle.
              </p>
            )}
          </div>

          {/* Prior Cycle Carry-Over */}
          <div className="bg-surface-container-low rounded-xl p-3.5 border border-surface-container flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="material-symbols-outlined text-[20px] text-primary shrink-0">history_toggle_off</span>
              <div className="min-w-0">
                <span className="font-title-sm text-title-sm text-on-surface font-semibold block">
                  Prior Cycle Carry-Over
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  Unused comp-off brought forward
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-label-sm text-label-sm font-bold bg-primary-fixed text-on-primary-fixed px-2.5 py-0.5 rounded-full">
                {carryForwardCompOff} Day{carryForwardCompOff !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-1">
                {carryForwardCompOff > 0 && (
                  <button
                    onClick={() => setCarryForwardCompOff(Math.max(0, carryForwardCompOff - 1))}
                    className="w-7 h-7 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high flex items-center justify-center cursor-pointer text-xs font-bold"
                    title="Decrease carry-over"
                  >
                    -
                  </button>
                )}
                <button
                  onClick={() => setCarryForwardCompOff(carryForwardCompOff + 1)}
                  className="w-7 h-7 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high flex items-center justify-center cursor-pointer text-xs font-bold"
                  title="Increase carry-over"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Book Leave CTA */}
          <button
            onClick={() => {
              setIsCompOffModalOpen(false);
              openApplyModal({ initialType: 'CO' });
            }}
            className="w-full py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-1"
          >
            <span className="material-symbols-outlined text-[18px]">beach_access</span>
            <span>Apply Leave Using Comp-Off</span>
          </button>
        </div>
      </div>
    </div>
  );
};
