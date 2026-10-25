import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV,parseLeaveCSV } from '../src/utils/leaveCSV.ts';
import { cycleView,validCycle,compOffAllocation,effectiveStatus,quotaImpact } from '../src/utils/leaveAccounting.ts';
import { calculateWorkingDays,ALL_GAZETTED_HOLIDAYS } from '../src/data/singaporeHolidays2026.ts';
import { mergeHolidaySources } from '../src/utils/officialHolidays.ts';
const header='Type,Title,Start Date,End Date,Days,Status,Remarks';
const row='AL,Annual Leave,2026-10-26,2026-10-26,1,planned,';
const record=(extra={})=>({id:'r',type:'AL',title:'Annual Leave',startDate:'2026-10-26',endDate:'2026-10-26',days:1,status:'planned',createdAt:'2026-10-25',...extra});
const settings={cycleStartMonth:6,cycleStartDay:13,cycleEndMonth:6,cycleEndDay:12,alEntitlement:12,slEntitlement:12};
test('CSV round-trips multiline remarks, commas and escaped quotes',()=>{
 const result=parseLeaveCSV(header+'\r\nAL,"Annual ""special"" Leave",2026-10-26,2026-10-26,1,planned,"Line 1, quoted\r\nLine 2"',[]);
 assert.equal(result.length,1);assert.equal(result[0].title,'Annual "special" Leave');assert.equal(result[0].notes,'Line 1, quoted\r\nLine 2');
 assert.throws(()=>parseCSV('"unfinished'),/not closed/);
});
test('invalid rows reject the entire CSV instead of partially accepting it',()=>{
 for(const bad of ['ZZ,Bad,2026-10-27,2026-10-27,1,planned,','AL,Bad,2026-10-27,2026-10-27,99,planned,','AL,Bad,,,1,planned,','AL,Bad,2026-10-27,2026-10-27,0,planned,','AL,Bad,2026-10-27,2026-10-27,1,unknown,','AL,Bad,2026-10-25,2026-10-25,1,taken,'])assert.throws(()=>parseLeaveCSV(header+'\n'+row+'\n'+bad,[]));
});
test('supported legacy type and status survive restore',()=>{
 const r=parseLeaveCSV(header+'\nCL,Comp-off Leave,2026-04-24,2026-04-24,1,retroactive,',[])[0];assert.equal(r.type,'CL');assert.equal(r.status,'retroactive');
});
test('cycle balances exclude other years and split explicit half-day spans',()=>{
 assert.equal(cycleView([record({startDate:'2025-10-20',endDate:'2025-10-20'})],'2026-06-13','2027-06-12',[]).length,0);
 const r=record({startDate:'2026-06-12',endDate:'2026-06-15',days:1.5,halfDay:'am',halfDayDate:'2026-06-15'});
 assert.equal(cycleView([r],'2025-06-13','2026-06-12',[])[0].days,1);
 assert.equal(cycleView([r],'2026-06-13','2027-06-12',[])[0].days,0.5);
});
test('future-year and cross-year quota impact uses the requested cycles',()=>{
 const used=record({startDate:'2026-05-04',endDate:'2026-05-19',days:12});
 const r=record({startDate:'2026-06-12',endDate:'2026-06-15',days:1.5,halfDay:'am',halfDayDate:'2026-06-15'});
 const impact=quotaImpact(r,[used],settings,[]);assert.equal(impact.lop,1);assert.equal(impact.remaining,11.5);
 assert.equal(quotaImpact(record({startDate:'2027-10-26',endDate:'2027-10-26'}),[used],settings,[]).available,12);
});
test('credit allocation rejects future credits, re-use and exclusions but allows late submission',()=>{
 const holidays=[{date:'2026-06-20',isCompOffEligible:true},{date:'2026-10-10',isCompOffEligible:true}];
 const one=record({type:'CO',startDate:'2026-06-22',endDate:'2026-06-22'});
 assert.deepEqual(compOffAllocation([one],holidays,'2026-10-25').unfunded,[]);
 assert.ok(compOffAllocation([{...one,endDate:'2026-06-23',days:2}],holidays,'2026-10-25').unfunded.length);
 assert.ok(compOffAllocation([one,{...one,id:'r2',startDate:'2026-06-23',endDate:'2026-06-23'}],holidays,'2026-10-25').unfunded.length);
 assert.ok(compOffAllocation([one],holidays,'2026-10-25',['2026-06-20']).unfunded.length);
 assert.ok(compOffAllocation([{...one,startDate:'2026-10-05',endDate:'2026-10-05'}],holidays,'2026-10-25').unfunded.length);
});
test('cycle dates are valid every recurring year',()=>{
 assert.equal(validCycle(2,31,6,12),false);assert.equal(validCycle(4,31,6,12),false);assert.equal(validCycle(2,29,6,12),false);assert.equal(validCycle(2,28,6,12),true);
});
test('effective status is shared and holiday overrides are authoritative',()=>{
 assert.equal(effectiveStatus(record({startDate:'2026-09-17'}),'2026-10-25'),'taken');
 const official=Array.from({length:11},(_,i)=>({date:'2026-12-'+String(i+1).padStart(2,'0'),name:'Synthetic '+i}));
 const merged=mergeHolidaySources(ALL_GAZETTED_HOLIDAYS,official,[]).all;
 assert.equal(calculateWorkingDays('2026-02-17','2026-02-17',merged),1);
});

test('legacy single half-day credit uses only half a credit',()=>{
 const r=record({type:'CO',startDate:'2026-06-22',endDate:'2026-06-22',days:0.5});
 const result=compOffAllocation([r],[{date:'2026-06-20',isCompOffEligible:true}],'2026-10-25');
 assert.deepEqual(result.unfunded,[]);assert.equal(result.credits[0].left,0.5);
});

test('a custom-cycle gap never silently deducts zero days',()=>{
 assert.equal(quotaImpact(record({startDate:'2026-06-05',endDate:'2026-06-05'}),[],{...settings,cycleEndMonth:5,cycleEndDay:31},[]).outsideCycle,true);
});
