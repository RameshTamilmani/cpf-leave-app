import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compOffDurationError,compOffReason} from '../src/utils/compOff.ts';
import {parseLeaveCSV} from '../src/utils/leaveCSV.ts';
import {buildTimesheet} from '../src/utils/timesheetRows.ts';
import {profileError} from '../src/utils/profile.ts';
import {compOffAllocation} from '../src/utils/leaveAccounting.ts';
const holidays=[{date:'2026-03-21',name:'Hari Raya Puasa',isCompOffEligible:true}];
const half=(id,date='2026-04-24',session='am')=>({id,type:'CO',title:'Hari Raya Puasa Comp-off',startDate:date,endDate:date,days:0.5,halfDay:session,halfDayDate:date,status:'taken',createdAt:'',compOffCredits:[{holidayDate:'2026-03-21',holidayName:'Hari Raya Puasa',leaveDate:date}]});
const header='Type,Title,Start Date,End Date,Days,Status,Half Day Date,Half Day Session,Comp Off Credits,Remarks';
const csv=rs=>header+'\n'+rs.map(r=>[r.type,r.title,r.startDate,r.endDate,r.days,r.status,r.halfDayDate||'',r.halfDay||'',JSON.stringify(r.compOffCredits),'Edited reason'].map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n');
test('Comp-Off half day requires AM/PM; multi-day adjustment also requires its working date',()=>{
 assert.equal(compOffDurationError(half('a')),null);
 assert.match(compOffDurationError({...half('a'),halfDay:'full'}),/AM or PM/);
 assert.ok(compOffDurationError({...half('a'),days:1}));
 assert.ok(compOffDurationError({...half('a'),days:1.5,endDate:'2026-04-27',halfDayDate:undefined}));
 assert.equal(compOffDurationError({...half('a'),days:1.5,endDate:'2026-04-27'}),null);
});
test('one credit funds two half days on different dates, including retrospective dates; never a third',()=>{
 const a=half('a'),b=half('b','2026-04-27','pm'),c=half('c','2026-04-28');
 let result=compOffAllocation([a],holidays,'2026-10-26');assert.equal(result.credits[0].left,0.5);
 result=compOffAllocation([a,b],holidays,'2026-10-26');assert.equal(result.credits[0].left,0);assert.equal(result.used.get('2026-03-21'),1);assert.deepEqual(result.unfunded,[]);assert.deepEqual(compOffAllocation([a,{...b,halfDay:'am'}],holidays,'2026-10-26').unfunded,[]);assert.equal(result.usage.get('2026-03-21').length,2);
 assert.deepEqual(compOffAllocation([a,b,c],holidays,'2026-10-26').unfunded,['c']);
 assert.deepEqual(compOffAllocation([a,{...b,days:1,halfDay:'full',halfDayDate:undefined}],holidays,'2026-10-26').unfunded,['b']);
});
test('remaining half day is still restricted to the same credit window and exclusions',()=>{
 const a=half('a');assert.ok(compOffAllocation([a,half('expired','2026-06-22')],holidays,'2026-10-26').unfunded.includes('expired'));
 assert.deepEqual(compOffAllocation([a],holidays,'2026-10-26',['2026-03-21']).unfunded,['a']);
});
test('CSV restore keeps AM/PM and date bindings, reconstructs date-free reasons and checks credit capacity',()=>{
 const before=csv([half('a'),half('b','2026-04-27','pm')]),restored=parseLeaveCSV(before,holidays);
 assert.equal(restored[0].notes,'Hari Raya Puasa Comp-off');assert.equal(restored[1].halfDay,'pm');assert.equal(restored[1].compOffCredits[0].holidayDate,'2026-03-21');
 assert.deepEqual(compOffAllocation(restored,holidays,'2026-10-26').unfunded,[]);
 const over=parseLeaveCSV(csv([half('a'),half('b','2026-04-27','pm'),half('c','2026-04-28')]),holidays);assert.equal(compOffAllocation(over,holidays,'2026-10-26').unfunded.length,1);
 assert.throws(()=>parseLeaveCSV(csv([half('a'),half('duplicate')]),holidays),/Overlapping/);
 assert.throws(()=>parseLeaveCSV(csv([{...half('bad'),halfDay:'full',halfDayDate:undefined}]),holidays),/AM or PM/);
});
test('same-day AM plus PM is valid, while the same elapsed AM session cannot be restored twice',()=>{
 const rs=parseLeaveCSV(csv([half('am'),half('pm','2026-04-24','pm')]),holidays);assert.equal(rs.length,2);assert.equal(compOffAllocation(rs,holidays,'2026-10-26').credits[0].left,0);
 assert.throws(()=>parseLeaveCSV(csv([half('am'),half('am2')]),holidays),/Overlapping/);
});
test('Excel half-day Comp-Off uses 4.5 hours and reason suffix only; HR leave formula is preserved',()=>{
 const a=half('a'),b=half('b','2026-04-27','pm');const result=buildTimesheet('2026-04',[a,b],holidays);
 assert.equal(result.rows[23].hours,4.5);assert.equal(result.rows[26].hours,4.5);assert.equal(result.rows[23].remarks,'Hari Raya Puasa Comp-off');assert.equal(result.totalLeave,1);
 const both=buildTimesheet('2026-04',[a,half('b','2026-04-24','pm')],holidays);assert.equal(both.rows[23].hours,'CO');assert.equal(both.totalLeave,0);assert.equal(both.rows[23].remarks,'Hari Raya Puasa Comp-off');
 assert.equal(compOffReason(a),'Hari Raya Puasa Comp-off');assert.equal(compOffReason({...a,compOffCredits:[...a.compOffCredits,...a.compOffCredits]}),'Hari Raya Puasa Comp-off');
});
test('phone remains required in profile and legacy phone stays compatible',()=>{
 const p={userName:'Test Person',employeeId:'6509',department:'HIS',dateOfJoining:'2022-11-18'};
 assert.match(profileError(p,'2026-10-26'),/contact number/);assert.equal(profileError({...p,contactNumber:'+91 90000 00000'},'2026-10-26'),'');assert.equal(profileError({...p,timesheetContact:'9000000000'},'2026-10-26'),'');assert.match(profileError({...p,contactNumber:'',timesheetContact:'9000000000'},'2026-10-26'),/contact number/);
});
