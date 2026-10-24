import { test } from 'node:test';
import assert from 'node:assert/strict';
import { downloadRelease, waitForActivation } from '../src/pwa.ts';

globalThis.window = globalThis;
class Worker extends EventTarget {
  constructor(id, state = 'activated') { super(); this.state = state; this.info = { buildId: id, version: '1.1.1', buildTime: id === 'A' ? 10 : 20 }; }
  postMessage(_message, ports) { ports[0].postMessage(this.info); ports[0].close(); }
  change(state) { this.state = state; this.dispatchEvent(new Event('statechange')); }
}
class Registration extends EventTarget {
  active = new Worker('A'); installing = null; waiting = null;
  constructor(update) { super(); this.performUpdate = update; }
  async update() { await this.performUpdate(this); }
}
const expected = { buildId: 'B', version: '1.1.1', buildTime: 20 };

test('updatefound after update() resolves still waits for the complete downloaded release', async () => {
  const reg = new Registration(reg => {
    setTimeout(() => {
      const worker = new Worker('B', 'installing'); reg.installing = worker;
      reg.dispatchEvent(new Event('updatefound'));
      setTimeout(() => { reg.installing = null; reg.waiting = worker; worker.change('installed'); }, 40);
    }, 20);
  });
  const result = await downloadRelease(reg, 'A', expected, 1000);
  assert.equal(result.info.buildId, 'B'); assert.equal(result.worker.state, 'installed');
});
test('slow or absent expected updates report an error instead of claiming up to date', async () => {
  const reg = new Registration(() => {});
  await assert.rejects(downloadRelease(reg, 'A', expected, 60), /not ready/);
});
test('failed worker installations are not swallowed', async () => {
  const reg = new Registration(reg => {
    const worker = new Worker('B', 'installing'); reg.installing = worker;
    reg.dispatchEvent(new Event('updatefound'));
    setTimeout(() => { reg.installing = null; worker.change('redundant'); }, 20);
  });
  await assert.rejects(downloadRelease(reg, 'A', expected, 1000), /download failed/);
});
test('a failed network check can still offer a previously downloaded release', async () => {
  const reg = new Registration(() => { throw new Error('Offline'); }); reg.waiting = new Worker('B', 'installed');
  assert.equal((await downloadRelease(reg, 'A', expected)).info.buildId, 'B');
});
test('a successful check with no new deployment reports no update', async () => {
  const reg = new Registration(() => {});
  assert.equal(await downloadRelease(reg, 'A', { ...expected, buildId: 'A' }, 1000), null);
});
test('activation waits for success and rejects redundant workers', async () => {
  const worker = new Worker('B', 'activating');
  const activated = waitForActivation(worker); worker.change('activated'); await activated;
  await assert.rejects(waitForActivation(new Worker('B', 'redundant')), /replaced/);
});
