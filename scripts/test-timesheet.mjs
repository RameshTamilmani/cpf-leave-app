import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildTimesheet,validContact} from '../src/utils/timesheetRows.ts';
import {compOffAllocation} from '../src/utils/leaveAccounting.ts';
import {parseLeaveCSV} from '../src/utils/leaveCSV.ts';
const r=(extra={})=>({id:'r',type:'AL',title:'Annual Leave',startDate:'2026-10-14',endDate:'2026-10-14',days:1,status:'planned',createdAt:'',...extra});
const holidays=[{date:'2026-09-26',name:'Credit A',isCompOffEligible:true},{date:'2026-10-10',name:'Credit B',isCompOffEligible:true}];
test('October HR sample: 20 nine-hour days, two leaves, blank weekends and unchanged HR totals',()=>{
 const result=buildTimesheet('2026-10',[r(),r({id:'s',type:'SL',startDate:'2026-10-06',endDate:'2026-10-06'})],[]);
 assert.equal(result.rows.length,31);assert.equal(result.totalHours,180);assert.equal(result.totalLeave,2);
 assert.equal(result.rows[2].hours,'');assert.equal(result.rows[3].remarks,'');assert.equal(result.rows[30].hours,'');
});
test('future unbooked dates are nine hours; future booked leave and Singapore weekday holidays are retained',()=>{
 const result=buildTimesheet('2026-10',[r({startDate:'2026-10-30',endDate:'2026-10-30'})],[{date:'2026-10-29',name:'Synthetic Singapore Day'},{date:'2026-10-31',name:'Saturday Holiday'}]);
 assert.equal(result.rows[27].hours,9);assert.equal(result.rows[28].hours,'L');assert.equal(result.rows[29].hours,'L');assert.equal(result.rows[30].hours,'');
});
test('half days preserve AM/PM and Comp-Off reason while full-day Comp-Off uses L',()=>{
 const records=[r({days:0.5,halfDay:'pm',halfDayDate:'2026-10-14'}),r({id:'co',type:'CO',startDate:'2026-10-15',endDate:'2026-10-15',compOffCredits:[{holidayDate:'2026-10-10',holidayName:'Credit B',leaveDate:'2026-10-15'}]})];
 const result=buildTimesheet('2026-10',records,holidays);assert.equal(result.rows[13].hours,4.5);assert.match(result.rows[13].remarks,/PM/);assert.equal(result.rows[14].hours,'L');assert.match(result.rows[14].remarks,/Credit B Comp-off/);assert.equal(result.totalLeave,1.5);
});
test('all month lengths and year transitions use the actual calendar',()=>{
 assert.equal(buildTimesheet('2028-02',[],[]).rows.length,29);assert.equal(buildTimesheet('2027-02',[],[]).rows.length,28);assert.equal(buildTimesheet('2026-04',[],[]).rows.length,30);assert.equal(buildTimesheet('2026-12',[],[]).rows.at(-1).date,'2026-12-31');assert.throws(()=>buildTimesheet('2026-13',[],[]));
 assert.throws(()=>buildTimesheet('2026-10',[r({startDate:'2026-10-12',endDate:'2026-10-16',days:4.5})],[]),/missing its date/);
});
const co=(id,date,credit,extra={})=>r({id,type:'CO',startDate:date,endDate:date,compOffCredits:[{holidayDate:credit,holidayName:credit==='2026-09-26'?'Credit A':'Credit B',leaveDate:date}],...extra});
test('selected credit is required to be unused, earned and in its own date window',()=>{
 const a=co('a','2026-10-27','2026-09-26');assert.equal(compOffAllocation([a],holidays,'2026-10-26').unfunded.length,0);
 assert.deepEqual(compOffAllocation([a,co('b','2026-10-28','2026-09-26')],holidays,'2026-10-26').unfunded,['b']);
 assert.equal(compOffAllocation([co('future','2026-10-09','2026-10-10')],holidays,'2026-10-26').unfunded.length,1);
 assert.equal(compOffAllocation([co('expired','2027-01-11','2026-10-10')],holidays,'2027-01-12').unfunded.length,1);
 assert.equal(compOffAllocation([a],holidays,'2026-09-25').unfunded.length,1);
});
test('half-day credit retains 0.5 balance; a full-day reuse is blocked and deletion releases it',()=>{
 const a=co('a','2026-10-27','2026-09-26',{days:0.5,halfDay:'am',halfDayDate:'2026-10-27'});
 const b=co('b','2026-10-28','2026-09-26');let result=compOffAllocation([a],holidays,'2026-10-26');assert.equal(result.credits.find(c=>c.date==='2026-09-26').left,0.5);assert.equal(result.used.get('2026-09-26'),0.5);
 assert.deepEqual(compOffAllocation([a,b],holidays,'2026-10-26').unfunded,['b']);assert.equal(compOffAllocation([b],holidays,'2026-10-26').unfunded.length,0);
 assert.equal(compOffAllocation([a,co('b','2026-10-28','2026-10-10')],holidays,'2026-10-26').unfunded.length,0);
});
test('legacy allocation is preserved and cannot be stolen by a selected booking',()=>{
 const old=r({id:'old',type:'CL',startDate:'2026-10-12',endDate:'2026-10-12'});
 const result=compOffAllocation([old,co('new','2026-10-27','2026-09-26')],holidays,'2026-10-26');assert.deepEqual(result.unfunded,['new']);assert.equal(result.assignments.get('old')[0].holidayDate,'2026-09-26');
});
test('multiple working dates require distinct credits; serialized selection round-trips through CSV',()=>{
 const rec=co('multi','2026-10-27','2026-09-26',{endDate:'2026-10-28',days:2});assert.equal(compOffAllocation([rec],holidays,'2026-10-26').unfunded.length,1);
 rec.compOffCredits.push({holidayDate:'2026-10-10',holidayName:'Credit B',leaveDate:'2026-10-28'});assert.equal(compOffAllocation([rec],holidays,'2026-10-26').unfunded.length,0);
 const sheet=buildTimesheet('2026-10',[rec],holidays);assert.equal(sheet.rows[26].hours,'L');assert.equal(sheet.rows[27].hours,'L');assert.equal(sheet.rows[26].remarks,'Credit A Comp-off');assert.equal(sheet.rows[27].remarks,'Credit B Comp-off');
 const csv='Type,Title,Start Date,End Date,Days,Status,Comp Off Credits\nCO,Comp-Off,2026-10-27,2026-10-28,2,planned,"'+JSON.stringify(rec.compOffCredits).replaceAll('"','""')+'"';assert.deepEqual(parseLeaveCSV(csv,holidays)[0].compOffCredits,rec.compOffCredits);
});
test('contact supports international/local text numbers for the required employee-profile field',()=>{assert.ok(validContact('+91 90000 00000'));assert.ok(validContact('9000000000'));assert.equal(validContact(''),false);assert.equal(validContact('123'),false);assert.equal(validContact('phone'),false);});

test('weekday holidays export as L with Holiday suffix and no substitute/observed qualifier',()=>{
 const november=buildTimesheet('2026-11',[],[{date:'2026-11-08',name:'Deepavali'},{date:'2026-11-09',name:'Deepavali (Substitute)'}]);
 assert.equal(november.rows[7].hours,'');assert.equal(november.rows[7].remarks,'');
 assert.equal(november.rows[8].hours,'L');assert.equal(november.rows[8].remarks,'Deepavali Holiday');assert.equal(november.totalLeave,1);assert.equal(november.totalHours,180);
 const february=buildTimesheet('2027-02',[],[{date:'2027-02-08',name:'Chinese New Year Day 2 (Substitute)'}]);
 assert.equal(february.rows[7].hours,'L');assert.equal(february.rows[7].remarks,'Chinese New Year Day 2 Holiday');assert.equal(february.totalLeave,1);
 const legacy=buildTimesheet('2026-10',[],[{date:'2026-10-29',name:'Example Day (Observed)'},{date:'2026-10-30',name:'Company Holiday'}]);
 assert.equal(legacy.rows[28].remarks,'Example Day Holiday');assert.equal(legacy.rows[29].remarks,'Company Holiday');assert.equal(legacy.totalLeave,2);
});
