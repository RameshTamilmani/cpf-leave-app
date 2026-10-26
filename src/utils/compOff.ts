import type { LeaveRecord } from '../types/leave';
import { isValidISODate } from '../data/singaporeHolidays2026';

export function compOffDurationError(record: Pick<LeaveRecord,'type'|'days'|'halfDay'|'halfDayDate'|'startDate'|'endDate'>): string | null {
  if(record.type!=='CO'&&record.type!=='CL')return null;
  if(!Number.isFinite(record.days)||record.days<0.5||record.days*2%1!==0)return 'Choose full days or a half day for Comp-Off.';
  const half=record.days%1===0.5,session=record.halfDay==='am'||record.halfDay==='pm';
  if(half&&!session)return 'Choose AM or PM for the half-day Comp-Off leave.';
  if(half&&record.startDate!==record.endDate&&!record.halfDayDate)return 'Choose the working date for the half-day Comp-Off leave.';
  if(!half&&(session||record.halfDayDate))return 'Half-day details do not match the Comp-Off deduction.';
  if(record.halfDayDate&&(!isValidISODate(record.halfDayDate)||record.halfDayDate<record.startDate||record.halfDayDate>record.endDate))return 'Choose a valid half-day date within this leave period.';
  return null;
}

export function compOffReason(record: Pick<LeaveRecord, 'compOffCredits'>, leaveDate?: string): string {
  return [...new Set((record.compOffCredits || []).filter(c => !leaveDate || c.leaveDate === leaveDate)
    .map(c => c.holidayName.trim().replace(/\s+comp[- ]?off$/i,'')+' Comp-off'))].join('; ');
}
