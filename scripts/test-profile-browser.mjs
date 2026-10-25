import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const screenshots = path.resolve(process.env.UI_SCREENSHOTS || 'ui-screenshots');
await mkdir(screenshots, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
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
  for (const width of [320, 390, 768]) {
    const context = await browser.newContext({ viewport: { width, height: 740 }, timezoneId: 'Asia/Kolkata', serviceWorkers: 'block' });
    await context.addInitScript(() => {
      if (localStorage.getItem('profile-test-seeded')) return;
      localStorage.setItem('cutisg_settings', JSON.stringify({ userName: 'Ramesh Tamilmani', employeeId: '6509', dateOfJoining: '2022-11-18', theme: 'dark' }));
      localStorage.setItem('cutisg_profile_setup_prompted', 'true');
      localStorage.setItem('cutisg_pwa_banner_snooze', String(Date.now() + 86400000));
      localStorage.setItem('profile-test-seeded', 'true');
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/holidays', route => route.fulfill({ status: 503, json: {} }));
    await page.clock.install({ time: new Date('2026-10-24T12:00:00+05:30') });
    await page.goto(origin);
    const dialog = page.getByRole('dialog', { name: 'Welcome to CutiSG', exact: true });
    await dialog.waitFor();
    assert.equal(await dialog.getByRole('button', { name: /later|skip|close/i }).count(), 0);
    assert.equal(await page.locator('[inert]').count(), 1);
    await page.keyboard.press('Escape');
    await page.mouse.click(2, 2);
    assert.equal(await dialog.isVisible(), true);
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')), true);
    }
    const department = dialog.getByLabel('Department *', { exact: true });
    const date = dialog.getByRole('textbox', { name: 'Date of Joining *', exact: true });
    const save = dialog.getByRole('button', { name: /Save & Continue/ });
    await department.fill('HIS');
    await date.fill('25/10/2026');
    assert.equal(await date.evaluate(node => node.checkValidity()), false);
    await save.click(); assert.equal(await dialog.isVisible(), true);
    await date.fill('18/11/');
    assert.equal(await date.evaluate(node => node.checkValidity()), false);
    await date.fill('18/11/2022');
    await department.fill('  ');
    await save.click();
    await dialog.getByRole('alert').getByText(/department/).waitFor();
    await department.fill('HIS');
    await dialog.screenshot({ path: path.join(screenshots, `required-profile-${width}.png`) });
    await save.click();
    await dialog.waitFor({ state: 'hidden' });
    const card = page.getByRole('region', { name: 'Employee profile', exact: true });
    assert.equal(await card.getAttribute('data-tenure'), 'gold');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('cutisg_settings')));
    assert.equal(saved.department, 'HIS'); assert.equal(saved.avatarUrl, '');
    assert.match(await page.getByTestId('employee-id-badge').innerText(), /EMP\s+6509/);
    assert.equal(await page.getByTestId('employee-id-badge').evaluate(node => getComputedStyle(node).backgroundColor), await page.evaluate(() => {
      const swatch = document.createElement('span'); swatch.style.backgroundColor = 'var(--color-amber-300)';
      document.body.append(swatch); const color = getComputedStyle(swatch).backgroundColor; swatch.remove(); return color;
    }));
    const colors = {};
    for (const [joined, tier] of [['24/10/2026', 'green'], ['24/10/2025', 'blue'], ['24/10/2024', 'blue'], ['23/10/2024', 'gold']]) {
      await card.getByRole('button', { name: 'Edit profile', exact: true }).click();
      await page.getByRole('textbox', { name: 'Date of Joining', exact: true }).fill(joined);
      await page.getByRole('button', { name: /Save Profile Changes/ }).click();
      await page.getByRole('button', { name: /Home/ }).last().click();
      assert.equal(await card.getAttribute('data-tenure'), tier);
      colors[tier] = await page.getByTestId('employee-id-badge').evaluate(node => getComputedStyle(node).backgroundColor);
      await card.screenshot({ path: path.join(screenshots, `profile-${tier}-${width}-dark.png`) });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    assert.equal(new Set(Object.values(colors)).size, 3);
    await card.getByRole('button', { name: 'Edit profile', exact: true }).click();
    const settingDate = page.getByRole('textbox', { name: 'Date of Joining', exact: true });
    await settingDate.fill('25/10/2026');
    await page.getByRole('textbox', { name: 'Full name', exact: true }).fill('Changed name');
    await page.getByRole('button', { name: /Save Profile Changes/ }).click();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cutisg_settings')).dateOfJoining), '2024-10-23');
    await page.getByRole('textbox', { name: 'Date of Joining', exact: true }).fill('23/10/2024');
    await page.getByText('Light', { exact: true }).click();
    await page.getByRole('button', { name: /Home/ }).last().click();
    await card.screenshot({ path: path.join(screenshots, `profile-gold-${width}-light.png`) });
    await page.reload();
    await card.waitFor();
    assert.equal(await page.getByRole('dialog', { name: 'Welcome to CutiSG' }).count(), 0);
    await context.close();
    console.log(`PASS: ${width}px mandatory setup, no skip/escape/backdrop bypass, optional image, date validation, tenure colors, persistence, light/dark card.`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
