import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const screenshots = path.resolve(process.env.UI_SCREENSHOTS || 'ui-screenshots');
await mkdir(screenshots, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  try {
    const file = path.join('dist', pathname === '/' ? 'index.html' : pathname);
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const errors = [];
try {
  browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL || 'chrome', headless: true });
  for (const width of [390, 768, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, timezoneId: 'Asia/Kolkata', serviceWorkers: 'block' });
    await context.addInitScript(() => {
      if (localStorage.getItem('ui-seeded')) return;
      const record = (id, type, startDate, endDate = startDate, days = 1) => ({ id, title: id, type, startDate, endDate, days, status: 'taken', createdAt: startDate });
      localStorage.setItem('cutisg_settings', JSON.stringify({
        userName: 'Ramesh Tamilmani', employeeId: '6509', department: 'Engineering', dateOfJoining: '2022-11-18',
        theme: 'dark', notificationsEnabled: false, wishesEnabled: false, weekendWishesEnabled: false,
        anniversaryWishesEnabled: false, holidayWishesEnabled: false,
      }));
      localStorage.setItem('cutisg_records', JSON.stringify([
        record('October annual', 'AL', '2026-10-12'),
        record('Sick leave span', 'SL', '2026-10-16', '2026-10-19', 2),
        record('Weekend legacy entry', 'AL', '2026-10-17'),
        record('Month boundary', 'AL', '2026-10-30', '2026-11-02', 2),
        { ...record('Comp-off half day', 'CO', '2026-04-06', undefined, 0.5), halfDay: 'am' },
        { ...record('November half day', 'SL', '2026-11-10', undefined, 0.5), halfDay: 'pm', status: 'planned' },
      ]));
      localStorage.setItem('cutisg_profile_setup_prompted', 'true');
      localStorage.setItem('cutisg_special_holidays', JSON.stringify([{ id: 'old-election', name: 'General Election Polling Day', date: '2026-08-10', dayOfWeek: 'Monday', isLongWeekend: true, description: '', isSpecial: true, category: 'gazetted_adhoc', createdAt: '' }]));
      localStorage.setItem('cutisg_pwa_banner_snooze', String(Date.now() + 86400000));
      localStorage.setItem('ui-seeded', 'true');
    });
    const page = await context.newPage();
    // Synthetic declaration tests importing; it is not real holiday information.
    await page.route('**/api/holidays', route => route.fulfill({ json: { rows: [{ date: '2026-10-29', holiday: 'Polling Day' }] } }));
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-10-24T12:00:00+05:30') });
    await page.goto(origin);
    await page.getByText('Engineering', { exact: true }).waitFor();
    await page.getByText('Happy Weekend! 🎉', { exact: true }).waitFor();
    const cards = page.locator('article');
    assert.equal(await cards.count(), 5);
    for (const card of await cards.all()) assert.doesNotMatch(await card.innerText(), /Days/);
    assert.match(await cards.nth(2).innerText(), /0\.5\s*\/1/);
    assert.match(await cards.nth(4).innerText(), /1/);
    const rectangles = await cards.evaluateAll(nodes => nodes.map(node => {
      const number = node.lastElementChild;
      const rect = number.getBoundingClientRect();
      return { right: Math.round(rect.right), height: Math.round(node.getBoundingClientRect().height) };
    }));
    assert.ok(Math.max(...rectangles.map(r => r.right)) - Math.min(...rectangles.map(r => r.right)) <= 1);
    await page.screenshot({ path: path.join(screenshots, `home-${width}-dark.png`), fullPage: true });

    await page.getByRole('button', { name: /Settings/ }).last().click();
    assert.equal(await page.getByText('Notifications & Wishes', { exact: true }).count(), 0);
    assert.equal(await page.getByText('Special Holidays (Rare Cases)', { exact: true }).count(), 0);
    const department = page.getByLabel('DEPARTMENT', { exact: true });
    await department.fill('Operations-Team-Long-Name-Plus');
    assert.equal((await department.inputValue()).length, 25);
    const departmentName = await department.inputValue();
    assert.equal(await page.locator('#department-limit').count(), 0);
    await page.getByRole('button', { name: /Save Profile Changes/ }).click();
    await page.getByRole('button', { name: 'Dismiss', exact: true }).click();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cutisg_settings')).department), departmentName);
    await page.getByText(/Already a public holiday. Not counted twice/).waitFor();
    await page.getByRole('button', { name: /Add Special Holiday/ }).click();
    await page.getByRole('textbox', { name: /^DATE \(/ }).fill('10/08/2026');
    await page.getByRole('alert').getByText(/National Day \(Observed\) is already recorded/).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Add Special Holiday', exact: true }).isDisabled(), true);
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Choose Date of Joining', exact: true }).count(), 1);
    await page.screenshot({ path: path.join(screenshots, `settings-${width}-dark.png`), fullPage: true });

    await page.getByRole('button', { name: /Calendar/ }).last().click();
    const history = page.getByRole('region', { name: 'Monthly holidays and leave history' });
    assert.equal(await history.getByText('Sick leave span', { exact: true }).count(), 2);
    assert.equal(await history.getByText('Weekend legacy entry', { exact: true }).count(), 0);
    assert.equal(await page.getByText('Public Holiday (PH)', { exact: true }).count(), 0);
    assert.equal(await page.getByText('Regular Working Day', { exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Next Month', exact: true }).click();
    await history.getByText('Deepavali', { exact: true }).waitFor();
    await history.getByText('Deepavali (Observed)', { exact: true }).waitFor();
    assert.equal(await history.locator('[data-date="2026-11-08"]').count(), 1);
    assert.equal(await history.locator('[data-date="2026-11-09"]').count(), 1);
    await history.getByText('November half day', { exact: true }).waitFor();
    await history.getByText(/Half day \(PM\)/).waitFor();
    const before = await history.innerText();
    const weekendColor = await page.getByRole('button', { name: /^07\/11\/2026/ }).evaluate(node => getComputedStyle(node).backgroundColor);
    const normalColor = await page.getByRole('button', { name: /^04\/11\/2026/ }).evaluate(node => getComputedStyle(node).backgroundColor);
    assert.notEqual(weekendColor, normalColor);
    await page.getByRole('button', { name: /^07\/11\/2026/ }).click();
    assert.equal(await history.innerText(), before, 'selecting a day must retain the full month history');
    await page.screenshot({ path: path.join(screenshots, `calendar-${width}-dark.png`), fullPage: true });
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Previous Month', exact: true }).click();
    assert.equal(await history.locator('[data-date="2026-08-10"]').count(), 1);
    assert.equal(await history.getByText('General Election Polling Day', { exact: true }).count(), 0);

    await page.getByRole('button', { name: /Home/ }).last().click();
    await page.getByText(departmentName, { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Apply Leave', exact: true }).click();
    await page.getByRole('button', { name: /Comp-Off.*Available/ }).click();
    await page.getByLabel('START DATE', { exact: true }).fill('14/10/2026');
    await page.getByLabel('END DATE', { exact: true }).fill('14/10/2026');
    await page.getByRole('button', { name: 'Half Day (AM)', exact: true }).click();
    await page.getByText('Validation Error', { exact: true }).waitFor();
    assert.equal(await page.getByText(/Comp-Off 90-Day Expiry Restriction:/).count(), 0);
    const modalError = page.getByText('Validation Error', { exact: true }).locator('..');
    assert.match(await modalError.innerText(), /90-day period/);
    await page.screenshot({ path: path.join(screenshots, `compoff-${width}-dark.png`), fullPage: true });
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();

    await page.getByRole('button', { name: /Settings/ }).last().click();
    await page.getByText('Light', { exact: true }).click();
    await page.getByRole('button', { name: /Home/ }).last().click();
    await page.screenshot({ path: path.join(screenshots, `home-${width}-light.png`), fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no horizontal overflow at ${width}px`);
    await page.reload();
    await page.getByText(departmentName, { exact: true }).waitFor();
    assert.match(await page.locator('article').nth(4).innerText(), /1/);
    await context.close();
    console.log(`PASS: ${width}px profile, balances, calendar history, comp-off validation, light/dark layouts.`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}

