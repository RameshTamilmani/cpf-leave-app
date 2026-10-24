import type { LeaveRecord, PublicHoliday } from '../types/leave';
import { isWeekend } from '../data/singaporeHolidays2026';

export interface CalendarEntry {
  id: string;
  date: string;
  title: string;
  holiday?: PublicHoliday;
  record?: LeaveRecord;
}

// Holidays remain visible on weekends. Leave spans include only their working dates.
export function getMonthEntries(year: number, month: number, holidays: PublicHoliday[], records: LeaveRecord[]): CalendarEntry[] {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
  const entries: CalendarEntry[] = [];
  const holidayDates = new Set<string>();
  const holidayKeys = new Set<string>();
  for (const holiday of holidays) {
    for (const date of [holiday.date, holiday.observedDate]) {
      if (!date) continue;
      holidayDates.add(date);
      const key = `${date}:${holiday.name}`;
      if (!date.startsWith(prefix) || holidayKeys.has(key)) continue;
      holidayKeys.add(key);
      entries.push({ id: `holiday:${holiday.id || holiday.name}:${date}`, date,
        title: holiday.name + (date !== holiday.date ? ' (Observed)' : ''), holiday });
    }
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = prefix + String(day).padStart(2, '0');
    if (isWeekend(date) || holidayDates.has(date)) continue;
    for (const record of records) {
      if (record.startDate <= date && record.endDate >= date) {
        entries.push({ id: `leave:${record.id}:${date}`, date, title: record.title, record });
      }
    }
  }
  return entries.sort((a, b) => a.date.localeCompare(b.date) || Number(!!a.record) - Number(!!b.record) || a.title.localeCompare(b.title));
}
