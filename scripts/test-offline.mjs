import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../src/sw.js', import.meta.url), 'utf8');
const origin = 'https://example.test';
function environment() {
  const stores = new Map();
  let offline = false;
  let failAsset = '';
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      const key = value => new URL(value.url || value, origin).href;
      return {
        async put(request, response) { store.set(key(request), response.clone()); },
        async match(request) { return store.get(key(request))?.clone(); },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  function worker(buildId) {
    const events = {};
    let skipped = false;
    vm.runInNewContext(source, {
      __APP_RELEASE__: { version: '1.3.3', buildId },
      URL, Response, console, caches,
      async fetch(request) {
        if (offline || String(request).includes(failAsset || 'NEVER_FAIL')) throw new Error('network unavailable');
        return new Response(buildId + ':' + new URL(request.url || request, origin).pathname);
      },
      self: {
        __WB_MANIFEST: ['index.html', `assets/${buildId}.js`, `assets/${buildId}.css`, 'assets/font.woff2'].map(url => ({ url, revision: buildId })),
        location: { origin },
        clients: { async claim() {} },
        async skipWaiting() { skipped = true; },
        addEventListener(type, fn) { events[type] = fn; },
      },
    });
    return {
      get skipped() { return skipped; },
      async lifecycle(type) { let promise; events[type]({ waitUntil(p) { promise = p; } }); await promise; },
      async fetch(path, navigate = false) {
        let response;
        events.fetch({ request: { url: origin + path, method: 'GET', mode: navigate ? 'navigate' : 'cors' }, respondWith(p) { response = p; } });
        return (await response).text();
      },
      async message(type) {
        let promise; let reply;
        events.message({ data: { type }, ports: [{ postMessage(value) { reply = value; } }], waitUntil(p) { promise = p; } });
        await promise; return reply;
      },
    };
  }
  return { worker, stores, setOffline(value) { offline = value; }, failAsset(value) { failAsset = value; } };
}

test('complete app shell, JS, CSS and fonts load offline after first installation', async () => {
  const env = environment(); const a = env.worker('A');
  await a.lifecycle('install'); await a.lifecycle('activate'); env.setOffline(true);
  assert.equal(await a.fetch('/?tab=calendar', true), 'A:/index.html');
  for (const path of ['/assets/A.js', '/assets/A.css', '/assets/font.woff2']) assert.equal(await a.fetch(path), 'A:' + path);
  assert.equal(a.skipped, false);
});
test('download and browser activation after closing windows preserve the approved release until acceptance', async () => {
  const env = environment(); const a = env.worker('A'); await a.lifecycle('install');
  const b = env.worker('B'); await b.lifecycle('install'); await b.lifecycle('activate');
  assert.equal(b.skipped, false);
  assert.equal(await b.fetch('/', true), 'A:/index.html');
  assert.equal((await b.message('GET_RELEASE')).buildId, 'B');
  // Recreating the worker simulates it stopping and restarting while offline.
  const reopened = env.worker('B'); env.setOffline(true);
  assert.equal(await reopened.fetch('/', true), 'A:/index.html');
  assert.equal((await reopened.message('APPROVE_UPDATE')).approved, true);
  assert.equal(reopened.skipped, true);
  assert.equal(await reopened.fetch('/', true), 'B:/index.html');
  assert.equal(await reopened.fetch('/assets/B.js'), 'B:/assets/B.js');
  assert.equal(await reopened.fetch('/assets/A.js'), 'A:/assets/A.js');
});
test('failed precache does not replace the working release or touch unrelated caches', async () => {
  const env = environment(); const a = env.worker('A'); await a.lifecycle('install');
  env.stores.set('another-app', new Map()); env.failAsset('B.js');
  const b = env.worker('B'); await assert.rejects(b.lifecycle('install'));
  assert.equal(env.stores.has('cutisg-release-B'), false);
  assert.equal(env.stores.has('another-app'), true);
  env.setOffline(true); assert.equal(await a.fetch('/', true), 'A:/index.html');
});

