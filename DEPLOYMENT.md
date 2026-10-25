# Deploying the offline and update fix

This project remains an installable web PWA. It does not produce an Android APK/AAB. Launch the installed home-screen app for its standalone window; opening a URL in Chrome still opens a browser tab.

## Vercel

Commit the source changes, including `package-lock.json` and `vercel.json` (with `bun.lock` removed to prevent package manager conflicts). Vercel uses `npm ci --include=dev`, `npm run build`, and the `dist` output directory. Do not deploy `src/sw.js` directly: the build injects the complete asset list into `dist/sw.js`.

Use Node.js 22.12+ or Node.js 24. To check locally:

```sh
npm ci
npm run lint
npm run test:offline
npm run build
npm run test:browser
```

The browser test uses an installed Google Chrome. Set `TEST_BROWSER_CHANNEL=msedge` to use installed Microsoft Edge instead. It builds a second release, serves both from one localhost origin, and checks offline launch, cached icon fonts, update approval, Later, closing/reopening, and profile preservation.

## First deployment: migration from the old worker

The old deployed app automatically activates workers and deletes caches. Its existing JavaScript cannot be changed retroactively. After deploying this fix, open the app online, close all windows/tabs for this site, then reopen online so the new release can finish installing. Reload once if needed. Only then test airplane mode. This first migration may load the repaired release without an approval dialog; subsequent releases use the new approval flow.

Do not clear site data or uninstall the app as a migration step: leave records live in browser localStorage. Export a normal CSV backup before testing if you want a backup.

## Subsequent releases

Update the version in `package.json` using `npm version patch --no-git-tag-version` (or minor/major). The version hook synchronizes `public/version.json`; edit release notes there. Every production build generates its own build ID and timestamp, shared by the client, worker, and generated `dist/version.json`. Even a rebuild with the same version label is detectable.

The worker downloads the complete new release before showing the update dialog. Choosing Later keeps the approved app version, including after all windows close and reopen. Choosing Update Now records approval, activates the downloaded worker when needed, and reloads without deleting leave data or offline assets. A downloaded update can be approved offline.

The approval record is separate from the browser worker lifecycle: a newer worker may activate automatically after every window closes, but it continues serving the previously approved app until acceptance. First-time visitors receive the current release because there is no previous installation to preserve.

Offline requires one successful online installation. Browser storage eviction or manually clearing site data removes offline availability. The app cannot install an uncached release without a connection. Existing tabs can finish using older hashed assets; release caches are retained rather than deleting assets underneath them.

## Manual verification after deployment

1. Open online and allow installation to finish. Add a leave entry.
2. Enable airplane mode, close and reopen the installed app, and confirm the entry, styling, and icons load.
3. Reconnect and deploy a second build. Refocus the app to trigger an update check.
4. Choose Later. Close every app window and tab, then reopen: the previous app version should remain.
5. Open Settings > App Updates > Check for updates to bypass the snooze, then choose Update Now. Confirm the new release opens and existing leave data remains.

Wishes now appear only in the Home banner. The settings toggle and automatic wish notification handlers have been removed. This project does not add an Android package or a push delivery backend.

## UI validation

Run npm run test:calendar for month filtering and observed-holiday cases. After building, npm run test:ui checks the profile department limit, balance alignment, calendar month history, single comp-off warning, and light/dark layouts in Chrome at 320px, 390px, and 768px widths. Screenshots are saved under ui-screenshots/ (ignored by Git).


## deployment and update corrections

The failed Vercel log used commit 2baf370: that commit had bun.lock and no package-lock.json, yet requested npm ci. It cannot succeed. The newer local commit removed Bun but its npm lockfile omitted platform-specific dependencies. A clean npm ci reproduced EUSAGE with missing Tailwind oxide, esbuild and lightningcss variants. Existing node_modules had hidden that second problem.

