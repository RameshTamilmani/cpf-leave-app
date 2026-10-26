import {createServer} from 'vite';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const server=await createServer({server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error'});await server.listen();
const origin='http://127.0.0.1:'+server.httpServer.address().port;
const browser=await chromium.launch({channel:process.env.TEST_BROWSER_CHANNEL||'chrome',headless:true});
const errors=[];
try {
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844},acceptDownloads:true});
 await context.addInitScript(()=>{if(localStorage.getItem('initialized'))return;localStorage.setItem('initialized','1');localStorage.setItem('cutisg_settings',JSON.stringify({userName:'Ramesh T',timesheetContact:'9000000000', employeeId:'6509',department:'HIS',dateOfJoining:'2022-11-18',theme:'dark'}));localStorage.setItem('cutisg_records',JSON.stringify([{id:'s',type:'SL',title:'Sick Leave',startDate:'2026-10-06',endDate:'2026-10-06',days:1,status:'taken',createdAt:''},{id:'a',type:'AL',title:'Annual Leave',startDate:'2026-10-14',endDate:'2026-10-14',days:1,status:'taken',createdAt:''}]));});
 await context.route('**/api/holidays',r=>r.fulfill({json:{rows:[{date:'2026-09-26',holiday:'Synthetic Credit A'},{date:'2026-10-10',holiday:'Synthetic Credit B'}]}}));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-26T12:00:00+05:30')});await page.goto(origin);
 const nav=name=>page.locator('nav').getByText(name,{exact:true}).click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('cutisg_settings')).contactNumber),'9000000000');
 await nav('Settings');assert.equal(await page.locator('section[aria-labelledby="timesheet-heading"] input[type="tel"]').count(),0);
 await page.getByLabel('Contact Number',{exact:true}).fill('9000000001');await page.getByRole('button',{name:/Save Profile Changes/}).click();await page.getByLabel('Timesheet Month',{exact:true}).fill('2026-10');
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export Timesheet',exact:true}).click();const download=await pending;await mkdir('ui-screenshots',{recursive:true});await download.saveAs('ui-screenshots/timesheet-2026-10.xlsx');
 assert.match(download.suggestedFilename(),/2026-10_6509.xlsx/);await page.reload();await nav('Settings');assert.equal(await page.getByLabel('Contact Number',{exact:true}).inputValue(),'9000000001');await nav('Home');assert.equal(await page.getByText('9000000001',{exact:true}).count(),0);
 console.log('PASS: contact is saved with Employee Profile, hidden from Home and used for direct full-month export');
 // Generate additional calendar boundaries through the same application exporter.
 const extra=await page.evaluate(async()=>{const {fillTimesheet}=await import('/src/utils/timesheetExport.ts');const url=(await import('/src/assets/hr-timesheet-template.xlsx?url')).default;const source=new Uint8Array(await(await fetch(url)).arrayBuffer());const settings=JSON.parse(localStorage.getItem('cutisg_settings'));return ['2028-02','2027-02','2026-04'].map(month=>({month,bytes:Array.from(fillTimesheet(source,month,settings,[],[]))}));});
 const invalidCredit=await page.evaluate(async()=>{const {fillTimesheet}=await import('/src/utils/timesheetExport.ts');const url=(await import('/src/assets/hr-timesheet-template.xlsx?url')).default;const source=new Uint8Array(await(await fetch(url)).arrayBuffer());try{fillTimesheet(source,'2026-10',JSON.parse(localStorage.getItem('cutisg_settings')),[{id:'bad',type:'CO',title:'Comp-Off',startDate:'2026-10-27',endDate:'2026-10-27',days:1,status:'planned',createdAt:''}],[]);return '';}catch(e){return e.message;}});assert.match(invalidCredit,/Review the selected Comp-Off credits/);
 for(const file of extra)await writeFile('ui-screenshots/timesheet-'+file.month+'.xlsx',Buffer.from(file.bytes));
 async function form(date){await page.getByRole('button',{name:/Apply Leave/}).click();await page.locator('form').getByRole('button').filter({hasText:'Comp-Off'}).first().click();await page.getByRole('textbox',{name:'Start Date',exact:true}).fill(date);await page.getByRole('textbox',{name:'End Date',exact:true}).fill(date);}
 await page.waitForFunction(()=>!!localStorage.getItem('cutisg_official_holidays'));
 await form('27/10/2026');assert.equal(await page.locator('form button[type="submit"]').isDisabled(),true);await page.getByLabel('Comp-Off Credit for 2026-10-27',{exact:true}).selectOption('2026-09-26');assert.equal(await page.getByRole('button',{name:'Half Day (AM)',exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:'Half Day (PM)',exact:true}).count(),0);assert.equal(await page.getByLabel('Comp-Off Reason',{exact:true}).isDisabled(),true);assert.match(await page.getByLabel('Comp-Off Reason',{exact:true}).inputValue(),/Synthetic Credit A/);assert.equal(await page.locator('form button[type="submit"]').isEnabled(),true);await page.locator('form button[type="submit"]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('cutisg_records')).length===3);
 await form('28/10/2026');assert.equal(await page.getByLabel('Comp-Off Credit for 2026-10-28',{exact:true}).locator('option[value="2026-09-26"]').count(),0);await page.getByLabel('Comp-Off Credit for 2026-10-28',{exact:true}).selectOption('2026-10-10');await page.locator('form button[type="submit"]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('cutisg_records')).length===4);
 await nav('History');await page.getByText('Comp-Off: Synthetic Credit A (26/09/2026)',{exact:true}).waitFor();
 await nav('Settings');const pending2=page.waitForEvent('download');await page.getByRole('button',{name:'Export Timesheet',exact:true}).click();await(await pending2).saveAs('ui-screenshots/timesheet-with-compoff.xlsx');
 console.log('PASS: explicit credit selection is mandatory, cannot be reused, and reasons reach History/export');
 const csvPending=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();const csvDownload=await csvPending;const chunks=[];for await(const chunk of await csvDownload.createReadStream())chunks.push(chunk);await page.locator('input[type="file"][accept=".csv"]').setInputFiles({name:'backup.csv',mimeType:'text/csv',buffer:Buffer.concat(chunks)});await page.getByRole('button',{name:'Replace & Restore',exact:true}).click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('cutisg_records')).filter(r=>r.compOffCredits).length===2);
 await page.setViewportSize({width:320,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'ui-screenshots/timesheet-settings-dark.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: credit metadata survives backup/restore and Settings fits 320px');
 // A fresh isolated history tests a genuine race for the same unused credit.
 await page.evaluate(()=>localStorage.setItem('cutisg_records','[]'));await page.reload();await nav('Home');
 const second=await context.newPage();second.on('pageerror',e=>errors.push(e.message));await second.clock.install({time:new Date('2026-10-26T12:00:00+05:30')});await second.goto(origin);
 for(const [p,date,iso] of [[page,'27/10/2026','2026-10-27'],[second,'28/10/2026','2026-10-28']]){
  await p.getByRole('button',{name:'Apply Leave',exact:true}).click();await p.locator('form').getByRole('button').filter({hasText:'Comp-Off'}).first().click();await p.getByRole('textbox',{name:'Start Date',exact:true}).fill(date);await p.getByRole('textbox',{name:'End Date',exact:true}).fill(date);await p.getByLabel('Comp-Off Credit for '+iso,{exact:true}).selectOption('2026-09-26');
 }
 await Promise.all([page.locator('form').evaluate(f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))),second.locator('form').evaluate(f=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})))]);
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('cutisg_records')).length===1);
 await Promise.all([page.waitForTimeout(150),second.waitForTimeout(150)]);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('cutisg_records')).length),1);assert.deepEqual(errors,[]);console.log('PASS: two windows cannot reserve the same holiday credit twice');
 await page.evaluate(()=>localStorage.setItem('cutisg_records',JSON.stringify([{id:'legacy-half',type:'CO',title:'Legacy half day',startDate:'2026-10-27',endDate:'2026-10-27',days:0.5,halfDay:'am',halfDayDate:'2026-10-27',status:'planned',createdAt:''}])));await second.close();await page.reload();await nav('Settings');
 let downloads=0;page.on('download',()=>downloads++);
 await page.getByRole('button',{name:'Export',exact:true}).click();await page.getByText(/Comp-Off is available for full working days only/,{exact:false}).waitFor();assert.equal(downloads,0);
 const bad='Type,Title,Start Date,End Date,Days,Status,Half Day Date,Half Day Session\nCO,Half,2026-10-27,2026-10-27,0.5,planned,2026-10-27,am';
 await page.locator('input[type="file"][accept=".csv"]').setInputFiles({name:'invalid.csv',mimeType:'text/csv',buffer:Buffer.from(bad)});
 await page.getByRole('alert').filter({hasText:'full working days only'}).first().waitFor();assert.equal(await page.getByRole('dialog',{name:'Replace Leave Records?',exact:true}).count(),0);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('cutisg_records'))[0].id),'legacy-half');
 assert.deepEqual(errors,[]);await context.close();console.log('PASS: CSV export/restore reject half-day Comp-Off without changing old data');
}finally{await browser.close();await server.close();}
