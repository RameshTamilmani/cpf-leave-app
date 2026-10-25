import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const digest = value => createHash('sha256').update(value).digest('hex');
export function sourceHash(root) {
  const files = [];
  function visit(path) {
    if (!existsSync(path)) return;
    for (const entry of readdirSync(path, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      if (entry.isSymbolicLink()) continue;
      const next = resolve(path, entry.name);
      if (entry.isDirectory()) visit(next);
      else if (relative(root, next).replaceAll('\\', '/') !== 'public/version.json') files.push(next);
    }
  }
  for (const dir of ['src', 'api', 'public']) visit(resolve(root, dir));
  for (const file of ['index.html', 'vite.config.ts', 'package.json', 'package-lock.json', 'vercel.json']) {
    if (existsSync(resolve(root, file))) files.push(resolve(root, file));
  }
  const hash = createHash('sha256');
  for (const file of files) {
    const name = relative(root, file).replaceAll('\\', '/');
    // Git may check text out as CRLF on Windows and LF on Vercel.
    const bytes = readFileSync(file);
    const content = /\.(tsx?|jsx?|mjs|css|html|json|svg)$/.test(name) ? bytes.toString('utf8').replace(/\r\n/g, '\n') : bytes;
    hash.update(name + '\0').update(digest(content)).update('\0');
  }
  return hash.digest('hex');
}
export function notesHash(release) {
  return digest(JSON.stringify({ releaseDate: release.releaseDate, highlights: release.highlights, releaseNotes: release.releaseNotes }));
}
function validateContent(release) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(release.releaseDate || '') || !Array.isArray(release.highlights) || release.highlights.length < 1 || release.highlights.length > 5 || release.highlights.some(item => typeof item.title !== 'string' || !item.title.trim() || typeof item.description !== 'string' || !item.description.trim())) {
    throw new Error('Add a release date and 1–5 short, plain-language highlights in public/version.json.');
  }
}
export function checkReleaseNotes(release, currentSourceHash) {
  validateContent(release);
  if (release.notesReview?.sourceHash !== currentSourceHash || release.notesReview?.notesHash !== notesHash(release)) {
    throw new Error('Release notes need review: update public/version.json to describe the latest changes in plain language, then run npm run release:notes.');
  }
}
// Build hosts may alter checkout/packaging files. Validate the release text
// without treating those environment differences as a failed deployment.
export function checkBuildReleaseNotes(release, currentSourceHash) {
  validateContent(release);
  if (!release.notesReview || release.notesReview.notesHash !== notesHash(release)) {
    throw new Error('Release notes are missing review or were edited after review. Update public/version.json, then run npm run release:notes.');
  }
  return release.notesReview.sourceHash === currentSourceHash
    ? null
    : 'App files differ from the reviewed checkout. Confirm the release notes describe your changes; use npm run release:check locally. This does not block deployment.';
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const file = resolve(root, 'public/version.json');
  const release = JSON.parse(readFileSync(file, 'utf8'));
  const currentSourceHash = sourceHash(root);
  if (process.argv.includes('--review')) {
    validateContent(release);
    if (release.notesReview && release.notesReview.sourceHash !== currentSourceHash && release.notesReview.notesHash === notesHash(release)) {
      throw new Error('The app changed but the release notes did not. Update the highlights before reviewing them.');
    }
    release.notesReview = { sourceHash: currentSourceHash, notesHash: notesHash(release) };
    writeFileSync(file, JSON.stringify(release, null, 2) + '\n');
    console.log('Release notes reviewed for this app revision.');
  } else if (process.argv.includes('--build-check')) {
    const warning = checkBuildReleaseNotes(release, currentSourceHash);
    if (warning) console.warn('Release notes: ' + warning);
    else console.log('Release notes match this app revision.');
  } else {
    checkReleaseNotes(release, currentSourceHash);
    console.log('Release notes match this app revision.');
  }
}
