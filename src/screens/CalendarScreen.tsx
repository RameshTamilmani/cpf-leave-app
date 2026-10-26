import { effectiveStatus } from '../utils/leaveAccounting';
import { halfDayOnDate } from '../utils/leaveDuration';
import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import { formatDateDDMMYYYY } from '../data/singaporeHolidays2026';
import { getMonthEntries } from '../utils/calendarEntries';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const leaveLabels: Record<string, string> = {
  AL: 'Annual Leave',
  SL: 'Sick Leave',
  CO: 'Comp-off Leave',
  CL: 'Comp-off Leave',
  LOP: 'Loss of Pay (LOP)'
};
const leaveColors: Record<string, string> = {
  AL: 'bg-leave-annual-container text-leave-annual-on-container',
  SL: 'bg-leave-sick-container text-leave-sick-on-container',
  CO: 'bg-leave-compoff-container text-leave-compoff-on-container',
  CL: 'bg-leave-compoff-container text-leave-compoff-on-container',
  LOP: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200'
};

export const CalendarScreen: React.FC = () => {
  const { records, selectedCalendarDate, setSelectedCalendarDate, allHolidays, todayDateStr } = useLeave();
  const [monthDate, setMonthDate] = useState(() => new Date(selectedCalendarDate + 'T00:00:00'));
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const monthTitle = `${monthNames[month]} ${year}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const entries = getMonthEntries(year, month, allHolidays, records);
  const navigate = (delta: number) => setMonthDate(new Date(year, month + delta, 1));
  const today = () => {
    setMonthDate(new Date(todayDateStr + 'T00:00:00'));
    setSelectedCalendarDate(todayDateStr);
  };

  return (
    <div className="flex flex-col w-full px-margin gap-4 pb-8 max-w-xl mx-auto">
      <div className="flex items-center justify-between gap-1 rounded-xl border border-surface-container bg-surface-container-lowest p-2 shadow-xs">
        <button type="button" aria-label="Previous Month" onClick={() => navigate(-1)} className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container cursor-pointer">
          <span aria-hidden="true" className="material-symbols-outlined text-[22px]">chevron_left</span>
        </button>
        <h1 className="flex-1 min-w-0 text-base sm:text-xl font-bold text-on-surface tracking-tight text-center">{monthTitle}</h1>
        <button type="button" onClick={today} className="px-3 h-9 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold hover:bg-primary-fixed-dim cursor-pointer">Today</button>
        <button type="button" aria-label="Next Month" onClick={() => navigate(1)} className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container cursor-pointer">
          <span aria-hidden="true" className="material-symbols-outlined text-[22px]">chevron_right</span>
        </button>
      </div>

      <section aria-label={monthTitle + ' calendar'} className="rounded-xl border border-surface-container bg-surface-container-lowest p-2 sm:p-3 shadow-xs">
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekdays.map((day, index) => <span key={day} className={`text-[11px] sm:text-xs font-semibold ${index > 4 ? 'text-weekend-header font-bold' : 'text-on-surface-variant'}`}>{day}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }, (_, i) => <div key={'blank-' + i} aria-hidden="true" />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEntries = entries.filter(entry => entry.date === date);
            const holiday = dayEntries.find(entry => entry.holiday);
            const leaves = dayEntries.filter(entry=>entry.record).map(entry=>entry.record!);
            const leave = leaves[0];
            const leaveSummary = leaves.map(r=>leaveLabels[r.type]+(halfDayOnDate(r,date)?', Half Day ('+halfDayOnDate(r,date)!.toUpperCase()+')':'')).join('; ');
            const leaveBadge = leaves.map(r=>(r.type==='CL'?'CO':r.type)+(halfDayOnDate(r,date)?' '+halfDayOnDate(r,date)!.toUpperCase():'')).join(' / ');
            const leaveHalf = leave ? halfDayOnDate(leave, date) : null;
            const weekend = (offset + i) % 7 > 4;
            const selected = selectedCalendarDate === date;
            const isToday = date === todayDateStr;
            const color = holiday ? 'bg-holiday-public-container text-holiday-public-on-container border border-holiday-public/20'
              : leave ? `${leaveColors[leave.type]} border border-current/20`
              : weekend ? 'bg-weekend-surface text-weekend-on-surface border border-weekend-border font-semibold'
              : 'bg-surface-container-low text-on-surface border border-transparent';
            return (
              <button type="button" key={date} onClick={() => setSelectedCalendarDate(date)}
                aria-label={`${formatDateDDMMYYYY(date)}${holiday ? ', ' + holiday.title : leave ? ', ' + leaveSummary : ''}${isToday ? ', Today' : ''}`}
                aria-pressed={selected} aria-current={isToday ? 'date' : undefined}
                className={`min-w-0 aspect-square rounded-lg flex flex-col items-center justify-center gap-1 text-xs sm:text-sm font-semibold cursor-pointer ${color} ${selected ? 'ring-2 ring-primary ring-inset' : ''} ${isToday ? 'font-bold outline outline-1 outline-primary -outline-offset-1' : ''}`}>
                <span>{day}</span>
                <span aria-hidden="true" className="text-[8px] sm:text-[10px] leading-tight font-medium break-words px-0.5">{holiday ? 'PH' : leave ? leaveBadge : isToday ? 'Today' : '\u00a0'}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="Monthly holidays and leave history" className="rounded-xl border border-surface-container bg-surface-container-lowest shadow-xs overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-surface-container">
          <h2 className="text-sm sm:text-base font-bold text-on-surface">Holidays &amp; Leave History</h2>
          <p className="text-xs text-on-surface-variant mt-1">{monthTitle}</p>
        </div>
        {entries.length === 0 ? (
          <p className="p-4 text-sm text-on-surface-variant">No holidays or leave entries this month.</p>
        ) : (
          <ul className="divide-y divide-surface-container">
            {entries.map(entry => {
              const date = new Date(entry.date + 'T00:00:00');
              const label = entry.holiday ? entry.holiday.isSpecial ? 'Special Holiday' : 'Public Holiday' : leaveLabels[entry.record!.type];
              const color = entry.holiday ? 'bg-holiday-public-container text-holiday-public-on-container' : leaveColors[entry.record!.type];
              const half = entry.record ? halfDayOnDate(entry.record, entry.date) : null;
              return (
                <li key={entry.id} data-date={entry.date} className="flex items-start gap-3 p-3 sm:p-4">
                  <time dateTime={entry.date} aria-label={formatDateDDMMYYYY(entry.date)} className="w-11 shrink-0 rounded-lg bg-surface-container-low py-1.5 text-center tabular-nums">
                    <span className="block text-lg leading-6 font-bold text-on-surface">{date.getDate()}</span>
                    <span className={`block text-[10px] ${date.getDay() === 0 || date.getDay() === 6 ? 'text-weekend-header font-semibold' : 'text-on-surface-variant'}`}>{weekdays[(date.getDay() + 6) % 7]}</span>
                  </time>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-5 text-on-surface break-words">{entry.title}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${color}`}>{label}</span>
                      {entry.record && <span className="text-xs text-on-surface-variant capitalize">{effectiveStatus(entry.record,todayDateStr)}{half ? ` · Half Day (${half.toUpperCase()})` : ''}</span>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};
