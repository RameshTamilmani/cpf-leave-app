import type { LeaveRecord, PublicHoliday } from '../types/leave';
import { parseDDMMYYYYToISO } from '../data/singaporeHolidays2026';
import { workingLeaveDates, halfDaySelectionError, leavePeriodsOverlap } from './leaveDuration';
export function parseCSV(text: string): string[][] {
  const rows:string[][]=[];let row:string[]=[];let cell='';let quoted=false;let closed=false;
  text=text.replace(/^\uFEFF/,'');
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(quoted) {if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;continue;}
    if(c==='"') {if(cell.length||closed)throw Error('Invalid quotation marks in CSV.');quoted=true;}
    else if(c===',') {row.push(cell);cell='';closed=false;}
    else if(c==='\n'||c==='\r') {if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';closed=false;}
    else {if(closed&&!/\s/.test(c))throw Error('Unexpected text after a quoted CSV value.');if(!closed)cell+=c;}
  }
  if(quoted)throw Error('A quoted CSV value is not closed.');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);return rows;
}
export function parseLeaveCSV(text:string,holidays:PublicHoliday[]):LeaveRecord[] {
  const rows=parseCSV(text);if(rows.length<2)throw Error('Choose a CSV export with leave records.');
  const headers=rows.shift()!.map(h=>h.trim().toLowerCase());
  const indexes={type:headers.indexOf('type'),title:headers.findIndex(h=>h==='title'||h==='reason'),start:headers.findIndex(h=>h==='start date'||h==='start'),end:headers.findIndex(h=>h==='end date'||h==='end'),days:headers.findIndex(h=>h==='days'||h==='day'),status:headers.indexOf('status'),notes:headers.findIndex(h=>h==='remarks'||h==='notes'),halfDate:headers.indexOf('half day date'),half:headers.indexOf('half day session')};
  if(['type','title','start','end','days','status'].some(k=>indexes[k as keyof typeof indexes]<0))throw Error('Unsupported CSV columns. Choose a CutiSG export.');
  const records:LeaveRecord[]=[];
  rows.forEach((cells,i)=>{
    const fail=(message:string):never=>{throw Error(`Row ${i+2}: ${message} No records were changed.`);};
    if(cells.length!==headers.length)fail('The number of values does not match the headings.');
    const get=(k:keyof typeof indexes)=>indexes[k]>=0?(cells[indexes[k]]||'').trim():'';
    const type=get('type').toUpperCase(),status=get('status').toLowerCase();
    if(!['AL','SL','CO','CL'].includes(type))fail('Unknown leave type.');
    if(!['planned','taken','retroactive'].includes(status))fail('Unknown leave status.');
    const startDate=parseDDMMYYYYToISO(get('start')),endDate=parseDDMMYYYYToISO(get('end')),days=Number(get('days'));
    if(!startDate||!endDate||endDate<startDate)fail('Enter valid start and end dates.');
    if(!get('title'))fail('Leave title is missing.');
    const dates=workingLeaveDates(startDate,endDate,holidays);
    if(!dates.length||dates[0]!==startDate||dates.at(-1)!==endDate)fail('Leave must start and end on working dates.');
    if(!Number.isFinite(days)||days<=0||days*2%1!==0||!(days===dates.length||days===dates.length-0.5))fail('Days must match the working dates.');
    const session=get('half').toLowerCase(),rawDate=get('halfDate');
    if(session&&!['full','am','pm'].includes(session))fail('Unknown half-day session.');
    const halfDay=session as LeaveRecord['halfDay']||undefined;
    const halfDayDate=rawDate?parseDDMMYYYYToISO(rawDate):((halfDay==='am'||halfDay==='pm')&&startDate===endDate?startDate:undefined);
    if(rawDate&&!halfDayDate)fail('Invalid half-day date.');
    if(halfDayDate&&halfDay!=='am'&&halfDay!=='pm')fail('Choose AM or PM for the half-day date.');
    if(halfDay==='am'||halfDay==='pm') {const error=halfDaySelectionError(dates,halfDayDate||'',halfDay);if(error||days!==dates.length-0.5)fail(error||'Half-day details do not match the deduction.');}
    const record:LeaveRecord={id:`restore_${i}`,createdAt:new Date().toISOString(),type:type as LeaveRecord['type'],title:cells[indexes.title],startDate,endDate,days,status:status as LeaveRecord['status'],notes:indexes.notes>=0?cells[indexes.notes]:undefined,halfDay,halfDayDate};
    if(records.some(r=>leavePeriodsOverlap(r,record,holidays)))fail('Overlapping leave sessions were found.');
    records.push(record);
  });
  return records;
}
