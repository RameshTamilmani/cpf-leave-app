import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const screenshots = path.resolve('ui-screenshots');
await mkdir(screenshots, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = path.join('dist', pathname === '/' ? 'index.html' : pathname);
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404); response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const errors = [];
try {
  browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL || 'chrome', headless: true });
  for (const [width, height] of [[320, 740], [390, 844], [900, 844], [390, 500]]) {
    const context = await browser.newContext({ viewport: { width, height }, timezoneId: 'Asia/Kolkata', serviceWorkers: 'block', hasTouch: true });
    await context.addInitScript(() => {
      localStorage.setItem('cutisg_settings', JSON.stringify({ userName: 'Ramesh Tamilmani', contactNumber:'9000000000', employeeId:'6509', department: 'HIS', dateOfJoining: '2022-11-18', theme: 'dark' }));
      localStorage.setItem('cutisg_records', JSON.stringify([{ id: 'co-used', type: 'CO', title: 'Comp-off half day', startDate: '2026-04-06', endDate: '2026-04-06', days: 0.5, status: 'taken', halfDay: 'am', createdAt: '2026-04-06' }]));
      localStorage.setItem('cutisg_pwa_banner_snooze', String(Date.now() + 86400000));
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-10-24T12:00:00+05:30') });
    // Synthetic dates test credited/non-expired/upcoming categories, not real declarations.
    await page.route('**/api/holidays', route => route.fulfill({ json: { rows: [
      { date: '2026-10-10', holiday: 'Synthetic credited holiday' },
      { date: '2026-11-07', holiday: 'Synthetic upcoming holiday' },
    ] } }));
    await page.goto(origin);
    await page.getByRole('heading', { name: 'Ramesh Tamilmani', exact: true }).waitFor();
    const ledgerButton = page.getByRole('button', { name: /Comp-off Ledger Saturday credits/ });
    await ledgerButton.scrollIntoViewIfNeeded();
    await page.evaluate(() => document.addEventListener('pointerdown', () => { window.__openScrollY = scrollY; }, { once: true, capture: true }));
    await ledgerButton.click();
    const position = await page.evaluate(() => window.__openScrollY);
    const ledger = page.getByRole('dialog', { name: 'Comp-Off Ledger', exact: true });
    await ledger.waitFor();
    assert.equal(await page.evaluate(() => document.body.style.position), 'fixed');
    const lockedTop = await page.evaluate(() => document.body.style.top);
    assert.equal(lockedTop, `${-position}px`);
    await page.mouse.move(2, 4); await page.mouse.wheel(0, 700);
    assert.equal(await page.evaluate(() => document.body.style.top), lockedTop);
    assert.equal(await page.evaluate(() => scrollY), 0);
    const credited = ledger.getByRole('region', { name: 'Credited comp-offs', exact: true });
    const upcoming = ledger.getByRole('region', { name: 'Upcoming comp-offs', exact: true });
    await credited.getByText('Hari Raya Puasa', { exact: true }).waitFor();
    await credited.getByText('Synthetic credited holiday', { exact: true }).waitFor();
    assert.equal(await credited.getByText('Synthetic upcoming holiday', { exact: true }).count(), 0);
    await upcoming.getByText('Synthetic upcoming holiday', { exact: true }).waitFor();
    assert.equal(await upcoming.getByText('Synthetic credited holiday', { exact: true }).count(), 0);
    const scroll = page.getByTestId('ledger-scroll');
    await scroll.hover(); await page.mouse.wheel(0, 600);
    await page.waitForFunction(() => document.querySelector('[data-testid="ledger-scroll"]').scrollTop > 0);
    assert.equal(await page.evaluate(() => document.body.style.top), lockedTop);
    // Separate real touch gestures reproduce lifting a finger and reversing direction.
    const cdp = await context.newCDPSession(page);
    async function swipe(fromY, toY) {
      const box = await scroll.boundingBox();
      const x = box.x + box.width / 2;
      const y = box.y + box.height * fromY;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let step = 1; step <= 12; step++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + box.height * (toY - fromY) * step / 12 }] });
        await page.waitForTimeout(20);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(250);
    }
    await scroll.evaluate(node => { node.scrollTop = 0; });
    await swipe(0.8, 0.2);
    const afterDown = await scroll.evaluate(node => node.scrollTop);
    assert.ok(afterDown > 0, 'finger swipe scrolls down inside modal');
    await swipe(0.2, 0.8);
    assert.ok(await scroll.evaluate(node => node.scrollTop) < afterDown, 'new finger gesture scrolls back up after release');
    assert.equal(await page.evaluate(() => document.body.style.top), lockedTop);
    assert.equal(await page.evaluate(() => scrollY), 0);
    await cdp.detach();
    await ledger.screenshot({ path: path.join(screenshots, `ledger-${width}-${height}.png`) });
    await ledger.getByRole('button', { name: 'Close', exact: true }).click();
    assert.equal(await page.evaluate(() => document.body.style.position), '');
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - position) < 2);

    await page.locator('article').last().click();
    assert.equal(await page.getByRole('button', { name: '+ Add Special Holiday', exact: true }).count(), 1);
    await page.getByRole('button', { name: '+ Add Special Holiday', exact: true }).click();
    const special = page.getByRole('dialog', { name: 'Add Special Public Holiday', exact: true });
    await special.waitFor();
    assert.equal(await special.getByRole('textbox', { name: /^Date / }).inputValue(), '26/10/2026', 'weekend opening defaults to Monday without a UTC date shift');
    const panelHeight = await special.locator(':scope > div').evaluate(node => node.getBoundingClientRect().height);
    assert.ok(panelHeight >= height * 0.65, `large holiday form at ${width}x${height}`);
    assert.equal(await page.evaluate(() => document.body.style.position), 'fixed');
    await special.getByRole('button', { name: 'Choose Special Holiday Date', exact: true }).click();
    await page.getByRole('dialog', { name: 'Calendar date selector', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    assert.equal(await page.evaluate(() => document.body.style.position), 'fixed', 'closing a nested picker must retain the parent scroll lock');
    await special.screenshot({ path: path.join(screenshots, `special-form-${width}-${height}.png`) });
    await special.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal(await page.evaluate(() => document.body.style.position), '');
    await page.getByRole('button', { name: 'Apply Leave', exact: true }).click();
    await page.getByText('Apply / Log Leave', { exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.body.style.position), 'fixed');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal(await page.evaluate(() => document.body.style.position), '');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await context.close();
    console.log(`PASS: ${width}x${height} background lock, internal scroll, restored position, nested picker, credited/upcoming groups and enlarged holiday form.`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
