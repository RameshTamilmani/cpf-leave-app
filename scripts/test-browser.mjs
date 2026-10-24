import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, cp, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

// Run after npm run build. Build B is served from the same origin as build A.
const temp = await mkdtemp(path.join(tmpdir(), 'cutisg-browser-'));
const first = path.join(temp, 'a');
await cp('dist', first, { recursive: true });
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], { stdio: 'pipe' });
let directory = first;
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  try {
    const file = path.join(directory, pathname === '/' ? 'index.html' : pathname);
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('Missing'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ channel: process.env.TEST_BROWSER_CHANNEL || 'chrome', headless: true });
  const context = await browser.newContext();
  let page = await context.newPage();
  const errors = [];
  const watch = p => p.on('pageerror', error => errors.push(error.message));
  watch(page);
  await page.goto(origin);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const script = p => p.locator('script[type="module"]').getAttribute('src');
  const aScript = await script(page);
  await page.evaluate(() => {
    const settings = JSON.parse(localStorage.getItem('cutisg_settings') || '{}');
    localStorage.setItem('cutisg_settings', JSON.stringify({ ...settings, userName: 'Offline Verification' }));
    localStorage.setItem('cutisg_profile_setup_prompted', 'true');
  });
  await context.setOffline(true);
  await page.reload();
  await page.getByText('CutiSG', { exact: true }).first().waitFor();
  assert.equal(await script(page), aScript);
  assert.equal(await page.evaluate(() => document.fonts.load('24px "Material Symbols Outlined Variable"').then(fonts => fonts.length)), 1);
  await context.setOffline(false);
  directory = path.resolve('dist');
  await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration()).update(); });
  await page.getByText('New Update Available', { exact: true }).waitFor();
  assert.equal(await script(page), aScript);
  await page.getByRole('button', { name: 'Later (6 hrs)', exact: true }).click();
  await page.close();
  // Give the browser its normal opportunity to activate the waiting worker.
  await new Promise(resolve => setTimeout(resolve, 1500));
  page = await context.newPage(); watch(page);
  await page.goto(origin);
  assert.equal(await script(page), aScript, 'closing every window must not approve the update');
  assert.equal(await page.getByText('New Update Available', { exact: true }).count(), 0);
  await page.evaluate(() => {
    localStorage.removeItem('cutisg_update_snooze_until');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.getByText('New Update Available', { exact: true }).waitFor();
  await context.setOffline(true);
  await Promise.all([
    page.waitForEvent('load').catch(async error => {
      console.error(await page.locator('body').innerText());
      console.error(await page.evaluate(async () => {
        const reg = await navigator.serviceWorker.getRegistration();
        return { active: reg.active?.state, waiting: reg.waiting?.state, controller: navigator.serviceWorker.controller?.state, caches: await caches.keys() };
      }));
      throw error;
    }),
    page.getByRole('button', { name: /Update Now/ }).click().catch(async error => {
      console.error('Approval failed:', await page.locator('body').innerText());
      throw error;
    }),
  ]);
  await page.getByText('CutiSG', { exact: true }).first().waitFor();
  assert.notEqual(await script(page), aScript, 'accepting must load build B');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('cutisg_settings')).userName), 'Offline Verification');
  await page.reload();
  await page.getByText('CutiSG', { exact: true }).first().waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: offline reload and fonts, update popup, Later, close/reopen, offline approval, preserved profile, updated offline reload.');
  await context.close();
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
  await rm(temp, { recursive: true, force: true });
}

