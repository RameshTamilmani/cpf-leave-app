import React from 'react';
import { useLeave } from '../context/LeaveContext';

export const HomeScreen: React.FC = () => {
  const {
    alAvailable,
    slAvailable,
    coAvailable,
    saturdayCompOffHolidays,
    autoCompOffEarned,
    excludedHolidayDates,
    carryForwardCompOff,
    upcomingHolidays,
    todayDateStr,
    cycleStartDateStr,
    cycleEndDateStr,
    settings,
    setCurrentTab,
    openApplyModal,
    setIsHolidaysModalOpen,
    setIsCompOffModalOpen,
    setIsAddSpecialHolidayOpen,
    setIsEditCycleModalOpen,
    setSelectedCalendarDate
  } = useLeave();

  // Next 4 strictly upcoming holidays (strictly on or after current date)
  const displayedUpcomingHolidays = upcomingHolidays.slice(0, 4);

  const todayObj = new Date(todayDateStr + 'T00:00:00');
  const todayFormatted = todayObj.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="flex flex-col w-full px-margin pb-6 gap-space-md max-w-xl mx-auto">
      {/* 1. Employee Profile & Cycle Header */}
      <section className="w-full bg-surface-container rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-space-sm border border-surface-container">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            {settings.avatarUrl ? (
              <img
                src={settings.avatarUrl}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2 border-primary-fixed shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-fixed font-bold text-lg flex items-center justify-center shadow-xs">
                {(settings.userName || 'E').slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary border-2 border-surface-card flex items-center justify-center">
              <span className="material-symbols-outlined text-[10px] text-on-primary">verified</span>
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-title-sm text-title-sm text-on-surface font-bold truncate">
                {settings.userName || 'Employee'}
              </span>
              <span className="font-label-sm text-label-sm px-2 py-0.2 rounded-full bg-surface-container-highest text-on-surface font-mono font-semibold">
                {settings.employeeId || 'EMP-ID'}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate mt-0.5">
              Cycle: {settings.cycle} ({cycleStartDateStr} – {cycleEndDateStr})
            </p>
          </div>
        </div>
        <button
          onClick={() => setCurrentTab('settings')}
          aria-label="Edit Profile & Settings"
          className="w-9 h-9 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface-variant hover:bg-surface-variant active:scale-90 transition-all shrink-0 cursor-pointer shadow-xs"
          title="Profile & Settings"
        >
          <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
        </button>
      </section>

      {/* 2. Leave Balance Cards (Hero Tonal Entitlement Grid) */}
      <section className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-title-md text-title-md text-on-surface font-semibold">Leave Balances</h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Active Cycle</span>
        </div>
        <div className="flex flex-col gap-space-sm">
          {/* Annual Leave Card - Informational Only */}
          <article className="w-full bg-leave-annual-container rounded-xl p-4 shadow-xs flex items-center justify-between text-leave-annual-on-container">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-surface-container-lowest/80 flex items-center justify-center text-leave-annual shrink-0">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>beach_access</span>
              </div>
              <div>
                <h3 className="font-title-md text-title-md font-semibold text-leave-annual-on-container leading-tight">Annual Leave (AL)</h3>
                <span className="font-label-sm text-label-sm opacity-80">
                  {Number.isInteger(alAvailable) ? alAvailable : alAvailable.toFixed(1)} / {settings.alEntitlement} Days Available
                </span>
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

          {/* Sick Leave Card - Informational Only */}
          <article className="w-full bg-leave-sick-container rounded-xl p-4 shadow-xs flex items-center justify-between text-leave-sick-on-container">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-surface-container-lowest/80 flex items-center justify-center text-leave-sick shrink-0">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
              </div>
              <div>
                <h3 className="font-title-md text-title-md font-semibold text-leave-sick-on-container leading-tight">Sick Leave (SL)</h3>
                <span className="font-label-sm text-label-sm opacity-80">
                  {Number.isInteger(slAvailable) ? slAvailable : slAvailable.toFixed(1)} / {settings.slEntitlement} Days Available
                </span>
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

          {/* Comp-off Leave Card - Informational Only */}
          <article className="w-full bg-leave-compoff-container rounded-xl p-4 shadow-xs flex items-center justify-between text-leave-compoff-on-container">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-surface-container-lowest/80 flex items-center justify-center text-leave-compoff shrink-0">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>update</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-title-md text-title-md font-semibold text-leave-compoff-on-container leading-tight">Comp-off Leave</h3>
                  {autoCompOffEarned > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-leave-compoff text-white">
                      Auto-Calculated
                    </span>
                  )}
                </div>
                <span className="font-label-sm text-label-sm opacity-80">Available</span>
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 text-right">
              <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-leave-compoff-on-container leading-none">
                {Number.isInteger(coAvailable) ? coAvailable : coAvailable.toFixed(1)}
              </span>
              <span className="font-title-sm text-title-sm font-semibold text-leave-compoff-on-container opacity-90">Days</span>
            </div>
          </article>
        </div>
      </section>

      {/* 3. Quick Action Grid / Buttons */}
      <section className="flex flex-col gap-space-xs mt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-title-md text-title-md text-on-surface font-semibold">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 gap-space-sm">
          {/* Apply / Log Leave */}
          <button
            onClick={() => openApplyModal({ initialType: 'AL' })}
            className="flex flex-col items-start justify-between p-3.5 rounded-xl bg-primary-fixed text-on-primary-fixed shadow-xs hover:bg-primary-fixed-dim active:scale-95 transition-all text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-on-primary-fixed/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </div>
            <div className="mt-3">
              <span className="font-title-sm text-title-sm font-semibold block leading-tight">Apply Leave</span>
              <span className="font-label-sm text-label-sm opacity-75">Log new request</span>
            </div>
          </button>

          {/* Leave Calendar */}
          <button
            onClick={() => setCurrentTab('calendar')}
            className="flex flex-col items-start justify-between p-3.5 rounded-xl bg-surface-container-lowest text-on-surface shadow-xs hover:bg-surface-container active:scale-95 transition-all text-left cursor-pointer border border-surface-container"
          >
            <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            </div>
            <div className="mt-3">
              <span className="font-title-sm text-title-sm font-semibold block leading-tight">Leave Calendar</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">View long weekends</span>
            </div>
          </button>

          {/* Leave History */}
          <button
            onClick={() => setCurrentTab('history')}
            className="flex flex-col items-start justify-between p-3.5 rounded-xl bg-surface-container-lowest text-on-surface shadow-xs hover:bg-surface-container active:scale-95 transition-all text-left cursor-pointer border border-surface-container"
          >
            <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">history_toggle_off</span>
            </div>
            <div className="mt-3">
              <span className="font-title-sm text-title-sm font-semibold block leading-tight">Leave History</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Past approvals &amp; MCs</span>
            </div>
          </button>

          {/* Comp-off Manager */}
          <button
            onClick={() => setIsCompOffModalOpen(true)}
            className="flex flex-col items-start justify-between p-3.5 rounded-xl bg-surface-container-lowest text-on-surface shadow-xs hover:bg-surface-container active:scale-95 transition-all text-left relative overflow-hidden cursor-pointer border border-surface-container"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">more_time</span>
              </div>
              <span className="font-label-sm text-label-sm font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                {coAvailable} Active
              </span>
            </div>
            <div className="mt-3">
              <span className="font-title-sm text-title-sm font-semibold block leading-tight">Comp-off Ledger</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Saturday PH credits</span>
            </div>
          </button>
        </div>
      </section>

      {/* 4. Comp-off Expiry Alerts & Saturday Policy Card */}
      <section className="w-full text-alert-warning rounded-xl p-4 shadow-xs flex flex-col gap-3 bg-surface-container-high border border-surface-container">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-on-surface-variant">event_available</span>
            <div>
              <h3 className="font-title-sm text-title-sm font-semibold text-on-surface">Comp-off Expiry Tracker</h3>
              <span className="text-[11px] text-on-surface-variant">
                Cycle: {settings.cycle} ({cycleStartDateStr} to {cycleEndDateStr})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsEditCycleModalOpen(true)}
              className="font-label-sm text-label-sm font-semibold text-primary bg-primary-fixed/30 hover:bg-primary-fixed/50 px-2.5 py-0.5 rounded-full cursor-pointer transition-colors"
            >
              Edit Cycle
            </button>
            <span className="font-label-sm text-label-sm font-medium bg-surface-container-lowest px-2 py-0.5 rounded-full text-on-surface-variant">
              MOM Sec 88
            </span>
          </div>
        </div>

        {saturdayCompOffHolidays.length > 0 ? (
          <div className="bg-surface-container-lowest rounded-lg p-3 text-on-surface flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-leave-compoff">stars</span>
                <span className="font-title-sm text-title-sm font-semibold text-on-surface">
                  {autoCompOffEarned} of {saturdayCompOffHolidays.length} Saturday Holiday{saturdayCompOffHolidays.length !== 1 ? 's' : ''} Active
                </span>
              </div>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-leave-compoff-container text-leave-compoff font-bold">
                +{autoCompOffEarned} Days Accrued{carryForwardCompOff > 0 ? ` (+${carryForwardCompOff} CF)` : ''}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 pt-1 border-t border-surface-container">
              {saturdayCompOffHolidays.map((h) => {
                const isExcluded = excludedHolidayDates?.includes(h.date);
                const isCNY = h.name.toLowerCase().includes('chinese new year');
                return (
                  <div key={h.date} className="flex items-center justify-between text-body-sm">
                    <span className="text-on-surface font-medium flex items-center gap-1.5 flex-wrap">
                      <span>{h.emoji || '🇸🇬'}</span>
                      <span>{h.name}</span>
                      {isCNY && (
                        <span className="text-[10px] bg-primary-fixed text-on-primary-fixed px-1.5 py-0.2 rounded-full font-semibold">
                          CNY 2027
                        </span>
                      )}
                      <span className="text-[11px] text-on-surface-variant">({h.date})</span>
                    </span>
                    <span className="flex items-center gap-1">
                      {isExcluded ? (
                        <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-1.5 py-0.2 rounded">
                          Excluded
                        </span>
                      ) : (
                        <span className="font-label-sm text-label-sm text-leave-compoff font-semibold">
                          +1 Comp-off
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-lg p-3.5 text-on-surface flex flex-col items-center justify-center text-center gap-1.5">
            <span className="material-symbols-outlined text-[28px] text-on-surface-variant opacity-75">check_circle</span>
            <span className="font-title-sm text-title-sm font-semibold text-on-surface">No Gazetted Saturday Holidays in Current Cycle</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs leading-snug">
              When a gazetted Singapore public holiday or special holiday falls on a Saturday during your Leave Year Cycle ({cycleStartDateStr} to {cycleEndDateStr}), +1 day comp-off automatically accrues.
            </p>
          </div>
        )}

        <div className="flex items-start gap-1.5 pt-0.5 text-on-surface-variant">
          <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5">info</span>
          <p className="font-label-sm text-label-sm leading-tight text-on-surface-variant">
            Under Singapore MOM Employment Act Section 88, employees on 5-day workweeks automatically receive +1 day off-in-lieu for public holidays on a Saturday.
          </p>
        </div>
      </section>

      {/* 5. Upcoming Singapore Public Holidays Section (STRICTLY ON OR AFTER CURRENT DATE) */}
      <section className="flex flex-col gap-space-sm mt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-holiday-public">flag</span>
              <h2 className="font-title-md text-title-md text-on-surface font-semibold">Upcoming Public Holidays</h2>
            </div>
            <span className="text-[11px] text-on-surface-variant">
              From current date ({todayFormatted}) onward • Excludes past holidays
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsAddSpecialHolidayOpen(true)}
              className="font-label-sm text-label-sm text-primary font-bold hover:underline cursor-pointer flex items-center gap-0.5 bg-primary-fixed/30 px-2.5 py-1 rounded-full shadow-2xs"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span>Special Holiday</span>
            </button>
            <button
              onClick={() => setIsHolidaysModalOpen(true)}
              className="font-label-md text-label-md text-primary font-medium hover:underline cursor-pointer px-1 py-1"
            >
              Full List
            </button>
          </div>
        </div>

        {/* Dynamic List: only holidays strictly on or after current date */}
        {displayedUpcomingHolidays.length > 0 ? (
          <div className="flex flex-col gap-2">
            {displayedUpcomingHolidays.map((holiday) => {
              const d = new Date(holiday.date + 'T00:00:00');
              const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
              const dayStr = String(d.getDate()).padStart(2, '0');
              const isSat = d.getDay() === 6;

              // Calculate countdown days from current date
              const dToday = new Date(todayDateStr + 'T00:00:00');
              const diffDays = Math.ceil((d.getTime() - dToday.getTime()) / (1000 * 60 * 60 * 24));
              const countdownLabel = diffDays === 0 ? 'Today! 🎉' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`;

              return (
                <article
                  key={holiday.date}
                  onClick={() => {
                    setSelectedCalendarDate(holiday.date);
                    setCurrentTab('calendar');
                  }}
                  className="bg-surface-container-lowest rounded-xl p-3.5 shadow-xs flex items-center justify-between transition-transform active:scale-[0.99] border border-surface-container cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-holiday-public-container text-holiday-public-on-container flex flex-col items-center justify-center shrink-0">
                      <span className="font-label-sm text-label-sm font-bold uppercase leading-none">{monthStr}</span>
                      <span className="font-title-md text-title-md font-bold leading-tight">{dayStr}</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-title-sm text-title-sm font-semibold text-on-surface">
                          {holiday.name}
                        </h4>
                        <span className="text-xs">{holiday.emoji || '🇸🇬'}</span>
                        {holiday.isSpecial && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary-fixed text-on-primary-fixed">
                            Special Holiday
                          </span>
                        )}
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant">
                          {countdownLabel}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {holiday.dayOfWeek} {holiday.observedDate ? `• Observed Mon ${new Date(holiday.observedDate + 'T00:00:00').getDate()}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-holiday-public-container text-holiday-public-on-container font-semibold">
                      0 leave needed
                    </span>
                    {isSat ? (
                      <span className="font-label-sm text-label-sm text-alert-warning font-semibold">
                        +1 Comp-Off Day
                      </span>
                    ) : holiday.isLongWeekend ? (
                      <span className="font-label-sm text-label-sm text-leave-compoff font-medium">
                        {holiday.longWeekendText || 'Long Weekend 🎉'}
                      </span>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-surface-container-low rounded-xl text-center text-body-sm text-on-surface-variant">
            No further public holidays scheduled for the remainder of this calendar year.
          </div>
        )}
      </section>
    </div>
  );
};
