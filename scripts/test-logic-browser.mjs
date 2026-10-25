import { createServer } from 'vite';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const server=await createServer({server:{host:'127.0.0.1',port:0,hmr:false},logLevel:'error'});await server.listen();
const origin='http://127.0.0.1:'+server.httpServer.address().port;
const browser=await chromium.launch({channel:process.env.TEST_BROWSER_CHANNEL||'chrome',headless:true});
const failures=[];
const record=(extra={})=>({id:'baseline',type:'AL',title:'Annual Leave',startDate:'2026-10-26',endDate:'2026-10-26',days:1,status:'planned',createdAt:'2026-10-25',...extra});
const header='Type,Title,Start Date,End Date,Days,Status,Remarks';
async function setup(records=[],settings={},rows=[],date='2026-10-25',fallback=false){
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});
 await context.addInitScript(({records,settings,fallback})=>{
  if(fallback)Object.defineProperty(navigator,'locks',{value:undefined});
  if(localStorage.getItem('audit_initialized'))return;
  localStorage.setItem('audit_initialized','1');localStorage.setItem('cutisg_settings',JSON.stringify({userName:'Regression Check',employeeId:'6509',department:'HIS',dateOfJoining:'2022-11-18',theme:'dark',...settings}));
  localStorage.setItem('cutisg_records',JSON.stringify(records));localStorage.setItem('cutisg_pwa_banner_snooze',String(Date.now()+86400000));
 },{records,settings,fallback});
 await context.route('**/api/holidays',route=>route.fulfill({json:{rows}}));
 async function open(){const page=await context.newPage();page.on('pageerror',e=>failures.push(e.message));await page.clock.install({time:new Date(date+'T12:00:00+05:30')});await page.goto(origin);await page.getByRole('heading',{name:'Regression Check',exact:true}).waitFor();return page;}
 return {context,open,page:await open()};
}
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('cutisg_records')));
const nav=(page,name)=>page.locator('nav').getByText(name,{exact:true}).click();
const upload=(page,csv)=>page.locator('input[type="file"][accept=".csv"]').setInputFiles({name:'backup.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
async function prepare(page,start,end=start,type='AL'){
 await page.getByRole('button',{name:'Apply Leave',exact:true}).click();
 if(type!=='AL')await page.locator('form').getByRole('button').filter({hasText:type==='CO'?'Comp-Off':'Sick (SL)'}).first().click();
 const human=d=>d.split('-').reverse().join('/');
 await page.getByRole('textbox',{name:'Start Date',exact:true}).fill(human(start));await page.getByRole('textbox',{name:'End Date',exact:true}).fill(human(end));
}
async function check(name,run){await run();console.log('PASS: '+name);}
try {
 await check('invalid restore is atomic; multiline and quoted fields survive; replacement requires confirmation',async()=>{
  const {context,page}=await setup([record()]);await nav(page,'Settings');
  for(const row of ['ZZ,Bad,2026-10-27,2026-10-27,1,planned,','AL,Bad,2026-10-27,2026-10-27,99,planned,','AL,Bad,invalid,invalid,1,planned,']){
   await upload(page,header+'\nAL,Good,2026-10-28,2026-10-28,1,planned,\n'+row);await page.getByRole('alert').waitFor();assert.deepEqual(await saved(page),[record()]);assert.equal(await page.getByRole('dialog',{name:'Replace Leave Records?'}).count(),0);
  }
  await upload(page,header+'\nAL,"Annual ""special"" Leave",2026-10-27,2026-10-27,1,planned,"Line 1\nLine 2"');
  const dialog=page.getByRole('dialog',{name:'Replace Leave Records?',exact:true});await dialog.waitFor();assert.deepEqual(await saved(page),[record()]);await dialog.getByRole('button',{name:'Replace & Restore',exact:true}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('cutisg_records'))[0].startDate==='2026-10-27');const result=await saved(page);assert.equal(result.length,1);assert.equal(result[0].notes,'Line 1\nLine 2');assert.equal(result[0].title,'Annual "special" Leave');await context.close();
 });
 await check('CL/retroactive backups preserve type and status',async()=>{
  const {context,page}=await setup();await nav(page,'Settings');await upload(page,header+'\nCL,Comp-off Leave,2026-04-24,2026-04-24,1,retroactive,');await page.getByRole('button',{name:'Replace & Restore',exact:true}).click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('cutisg_records')).length===1);assert.equal((await saved(page))[0].type,'CL');assert.equal((await saved(page))[0].status,'retroactive');await nav(page,'History');await page.getByRole('button',{name:'Comp Off',exact:true}).click();await page.getByText('Comp-off Leave',{exact:true}).waitFor();await context.close();
 });
 await check('other leave years do not reduce this year; combined AM/PM grid shows both sessions',async()=>{
  const {context,page}=await setup([record({id:'old',startDate:'2025-10-20',endDate:'2025-10-20'}),record({id:'am',type:'SL',days:0.5,halfDay:'am',halfDayDate:'2026-10-26'}),record({id:'pm',type:'SL',days:0.5,halfDay:'pm',halfDayDate:'2026-10-26'})]);
  assert.match(await page.locator('article').filter({has:page.getByRole('heading',{name:'Annual Leave',exact:true})}).innerText(),/12\s*\/12/);
  await nav(page,'Calendar');const label=await page.getByRole('button',{name:/26\/10\/2026/}).getAttribute('aria-label');assert.match(label,/\(AM\)/);assert.match(label,/\(PM\)/);await context.close();
 });
 await check('Comp-Off cannot spend a future credit on earlier leave dates; eligible retrospective leave saves',async()=>{
  const {context,page}=await setup([],{},[{date:'2026-06-20',holiday:'Synthetic Credit A'},{date:'2026-10-10',holiday:'Synthetic Credit B'}]);await page.waitForFunction(()=>localStorage.getItem('cutisg_official_holidays'));
  await prepare(page,'2026-06-22','2026-06-23','CO');assert.equal(await page.locator('form button[type="submit"]').isDisabled(),true);
  await page.getByRole('textbox',{name:'End Date',exact:true}).fill('22/06/2026');assert.equal(await page.locator('form button[type="submit"]').isEnabled(),true);await page.locator('form button[type="submit"]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('cutisg_records')).length===1);await context.close();
 });
 await check('custom cycle end date is retained; February 31 cannot be saved',async()=>{
  const {context,page}=await setup([],{cycle:'13 Jun – 31 May',cycleStartMonth:6,cycleStartDay:13,cycleEndMonth:5,cycleEndDay:31});await nav(page,'Settings');await page.getByRole('button',{name:/Change/}).click();
  const selects=page.locator('select');assert.deepEqual(await selects.evaluateAll(nodes=>nodes.map(n=>n.value)),['6','13','5','31']);await selects.nth(0).selectOption('2');assert.equal(await selects.nth(1).locator('option[value="31"]').count(),0);
  await selects.nth(1).evaluate(node=>node.add(new Option('Invalid day','31')));await selects.nth(1).selectOption('31');assert.equal(await page.getByRole('button',{name:'Save Leave Cycle',exact:true}).isDisabled(),true);await context.close();
 });
 await check('a future booking becomes Taken in Calendar and History after its date passes',async()=>{
  const {context,page}=await setup([],{},[],'2026-09-16');await prepare(page,'2026-09-17','2026-09-17','SL');await page.locator('form button[type="submit"]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('cutisg_records')).length===1);await page.clock.setSystemTime(new Date('2026-10-25T12:00:00+05:30'));
  await nav(page,'History');await page.getByText(/^taken$/i).waitFor();await nav(page,'Calendar');assert.match(await page.locator('li[data-date="2026-09-17"]').innerText(),/Taken/);await context.close();
 });
 await check('two windows save without lost updates; stale restore confirmation cannot overwrite newer records',async()=>{
  const {context,page,open}=await setup();const second=await open();
  await prepare(page,'2026-10-26');await prepare(second,'2026-10-28');
  await Promise.all([page.locator('form').evaluate(f=>f.requestSubmit()),second.locator('form').evaluate(f=>f.requestSubmit())]);await page.waitForFunction(()=>JSON.parse(localStorage.getItem('cutisg_records')).length===2);assert.equal((await saved(page)).length,2);
  await nav(page,'Settings');await upload(page,header+'\nAL,Replacement,2026-10-30,2026-10-30,1,planned,');await page.getByRole('dialog',{name:'Replace Leave Records?',exact:true}).waitFor();
  await prepare(second,'2026-10-29');await second.locator('form button[type="submit"]').click();await second.waitForFunction(()=>JSON.parse(localStorage.getItem('cutisg_records')).length===3);
  await page.getByRole('button',{name:'Replace & Restore',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal((await saved(page)).length,3);await context.close();
 });
 await check('safe saving also works without Web Locks',async()=>{
  const {context,page,open}=await setup([],{},[],'2026-10-25',true);const second=await open();
  assert.equal(await page.evaluate(()=>!!navigator.locks),false);
  await prepare(page,'2026-10-26');await prepare(second,'2026-10-28');
  await Promise.all([page.locator('form').evaluate(f=>f.requestSubmit()),second.locator('form').evaluate(f=>f.requestSubmit())]);
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('cutisg_records')).length===2);
  assert.equal((await saved(page)).length,2);await context.close();
 });
 await check('multi-day half-day choices, deductions and export/restore still work',async()=>{
  for(const [date,session] of [['2026-10-26','am'],['2026-10-28','pm'],['2026-10-30','pm']]){
   const {context,page}=await setup();await page.setViewportSize({width:320,height:844});
   await prepare(page,'2026-10-26','2026-10-30');await page.getByRole('button',{name:/Half-Day Adjustment/}).click();
   const submit=page.locator('form button[type="submit"]');assert.equal(await submit.isDisabled(),true);
   await page.getByLabel('Half-Day Date',{exact:true}).selectOption(date);assert.equal(await submit.isDisabled(),true);
   await page.getByRole('button',{name:session==='am'?'AM · Morning Leave':'PM · Afternoon Leave',exact:true}).click();await submit.click();
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('cutisg_records')).length===1);
   const before=(await saved(page))[0];assert.equal(before.days,4.5);assert.equal(before.halfDayDate,date);assert.equal(before.halfDay,session);
   await nav(page,'History');await page.getByText('Half Day: '+date.split('-').reverse().join('/')+' · '+session.toUpperCase(),{exact:true}).waitFor();
   if(date==='2026-10-28'){
    await nav(page,'Settings');const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();
    const stream=await (await pending).createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);const csv=Buffer.concat(chunks).toString('utf8');
    assert.ok(csv.includes('Half Day Date,Half Day Session'));await upload(page,csv);await page.getByRole('button',{name:'Replace & Restore',exact:true}).click();
    await page.waitForFunction(oldId=>JSON.parse(localStorage.getItem('cutisg_records'))[0].id!==oldId,before.id);
    const after=(await saved(page))[0];assert.equal(after.days,4.5);assert.equal(after.halfDayDate,date);assert.equal(after.halfDay,session);
   }
   await context.close();
  }
 });
 assert.deepEqual(failures,[]);
} finally {await browser.close();await server.close();}
