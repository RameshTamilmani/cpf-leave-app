# CutiSG Deployment and Verification

Reviewed 26 October 2026. This project builds an installable web PWA, not an APK/AAB. Keep version **1.0.0** until a version change is requested.

## Build Requirements

Use npm, the committed package-lock.json, and Node.js >=22.12.0 and <25. CI checks Windows/Ubuntu on Node 22 and 24. The current vercel.json uses npm install, npm run build and dist output. The clean local verification below uses npm ci --include=dev to check the lockfile independently of existing node_modules. GitHub Actions uses npm ci. The project root must contain package.json and vercel.json. Deploy the new commit containing all changes, not a retry of an older failing revision.

~~~sh
npm ci --include=dev
npm run lint
node --import tsx --test scripts/test-calendar.mjs scripts/test-holidays.mjs scripts/test-profile.mjs scripts/test-offline.mjs scripts/test-updates.mjs scripts/test-restore.mjs scripts/test-release-notes.mjs scripts/test-leave-duration.mjs scripts/test-logic-fixes.mjs scripts/test-timesheet.mjs scripts/test-profile-compoff-policy.mjs
npm run build
~~~

Unit suites also have individual npm scripts: test:calendar, test:holidays, test:profile, test:offline, test:updates, test:restore, test:release-notes, test:leave-duration, test:logic and test:timesheet.

api/holidays.ts is a Vercel function; plain npm run dev/preview serves the frontend without this function. Holiday sync may fall back to saved or bundled dates in that local environment. No Gemini API key or separate Express server is required.

## Release Metadata

package.json is canonical. Shared injected metadata supplies the application and service worker; Settings/About read the same version. A unique build ID and timestamp identify each build even if the version stays 1.0.0. Vite generates dist/version.json; do not manually edit generated output or deploy raw src/sw.js.

For every app change:

1. Finish the code and validation. Update public/version.json releaseDate, releaseNotes and 1–5 highlights in simple user-facing language. Notes are authored, not automatically inferred from code.
2. Run npm run release:notes to record review hashes. Do not hand-edit notesReview.
3. Run npm run release:check for the strict revision check, then npm run build.
4. Run relevant browser checks below. Commit all required source, scripts, docs, metadata and lockfile updates before deployment.

Prebuild syncs version and checks that notes are complete and reviewed. A source fingerprint difference warns during a deployment build rather than blocking host-specific checkout differences; the strict local release:check still fails on stale source review. Windows/Linux line endings are normalized. Reviewing changed app files with unchanged notes fails; update the notes to describe the release first.

Only when a version bump is requested, npm version patch --no-git-tag-version (or minor/major) updates package/lock and synchronizes public/version.json and README version labels. Rebuild and deploy afterward.

## Browser Regression Checks

An installed Google Chrome is required; set TEST_BROWSER_CHANNEL=msedge to use Microsoft Edge. These checks use synthetic isolated browser data rather than personal records.

~~~sh
npm run test:timesheet-browser
npm run test:split-compoff-browser
npm run test:logic-browser
npm run test:profile-browser
npm run test:ui
npm run test:modals
npm run test:browser
~~~

- test:timesheet-browser: exact month/year download filename, profile contact migration/editing, disabled date-free holiday reasons, selected credits, valid AM/PM metadata round trips and rejection of missing half-day session details.
- test:split-compoff-browser: two half-day bookings sharing one credit, elapsed-session overlap prevention, rejected overdrawn restore and concurrent half-day saving.
- test:logic-browser: strict/confirmed CSV replacement, legacy types, per-cycle balances, half-day date/session round trips, Comp-Off funding, cycle boundaries, status consistency and concurrent windows including IndexedDB fallback. It starts a current-source Vite server.
- test:profile-browser: mandatory setup, optional image, tenure accents and responsive profile behavior.
- test:ui: department, balances, Calendar, validation and light/dark responsive layouts.
- test:modals: background scroll locking, internal touch reversal, nested pickers, restored page position and Special Holiday sizing.
- test:browser: production service worker, offline restart, delayed download, Later/manual checks, approval failure/retry and profile preservation. It builds a second release for update testing.