The lockfile was repaired without an existing node_modules tree and includes the optional packages for Windows, Linux and other supported platforms. The final source passed a second clean npm ci --include=dev, TypeScript checking and production build in a separate directory. The package manifest declares npm and a supported Node range. GitHub Actions now checks fresh installs and builds on Ubuntu and Windows with Node 22 and 24; those remote jobs run after pushing.

Commit and push all changed files, especially package-lock.json, package.json, vercel.json, scripts/test-updates.mjs and .github/workflows/build.yml. Deploy the resulting NEW commit on Vercel. Redeploying 2baf370 repeats its missing-lockfile failure. Confirm the Vercel Root Directory is the directory containing these files and its deployment log shows the new commit. No Vercel account settings or deployment were changed by this fix.

The updater attaches updatefound/statechange listeners before calling update(), and waits for the downloaded release identified by generated server metadata. Server metadata alone no longer enables Update Now. Download/activation failures are surfaced instead of reloading and pretending the update succeeded. The worker validates the downloaded asset cache before accepting approval. Installing a PWA shortcut does not approve an unrelated code update. First-time visits receive the current release; existing installations keep their approved release until Update Now.

Settings manual checks bypass Later. A network error does not open the up-to-date dialog. Downloaded updates remain usable offline, and local leave/profile data is preserved. No cache-clearing or reinstall step is needed.

Validation commands:

```sh
npm ci --include=dev
npm run lint
npm run test:updates
npm run test:offline
npm run build
npm run test:browser
```

The browser test covers a delayed download, install events without automatic approval, snooze/manual checks online and offline, missing-cache approval rejection without reloading, retry, profile preservation and offline restart. Browser tests need installed Chrome (or TEST_BROWSER_CHANNEL=msedge).

## modal scrolling and ledger clarity

All modal windows, inline confirmations and calendar popovers use a shared page scroll lock. It fixes the body at its previous position and restores that position and the original styles after the final window closes. Nested dialogs keep the page locked when a child closes; content inside the active modal can still scroll.

The comp-off ledger separates already credited holidays from upcoming holidays, uses distinct muted green/blue sections and status labels, and states that upcoming credits are not part of the available balance. Credited entries now include both expired-window and non-expired-window earned credits, respecting excluded dates. The underlying earning and deduction rules are unchanged.

The special holiday form occupies 85% of the dynamic viewport height on phones and 75% on larger screens, with an internally scrollable form. The weekend default-date calculation uses local calendar arithmetic so Saturday/Sunday correctly advances to Monday in Singapore/India time zones.

After building, run npm run test:modals to verify background locking, internal scrolling, restored page position, nested date pickers, credited/upcoming sections, and large holiday-form dimensions at phone, desktop and short viewport sizes.

## Version source

The release baseline is 1.0.0. package.json is the canonical app version. Vite injects that version into the client and worker and generates dist/version.json. About CutiSG imports the shared APP_VERSION value, so its badge follows every future build without manual editing. Use npm version patch --no-git-tag-version (or minor/major) to update package.json, package-lock.json, public/version.json and README badges together. Manual package.json edits also control all built version displays. Unique build IDs continue detecting deployments even when the version label is unchanged or reset.

## Release notes for every update

The popup displays the highlights bundled with the downloaded release, even when the version number stays the same. It does not generate summaries from code. Before deploying an app change:

1. Edit public/version.json: set releaseDate and replace highlights with 1–5 short items explaining what users will notice. Use simple wording, for example: Reset Leave Records stays off until you have a leave record.
2. Run npm run release:notes after finishing the code and notes. This records the reviewed app revision.
3. Run npm run build and commit all changed files, including public/version.json and the release-note scripts.

Prebuild stops deployment if app files changed after review or notes were edited without review. Reviewing changed app files with unchanged notes also fails. Rebuilding unchanged app files may reuse the same notes. Windows/Linux line endings are normalized. These checks detect stale notes; the author must still ensure the summary accurately describes the change. Do not hand-edit notesReview. Version numbers still come from package.json; keep 1.0.0 until a version change is requested.
