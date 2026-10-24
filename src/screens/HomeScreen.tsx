import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import { formatDateDDMMYYYY } from '../data/singaporeHolidays2026';
import { LeaveDetailModal, DetailCategory } from '../components/LeaveDetailModal';
import { EmployeeProfileCard } from '../components/EmployeeProfileCard';
import { generateNotifications } from '../utils/notifications';

export const HomeScreen: React.FC = () => {
  const {
    alAvailable,
    slAvailable,
    coAvailable,
    coUsed,
    autoCompOffEarned,
    manualCompOffCredits,
    alLOP,
    slLOP,
    totalLOP,
    specialHolidays,
    allHolidays,
    records,
    saturdayCompOffHolidays,
    expiredHolidayDates,
    expiredCompOffCount,
    upcomingHolidays,
    todayDateStr,
    settings,
    openApplyModal,
    setIsHolidaysModalOpen,
    setIsCompOffModalOpen,
    setIsAddSpecialHolidayOpen,
    setSelectedCalendarDate,
    setCurrentTab
  } = useLeave();

  const [activeDetailCategory, setActiveDetailCategory] = useState<DetailCategory | null>(null);
  const coTotal = autoCompOffEarned + manualCompOffCredits;

  // Next 4 strictly upcoming holidays (from current date onward)
  const displayedUpcomingHolidays = upcomingHolidays.slice(0, 4);

  // Generate contextual notifications to surface celebrations & wishes
  const notifications = generateNotifications(
    settings,
    specialHolidays,
    allHolidays,
    records,
    todayDateStr
  );
  const celebrationWish = notifications.find((n) => n.isCelebration);

  return (
    <div className="flex flex-col w-full px-margin pb-6 gap-3 max-w-xl mx-auto">
      <EmployeeProfileCard settings={settings} today={todayDateStr} onEdit={() => setCurrentTab('settings')} />

        {/* Home Screen Greeting Ribbon - Static, warm greeting (no popup modal) */}
        {celebrationWish && (
          <div className="p-2 px-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-primary-container/20 to-emerald-500/10 border border-amber-500/20 flex items-center gap-2 shadow-2xs">
            <span className="text-base shrink-0">{celebrationWish.emoji || '🎉'}</span>
            <div className="min-w-0 flex-1">
              <span className="text-[12px] font-bold text-on-surface block leading-tight truncate">
                {celebrationWish.title}
              </span>
              <span className="text-[10.5px] text-on-surface-variant block truncate">
                {celebrationWish.subtitle}
              </span>
            </div>
          </div>
        )}

      {/* 2. Leave Balance Cards (Clickable to view applied leaves list) */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-on-surface">Leave Balances</h2>
          <span className="text-[10.5px] text-on-surface-variant">Tap card to view details</span>
        </div>
        <div className="flex flex-col gap-2">
          {/* Annual Leave Card */}
          <article
            onClick={() => setActiveDetailCategory('AL')}
            className="w-full bg-leave-annual-container rounded-xl p-2.5 sm:p-3 min-h-14 shadow-2xs flex items-center justify-between gap-3 text-leave-annual-on-container cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-surface-container-lowest/80 flex items-center justify-center text-leave-annual shrink-0">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  beach_access
                </span>
              </div>
              <h3 className="text-sm font-semibold text-leave-annual-on-container leading-tight">
                Annual Leave
              </h3>
            </div>
            <div className="flex items-center justify-end gap-0.5 min-w-[4.5rem] shrink-0 text-right tabular-nums">
              <span className="text-lg font-bold text-leave-annual-on-container leading-none">
                {Number.isInteger(alAvailable) ? alAvailable : alAvailable.toFixed(1)}
              </span>
              <span className="text-lg font-bold text-leave-annual-on-container/70 leading-none">
                /{settings.alEntitlement}
              </span>
            </div>
          </article>

          {/* Sick Leave Card */}
          <article
            onClick={() => setActiveDetailCategory('SL')}
            className="w-full bg-leave-sick-container rounded-xl p-2.5 sm:p-3 min-h-14 shadow-2xs flex items-center justify-between gap-3 text-leave-sick-on-container cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-surface-container-lowest/80 flex items-center justify-center text-leave-sick shrink-0">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  medical_services
                </span>
              </div>
              <h3 className="text-sm font-semibold text-leave-sick-on-container leading-tight">
                Sick Leave
              </h3>
            </div>
            <div className="flex items-center justify-end gap-0.5 min-w-[4.5rem] shrink-0 text-right tabular-nums">
              <span className="text-lg font-bold text-leave-sick-on-container leading-none">
                {Number.isInteger(slAvailable) ? slAvailable : slAvailable.toFixed(1)}
              </span>
              <span className="text-lg font-bold text-leave-sick-on-container/70 leading-none">
                /{settings.slEntitlement}
              </span>
            </div>
          </article>

          {/* Comp-off Leave Card */}
          <article
            onClick={() => setActiveDetailCategory('CO')}
            className="w-full bg-leave-compoff-container rounded-xl p-2.5 sm:p-3 min-h-14 shadow-2xs flex items-center justify-between gap-3 text-leave-compoff-on-container cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-surface-container-lowest/80 flex items-center justify-center text-leave-compoff shrink-0">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  update
                </span>
              </div>
              <h3 className="text-sm font-semibold text-leave-compoff-on-container leading-tight">
                Comp-off Leave
              </h3>
            </div>
            <div title={`${coAvailable} available, ${coUsed} used`} aria-label={`${coAvailable} available, ${coUsed} used`} className="flex items-center justify-end gap-0.5 min-w-[4.5rem] shrink-0 text-right tabular-nums">
              <span className="text-lg font-bold text-leave-compoff-on-container leading-none">
                {Number.isInteger(coAvailable) ? coAvailable : coAvailable.toFixed(1)}
              </span>
              <span className="text-lg font-bold text-leave-compoff-on-container/70 leading-none">
                /{Number.isInteger(coTotal) ? coTotal : coTotal.toFixed(1)}
              </span>
            </div>
          </article>

          {/* Loss of Pay (LOP) Card */}
          <article
            onClick={() => setActiveDetailCategory('LOP')}
            className="w-full bg-rose-50/90 dark:bg-rose-950/30 rounded-xl p-2.5 sm:p-3 min-h-14 shadow-2xs flex items-center justify-between gap-3 text-rose-950 dark:text-rose-200 border border-rose-200/90 dark:border-rose-800/40 cursor-pointer hover:border-rose-300 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-300 shrink-0 shadow-2xs border border-rose-200 dark:border-rose-800/40">
                <span className="material-symbols-outlined text-[18px]">
                  money_off
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-semibold leading-tight">
                  Loss of Pay (LOP)
                </h3>
                {totalLOP > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                    Unpaid
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-0.5 min-w-[4.5rem] shrink-0 text-right tabular-nums">
              <span className={`text-lg font-bold leading-none ${totalLOP > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-rose-900/60 dark:text-rose-300/60'}`}>
                {Number.isInteger(totalLOP) ? totalLOP : totalLOP.toFixed(1)}
              </span>
            </div>
          </article>

          {/* Special Holidays Card */}
          <article
            onClick={() => setActiveDetailCategory('SPECIAL')}
            title="Special holidays in the current leave cycle"
            className="w-full bg-purple-50/90 dark:bg-purple-950/30 rounded-xl p-2.5 sm:p-3 min-h-14 shadow-2xs flex items-center justify-between gap-3 text-purple-950 dark:text-purple-200 border border-purple-200/90 dark:border-purple-800/40 cursor-pointer hover:border-purple-300 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-700 dark:text-purple-300 shrink-0 shadow-2xs border border-purple-200 dark:border-purple-800/40">
                <span className="material-symbols-outlined text-[18px]">
                  celebration
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-semibold leading-tight">
                  Special Holidays
                </h3>
                {specialHolidays.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                    Current cycle
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-0.5 min-w-[4.5rem] shrink-0 text-right tabular-nums">
              <span className="text-lg font-bold leading-none text-purple-700 dark:text-purple-300">
                {specialHolidays.length}
              </span>
            </div>
          </article>
        </div>
      </section>

      {/* 3. Quick Action Buttons - Leave History and Comp-off Ledger */}
      <section className="flex flex-col gap-2 mt-0.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-on-surface">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Move to History Tab Button */}
          <button
            onClick={() => setCurrentTab('history')}
            className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-lowest border border-surface-container hover:bg-surface-container transition-all cursor-pointer text-left shadow-2xs active:scale-[0.99]"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-fixed flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">history</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-on-surface truncate">Leave History</p>
              <p className="text-[10px] text-on-surface-variant truncate">View all leaves</p>
            </div>
          </button>

          {/* Comp-off Ledger Button */}
          <button
            onClick={() => setIsCompOffModalOpen(true)}
            className="w-full flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-lowest border border-surface-container hover:bg-surface-container transition-all cursor-pointer text-left shadow-2xs active:scale-[0.99]"
          >
            <div className="w-8 h-8 rounded-lg bg-leave-compoff-container text-leave-compoff-on-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">more_time</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-on-surface truncate">Comp-off Ledger</p>
              <p className="text-[10px] text-on-surface-variant truncate">Saturday credits</p>
            </div>
          </button>
        </div>
      </section>

      {/* 5. Upcoming Public Holidays */}
      <section className="flex flex-col gap-2 mt-0.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold text-on-surface">
              Upcoming Public Holidays
            </h2>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-holiday-public-container text-holiday-public font-bold">
              {upcomingHolidays.length}
            </span>
          </div>

          <button
            onClick={() => setIsHolidaysModalOpen(true)}
            className="text-[11px] text-primary font-semibold hover:underline cursor-pointer"
          >
            View All ({upcomingHolidays.length})
          </button>
        </div>

        {displayedUpcomingHolidays.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {displayedUpcomingHolidays.map((holiday) => {
              const d = new Date(holiday.date + 'T00:00:00');
              const isSat = d.getDay() === 6;

              const todayObj = new Date(todayDateStr + 'T00:00:00');
              const targetDateObj = new Date(holiday.date + 'T00:00:00');
              const diffTime = targetDateObj.getTime() - todayObj.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              let countdownLabel = `${diffDays}d away`;
              if (diffDays === 0) countdownLabel = 'Today';
              else if (diffDays === 1) countdownLabel = 'Tomorrow';

              return (
                <div
                  key={holiday.date}
                  onClick={() => {
                    setSelectedCalendarDate(holiday.date);
                    setIsHolidaysModalOpen(true);
                  }}
                  className="bg-surface-container-lowest rounded-xl p-2 sm:p-2.5 shadow-2xs flex items-center justify-between transition-transform active:scale-[0.99] border border-surface-container hover:bg-surface-container-low cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="px-2 py-1 rounded-md bg-holiday-public-container text-holiday-public-on-container flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10.5px] font-bold font-mono leading-tight">
                        {formatDateDDMMYYYY(holiday.date)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-xs sm:text-sm font-semibold text-on-surface">
                          {holiday.name}
                        </span>
                        <span className="text-xs">{holiday.emoji || '🇸🇬'}</span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant">
                        {holiday.dayOfWeek} {holiday.observedDate ? `• Observed ${formatDateDDMMYYYY(holiday.observedDate)}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant">
                      {countdownLabel}
                    </span>
                    {isSat ? (
                      <span className="text-[10px] text-leave-compoff font-bold">
                        +1 Comp-Off
                      </span>
                    ) : holiday.isLongWeekend ? (
                      <span className="text-[10px] text-primary font-medium">
                        Long Weekend
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-surface-container-low rounded-xl text-center text-body-sm text-on-surface-variant">
            No further public holidays scheduled for this calendar year.
          </div>
        )}
      </section>

      {/* Leave Detail Modal on Balance Card Click */}
      {activeDetailCategory && (
        <LeaveDetailModal
          isOpen={Boolean(activeDetailCategory)}
          category={activeDetailCategory}
          onClose={() => setActiveDetailCategory(null)}
          onApplyLeave={() => openApplyModal({
            initialType: activeDetailCategory === 'SL' ? 'SL' : activeDetailCategory === 'CO' ? 'CO' : 'AL'
          })}
          onAddSpecialHoliday={() => setIsAddSpecialHolidayOpen(true)}
        />
      )}
    </div>
  );
};
