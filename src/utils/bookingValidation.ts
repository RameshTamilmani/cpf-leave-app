import type { LeaveRecord, PublicHoliday } from '../types/leave';
import { isValidISODate } from '../data/singaporeHolidays2026';
import { workingLeaveDates, halfDaySelectionError } from './leaveDuration';

// Used at the locked save boundary for both new and edited bookings.
export function bookingDetailsError(record: LeaveRecord, holidays: PublicHoliday[]): string | null {
  if (!['AL','SL','CO','CL'].includes(record.type) || !['planned','taken','retroactive'].includes(record.status)) return 'Choose a valid leave category and status.';
  if (!record.title?.trim()) return 'Enter a leave title.';
  if (!isValidISODate(record.startDate) || !isValidISODate(record.endDate) || record.endDate < record.startDate) return 'Choose valid start and end dates.';
  const dates=workingLeaveDates(record.startDate,record.endDate,holidays);
  if (!dates.length || dates[0]!==record.startDate || dates.at(-1)!==record.endDate) return 'Leave must start and end on working dates, excluding weekends and holidays.';
  if (!Number.isFinite(record.days) || record.days<=0 || ![dates.length,dates.length-0.5].includes(record.days)) return 'Days must match the selected working dates.';
  if (record.days===0.5 && record.startDate!==record.endDate) return 'For a single half day, use the same start and end date.';
  const hasSession=record.halfDay==='am'||record.halfDay==='pm';
  if (record.days%1===0.5) {
    const error=halfDaySelectionError(dates,record.halfDayDate || (record.startDate===record.endDate?record.startDate:''),record.halfDay||'');
    if(error)return error;
  } else if(hasSession || record.halfDayDate) return 'Half-day details do not match the deduction.';
  return null;
}
