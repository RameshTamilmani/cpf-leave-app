import {createServer} from 'vite';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const server=await createServer({server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error'});await server.listen();
const origin='http://127.0.0.1:'+server.httpServer.address().port;
const browser=await chromium.launch({channel:process.env.TEST_BROWSER_CHANNEL||'chrome',headless:true});
try{
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844},acceptDownloads:true});
 const errors=[];
 await context.addInitScript(()=>{if(localStorage.getItem('split-test'))return;localStorage.setItem('split-test','1');localStorage.setItem('cutisg_settings',JSON.stringify({userName:'Split Credit Test',employeeId:'6509',department:'HIS',contactNumber:'9000000000',dateOfJoining:'2022-11-18',theme:'dark'}));localStorage.setItem('cutisg_records','[]');});
 await context.route('**/api/holidays',r=>r.fulfill({json:{rows:[{date:'2026-03-21',holiday:'Hari Raya Puasa'}]}}));
 async function open(){const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.clock.install({time:new Date('2026-10-26T12:00:00+05:30')});await page.goto(origin);await page.getByRole('heading',{name:'Split Credit Test',exact:true}).waitFor();return page;}
 const page=await open();const nav=(p,name)=>p.locator('nav').getByText(name,{exact:true}).click();const submit=p=>p.locator('form button[type="submit"]');
 async function prepare(p,date,session){await p.getByRole('button',{name:'Apply Leave',exact:true}).click();await p.locator('form').getByRole('button').filter({hasText:'Comp-Off'}).first().click();await p.getByRole('textbox',{name:'Start Date',exact:true}).fill(date);await p.getByRole('textbox',{name:'End Date',exact:true}).fill(date);await p.getByRole('button',{name:session==='am'?'Half Day (AM)':'Half Day (PM)',exact:true}).click();}
 async function select(p,iso){await p.getByLabel('Comp-Off Credit for '+iso,{exact:true}).selectOption('2026-03-21');}
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('cutisg_records')));
 await prepare(page,'24/04/2026','am');await select(page,'2026-04-24');assert.equal(await page.getByLabel('Comp-Off Reason',{exact:true}).inputValue(),'Hari Raya Puasa Comp-off');assert.equal(await page.getByLabel('Comp-Off Reason',{exact:true}).isDisabled(),true);await submit(page).click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('cutisg_records')).length===1);assert.equal((await saved())[0].days,0.5);assert.equal((await saved())[0].halfDay,'am');
 await prepare(page,'24/04/2026','am');await select(page,'2026-04-24');assert.equal(await submit(page).isDisabled(),true);await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await prepare(page,'27/04/2026','pm');await select(page,'2026-04-27');await submit(page).click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('cutisg_records')).length===2);
 await prepare(page,'28/04/2026','am');assert.equal(await page.getByLabel('Comp-Off Credit for 2026-04-28',{exact:true}).locator('option[value="2026-03-21"]').count(),0);assert.equal(await submit(page).isDisabled(),true);await page.getByRole('button',{name:'Cancel',exact:true}).click();
 console.log('PASS: retrospective AM and PM bookings on two dates share one credit; duplicate AM and third half day are blocked');
 await nav(page,'Settings');await page.getByLabel('Timesheet Month',{exact:true}).fill('2026-04');const excel=page.waitForEvent('download');await page.getByRole('button',{name:'Export Timesheet',exact:true}).click();await(await excel).saveAs('ui-screenshots/timesheet-split-compoff.xlsx');
 const csv=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();const chunks=[];for await(const c of await(await csv).createReadStream())chunks.push(c);const backup=Buffer.concat(chunks);const upload=buffer=>page.locator('input[type="file"][accept=".csv"]').setInputFiles({name:'backup.csv',mimeType:'text/csv',buffer});
 await upload(backup);await page.getByRole('button',{name:'Replace & Restore',exact:true}).click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('cutisg_records')).length===2&&JSON.parse(localStorage.getItem('cutisg_records')).every(r=>r.id.length>10));
 assert.deepEqual((await saved()).map(r=>r.halfDay).sort(),['am','pm']);assert.ok((await saved()).every(r=>r.notes==='Hari Raya Puasa Comp-off'&&r.compOffCredits[0].holidayDate==='2026-03-21'));
 const snapshot=JSON.stringify(await saved());const credit=[{holidayDate:'2026-03-21',holidayName:'Hari Raya Puasa',leaveDate:'2026-04-28'}];
 const extra=['CO','Third half','2026-04-28','2026-04-28','0.5','taken','Wrong text','2026-04-28','am',JSON.stringify(credit)].map(v=>'"'+v.replaceAll('"','""')+'"').join(',');
 await upload(Buffer.from(backup.toString().trimEnd()+'\r\n'+extra));await page.getByRole('button',{name:'Replace & Restore',exact:true}).click();await page.getByText(/The backup contains Comp-Off leave without enough eligible credit/).waitFor();assert.equal(JSON.stringify(await saved()),snapshot);await page.getByRole('dialog',{name:'Replace Leave Records?',exact:true}).waitFor({state:'hidden'});
 const lines=backup.toString().trimEnd().split('\r\n');await upload(Buffer.from(backup.toString().trimEnd()+'\r\n'+lines[1]));await page.getByRole('alert').filter({hasText:'Overlapping'}).waitFor();assert.equal(JSON.stringify(await saved()),snapshot);
 console.log('PASS: half-day bindings survive CSV restore; overdrawn credits and duplicate elapsed sessions cannot replace history');
 // Race two valid halves against the same original credit in separate windows.
 await page.evaluate(()=>localStorage.setItem('cutisg_records','[]'));await page.reload();const second=await open();
 await prepare(page,'24/04/2026','am');await select(page,'2026-04-24');await prepare(second,'27/04/2026','pm');await select(second,'2026-04-27');
 await Promise.all([submit(page).evaluate(b=>b.form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))),submit(second).evaluate(b=>b.form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})))]);await page.waitForFunction(()=>JSON.parse(localStorage.getItem('cutisg_records')).length===2);assert.equal((await saved()).reduce((s,r)=>s+r.days,0),1);assert.deepEqual(errors,[]);await context.close();console.log('PASS: concurrent half-day bookings total exactly one day without lost updates');
}finally{await browser.close();await server.close();}
