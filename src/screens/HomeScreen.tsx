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
    setCurrentTab,
    setIsNotificationsOpen,
    openWishWithChime
  } = useLeave();

  const [activeDetailCategory, setActiveDetailCategory] = useState<DetailCategory | null>(null);

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
    <div className="flex flex-col w-full px-margin pb-6 gap-space-md max-w-xl mx-auto">
      {/* 1. Executive Employee Profile Card */}
      <section className="w-full bg-gradient-to-br from-surface-card via-surface-container-low to-primary-container/20 rounded-3xl p-4 sm:p-5 shadow-sm border border-primary/20 flex flex-col gap-3.5 transition-all">
        {/* Top Identity Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar with Multi-layer Ring */}
            <div className="relative shrink-0">
              {settings.avatarUrl ? (
                <img
                  src={settings.avatarUrl}
                  alt={settings.userName || 'Profile'}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-primary ring-offset-2 ring-offset-surface-card shadow-md"
                />
              ) : settings.userName ? (
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-primary-fixed text-on-primary font-bold text-2xl flex items-center justify-center ring-2 ring-primary ring-offset-2 ring-offset-surface-card shadow-md">
                  {settings.userName.slice(0, 1).toUpperCase()}
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center ring-2 ring-surface-container ring-offset-2 ring-offset-surface-card shadow-sm">
                  <span className="material-symbols-outlined text-[32px]">person</span>
                </div>
              )}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary border-2 border-surface-card flex items-center justify-center shadow-xs"
                title="Employee Profile"
              >
                <span className="material-symbols-outlined text-[12px] text-on-primary">verified</span>
              </div>
            </div>

            {/* Name & Bright Employee ID Badge */}
            <div className="flex flex-col min-w-0">
              <h1 className="font-headline-sm text-title-lg font-bold text-on-surface tracking-tight truncate leading-snug">
                {settings.userName || 'Employee Name'}
              </h1>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {settings.employeeId ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-300 text-slate-950 text-xs font-mono font-black border-2 border-amber-300 shadow-md ring-2 ring-amber-400/40 tracking-wider">
                    <span className="material-symbols-outlined text-[15px] text-slate-950 font-bold">badge</span>
                    <span>EMP {settings.employeeId}</span>
                  </span>
                ) : (
                  <span className="text-xs text-on-surface-variant italic">ID not assigned</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Edit Profile Shortcut */}
          <button
            type="button"
            onClick={() => setCurrentTab('settings')}
            className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary flex items-center justify-center transition-all cursor-pointer shadow-2xs border border-surface-container shrink-0"
            title="Edit Profile, Photo &amp; Joining Date"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
        </div>

        {/* Middle: Years of Work Experience Badge (or Prompt to Set Joining Date) */}
        {effectiveDoj ? (
          <div className="p-3 rounded-2xl bg-surface-card/90 border border-primary/20 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-container text-on-primary-fixed flex items-center justify-center shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-[20px] text-primary">workspace_premium</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-title-sm text-title-sm font-bold text-on-surface">
                  {experienceText || '1st Year'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed">
                  Experience
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('settings')}
              className="flex items-center gap-1 text-[11.5px] font-medium text-on-surface-variant bg-surface-container/60 hover:bg-surface-container px-2.5 py-1 rounded-lg border border-surface-container/60 shrink-0 cursor-pointer transition-colors"
              title="Update Date of Joining in Profile Settings"
            >
              <span className="material-symbols-outlined text-[14px] text-primary">calendar_month</span>
              <span>Joined {formatDateDDMMYYYY(effectiveDoj)}</span>
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-surface-card/90 border border-primary/20 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-surface-container text-primary flex items-center justify-center shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              </div>
              <div className="min-w-0">
                <span className="font-title-sm text-xs font-semibold text-on-surface block leading-tight">
                  Date of Joining Not Set
                </span>
                <span className="text-[11px] text-on-surface-variant block truncate">
                  Set joining date to track work experience &amp; milestones
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('settings')}
              className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary-fixed/40 hover:bg-primary-fixed/60 px-3 py-1.5 rounded-xl border border-primary/20 shrink-0 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span>Set Joining Date</span>
            </button>
          </div>
        )}

        {/* Bottom Celebration Ribbon (Anniversary / Weekend / Special Holiday Wishes) */}
        {celebrationWish && (
          <div
            onClick={() => openWishWithChime(celebrationWish)}
            className="p-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-primary-container/40 to-emerald-500/15 border border-amber-500/25 flex items-center justify-between gap-2 cursor-pointer hover:opacity-95 transition-all shadow-2xs"
            title="Click to view celebration wish popup with sound"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl shrink-0">{celebrationWish.emoji || '🎉'}</span>
              <div className="min-w-0">
                <span className="font-title-sm text-[12.5px] font-bold text-on-surface block leading-tight truncate">
                  {celebrationWish.title}
                </span>
                <span className="text-[11px] text-on-surface-variant block truncate">
                  {celebrationWish.subtitle}
                </span>
              </div>
            </div>
            <span className="font-label-sm text-[10px] font-bold text-primary shrink-0 flex items-center gap-0.5">
              <span>View</span>
              <span className="material-symbols-outlined text-[14px]">celebration</span>
            </span>
          </div>
        )}
      </section>

      {/* 2. Leave Balance Cards (Clickable to view applied leaves list) */}
      <section className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-title-md text-title-md text-on-surface font-semibold">Leave Balances</h2>
          <span className="text-[11px] text-on-surface-variant">Tap card to view applied records</span>
        </div>
        <div className="flex flex-col gap-space-sm">
          {/* Annual Leave Card - Click to show applied annual leaves */}
          <article
            onClick={() => setActiveDetailCategory('AL')}
            className="w-full bg-leave-annual-container rounded-xl p-4 shadow-xs flex items-center justify-between text-leave-annual-on-container cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-surface-container-lowest/80 flex items-center justify-center text-leave-annual shrink-0">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  beach_access
                </span>
              </div>
              <div>
                <h3 className="font-title-md text-title-md font-semibold text-leave-annual-on-container leading-tight">
                  Annual Leave
                </h3>
              </div>
            </div>
            <div className="flex items-baseline gap-1 text-right">
              <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-leave-annual-on-container leading-none">
                {Number.isInteger(alAvailable) ? alAvailable : alAvailable.toFixed(1)}
              </span>
              <span className="font-title-sm text-title-sm font-semibold text-leave-annual-on-container opacity-90">
                /{settings.alEntitlement}
              </span>
            </div>
          </article>

          {/* Sick Leave Card - Click to show applied sick leaves */}
          <article
            onClick={() => setActiveDetailCategory('SL')}
            className="w-full bg-leave-sick-container rounded-xl p-4 shadow-xs flex items-center justify-between text-leave-sick-on-container cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-surface-container-lowest/80 flex items-center justify-center text-leave-sick shrink-0">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  medical_services
                </span>
              </div>
              <div>
                <h3 className="font-title-md text-title-md font-semibold text-leave-sick-on-container leading-tight">
                  Sick Leave
                </h3>
              </div>
            </div>
            <div className="flex items-baseline gap-1 text-right">
              <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-leave-sick-on-container leading-none">
                {Number.isInteger(slAvailable) ? slAvailable : slAvailable.toFixed(1)}
              </span>
              <span className="font-title-sm text-title-sm font-semibold text-leave-sick-on-container opacity-90">
                /{settings.slEntitlement}
              </span>
            </div>
          </article>

          {/* Comp-off Leave Card - Click to show applied comp-off leaves */}
          <article
            onClick={() => setActiveDetailCategory('CO')}
            className="w-full bg-leave-compoff-container rounded-xl p-4 shadow-xs flex items-center justify-between text-leave-compoff-on-container cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-surface-container-lowest/80 flex items-center justify-center text-leave-compoff shrink-0">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  update
                </span>
              </div>
              <div>
                <h3 className="font-title-md text-title-md font-semibold text-leave-compoff-on-container leading-tight">
                  Comp-off Leave
                </h3>
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 text-right">
              <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-leave-compoff-on-container leading-none">
                {Number.isInteger(coAvailable) ? coAvailable : coAvailable.toFixed(1)}
              </span>
              <span className="font-title-sm text-title-sm font-semibold text-leave-compoff-on-container opacity-90">Days</span>
            </div>
          </article>

          {/* Loss of Pay (LOP) Card - Dedicated Rose/Crimson Theme */}
          <article
            onClick={() => setActiveDetailCategory('LOP')}
            className="w-full bg-rose-50/90 rounded-xl p-4 shadow-xs flex items-center justify-between text-rose-950 border border-rose-200/90 cursor-pointer hover:border-rose-300 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs border border-rose-200">
                <span className="material-symbols-outlined text-[24px]">
                  money_off
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-title-md text-title-md font-bold text-rose-950 leading-tight">
                    Loss of Pay (LOP)
                  </h3>
                  {totalLOP > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-label-sm text-[11px] font-bold shadow-2xs">
                      Unpaid
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 text-right">
              <span className={`font-headline-lg-mobile text-headline-lg-mobile font-bold leading-none ${totalLOP > 0 ? 'text-rose-600' : 'text-rose-900/60'}`}>
                {Number.isInteger(totalLOP) ? totalLOP : totalLOP.toFixed(1)}
              </span>
              <span className="font-title-sm text-title-sm font-semibold text-rose-800/70 opacity-90">Days</span>
            </div>
          </article>

          {/* Special Holidays Card - Dedicated Royal Purple Theme */}
          <article
            onClick={() => setActiveDetailCategory('SPECIAL')}
            className="w-full bg-purple-50/90 rounded-xl p-4 shadow-xs flex items-center justify-between text-purple-950 border border-purple-200/90 cursor-pointer hover:border-purple-300 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0 shadow-2xs border border-purple-200">
                <span className="material-symbols-outlined text-[24px]">
                  celebration
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-title-md text-title-md font-bold text-purple-950 leading-tight">
                    Special Holidays
                  </h3>
                  {specialHolidays.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-label-sm text-[11px] font-bold shadow-2xs">
                      Configured
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 text-right">
              <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold leading-none text-purple-700">
                {specialHolidays.length}
              </span>
              <span className="font-title-sm text-title-sm font-semibold text-purple-800/70 opacity-90">Days</span>
            </div>
          </article>
        </div>
      </section>

      {/* 3. Quick Action Buttons - Leave History and Comp-off Ledger */}
      <section className="flex flex-col gap-space-xs mt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-title-md text-title-md text-on-surface font-semibold">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 gap-space-sm">
          {/* Move to History Tab Button */}
          <button
            onClick={() => setCurrentTab('history')}
            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-surface-container-lowest border border-surface-container hover:bg-surface-container transition-all cursor-pointer text-left shadow-xs active:scale-[0.99]"
          >
            <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary-fixed flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">history</span>
            </div>
            <div>
              <p className="font-title-sm text-title-sm text-on-surface font-semibold">Leave History</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">View all past &amp; planned leaves</p>
            </div>
          </button>

          {/* Comp-off Ledger Button */}
          <button
            onClick={() => setIsCompOffModalOpen(true)}
            className="w-full flex items-center gap-3 p-4 rounded-2xl bg-surface-container-lowest border border-surface-container hover:bg-surface-container transition-all cursor-pointer text-left shadow-xs active:scale-[0.99]"
          >
            <div className="w-11 h-11 rounded-xl bg-leave-compoff-container text-leave-compoff-on-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">more_time</span>
            </div>
            <div>
              <p className="font-title-sm text-title-sm text-on-surface font-semibold">Comp-off Ledger</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">View Saturday holiday credits</p>
            </div>
          </button>
        </div>
      </section>

      {/* 5. Upcoming Public Holidays */}
      <section className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="font-title-md text-title-md text-on-surface font-semibold">
              Upcoming Public Holidays
            </h2>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-holiday-public-container text-holiday-public font-bold">
              {upcomingHolidays.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHolidaysModalOpen(true)}
              className="font-label-sm text-label-sm text-primary font-semibold hover:underline cursor-pointer"
            >
              View All ({upcomingHolidays.length})
            </button>
          </div>
        </div>

        {displayedUpcomingHolidays.length > 0 ? (
          <div className="flex flex-col gap-2">
            {displayedUpcomingHolidays.map((holiday) => {
              const d = new Date(holiday.date + 'T00:00:00');
              const isSat = d.getDay() === 6;

              const todayObj = new Date(todayDateStr + 'T00:00:00');
              const targetDateObj = new Date(holiday.date + 'T00:00:00');
              const diffTime = targetDateObj.getTime() - todayObj.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              let countdownLabel = `${diffDays} days away`;
              if (diffDays === 0) countdownLabel = 'Today';
              else if (diffDays === 1) countdownLabel = 'Tomorrow';

              return (
                <div
                  key={holiday.date}
                  onClick={() => {
                    setSelectedCalendarDate(holiday.date);
                    setIsHolidaysModalOpen(true);
                  }}
                  className="bg-surface-container-lowest rounded-xl p-3 shadow-xs flex items-center justify-between transition-transform active:scale-[0.99] border border-surface-container hover:bg-surface-container-low cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="px-2.5 py-1.5 rounded-lg bg-holiday-public-container text-holiday-public-on-container flex flex-col items-center justify-center shrink-0">
                      <span className="font-label-sm text-[11px] font-bold font-mono leading-tight">
                        {formatDateDDMMYYYY(holiday.date)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-title-sm text-title-sm font-semibold text-on-surface">
                          {holiday.name}
                        </span>
                        <span className="text-xs">{holiday.emoji || '🇸🇬'}</span>
                      </div>
                      <span className="font-body-sm text-[12px] text-on-surface-variant">
                        {holiday.dayOfWeek} {holiday.observedDate ? `• Observed ${formatDateDDMMYYYY(holiday.observedDate)}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="font-label-sm text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                      {countdownLabel}
                    </span>
                    {isSat ? (
                      <span className="font-label-sm text-[11px] text-leave-compoff font-bold">
                        +1 Comp-Off
                      </span>
                    ) : holiday.isLongWeekend ? (
                      <span className="font-label-sm text-[11px] text-primary font-medium">
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
