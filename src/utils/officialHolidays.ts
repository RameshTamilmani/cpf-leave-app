import { holidayLabel } from './holidayLabel';
import type { PublicHoliday, SpecialHoliday } from '../types/leave';

export const HOLIDAY_DATASET = 'd_8ef23381f9417e4d4254ee8b4dcdb176';
export const HOLIDAY_SOURCE = `https://data.gov.sg/datasets/${HOLIDAY_DATASET}/view`;
const regularHoliday = /^(new year'?s day|chinese new year|good friday|labour day|hari raya (puasa|haji)|vesak day|national day|deepavali|christmas day)\b/i;

export function parseOfficialHolidays(rows: unknown): PublicHoliday[] {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 5000) throw new Error('Invalid holiday dataset.');
  const holidays = new Map<string, PublicHoliday>();
  for (const row of rows) {
    const date = row?.date;
    const name = typeof row?.holiday === 'string' ? holidayLabel(row.holiday.trim().replace(/’/g, "'")) : '';
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !name || name.length > 150) throw new Error('Invalid holiday row.');
    const parsed = new Date(date + 'T00:00:00Z');
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error('Invalid holiday date.');
    const day = parsed.getUTCDay();
    holidays.set(date, {
      date, name, dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
      description: 'Published in the Ministry of Manpower public holiday dataset.',
      isLongWeekend: day === 0 || day === 1 || day === 5,
      isSpecial: !regularHoliday.test(name),
      isCompOffEligible: day === 6 && !/\((?:Observed|Substitute)\)/i.test(name),
      source: 'official', sourceUrl: HOLIDAY_SOURCE,
    });
  }
  return [...holidays.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function flattenHolidays(holidays: PublicHoliday[]): PublicHoliday[] {
  return holidays.flatMap(holiday => {
    const base = { ...holiday, name: holidayLabel(holiday.name), observedDate: undefined };
    if (!holiday.observedDate || holiday.observedDate === holiday.date) return [base];
    const date = new Date(holiday.observedDate + 'T00:00:00');
    return [base, { ...base, date: holiday.observedDate, name: `${base.name} (Substitute)`,
      dayOfWeek: date.toLocaleDateString('en-SG', { weekday: 'long' }), isCompOffEligible: false }];
  });
}

export function mergeHolidaySources(bundled: PublicHoliday[], official: PublicHoliday[], custom: SpecialHoliday[]) {
  const remote = flattenHolidays(official);
  const yearCounts = new Map<string, number>();
  remote.forEach(h => yearCounts.set(h.date.slice(0, 4), (yearCounts.get(h.date.slice(0, 4)) || 0) + 1));
  // A complete official year replaces the bundled year, including changed dates.
  const dates = new Map(flattenHolidays(bundled).filter(h => (yearCounts.get(h.date.slice(0, 4)) || 0) < 11).map(h => [h.date, h]));
  remote.forEach(h => dates.set(h.date, h));
  const officialDates = new Set(dates.keys());
  const conflicts: SpecialHoliday[] = [];
  for (const holiday of custom) {
    if (officialDates.has(holiday.date) || dates.has(holiday.date)) { conflicts.push(holiday); continue; }
    dates.set(holiday.date, holiday);
  }
  const all = [...dates.values()].sort((a, b) => a.date.localeCompare(b.date));
  const specials: SpecialHoliday[] = all.filter(h => h.isSpecial).map(h => ({ ...h,
    id: h.id || `official:${h.date}`, isSpecial: true,
    category: (h as SpecialHoliday).category || 'gazetted_adhoc',
    createdAt: (h as SpecialHoliday).createdAt || h.date + 'T00:00:00Z',
  }));
  return { all, specials, conflicts };
}
