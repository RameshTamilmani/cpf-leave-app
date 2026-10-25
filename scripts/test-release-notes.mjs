import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { checkReleaseNotes, checkBuildReleaseNotes, notesHash, sourceHash } from './release-notes.mjs';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const release = { version: '1.0.0', releaseDate: '2026-10-25', highlights: [{ title: 'Clearer headings', description: 'Matching headings in Home and Settings.' }] };
function reviewed() { return { ...release, notesReview: { sourceHash: 'source-a', notesHash: notesHash(release) } }; }
test('same source rebuilds pass; changed app or unreviewed notes fail', () => {
  assert.doesNotThrow(() => checkReleaseNotes(reviewed(), 'source-a'));
  assert.throws(() => checkReleaseNotes(reviewed(), 'source-b'), /need review/);
  assert.throws(() => checkReleaseNotes({ ...reviewed(), releaseNotes: 'Different changes' }, 'source-a'), /need review/);
  assert.throws(() => checkReleaseNotes({ ...reviewed(), highlights: [] }, 'source-a'), /1–5/);
});
test('source fingerprint is stable across Windows/Linux line endings and detects app edits', () => {
  const root = mkdtempSync(join(tmpdir(), 'cutisg-notes-'));
  try {
    mkdirSync(join(root, 'src')); mkdirSync(join(root, 'public'));
    const file = join(root, 'src', 'App.tsx');
    writeFileSync(file, 'first\r\nsecond\r\n'); const original = sourceHash(root);
    writeFileSync(file, 'first\nsecond\n'); assert.equal(sourceHash(root), original);
    writeFileSync(join(root, 'public', 'version.json'), '{"buildId":"different"}'); assert.equal(sourceHash(root), original);
    writeFileSync(file, 'changed\n'); assert.notEqual(sourceHash(root), original);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
test('update dialog renders each downloaded release notes even with the same version label', async () => {
  const { UpdateAvailableModal } = await import('../src/components/UpdateAvailableModal.tsx');
  const render = info => renderToStaticMarkup(React.createElement(UpdateAvailableModal, { isOpen: true, updateInfo: info, currentVersion: '1.0.0', onUpdate: async () => {}, onDismiss() {} }));
  const first = render({ ...release, buildId: 'a', buildTime: 1 });
  const second = render({ ...release, buildId: 'b', buildTime: 2, highlights: [{ title: 'Simpler resets', description: 'Reset stays off when there are no records.' }] });
  assert.ok(first.includes('Clearer headings')); assert.ok(!first.includes('Simpler resets'));
  assert.ok(second.includes('Simpler resets')); assert.ok(!second.includes('Clearer headings'));
  const fallback = render({ version: '1.0.0', buildId: 'c', buildTime: 3, releaseNotes: 'Better calendar scrolling.' });
  assert.ok(fallback.includes('Better calendar scrolling.')); assert.ok(!fallback.includes('Clearer headings'));
});

test('deployment tolerates checkout differences while enforcing reviewed release text', () => {
  assert.equal(checkBuildReleaseNotes(reviewed(), 'source-a'), null);
  assert.match(checkBuildReleaseNotes(reviewed(), 'vercel-checkout'), /does not block/);
  assert.throws(() => checkBuildReleaseNotes({ ...reviewed(), releaseNotes: 'Unreviewed text' }, 'vercel-checkout'), /edited after review/);
  assert.throws(() => checkBuildReleaseNotes(release, 'vercel-checkout'), /missing review/);
});
