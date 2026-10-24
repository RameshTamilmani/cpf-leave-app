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
let pauseAssets = false;
let releaseAssetRequests = [];
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  try {
    if (pauseAssets && pathname.startsWith('/assets/')) await new Promise(resolve => releaseAssetRequests.push(resolve));
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
    localStorage.setItem('cutisg_settings', JSON.stringify({ ...settings, userName: 'Offline Verification', employeeId: '6509', department: 'HIS', dateOfJoining: '2022-11-18' }));
    localStorage.setItem('cutisg_profile_setup_prompted', 'true');
  });
  await context.setOffline(true);
  await page.reload();
  await page.getByText('CutiSG', { exact: true }).first().waitFor();
  assert.equal(await script(page), aScript);
  assert.equal(await page.evaluate(() => document.fonts.load('24px "Material Symbols Outlined Variable"').then(fonts => fonts.length)), 1);
  await context.setOffline(false);
  await page.getByRole('button', { name: /Settings/ }).last().click();
  await page.getByRole('button', { name: 'Check for updates', exact: true }).waitFor();
  pauseAssets = true;
  directory = path.resolve('dist');
  await page.getByRole('button', { name: 'Check for updates', exact: true }).click();
  await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistration()).installing?.state === 'installing');
  assert.equal(await page.getByText('New Update Available', { exact: true }).count(), 0, 'metadata alone must not enable Update Now');
  pauseAssets = false; releaseAssetRequests.forEach(resolve => resolve()); releaseAssetRequests = [];
  await page.getByText('New Update Available', { exact: true }).waitFor();
  assert.equal(await script(page), aScript);
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  const approvalBefore = await page.evaluate(async () => {
    const state = await (await caches.open('cutisg-update-state-v1')).match('/__cutisg_approved_release');
    return (await state.json()).release.buildId;
  });
  assert.equal(approvalBefore, JSON.parse(await readFile(path.join(first, 'version.json'), 'utf8')).buildId, 'installing a shortcut must not approve an update');
  await page.getByRole('button', { name: 'Later (6 hrs)', exact: true }).click();
  await page.getByRole('button', { name: /Settings/ }).last().click();
  await page.getByRole('button', { name: 'Check for updates', exact: true }).click();
  await page.getByText('New Update Available', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Later (6 hrs)', exact: true }).click();
  await page.close();
  // Give the browser its normal opportunity to activate the waiting worker.
  await new Promise(resolve => setTimeout(resolve, 1500));
  page = await context.newPage(); watch(page);
  await page.goto(origin);
  assert.equal(await script(page), aScript, 'closing every window must not approve the update');
  assert.equal(await page.getByText('New Update Available', { exact: true }).count(), 0);
  await context.setOffline(true);
  await page.getByRole('button', { name: /Settings/ }).last().click();
  await page.getByRole('button', { name: 'Check for updates', exact: true }).click();
  await page.getByText('New Update Available', { exact: true }).waitFor();
  await context.setOffline(true);
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    const channel = new MessageChannel();
    const info = await new Promise(resolve => {
      channel.port1.onmessage = event => { channel.port1.close(); resolve(event.data); };
      (registration.waiting || registration.active).postMessage({ type: 'GET_RELEASE' }, [channel.port2]);
    });
    const name = 'cutisg-release-' + info.buildId;
    const cache = await caches.open(name);
    const key = (await cache.keys()).find(request => new URL(request.url).pathname.endsWith('.js'));
    window.__testAssetRestore = { name, key, response: await cache.match(key) };
    await cache.delete(key);
  });
  await page.getByRole('button', { name: /Update Now/ }).click();
  await page.getByRole('alert').getByText(/Update files are missing/).waitFor();
  assert.equal(await script(page), aScript, 'failed approval must not reload the old release');
  await page.evaluate(async () => {
    const saved = window.__testAssetRestore;
    await (await caches.open(saved.name)).put(saved.key, saved.response);
    delete window.__testAssetRestore;
  });
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
  await page.getByRole('button', { name: /Settings/ }).last().click();
  await page.getByRole('button', { name: 'Check for updates', exact: true }).click();
  await page.getByText('Connect to the internet to check for updates.', { exact: true }).waitFor();
  assert.equal(await page.getByText("You're Up to Date", { exact: true }).count(), 0, 'failed checks must not claim up to date');
  assert.deepEqual(errors, []);
  console.log('PASS: delayed download gating, install without auto-approval, Later, manual checks online/offline, failed approval without reload, retry, profile preservation and offline reopening.');
  await context.close();
} finally {
  pauseAssets = false; releaseAssetRequests.forEach(resolve => resolve());
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
  await rm(temp, { recursive: true, force: true });
}