The timesheet, split-credit and logic browser suites start their own current-source Vite server. Build before the static UI/modal/profile and production-worker checks. Screenshots under ui-screenshots are generated test artifacts and are ignored by Git. npm run clean removes only dist across supported operating systems.

## Offline and Approval Behavior

The production worker precaches the complete app shell, local fonts and icons. One successful online install is required before offline launch. The full new release must download before Update Now becomes available. Later keeps the approved release for six hours; Settings → App Updates → Check for updates bypasses snooze. A downloaded update can be approved offline. Approval failures preserve the working release.

Browser activation and user approval are separate: a newer worker can activate after all windows close while continuing to serve the approved release until acceptance. First-time visitors receive the current release. Old hashed assets/release caches are retained so open windows continue working. Do not clear site data or reinstall as an update strategy.

For a first migration from an old automatically updating worker, open online, close all site/app windows, then reopen online so the repaired release installs. That one migration can load without the new approval dialog; later releases use approval gating. Do not erase personal records to force migration.

## Post-deployment Checks

1. Confirm deployment commit, generated metadata and displayed version. Create a test record in an isolated profile.
2. Go offline, close/reopen the installed app and confirm records, fonts/icons and styling remain available.
3. Deploy a second build, refocus, choose Later and reopen; the previously approved release should remain.
4. Check manually in Settings, approve Update Now and confirm the new release opens with records intact.
5. Confirm the holiday endpoint works online and saved/bundled fallback works offline. An app update check and holiday refresh are separate operations.

## Release Acceptance Checklist

- Keep package.json, package-lock.json, public/version.json and generated version displays at 1.0.0 until a version change is requested.
- Confirm both the clean npm install and the production build finish with exit code 0. Run the strict release:check locally; do not bypass the release-note guard or hand-edit review hashes.
- Confirm Contact Number is required in Employee Profile/onboarding and absent from Home and the Timesheet controls.
- Book two 0.5-day AM/PM sessions against one credit. Confirm remaining balance changes from 1 to 0.5 to 0, another date may use the same AM or PM session, and a third half day/duplicate elapsed session is blocked.
- Export/restore those records. Confirm bindings and sessions survive, edited Comp-Off remarks are reconstructed, and duplicate/overdrawn files leave existing history unchanged.
- Export the chosen month before month-end. Confirm future booked leave is respected, unbooked working dates use 9 hours, Singapore holidays/weekends follow the documented rules and HR's original formulas remain intact.
- Confirm the exact filename, for example Optimum India_Timesheet Oct 2026.xlsx, with Jan–Dec capitalization and the selected year. Verify the full September heading fits without trimming.
- Confirm the blank HR template is in the production assets/precache and offline Excel export works after successful installation.
- Review and commit all intended source changes, new regression scripts, documentation and release metadata together. Include the blank template if it is not already tracked; exclude node_modules, dist and generated screenshots/workbook fixtures.

Local checks validate the current checkout. CI runs its Node/OS matrix after push; the deployment log must show the new commit and the expected project root/build settings. Documentation-only changes do not require a new version or altered leave rules.

## Repository Hygiene

Keep package-lock.json, regression scripts, icon generator, bundled fonts and real PWA icons. The blank src/assets/hr-timesheet-template.xlsx is an intentional runtime asset; keep it committed and included in the xlsx precache glob. Do not replace it with a filled personal workbook. Reference screenshots/videos and AI Studio temporary media are not runtime assets and must stay outside public and out of commits. Vite copies public files into dist even when a service-worker glob excludes them. Inspect dist before deployment; it should contain application assets, not reference attachments.

The manifest declares supported standalone launch and icons only; unsupported import/share/widget/query shortcuts have been removed. metadata.json remains minimal authoring metadata without advertising a Gemini backend. Unused notification helper modules and dormant popup UI have been removed; Home banners remain the supported wish flow. This app has no push delivery backend.

Record persistence uses localStorage with Web Locks or an IndexedDB mutex fallback. Do not change stored keys or remove legacy settings/type compatibility as part of packaging cleanup. CSV exports cover leave records only, not complete profile/settings backups.
