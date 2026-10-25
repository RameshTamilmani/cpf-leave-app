import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workingLeaveDates, halfDaySelectionError, halfDayOnDate, halfDaySummary, leavePeriodsOverlap } from '../src/utils/leaveDuration.ts';
import { getMonthEntries } from '../src/utils/calendarEntries.ts';
const dates=['2026-10-26','2026-10-27','2026-10-28','2026-10-29','2026-10-30'];
const span={id:'span',type:'AL',title:'Annual Leave',startDate:dates[0],endDate:dates[4],days:4.5,halfDay:'pm',halfDayDate:dates[2],status:'planned',createdAt:dates[0]};
test('any working date can be the half day; all other dates remain full',()=>{
  assert.deepEqual(workingLeaveDates(dates[0],dates[4],[]),dates);
  for(const date of [dates[0],dates[2],dates[4]]) for(const session of ['am','pm']){
    const record={...span,halfDayDate:date,halfDay:session};
    assert.equal(halfDaySelectionError(dates,date,session),null);
    assert.equal(halfDayOnDate(record,date),session);
    assert.ok(dates.filter(d=>d!==date).every(d=>halfDayOnDate(record,d)===null));
    assert.equal(dates.reduce((sum,d)=>sum+(halfDayOnDate(record,d)?0.5:1),0),4.5);
  }
});
test('selection must specify date and session and exclude weekends and holidays',()=>{
  const holiday={date:dates[2],name:'Company Day',isSpecial:true};
  const available=workingLeaveDates('2026-10-23','2026-10-30',[holiday]);
  assert.ok(!available.includes('2026-10-24'));assert.ok(!available.includes('2026-10-25'));assert.ok(!available.includes(dates[2]));
  for(const date of ['', '2026-10-24', '2026-10-31',dates[2]])assert.match(halfDaySelectionError(available,date,'am'),/working date/);
  assert.match(halfDaySelectionError(available,dates[0],''),/AM or PM/);
});
test('calendar shows the session only on the selected date, including spanning months',()=>{
  const entries=getMonthEntries(2026,9,[],[span]);
  assert.deepEqual(entries.filter(e=>halfDayOnDate(e.record,e.date)).map(e=>e.date),[dates[2]]);
  const cross={...span,startDate:'2026-10-30',endDate:'2026-11-03',days:2.5,halfDayDate:'2026-11-02'};
  assert.equal(halfDayOnDate(cross,getMonthEntries(2026,10,[],[cross])[0].date),'pm');
});
test('complementary half-day sessions can coexist; full-day and matching session conflicts remain blocked',()=>{
  const single={...span,startDate:dates[2],endDate:dates[2],days:0.5,halfDay:'am'};
  assert.equal(leavePeriodsOverlap(span,single,[]),false);
  assert.equal(leavePeriodsOverlap(span,{...single,halfDay:'pm'},[]),true);
  assert.equal(leavePeriodsOverlap(span,{...single,halfDay:'full',days:1},[]),true);
  assert.equal(leavePeriodsOverlap(span,{...single,startDate:dates[1],endDate:dates[1]},[]),true);
});
test('legacy records do not invent a half-day date; existing single-day sessions still display',()=>{
  const legacy={...span,halfDay:'full',halfDayDate:undefined};
  assert.match(halfDaySummary(legacy),/not recorded/);
  assert.ok(dates.every(date=>halfDayOnDate(legacy,date)===null));
  assert.equal(halfDayOnDate({...span,startDate:dates[0],endDate:dates[0],days:0.5,halfDayDate:undefined},dates[0]),'pm');
});
