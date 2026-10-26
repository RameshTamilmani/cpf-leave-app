import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fullDayCompOffError} from '../src/utils/compOff.ts';
import {parseLeaveCSV} from '../src/utils/leaveCSV.ts';
import {buildTimesheet} from '../src/utils/timesheetRows.ts';
import {profileError} from '../src/utils/profile.ts';
const half={id:'old',type:'CO',title:'Comp-Off',startDate:'2026-10-27',endDate:'2026-10-27',days:0.5,halfDay:'am',halfDayDate:'2026-10-27',status:'planned',createdAt:''};
const header='Type,Title,Start Date,End Date,Days,Status,Half Day Date,Half Day Session,Comp Off Credits';
test('Comp-Off rejects half days, half-day adjustments and misleading half-day metadata',()=>{
 assert.match(fullDayCompOffError(half),/full working days only/);
 assert.ok(fullDayCompOffError({...half,days:1}));
 assert.ok(fullDayCompOffError({...half,days:1.5,endDate:'2026-10-28',halfDay:'full',halfDayDate:undefined}));
 assert.equal(fullDayCompOffError({...half,days:2,endDate:'2026-10-28',halfDay:'full',halfDayDate:undefined}),null);
 assert.equal(fullDayCompOffError({...half,type:'AL'}),null);
});
test('CSV restore refuses half-day CO and CL without mutating the incoming file',()=>{
 for(const type of ['CO','CL'])assert.throws(()=>parseLeaveCSV(header+`\n${type},Comp-Off,2026-10-27,2026-10-27,0.5,planned,2026-10-27,am,`,[]),/full working days only/);
 assert.equal(parseLeaveCSV(header+'\nAL,Annual Leave,2026-10-27,2026-10-27,0.5,planned,2026-10-27,am,',[])[0].days,0.5);
});
test('Excel export refuses historical half-day Comp-Off instead of silently rounding it',()=>{
 const before=JSON.stringify(half);assert.throws(()=>buildTimesheet('2026-10',[half],[]),/full working days only/);assert.equal(JSON.stringify(half),before);
});
test('Comp-Off remarks are generated from selected credits, not edited CSV remarks',()=>{
 const selected=[{holidayDate:'2026-10-10',holidayName:'Credit A',leaveDate:'2026-10-27'}];
 const csv=header+',Remarks\nCO,Comp-Off,2026-10-27,2026-10-27,1,planned,,,"'+JSON.stringify(selected).replaceAll('"','""')+'",Wrong reason';
 const r=parseLeaveCSV(csv,[])[0];assert.equal(r.notes,'Credit A (10/10/2026)');assert.equal(buildTimesheet('2026-10',[r],[]).rows[26].remarks,'Comp-Off: Credit A (10/10/2026)');
});
test('phone is required in profile, legacy phone is compatible and explicit blank does not fall back',()=>{
 const p={userName:'Test Person',employeeId:'6509',department:'HIS',dateOfJoining:'2022-11-18'};
 assert.match(profileError(p,'2026-10-26'),/contact number/);
 assert.equal(profileError({...p,contactNumber:'+91 90000 00000'},'2026-10-26'),'');
 assert.equal(profileError({...p,timesheetContact:'9000000000'},'2026-10-26'),'');
 assert.match(profileError({...p,contactNumber:'',timesheetContact:'9000000000'},'2026-10-26'),/contact number/);
});
