import React from 'react';
import { useLeave } from '../context/LeaveContext';
import { formatDateDDMMYYYY } from '../data/singaporeHolidays2026';

export const HomeScreen: React.FC = () => {
  const {
    alAvailable,
    slAvailable,
    coAvailable,
    alLOP,
    slLOP,
    totalLOP,
    saturdayCompOffHolidays,
    expiredHolidayDates,
    expiredCompOffCount,
    upcomingHolidays,
    todayDateStr,
    settings,
    openApplyModal,
    setIsHolidaysModalOpen,
    setIsCompOffModalOpen,
    setSelectedCalendarDate
  } = useLeave();

  // Next 4 strictly upcoming holidays (from current date onward)
  const displayedUpcomingHolidays = upcomingHolidays.slice(0, 4);

  return (
    <div className="flex flex-col w-full px-margin pb-6 gap-space-md max-w-xl mx-auto">
      {/* 1. Employee Profile Header (Employee profile setting button & Cycle removed) */}
      <section className="w-full bg-surface-container rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-space-sm border border-surface-container">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            {settings.avatarUrl ? (
              <img
                src={settings.avatarUrl}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover border-2 border-primary-fixed shadow-xs"
              />
            ) : settings.userName ? (
              <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-fixed font-bold text-lg flex items-center justify-center shadow-xs">
                {settings.userName.slice(0, 1).toUpperCase()}
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[24px]">person</span>
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary border-2 border-surface-card flex items-center justify-center">
              <span className="material-symbols-outlined text-[10px] text-on-primary">verified</span>
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {settings.userName ? (
                <span className="font-title-sm text-title-sm text-on-surface font-bold truncate">
                  {settings.userName}
                </span>
              ) : (
                <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                  Employee Profile
                </span>
              )}
              {settings.employeeId && (
                <span className="font-label-sm text-label-sm px-2 py-0.2 rounded-full bg-surface-container-highest text-on-surface font-mono font-semibold">
                  {settings.employeeId}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Leave Balance Cards */}
      <section className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-title-md text-title-md text-on-surface font-semibold">Leave Balances</h2>
        </div>
        <div className="flex flex-col gap-space-sm">
          {/* Annual Leave Card - Always beach_access icon */}
          <article className="w-full bg-leave-annual-container rounded-xl p-4 shadow-xs flex items-center justify-between text-leave-annual-on-container">
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

          {/* Sick Leave Card - Always medical_services icon */}
          <article className="w-full bg-leave-sick-container rounded-xl p-4 shadow-xs flex items-center justify-between text-leave-sick-on-container">
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

          {/* Comp-off Leave Card - Always update icon */}
          <article className="w-full bg-leave-compoff-container rounded-xl p-4 shadow-xs flex items-center justify-between text-leave-compoff-on-container">
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
                <span className="font-label-sm text-label-sm opacity-80">Available Balance</span>
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 text-right">
              <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-leave-compoff-on-container leading-none">
                {Number.isInteger(coAvailable) ? coAvailable : coAvailable.toFixed(1)}
              </span>
              <span className="font-title-sm text-title-sm font-semibold text-leave-compoff-on-container opacity-90">Days</span>
            </div>
          </article>

          {/* Loss of Pay (LOP) Card - Additional to AL, SL and Comp-off */}
          <article className="w-full bg-surface-container-high rounded-xl p-4 shadow-xs flex items-center justify-between text-on-surface border border-surface-container">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-surface-container-lowest flex items-center justify-center text-error shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-[24px]">
                  money_off
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-title-md text-title-md font-semibold text-on-surface leading-tight">
                    Loss of Pay (LOP)
                  </h3>
                  {totalLOP > 0 && (
                    <span className="px-2 py-0.2 rounded-full bg-error-container text-on-error-container font-label-sm text-[11px] font-bold">
                      Unpaid
                    </span>
                  )}
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {totalLOP > 0
                    ? `${alLOP > 0 ? `${Number.isInteger(alLOP) ? alLOP : alLOP.toFixed(1)}d AL` : ''}${alLOP > 0 && slLOP > 0 ? ' • ' : ''}${slLOP > 0 ? `${Number.isInteger(slLOP) ? slLOP : slLOP.toFixed(1)}d SL` : ''} over entitlement`
                    : 'Leaves applied exceeding 12-day entitlement'}
                </span>
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 text-right">
              <span className={`font-headline-lg-mobile text-headline-lg-mobile font-bold leading-none ${totalLOP > 0 ? 'text-error' : 'text-on-surface'}`}>
                {Number.isInteger(totalLOP) ? totalLOP : totalLOP.toFixed(1)}
              </span>
              <span className="font-title-sm text-title-sm font-semibold text-on-surface-variant opacity-90">Days</span>
            </div>
          </article>
        </div>
      </section>

      {/* 3. Quick Action Buttons - Only Apply Leave and Comp-off Ledger */}
      <section className="flex flex-col gap-space-xs mt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-title-md text-title-md text-on-surface font-semibold">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 gap-space-sm">
          {/* Apply Leave Button */}
          <button
            onClick={() => openApplyModal({ initialType: 'AL' })}
            className="flex flex-col items-start justify-between p-4 rounded-xl bg-primary text-on-primary shadow-xs hover:opacity-95 active:scale-95 transition-all text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-on-primary/15 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">add_circle</span>
            </div>
            <div className="mt-3">
              <span className="font-title-sm text-title-sm font-bold block leading-tight">Apply Leave</span>
              <span className="font-label-sm text-label-sm opacity-80">Log new leave</span>
            </div>
          </button>

          {/* Comp-off Ledger */}
          <button
            onClick={() => setIsCompOffModalOpen(true)}
            className="flex flex-col items-start justify-between p-4 rounded-xl bg-surface-container-lowest text-on-surface shadow-xs hover:bg-surface-container active:scale-95 transition-all text-left border border-surface-container cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-leave-compoff">
                <span className="material-symbols-outlined text-[22px]">more_time</span>
              </div>
              <span className="font-label-sm text-label-sm font-bold px-2 py-0.5 rounded-full bg-leave-compoff-container text-leave-compoff">
                {coAvailable} Active
              </span>
            </div>
            <div className="mt-3">
              <span className="font-title-sm text-title-sm font-semibold block leading-tight">Comp-off Ledger</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">View Saturday credits</span>
            </div>
          </button>
        </div>
      </section>

      {/* 4. Comp-off Expiry Tracker - (Cycle display removed, dates in DD-MM-YYYY) */}
      <section className="w-full rounded-2xl p-4 shadow-xs flex flex-col gap-3 bg-surface-container-lowest border border-surface-container">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-leave-compoff-container text-leave-compoff flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">event_available</span>
            </div>
            <div>
              <h3 className="font-title-sm text-title-sm font-bold text-on-surface">Comp-off Expiry Tracker</h3>
            </div>
          </div>
        </div>

        {/* Clean Summary Stats Strip */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-container-low rounded-xl p-2.5 flex items-center justify-between border border-surface-container/60">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Available</span>
            <span className="font-title-sm text-title-sm font-bold text-leave-compoff">
              {coAvailable} Day{coAvailable !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="bg-surface-container-low rounded-xl p-2.5 flex items-center justify-between border border-surface-container/60">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Expired in Cycle</span>
            <span className="font-title-sm text-title-sm font-bold text-on-surface">
              {expiredCompOffCount} Day{expiredCompOffCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Simple & Neat Holiday List (Dates in DD-MM-YYYY) */}
        {saturdayCompOffHolidays.length > 0 ? (
          <div className="flex flex-col divide-y divide-surface-container pt-1">
            {saturdayCompOffHolidays.map((h) => {
              const isPast = h.date < todayDateStr;
              const isExpired = expiredHolidayDates?.includes(h.date);

              return (
                <div key={h.date} className="py-2.5 flex items-center justify-between text-body-sm first:pt-1 last:pb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{h.emoji || '🇸🇬'}</span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-title-sm text-title-sm font-medium text-on-surface truncate">
                        {h.name}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        {formatDateDDMMYYYY(h.date)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isPast || isExpired ? (
                      <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
                        Expired (Usable)
                      </span>
                    ) : (
                      <span className="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-leave-compoff-container text-leave-compoff font-semibold">
                        Auto on date
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3 bg-surface-container-low rounded-xl text-center text-body-sm text-on-surface-variant">
            No Saturday gazetted holidays in this cycle.
          </div>
        )}
      </section>

      {/* 5. Upcoming Singapore Public Holidays - (Dates in DD-MM-YYYY) */}
      <section className="flex flex-col gap-space-sm mt-1">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="font-title-md text-title-md text-on-surface font-semibold">Upcoming Public Holidays</h2>
            <p className="text-[11px] text-on-surface-variant">From current date ({formatDateDDMMYYYY(todayDateStr)}) onward</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHolidaysModalOpen(true)}
              className="font-label-sm text-label-sm text-primary font-semibold hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>
        </div>

        {/* Clean Holiday Cards with DD-MM-YYYY */}
        {displayedUpcomingHolidays.length > 0 ? (
          <div className="flex flex-col gap-2">
            {displayedUpcomingHolidays.map((holiday) => {
              const d = new Date(holiday.date + 'T00:00:00');
              const isSat = d.getDay() === 6;

              const dToday = new Date(todayDateStr + 'T00:00:00');
              const diffDays = Math.ceil((d.getTime() - dToday.getTime()) / (1000 * 60 * 60 * 24));
              const countdownLabel = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`;

              return (
                <div
                  key={holiday.date}
                  onClick={() => {
                    setSelectedCalendarDate(holiday.date);
                  }}
                  className="bg-surface-container-lowest rounded-xl p-3 shadow-xs flex items-center justify-between transition-transform active:scale-[0.99] border border-surface-container hover:bg-surface-container-low"
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
    </div>
  );
};
