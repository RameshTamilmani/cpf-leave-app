import type { LeaveRecord, PublicHoliday, UserSettings } from '../types/leave';
import { isValidISODate, addDaysToDate } from '../data/singaporeHolidays2026';
import { workingLeaveDates, halfDayOnDate } from './leaveDuration';

export const effectiveStatus = (r: LeaveRecord, today: string) => r.status === 'planned' && r.startDate <= today ? 'taken' : r.status;
export function cycleDayLimit(month: number) { return month === 2 ? 28 : [4, 6, 9, 11].includes(month) ? 30 : 31; }
export function validCycle(sm: number, sd: number, em: number, ed: number) {
  return [sm, sd, em, ed].every(Number.isInteger) && sm >= 1 && sm <= 12 && em >= 1 && em <= 12 && sd >= 1 && sd <= cycleDayLimit(sm) && ed >= 1 && ed <= cycleDayLimit(em);
}
export function cycleFor(date: string, settings: Partial<UserSettings>) {
  const sm = settings.cycleStartMonth ?? 6, sd = settings.cycleStartDay ?? 13, em = settings.cycleEndMonth ?? 6, ed = settings.cycleEndDay ?? 12;
  const year = Number(date.slice(0, 4)); const md = date.slice(5);
  const startMD = `${String(sm).padStart(2,'0')}-${String(sd).padStart(2,'0')}`, endMD = `${String(em).padStart(2,'0')}-${String(ed).padStart(2,'0')}`;
  const cross = endMD <= startMD; const startYear = cross && md < startMD ? year - 1 : year;
  return { start: `${startYear}-${startMD}`, end: `${startYear + Number(cross)}-${endMD}` };
}
export function daysInWindow(r: LeaveRecord, start: string, end: string, holidays: PublicHoliday[]) {
  if (r.endDate < start || r.startDate > end) return 0;
  if(r.startDate>=start&&r.endDate<=end)return r.days;
  const dates = workingLeaveDates(r.startDate, r.endDate, holidays);
  const inside = dates.filter(d => d >= start && d <= end);
  if(dates.length===1&&inside.length===1)return r.days;
  // Preserve the totals of legacy records with an unspecified half-day date.
  if (!r.halfDayDate && r.days % 1 === 0.5 && r.startDate !== r.endDate) return inside.length === dates.length ? r.days : Math.min(r.days, inside.length);
  return inside.reduce((sum, date) => sum + (halfDayOnDate(r, date) ? 0.5 : 1), 0);
}
export function cycleView(records: LeaveRecord[], start: string, end: string, holidays: PublicHoliday[]) {
  return records.map(r => {
    const days = daysInWindow(r,start,end,holidays);
    const dates = workingLeaveDates(r.startDate,r.endDate,holidays).filter(d=>d>=start&&d<=end);
    return {...r, days, startDate: dates[0] || r.startDate, endDate: dates.at(-1) || r.endDate,
      halfDay: r.halfDayDate && (r.halfDayDate<start||r.halfDayDate>end) ? 'full' as const : r.halfDay};
  }).filter(r=>r.days>0);
}
export function quotaImpact(r: LeaveRecord, records: LeaveRecord[], settings: UserSettings, holidays: PublicHoliday[]) {
  const cycles = new Map<string, ReturnType<typeof cycleFor>>();
  workingLeaveDates(r.startDate,r.endDate,holidays).forEach(d=>{ const c=cycleFor(d,settings); cycles.set(c.start,c); });
  const outsideCycle=workingLeaveDates(r.startDate,r.endDate,holidays).some(d=>{const c=cycleFor(d,settings);return d<c.start||d>c.end;});
  let available=0, remaining=0, lop=0;
  for(const c of cycles.values()) {
    const entitlement = r.type==='AL' ? settings.alEntitlement : settings.slEntitlement;
    const used = records.filter(x=>x.type===r.type).reduce((s,x)=>s+daysInWindow(x,c.start,c.end,holidays),0);
    const left=Math.max(0,entitlement-used), wanted=daysInWindow(r,c.start,c.end,holidays);
    available+=left;remaining+=Math.max(0,left-wanted);lop+=Math.max(0,wanted-left);
  }
  return {available,remaining,lop,outsideCycle};
}
export function compOffAllocation(records: LeaveRecord[], holidays: PublicHoliday[], today: string, excluded: string[] = []) {
  const credits = [...new Map(holidays.filter(h => (h.isCompOffEligible ?? new Date(h.date+'T00:00:00').getDay()===6) && h.date<today && !excluded.includes(h.date)).map(h=>[h.date,{date:h.date,name:h.name,end:addDaysToDate(h.date,90),left:1}])).values()].sort((a,b)=>a.end.localeCompare(b.end));
  const used = new Map<string,number>(), reserved = new Map<string,string>();
  const assignments = new Map<string,NonNullable<LeaveRecord['compOffCredits']>>();
  const unfunded: string[]=[];
  const demands: {id:string;date:string;days:number}[]=[];
  // Preserve the established allocation of legacy unlinked records first.
  for(const r of records.filter(r=>(r.type==='CO'||r.type==='CL') && r.compOffCredits===undefined)) {
    if(r.days%1===0.5 && r.startDate!==r.endDate && !r.halfDayDate) { unfunded.push(r.id); continue; }
    const dates=workingLeaveDates(r.startDate,r.endDate,holidays);
    const portions=dates.map(date=>({id:r.id,date,days:dates.length===1?r.days:halfDayOnDate(r,date)?0.5:1}));
    if(!dates.length||portions.reduce((s,d)=>s+d.days,0)!==r.days)unfunded.push(r.id);
    demands.push(...portions);
  }
  demands.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
  for(const demand of demands) {
    let needed=demand.days;
    for(const credit of credits) {
      if(credit.date>demand.date||credit.end<demand.date||credit.left===0)continue;
      const amount=Math.min(needed,credit.left);credit.left-=amount;needed-=amount;
      used.set(credit.date,(used.get(credit.date)||0)+amount); reserved.set(credit.date,demand.id);
      const list=assignments.get(demand.id)||[];
      if(!list.some(c=>c.holidayDate===credit.date&&c.leaveDate===demand.date))list.push({holidayDate:credit.date,holidayName:credit.name,leaveDate:demand.date});
      assignments.set(demand.id,list);
      if(!needed)break;
    }
    if(needed)unfunded.push(demand.id);
  }
  // New records bind one distinct credit to each working leave date. Even a
  // half-day application reserves that holiday credit against another booking.
  for(const r of records.filter(r=>(r.type==='CO'||r.type==='CL') && r.compOffCredits!==undefined)) {
    const dates=workingLeaveDates(r.startDate,r.endDate,holidays), selections=r.compOffCredits!;
    const total=dates.reduce((s,d)=>s+(dates.length===1?r.days:halfDayOnDate(r,d)?0.5:1),0);
    if(!dates.length||total!==r.days||selections.length!==dates.length||new Set(selections.map(c=>c.holidayDate)).size!==selections.length||new Set(selections.map(c=>c.leaveDate)).size!==dates.length||(r.days%1===0.5&&r.startDate!==r.endDate&&!r.halfDayDate)) { unfunded.push(r.id); continue; }
    const chosen=selections.map(c=>({selection:c,credit:credits.find(x=>x.date===c.holidayDate)}));
    if(chosen.some(({selection:c,credit})=>!dates.includes(c.leaveDate)||!c.holidayName?.trim()||!credit||credit.left!==1||reserved.has(c.holidayDate)||credit.date>c.leaveDate||credit.end<c.leaveDate)) {unfunded.push(r.id);continue;}
    for(const {selection:c,credit} of chosen) {
      credit!.left=0;reserved.set(c.holidayDate,r.id);
      used.set(c.holidayDate,dates.length===1?r.days:halfDayOnDate(r,c.leaveDate)?0.5:1);
    }
    assignments.set(r.id,selections);
  }
  return {credits,used,reserved,assignments,unfunded:[...new Set(unfunded)]};
}
