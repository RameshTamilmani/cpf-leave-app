import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import { formatDateDDMMYYYY, calculateExperience } from '../data/singaporeHolidays2026';
import { LeaveDetailModal, DetailCategory } from '../components/LeaveDetailModal';
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

  // Calculate experience from date of joining if set
  const effectiveDoj = settings.dateOfJoining?.trim() || '';
  const experienceText = effectiveDoj ? calculateExperience(effectiveDoj, todayDateStr) : null;

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
      {/* 1. Executive Employee Profile Card */}
      <section className="w-full bg-gradient-to-br from-surface-card via-surface-container-low to-primary-container/15 rounded-2xl p-3 sm:p-3.5 shadow-xs border border-primary/20 flex flex-col gap-2.5 transition-all">
        {/* Top Identity Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="relative shrink-0">
              {settings.avatarUrl ? (
                <img
                  src={settings.avatarUrl}
                  alt={settings.userName || 'Profile'}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400 ring-offset-1 ring-offset-surface-card shadow-sm"
                />
              ) : settings.userName ? (
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-primary-fixed text-on-primary font-bold text-lg flex items-center justify-center ring-2 ring-amber-400 ring-offset-1 ring-offset-surface-card shadow-sm">
                  {settings.userName.slice(0, 1).toUpperCase()}
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center ring-2 ring-amber-400 shadow-xs">
                  <span className="material-symbols-outlined text-[24px]">person</span>
                </div>
              )}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-surface-card border-2 border-surface-card flex items-center justify-center shadow-xs"
                title="Employee Profile"
              >
                <span className="material-symbols-outlined text-[10px] text-amber-500 dark:text-amber-300">verified</span>
              </div>
            </div>

            {/* Name, Employee ID & Department */}
            <div className="flex flex-col min-w-0">
              <h1 className="text-base font-bold text-on-surface tracking-tight truncate leading-tight">
                {settings.userName || 'Employee Name'}
              </h1>

              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {settings.employeeId ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-300 text-amber-950 text-xs font-mono font-bold border border-amber-500 shadow-xs">
                    <span className="material-symbols-outlined text-[13px]">badge</span>
                    <span>EMP {settings.employeeId}</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-on-surface-variant italic">ID not assigned</span>
                )}
              </div>
              {settings.department && (
                <p className="mt-1 text-xs font-medium text-on-surface-variant break-words" aria-label="Department">
                  {settings.department}
                </p>
              )}
            </div>
          </div>

          {/* Quick Edit Profile Shortcut */}
          <button
            type="button"
            onClick={() => setCurrentTab('settings')}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary flex items-center justify-center transition-all cursor-pointer shadow-2xs border border-surface-container shrink-0"
            title="Edit Profile"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
        </div>

        {/* Experience row */}
        {effectiveDoj ? (
          <div className="p-2 px-2.5 rounded-xl bg-surface-card/90 border border-primary/15 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-container text-on-primary-fixed flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px] text-primary">workspace_premium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-on-surface">
                  {experienceText || '1st Year'}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-primary-fixed text-on-primary-fixed">
                  Experience
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('settings')}
              className="flex items-center gap-1 text-[11px] font-medium text-on-surface-variant bg-surface-container/60 hover:bg-surface-container px-2 py-0.5 rounded-md border border-surface-container/60 shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[12px] text-primary">calendar_month</span>
              <span>Joined {formatDateDDMMYYYY(effectiveDoj)}</span>
            </button>
          </div>
        ) : (
          <div className="p-2 px-2.5 rounded-xl bg-surface-card/90 border border-primary/15 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              </div>
              <span className="text-[11.5px] text-on-surface-variant truncate">
                Set joining date to track work experience
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('settings')}
              className="text-[11px] font-semibold text-primary bg-primary-fixed/40 hover:bg-primary-fixed/60 px-2 py-0.5 rounded-md border border-primary/20 shrink-0 cursor-pointer"
            >
              + Set Date
            </button>
          </div>
        )}

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
      </section>

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
            <div className="flex items-baseline justify-end gap-0.5 min-w-[4.5rem] shrink-0 text-right tabular-nums">
              <span className="text-xl font-bold text-leave-annual-on-container leading-7">
                {Number.isInteger(alAvailable) ? alAvailable : alAvailable.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-leave-annual-on-container opacity-80">
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
            <div className="flex items-baseline justify-end gap-0.5 min-w-[4.5rem] shrink-0 text-right tabular-nums">
              <span className="text-xl font-bold text-leave-sick-on-container leading-7">
                {Number.isInteger(slAvailable) ? slAvailable : slAvailable.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-leave-sick-on-container opacity-80">
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
            <div title={`${coAvailable} available, ${coUsed} used`} aria-label={`${coAvailable} available, ${coUsed} used`} className="flex items-baseline justify-end gap-0.5 min-w-[4.5rem] shrink-0 text-right tabular-nums">
              <span className="text-xl font-bold text-leave-compoff-on-container leading-7">
                {Number.isInteger(coAvailable) ? coAvailable : coAvailable.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-leave-compoff-on-container opacity-80">/{Number.isInteger(coTotal) ? coTotal : coTotal.toFixed(1)}</span>
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
            <div className="flex items-baseline justify-end gap-0.5 min-w-[4.5rem] shrink-0 text-right tabular-nums">
              <span className={`text-xl font-bold leading-7 ${totalLOP > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-rose-900/60 dark:text-rose-300/60'}`}>
                {Number.isInteger(totalLOP) ? totalLOP : totalLOP.toFixed(1)}
              </span>
            </div>
          </article>

          {/* Special Holidays Card */}
          <article
            onClick={() => setActiveDetailCategory('SPECIAL')}
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
                    Configured
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-baseline justify-end gap-0.5 min-w-[4.5rem] shrink-0 text-right tabular-nums">
              <span className="text-xl font-bold leading-7 text-purple-700 dark:text-purple-300">
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
