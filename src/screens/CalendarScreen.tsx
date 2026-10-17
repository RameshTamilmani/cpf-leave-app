import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import { isWeekend, formatDateDDMMYYYY } from '../data/singaporeHolidays2026';

export const CalendarScreen: React.FC = () => {
  const {
    records,
    deleteRecord,
    selectedCalendarDate,
    setSelectedCalendarDate,
    allHolidays,
    todayDateStr,
    openApplyModal,
    showToast
  } = useLeave();

  // Year & Month state: initialize to selectedCalendarDate
  const initialDateObj = new Date(selectedCalendarDate + 'T00:00:00');
  const [currentYear, setCurrentYear] = useState<number>(initialDateObj.getFullYear() || 2026);
  const [currentMonth, setCurrentMonth] = useState<number>(initialDateObj.getMonth() ?? 4);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    const todayObj = new Date(todayDateStr + 'T00:00:00');
    setCurrentYear(todayObj.getFullYear());
    setCurrentMonth(todayObj.getMonth());
    setSelectedCalendarDate(todayDateStr);
  };

  // Month stats from allHolidays (gazetted + special)
  const holidaysInMonth = allHolidays.filter((h) => {
    const d = new Date(h.date + 'T00:00:00');
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  // Calculate calendar grid days for Mon-Sun week start
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

  // In SG calendar Mon=0, Sun=6
  const getDayIndexMonStart = (d: Date) => {
    const raw = d.getDay(); // 0 is Sun, 1 is Mon...
    return raw === 0 ? 6 : raw - 1;
  };

  const startDayOffset = getDayIndexMonStart(firstDayOfMonth);
  const totalDaysInMonth = lastDayOfMonth.getDate();

  // Days from previous month
  const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();
  const leadingDays: number[] = [];
  for (let i = startDayOffset - 1; i >= 0; i--) {
    leadingDays.push(prevMonthLastDate - i);
  }

  // Current month days
  const currentMonthDays: number[] = [];
  for (let i = 1; i <= totalDaysInMonth; i++) {
    currentMonthDays.push(i);
  }

  // Selected date metadata
  const selectedDateFormatted = formatDateDDMMYYYY(selectedCalendarDate);
  const selectedDateObj = new Date(selectedCalendarDate + 'T00:00:00');

  const selectedHoliday = allHolidays.find(
    (h) => h.date === selectedCalendarDate || h.observedDate === selectedCalendarDate
  );
  const selectedIsWeekend = isWeekend(selectedCalendarDate);

  // Check if any leave booked for selected date
  const bookedRecord = records.find(
    (r) => selectedCalendarDate >= r.startDate && selectedCalendarDate <= r.endDate
  );

  let inspectorTitle = 'Regular Working Day';
  let inspectorCategory = 'Working Day';
  let inspectorBadgeClass = 'bg-surface-container text-on-surface-variant';
  let inspectorDeduction = 'Available to Book';
  let inspectorRule = 'Normal Working Day';
  let inspectorExplanation = 'Normal gazetted business day. Eligible for Annual Leave or sick leave logging.';
  let isHolidayType = false;

  const isGazettedPH = Boolean(selectedHoliday && !selectedHoliday.isSpecial);

  if (selectedHoliday) {
    inspectorTitle = selectedHoliday.name;
    if (isGazettedPH) {
      isHolidayType = true;
      inspectorCategory = 'Gazetted PH';
      inspectorBadgeClass = 'bg-holiday-public-container text-holiday-public-on-container';
      inspectorDeduction = '0 Days Deducted';
      inspectorRule = selectedHoliday.momSection || 'MOM Section 88';
      inspectorExplanation = `${selectedHoliday.name} is an official gazetted public holiday (paid non-working day under MOM Employment Act). Leave cannot be applied.`;
    } else {
      inspectorCategory = 'Special Holiday';
      inspectorBadgeClass = 'bg-leave-compoff-container text-leave-compoff-on-container';
      inspectorDeduction = 'Leave Allowed';
      inspectorRule = 'Company / Comp-Off';
      inspectorExplanation = `${selectedHoliday.name} (Special holiday declared under Comp-off). Eligible for leave application.`;
    }
  } else if (bookedRecord) {
    inspectorTitle = bookedRecord.title;
    if (bookedRecord.type === 'AL') {
      inspectorCategory = 'Annual Leave';
      inspectorBadgeClass = 'bg-leave-annual-container text-leave-annual';
      inspectorDeduction = `${bookedRecord.days.toFixed(1)} Day Balance`;
      inspectorRule = 'Standard Approved';
      inspectorExplanation = `Booked Annual Vacation (${bookedRecord.status}).`;
    } else if (bookedRecord.type === 'SL') {
      inspectorCategory = 'Medical Outpatient';
      inspectorBadgeClass = 'bg-leave-sick-container text-leave-sick';
      inspectorDeduction = `${bookedRecord.days.toFixed(1)} MC Day`;
      inspectorRule = 'MOM Medical Leave';
      inspectorExplanation = `Certified Outpatient Medical Leave pursuant to MOM Employment Act.`;
    } else {
      inspectorCategory = 'Comp-Off Spent';
      inspectorBadgeClass = 'bg-leave-compoff-container text-leave-compoff';
      inspectorDeduction = '0 AL (Comp-Off)';
      inspectorRule = 'Off-In-Lieu MOM';
      inspectorExplanation = 'Time-off taken in replacement of public holiday or weekend duties.';
    }
  } else if (selectedIsWeekend) {
    inspectorTitle = selectedDateObj.getDay() === 6 ? 'Rest Day (Saturday)' : 'Rest Day (Sunday)';
    inspectorCategory = 'Weekend Rest';
    inspectorBadgeClass = 'bg-surface-container-high text-weekend-on-surface';
    inspectorDeduction = '0 Days';
    inspectorRule = 'Non-Working Day';
    inspectorExplanation = 'Official statutory weekly rest day pursuant to Singapore Employment Act Part IV.';
  }

  return (
    <div className="flex flex-col w-full pb-8 max-w-xl mx-auto">
      {/* Month Navigator Header */}
      <div className="px-margin flex flex-col gap-space-sm pt-2">
        {/* Month Picker Card */}
        <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-xs flex items-center justify-between border border-surface-container">
          <div className="flex items-center gap-space-xs">
            <button
              onClick={prevMonth}
              aria-label="Previous Month"
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_left</span>
            </button>
            <div className="flex flex-col">
              <h1 className="font-headline-md text-headline-md text-on-surface leading-tight tracking-tight">
                {monthNames[currentMonth]} {currentYear}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-space-xs">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed-dim transition-colors font-label-md text-label-md flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">today</span>
              <span>Today</span>
            </button>
            <button
              onClick={nextMonth}
              aria-label="Next Month"
              className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive MD3 Filter Legend */}
      <div className="mt-3 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-2 px-margin min-w-max">
          <button className="px-3 py-1.5 rounded-full bg-holiday-public-container text-holiday-public font-label-sm text-label-sm flex items-center gap-1.5 shadow-xs active:scale-95 transition-transform cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-holiday-public" />
            <span>Public Holiday (PH)</span>
          </button>
          <button className="px-3 py-1.5 rounded-full bg-leave-annual-container text-leave-annual-on-container font-label-sm text-label-sm flex items-center gap-1.5 shadow-xs active:scale-95 transition-transform cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-leave-annual" />
            <span>Annual Leave (AL)</span>
          </button>
          <button className="px-3 py-1.5 rounded-full bg-leave-sick-container text-leave-sick-on-container font-label-sm text-label-sm flex items-center gap-1.5 shadow-xs active:scale-95 transition-transform cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-leave-sick" />
            <span>Sick / MC</span>
          </button>
          <button className="px-3 py-1.5 rounded-full bg-leave-compoff-container text-leave-compoff-on-container font-label-sm text-label-sm flex items-center gap-1.5 shadow-xs active:scale-95 transition-transform cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-leave-compoff" />
            <span>Comp-Off Taken</span>
          </button>
          <button className="px-3 py-1.5 rounded-full bg-alert-warning-container text-alert-warning font-label-sm text-label-sm flex items-center gap-1.5 shadow-xs active:scale-95 transition-transform cursor-pointer">
            <span className="material-symbols-outlined text-[14px]">stars</span>
            <span>Comp-Off Earned</span>
          </button>
          <button className="px-3 py-1.5 rounded-full bg-surface-container-high text-weekend-on-surface font-label-sm text-label-sm flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-weekend-on-surface" />
            <span>Weekend</span>
          </button>
        </div>
      </div>

      {/* Calendar Matrix Container */}
      <div className="px-margin mt-3">
        <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-xs flex flex-col gap-1 border border-surface-container">
          {/* Day Headers (Mon - Sun) */}
          <div className="grid grid-cols-7 text-center pb-2">
            <div className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Mon</div>
            <div className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Tue</div>
            <div className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Wed</div>
            <div className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Thu</div>
            <div className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Fri</div>
            <div className="font-label-sm text-label-sm text-holiday-public font-semibold">Sat</div>
            <div className="font-label-sm text-label-sm text-holiday-public font-semibold">Sun</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Leading days from previous month */}
            {leadingDays.map((d, idx) => (
              <div
                key={`lead-${idx}`}
                className="aspect-square rounded-lg p-1 flex flex-col items-center justify-start opacity-30 bg-surface-container-low"
              >
                <span className="font-label-sm text-label-sm text-on-surface-variant">{d}</span>
              </div>
            ))}

            {/* Current month days */}
            {currentMonthDays.map((dayNum) => {
              const monthStr = String(currentMonth + 1).padStart(2, '0');
              const dayStr = String(dayNum).padStart(2, '0');
              const dateKey = `${currentYear}-${monthStr}-${dayStr}`;

              const holiday = allHolidays.find((h) => h.date === dateKey || h.observedDate === dateKey);
              const isSelected = selectedCalendarDate === dateKey;
              const dateObj = new Date(currentYear, currentMonth, dayNum);
              const dayOfWeek = dateObj.getDay();
              const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
              const isToday = dateKey === todayDateStr;

              const booked = records.find((r) => dateKey >= r.startDate && dateKey <= r.endDate);

              // 1. Public Holiday Style
              if (holiday) {
                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedCalendarDate(dateKey)}
                    className={`day-cell aspect-square rounded-lg p-0.5 flex flex-col items-center justify-between bg-holiday-public text-white hover:opacity-95 active:scale-95 transition-all shadow-xs cursor-pointer ${
                      isSelected ? 'ring-2 ring-holiday-public scale-[1.03]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between w-full px-1">
                      <span className="font-label-md text-label-md font-bold text-white">{dayNum}</span>
                      <span className="text-[10px]">{holiday.emoji || '🇸🇬'}</span>
                    </div>
                    <span className="w-full text-center py-0.5 rounded bg-white text-holiday-public font-label-sm text-[8px] font-bold leading-tight truncate px-0.5">
                      🇸🇬 {holiday.name}
                    </span>
                  </button>
                );
              }

              // 2. Today Style
              if (isToday) {
                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedCalendarDate(dateKey)}
                    className={`day-cell aspect-square rounded-lg p-1 flex flex-col items-center justify-between bg-primary-container text-on-primary-container shadow-xs active:scale-95 transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-primary scale-[1.03]' : ''
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center font-label-sm text-[11px] font-bold shadow-xs">
                      {dayNum}
                    </div>
                    <span className="font-label-sm text-[9px] font-bold text-on-primary">TODAY</span>
                  </button>
                );
              }

              // 3. Booked Leave Style
              if (booked) {
                const bgClass =
                  booked.type === 'AL'
                    ? 'bg-leave-annual-container text-leave-annual-on-container'
                    : booked.type === 'SL'
                    ? 'bg-leave-sick-container text-leave-sick-on-container'
                    : 'bg-leave-compoff-container text-leave-compoff-on-container';

                const label = booked.type;

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedCalendarDate(dateKey)}
                    className={`day-cell aspect-square rounded-lg p-1 flex flex-col items-center justify-between ${bgClass} hover:opacity-90 active:scale-95 transition-all cursor-pointer ${
                      isSelected ? 'ring-2 ring-primary scale-[1.03]' : ''
                    }`}
                  >
                    <span className="font-label-md text-label-md font-bold">{dayNum}</span>
                    <span className="font-label-sm text-[8px] font-bold uppercase">{label}</span>
                  </button>
                );
              }

              // 4. Weekend Rest Days
              if (isWeekendDay) {
                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedCalendarDate(dateKey)}
                    className={`day-cell aspect-square rounded-lg p-1 flex flex-col items-center justify-between bg-weekend-surface text-weekend-on-surface hover:bg-surface-container-high transition-colors cursor-pointer ${
                      isSelected ? 'ring-2 ring-primary scale-[1.03]' : ''
                    }`}
                  >
                    <span className="font-label-md text-label-md font-medium">{dayNum}</span>
                    <span className="text-[9px] uppercase font-label-sm font-semibold">
                      {dayOfWeek === 6 ? 'Sat' : 'Sun'}
                    </span>
                  </button>
                );
              }

              // 5. Standard Working Day
              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedCalendarDate(dateKey)}
                  className={`day-cell aspect-square rounded-lg p-1 flex flex-col items-center justify-between bg-surface-container-lowest hover:bg-surface-container transition-colors group cursor-pointer ${
                    isSelected ? 'ring-2 ring-primary scale-[1.03]' : ''
                  }`}
                >
                  <span className="font-label-md text-label-md text-on-surface">{dayNum}</span>
                  <span className="w-1 h-1 rounded-full bg-surface-variant group-hover:bg-primary" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Date Detail Sheet / Card */}
      <div className="px-margin mt-4">
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-xs flex flex-col gap-3 transition-all duration-300 border border-surface-container" id="inspectorCard">
          {/* Date & Badge Header */}
          <div className="flex items-start justify-between gap-space-sm">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                {selectedDateFormatted}
              </span>
              <h2 className="font-title-lg text-title-lg text-on-surface font-bold leading-tight mt-0.5">
                {inspectorTitle}
              </h2>
            </div>
            <div className="shrink-0">
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-label-sm text-label-sm font-semibold ${inspectorBadgeClass}`}>
                <span className="material-symbols-outlined text-[16px]">
                  {isHolidayType ? 'flag' : bookedRecord ? 'event_available' : 'calendar_today'}
                </span>
                <span>{inspectorCategory}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bento Grid for Date */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="bg-surface-container-low p-2.5 rounded-lg flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Leave Impact</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="material-symbols-outlined text-leave-compoff text-[18px]">check_circle</span>
                <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                  {inspectorDeduction}
                </span>
              </div>
            </div>
            <div className="bg-surface-container-low p-2.5 rounded-lg flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Employment Act Rule</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="material-symbols-outlined text-primary text-[18px]">gavel</span>
                <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                  {inspectorRule}
                </span>
              </div>
            </div>
          </div>

          {/* Contextual Explanation / Policy Guidance */}
          <div className="bg-surface-container p-3 rounded-lg flex gap-2.5 items-start">
            <span className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5">info</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              {inspectorExplanation}
            </p>
          </div>

          {/* Contextual Date Status Display */}
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center justify-between gap-space-sm">
              {isGazettedPH ? (
                <div
                  className="flex-1 h-11 rounded-full bg-surface-container-highest text-on-surface-variant font-label-md text-label-md flex items-center justify-center gap-2 select-none"
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>Gazetted Public Holiday (Paid Off-Day)</span>
                </div>
              ) : bookedRecord ? (
                <div className="flex items-center gap-2 w-full">
                  <div className="flex-1 h-11 px-3.5 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[18px] text-primary shrink-0">event_available</span>
                    <span className="truncate">
                      {bookedRecord.title} ({bookedRecord.type === 'AL' ? 'Annual Leave' : bookedRecord.type === 'SL' ? 'Sick Leave' : 'Comp Off'})
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      deleteRecord(bookedRecord.id);
                    }}
                    className="h-11 px-4 rounded-full bg-error text-on-error font-label-md text-label-md font-semibold flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
                    title="Delete Leave Booking"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    <span>Delete</span>
                  </button>
                </div>
              ) : selectedIsWeekend ? (
                <div
                  className="flex-1 h-11 rounded-full bg-surface-container-highest text-on-surface-variant font-label-md text-label-md flex items-center justify-center gap-2 select-none"
                >
                  <span className="material-symbols-outlined text-[18px]">weekend</span>
                  <span>Rest Day (Non-Working Day)</span>
                </div>
              ) : (
                <button
                  onClick={() => openApplyModal({ initialType: 'AL', initialDate: selectedCalendarDate })}
                  className="flex-1 h-11 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-2 hover:opacity-95 active:scale-98 transition-all shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>+ Apply Leave on this day</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
