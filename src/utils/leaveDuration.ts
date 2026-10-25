import type { LeaveRecord, PublicHoliday } from '../types/leave';
import { addDaysToDate, calculateWorkingDays, formatDateDDMMYYYY, isValidISODate } from '../data/singaporeHolidays2026';

type Duration = Pick<LeaveRecord, 'startDate' | 'endDate' | 'days' | 'halfDay' | 'halfDayDate'>;
export function workingLeaveDates(start: string, end: string, holidays: PublicHoliday[]): string[] {
  if (!isValidISODate(start) || !isValidISODate(end) || end < start) return [];
  const dates: string[] = [];
  for (let date = start; date <= end; date = addDaysToDate(date, 1)) {
    if (calculateWorkingDays(date, date, holidays) === 1) dates.push(date);
  }
  return dates;
}
export function halfDayOnDate(record: Duration, date: string): 'am' | 'pm' | null {
  if (record.halfDay !== 'am' && record.halfDay !== 'pm') return null;
  const halfDate = record.halfDayDate || (record.startDate === record.endDate ? record.startDate : '');
  return halfDate === date ? record.halfDay : null;
}
export function halfDaySummary(record: Duration): string | null {
  const date = record.halfDayDate || (record.startDate === record.endDate ? record.startDate : '');
  if (date && (record.halfDay === 'am' || record.halfDay === 'pm')) {
    return `Half Day: ${formatDateDDMMYYYY(date)} · ${record.halfDay.toUpperCase()}`;
  }
  if (record.days % 1 === 0.5) return record.startDate === record.endDate ? 'Half-day session not recorded' : 'Half-day date and session not recorded';
  return null;
}
export function halfDaySelectionError(dates: string[], date: string, session: string): string | null {
  if (!date || !dates.includes(date)) return 'Choose a working date in this leave period for your half day.';
  if (session !== 'am' && session !== 'pm') return 'Choose AM or PM for your half-day leave.';
  return null;
}
export function leavePeriodsOverlap(a: Duration, b: Duration, holidays: PublicHoliday[]): boolean {
  const start = a.startDate > b.startDate ? a.startDate : b.startDate;
  const end = a.endDate < b.endDate ? a.endDate : b.endDate;
  return workingLeaveDates(start, end, holidays).some(date => {
    const first = halfDayOnDate(a, date), second = halfDayOnDate(b, date);
    return !first || !second || first === second;
  });
}
