import {createServer} from 'vite';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const server=await createServer({server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error'});await server.listen();
const browser=await chromium.launch({channel:process.env.TEST_BROWSER_CHANNEL||'chrome',headless:true});
try {
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844},acceptDownloads:true});
 await context.addInitScript(()=>{
  if(localStorage.getItem('edit-seed'))return;localStorage.setItem('edit-seed','1');
  localStorage.setItem('cutisg_settings',JSON.stringify({userName:'Edit Test',employeeId:'6509',department:'HIS',contactNumber:'9000000000',dateOfJoining:'2022-11-18',theme:'light'}));
  const row=(id,type,startDate,days=1,extra={})=>({id,type,startDate,endDate:startDate,days,title:type==='AL'?'Annual Leave':'Sick Leave',status:'taken',createdAt:'2026-10-01T00:00:00Z',...extra});
  localStorage.setItem('cutisg_records',JSON.stringify([row('annual','AL','2026-10-14'),row('sick','SL','2026-10-06'),row('co1','CO','2026-10-20',0.5,{title:'Synthetic Credit Comp-off',halfDay:'am',halfDayDate:'2026-10-20',notes:'Synthetic Credit Comp-off',compOffCredits:[{holidayDate:'2026-09-26',holidayName:'Synthetic Credit',leaveDate:'2026-10-20'}]}),row('co2','CO','2026-10-21',0.5,{title:'Synthetic Credit Comp-off',halfDay:'pm',halfDayDate:'2026-10-21',notes:'Synthetic Credit Comp-off',compOffCredits:[{holidayDate:'2026-09-26',holidayName:'Synthetic Credit',leaveDate:'2026-10-21'}]})]));
 });
 await context.route('**/api/holidays',r=>r.fulfill({json:{rows:[{date:'2026-09-26',holiday:'Synthetic Credit'}]}}));
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-27T12:00:00+05:30')});
 await page.goto('http://127.0.0.1:'+server.httpServer.address().port);await page.getByRole('heading',{name:'Edit Test',exact:true}).waitFor();await page.waitForFunction(()=>!!localStorage.getItem('cutisg_official_holidays'));
 const nav=name=>page.locator('nav').getByText(name,{exact:true}).click();
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('cutisg_records')));
 const form=page.locator('form');const save=()=>form.getByRole('button',{name:'Save Changes',exact:true}).click();
 async function edit(date){await nav('History');await page.getByText(date,{exact:false}).filter({hasText:date}).first().locator('xpath=ancestor::div[contains(@class,"bg-surface-card")][1]').getByRole('button',{name:'Edit leave record',exact:true}).click();await page.getByRole('heading',{name:'Edit Leave',exact:true}).waitFor();}
 // The quick action exposes only a button until opened, and locks background scrolling.
 assert.equal(await page.getByLabel('Timesheet Month',{exact:true}).count(),0);await page.getByRole('button',{name:'Timesheet',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Export Timesheet',exact:true});await dialog.waitFor();assert.equal(await page.evaluate(()=>document.body.style.position),'fixed');
 await page.getByLabel('Timesheet Month',{exact:true}).fill('2026-09');await mkdir('ui-screenshots',{recursive:true});await dialog.screenshot({path:'ui-screenshots/home-timesheet-popup-light.png'});
 const pending=page.waitForEvent('download');await dialog.getByRole('button',{name:'Export Timesheet',exact:true}).click();assert.equal((await pending).suggestedFilename(),'Optimum India_Timesheet Sep 2026.xlsx');await dialog.waitFor({state:'hidden'});
 await nav('Settings');assert.equal(await page.getByLabel('Timesheet Month',{exact:true}).count(),0);await nav('Home');
 // Start Date always synchronizes End Date; changing End Date remains independent.
 await page.getByRole('button',{name:'Apply Leave',exact:true}).click();await page.getByRole('textbox',{name:'Start Date',exact:true}).fill('05/10/2026');assert.equal(await page.getByRole('textbox',{name:'End Date',exact:true}).inputValue(),'05/10/2026');await page.getByRole('textbox',{name:'End Date',exact:true}).fill('07/10/2026');assert.equal(await page.getByRole('textbox',{name:'Start Date',exact:true}).inputValue(),'05/10/2026');await form.getByRole('button',{name:'Cancel',exact:true}).click();
 // Editing keeps identity, can change category/session, and refuses conflicting/non-working dates.
 await edit('14/10/2026');assert.equal(await page.getByRole('textbox',{name:'Start Date',exact:true}).inputValue(),'14/10/2026');assert.equal(await form.getByRole('button',{name:'Save Changes',exact:true}).isEnabled(),true);
 await page.getByRole('textbox',{name:'Start Date',exact:true}).fill('06/10/2026');assert.equal(await form.locator('button[type="submit"]').isDisabled(),true);
 await page.getByRole('textbox',{name:'Start Date',exact:true}).fill('10/10/2026');assert.equal(await form.locator('button[type="submit"]').isDisabled(),true);
 await page.getByRole('textbox',{name:'Start Date',exact:true}).fill('09/11/2026');assert.equal(await form.locator('button[type="submit"]').isDisabled(),true);
 await page.getByRole('textbox',{name:'Start Date',exact:true}).fill('14/10/2026');await form.getByRole('button').filter({hasText:'Sick (SL)'}).click();await form.getByRole('button',{name:'Half Day (PM)',exact:true}).click();await page.getByLabel('Remarks',{exact:true}).fill('Medical appointment');await save();await page.getByRole('heading',{name:'Edit Leave',exact:true}).waitFor({state:'hidden'});
 let records=await read();assert.equal(records.length,4);let annual=records.find(r=>r.id==='annual');assert.equal(annual.type,'SL');assert.equal(annual.days,0.5);assert.equal(annual.halfDay,'pm');assert.equal(annual.notes,'Medical appointment');assert.equal(annual.createdAt,'2026-10-01T00:00:00Z');
 // Reopen a multi-day half adjustment and preserve both its day and AM/PM selection.
 await edit('14/10/2026');await page.getByRole('textbox',{name:'End Date',exact:true}).fill('16/10/2026');await form.getByRole('button',{name:/Half-Day Adjustment/}).click();await page.getByLabel('Half-Day Date',{exact:true}).selectOption('2026-10-15');await page.getByRole('button',{name:'AM · Morning Leave',exact:true}).click();await save();await page.getByRole('heading',{name:'Edit Leave',exact:true}).waitFor({state:'hidden'});
 await edit('14/10/2026');assert.equal(await page.getByLabel('Half-Day Date',{exact:true}).inputValue(),'2026-10-15');assert.equal(await page.getByRole('button',{name:'AM · Morning Leave',exact:true}).getAttribute('aria-pressed'),'true');await save();await page.getByRole('heading',{name:'Edit Leave',exact:true}).waitFor({state:'hidden'});assert.equal((await read()).find(r=>r.id==='annual').days,2.5);
 // Editing returns only its own credit portion, never the portion used by another record.
 await edit('20/10/2026');assert.equal(await page.getByLabel('Comp-Off Credit for 2026-10-20',{exact:true}).inputValue(),'2026-09-26');assert.equal(await form.getByRole('button',{name:'Save Changes',exact:true}).isEnabled(),true);await form.getByRole('button',{name:'Full Day (1.0d)',exact:true}).click();assert.equal(await form.locator('button[type="submit"]').isDisabled(),true);
 await form.getByRole('button',{name:'Half Day (AM)',exact:true}).click();await page.getByRole('textbox',{name:'Start Date',exact:true}).fill('22/10/2026');await page.getByLabel('Comp-Off Credit for 2026-10-22',{exact:true}).selectOption('2026-09-26');await save();await page.getByRole('heading',{name:'Edit Leave',exact:true}).waitFor({state:'hidden'});records=await read();assert.equal(records.find(r=>r.id==='co1').compOffCredits[0].leaveDate,'2026-10-22');assert.equal(records.filter(r=>r.type==='CO').reduce((s,r)=>s+r.days,0),1);
 // A new conflicting record arriving after opening is rejected at the locked write boundary.
 await edit('06/10/2026');await page.getByRole('textbox',{name:'Start Date',exact:true}).fill('05/10/2026');await page.evaluate(()=>{const rows=JSON.parse(localStorage.getItem('cutisg_records'));rows.push({id:'newer',type:'AL',title:'Newer booking',startDate:'2026-10-05',endDate:'2026-10-05',days:1,status:'taken',createdAt:''});localStorage.setItem('cutisg_records',JSON.stringify(rows));});await save();await page.getByText('This leave overlaps a saved record.',{exact:true}).waitFor();assert.equal((await read()).find(r=>r.id==='sick').startDate,'2026-10-06');await form.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.reload();await edit('06/10/2026');await page.evaluate(()=>{const rows=JSON.parse(localStorage.getItem('cutisg_records'));rows.find(r=>r.id==='sick').notes='Changed elsewhere';localStorage.setItem('cutisg_records',JSON.stringify(rows));});await save();await page.getByText(/This leave changed in another window/).waitFor();assert.equal((await read()).find(r=>r.id==='sick').notes,'Changed elsewhere');await form.getByRole('button',{name:'Cancel',exact:true}).click();
 for(const width of [320,390]){await page.setViewportSize({width,height:844});await nav('History');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await nav('Home');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
 assert.deepEqual(errors,[]);await context.close();console.log('PASS: Home export popup, chosen month filename, scroll lock, date synchronization, edit identity and half-day persistence, credit capacity, invalid dates, overlap and stale-edit protection, mobile widths.');
}finally{await browser.close();await server.close();}
