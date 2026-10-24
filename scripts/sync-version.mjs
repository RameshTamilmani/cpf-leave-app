import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const version = JSON.parse(readFileSync(new URL('package.json', root), 'utf8')).version;
const releaseFile = new URL('public/version.json', root);
const release = JSON.parse(readFileSync(releaseFile, 'utf8'));
release.version = version;
writeFileSync(releaseFile, JSON.stringify(release, null, 2) + '\n');
const readme = new URL('README.md', root);
if (existsSync(fileURLToPath(readme))) {
 const text = readFileSync(readme, 'utf8').replace(/\(v\d+\.\d+\.\d+(?:[-+][\w.-]+)?\)/g, '(v' + version + ')');
 writeFileSync(readme, text);
}
console.log('Synced app release metadata to ' + version);
