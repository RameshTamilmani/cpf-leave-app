import type { LeaveRecord } from '../types/leave';
import { formatDateDDMMYYYY } from '../data/singaporeHolidays2026';

export function fullDayCompOffError(record: Pick<LeaveRecord,'type'|'days'|'halfDay'|'halfDayDate'>): string | null {
  return (record.type==='CO'||record.type==='CL') && (!Number.isInteger(record.days)||record.days<1||record.halfDay==='am'||record.halfDay==='pm'||!!record.halfDayDate)
    ? 'Comp-Off is available for full working days only. Review the half-day Comp-Off record in History; no records were changed.' : null;
}

export function compOffReason(record: Pick<LeaveRecord, 'compOffCredits'>, leaveDate?: string): string {
  return (record.compOffCredits || []).filter(c => !leaveDate || c.leaveDate === leaveDate)
    .map(c => `${c.holidayName} (${formatDateDDMMYYYY(c.holidayDate)})`).join('; ');
}
