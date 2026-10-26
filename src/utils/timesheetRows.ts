import type { LeaveRecord, PublicHoliday } from '../types/leave';
import { addDaysToDate, formatDateDDMMYYYY, isValidISODate } from '../data/singaporeHolidays2026';
import { halfDayOnDate } from './leaveDuration';
import { compOffReason, fullDayCompOffError } from './compOff';

export const TIMESHEET_DEFAULTS = { businessUnit: 'CPF', location: 'Chennai', manager: 'Sujatha Sambavamurthy', dailyHours: 9 } as const;
export { validContact } from './profile';
export interface TimesheetRow { date: string; day: string; hours: number | 'L' | 'CO' | 'PH' | ''; remarks: string; style: 'work' | 'leave' | 'blank'; }

export function buildTimesheet(month: string, records: LeaveRecord[], holidays: PublicHoliday[]) {
  if (!/^\d{4}-\d{2}$/.test(month) || !isValidISODate(month + '-01') || Number(month.slice(0,4)) < 1901 || Number(month.slice(0,4)) > 9998) throw Error('Choose a valid timesheet month.');
  const relevant = records.filter(r => r.startDate <= month + '-31' && r.endDate >= month + '-01');
  for (const r of relevant) {
    const policyError=fullDayCompOffError(r);if(policyError)throw Error(policyError);
    if (r.startDate !== r.endDate && r.days % 1 === 0.5 && !r.halfDayDate) throw Error('An older half-day leave is missing its date. Correct it in History before exporting this month.');
  }
  const rows: TimesheetRow[] = [];
  for (let date = month + '-01'; date.startsWith(month + '-'); date = addDaysToDate(date, 1)) {
    const d = new Date(date + 'T00:00:00');
    const row: TimesheetRow = { date, day: d.toLocaleDateString('en-US', { weekday: 'long' }), hours: '', remarks: '', style: 'blank' };
    if (d.getDay() === 0 || d.getDay() === 6) { rows.push(row); continue; }
    const holiday = holidays.find(h => h.date === date || h.observedDate === date);
    if (holiday) { row.hours = 'PH'; row.remarks = holiday.name; row.style = 'leave'; rows.push(row); continue; }
    const leaves = relevant.filter(r => r.startDate <= date && r.endDate >= date);
    const portions = leaves.map(r => ({ r, half: halfDayOnDate(r, date), amount: r.startDate === r.endDate ? r.days : halfDayOnDate(r, date) ? 0.5 : 1 }));
    const total = portions.reduce((s, p) => s + p.amount, 0);
    if (total > 1 || portions.some(p => p.amount !== 0.5 && p.amount !== 1) || (portions.length === 2 && (!portions[0].half || !portions[1].half || portions[0].half === portions[1].half))) throw Error(`Conflicting leave records on ${formatDateDDMMYYYY(date)}. Review History before exporting.`);
    row.hours = total === 0 ? 9 : total === 0.5 ? 4.5 : portions.every(p => p.r.type === 'CO' || p.r.type === 'CL') ? 'CO' : 'L';
    row.style = typeof row.hours === 'number' ? 'work' : 'leave';
    row.remarks = portions.map(({r, half}) => {
      const co = r.type === 'CO' || r.type === 'CL';
      const reason = co ? compOffReason(r, date) : '';
      const label = co ? `Comp-Off: ${reason || r.title || 'credit not recorded'}` : r.type === 'SL' ? 'Sick Leave' : 'Annual Leave';
      return `${label}${half ? ` · ${half.toUpperCase()}` : r.days === 0.5 ? ' · Half Day' : ''}${!co&&r.notes?.trim() ? ` — ${r.notes.trim()}` : ''}`;
    }).join('; ');
    rows.push(row);
  }
  return { rows, totalHours: rows.reduce((s,r) => s + (typeof r.hours === 'number' ? r.hours : 0), 0), totalLeave: rows.reduce((s,r) => s + (r.hours === 'L' ? 1 : r.hours === 4.5 || r.hours === 4 ? 0.5 : 0), 0) };
}
