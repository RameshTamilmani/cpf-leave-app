# Deploying the offline and update fix

This project remains an installable web PWA. It does not produce an Android APK/AAB. Launch the installed home-screen app for its standalone window; opening a URL in Chrome still opens a browser tab.

## Vercel

Commit the source changes, including `package-lock.json` and `vercel.json` (with `bun.lock` removed to prevent package manager conflicts). Vercel uses `npm install`, `npm run build`, and the `dist` output directory. Do not deploy `src/sw.js` directly: the build injects the complete asset list into `dist/sw.js`.

Use Node.js 22.12 or later. To check locally:

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

Update the human-readable version and notes in `public/version.json` and the package version when preparing a release. Every production build generates its own build ID and timestamp, shared by the client, worker, and generated `dist/version.json`. Even a rebuild with the same version label is detectable.

The worker downloads the complete new release before showing the update dialog. Choosing Later keeps the approved app version, including after all windows close and reopen. Choosing Update Now records approval, activates the downloaded worker when needed, and reloads without deleting leave data or offline assets. A downloaded update can be approved offline.

The approval record is separate from the browser worker lifecycle: a newer worker may activate automatically after every window closes, but it continues serving the previously approved app until acceptance. First-time visitors receive the current release because there is no previous installation to preserve.

Offline requires one successful online installation. Browser storage eviction or manually clearing site data removes offline availability. The app cannot install an uncached release without a connection. Existing tabs can finish using older hashed assets; release caches are retained rather than deleting assets underneath them.

## Manual verification after deployment

1. Open online and allow installation to finish. Add a leave entry.
2. Enable airplane mode, close and reopen the installed app, and confirm the entry, styling, and icons load.
3. Reconnect and deploy a second build. Refocus the app to trigger an update check.
4. Choose Later. Close every app window and tab, then reopen: the previous app version should remain.
5. After the six-hour snooze expires, choose Update Now. Confirm the new release opens and existing leave data remains.

Wishes now appear only in the Home banner. The settings toggle and automatic wish notification handlers have been removed. This project does not add an Android package or a push delivery backend.

## UI validation

Run npm run test:calendar for month filtering and observed-holiday cases. After building, npm run test:ui checks the profile department limit, balance alignment, calendar month history, single comp-off warning, and light/dark layouts in Chrome at 320px, 390px, and 768px widths. Screenshots are saved under ui-screenshots/ (ignored by Git).


## Version 1.0.0: Consolidated Release & PWA UX Overhaul

- **Reset Version Baseline**: Version sequence reset to clean `1.0.0`.
- **PWA Installation Flow**:
  - **Chrome on Android**: Native 1-tap direct installation triggered via early `beforeinstallprompt` capture in `<head>`.
  - **Samsung Internet Browser & Non-Chrome Android**: Auto-detected with a direct "Open in Google Chrome" intent button, "Copy App Link" shortcut, and Samsung in-browser steps (Menu ☰ → Add page to → Home screen / App screen).
  - **iPhone / iOS Safari**: Tailored 3-step guide detailing the Apple Share button `[⎋]` → Add to Home Screen action.
- **Home Screen & Typography**:
  - Unified all leave balances and denominators to identical `text-lg font-bold` typography and vertical baseline alignment.
  - Profile card: Red border removed from EMP ID badge, department formatted with a theme-adaptive violet badge, dynamic tenure colors applied strictly to ring, verification mark, and EMP ID badge, and Joined/Experience labels standardized to teal (`text-teal-700 dark:text-teal-400`).
  - Replaced disruptive pop-up celebration modals with a static Home Screen greeting ribbon.
- **Calendar Tab**:
  - Removed color and abbreviation legend strips.
  - Added full monthly holidays and leaves taken breakdown (excluding non-working weekend days).
- **Settings & Update Handling**:
  - App Updates card moved directly above the About CutiSG button.
  - "Check for updates" displays either the `UpdateAvailableModal` (when an update is found) or a dedicated `UpToDateModal` dialog ("You're Up to Date").
  - Background MOM sync explanations and data.gov.sg link moved into About CutiSG modal.
