# CutiSG — Singapore Leave Tracker (v1.0.0)

CutiSG (“Cuti” means leave) is a personal leave and Singapore public holiday tracker. It is an installable Progressive Web App (PWA), not an Android APK/AAB. Its fixed allocations and Comp-Off rules are app defaults; confirm your employer's policy. It does not approve leave requests or certify legal entitlement.

Documentation reviewed against the implementation on 27 October 2026. See [Policy and Validation Guide](POLICY_AND_VALIDATION_GUIDE.md) for calculation and backup rules, and [Deployment Guide](DEPLOYMENT.md) for release checks.

## Current Features

- Mandatory profile setup: full name (40 characters), numeric Employee ID (12 digits), uppercase department (25 characters), a valid non-future joining date, and Contact Number (7–15 digits). A locally uploaded/cropped photo is optional (8 MiB file limit).
- Profile photo ring, verification tick and Employee ID badge use green under one year, blue from the first through the second anniversary, and gold afterward. Joined and Experience labels use teal.
- Annual and Sick Leave default to 12 days each per configured leave year. Home balance cards open details; Apply Leave creates a record. Annual, Sick and Comp-Off category colors are blue, purple and green; Loss of Pay uses a crossed-rupee icon, and Special Holidays uses purple.
- Annual and Sick Leave support full or half days, including a selected working date and AM/PM for a multi-day half-day adjustment. Complementary AM and PM bookings on one date are allowed; overlapping sessions are blocked.
- Monthly Calendar shows all sessions and a month summary of holidays and leave. Ordinary weekend leave is omitted from the summary, while weekend public holidays remain visible. Weekend cells have a muted distinction. History and Calendar use the same effective Planned/Taken status.
- One-click **Export Timesheet** in Settings fills the selected calendar month in the original HR workbook. Contact Number is saved with Employee Profile, including initial setup, and never displayed on Home. Defaults: CPF, Chennai, Sujatha Sambavamurthy, 9-hour weekdays, Singapore holidays and blank weekends. Future dates include recorded leave or normal hours. Half days with AM/PM and specific Comp-Off reasons are included; HR formulas, formatting, logo and protection are preserved. This is a logging export based on the schedule and recorded leave, not an attendance clock.
- Comp-Off applications require a specific holiday credit for each working leave date. Each credit covers 1 day in total: a full day, or two 0.5-day bookings with AM/PM on the same or different working dates. Remaining balance and the original 90-day window are enforced; spent credits and duplicate sessions are blocked. The selected holiday reason is filled automatically in a disabled remarks field. CSV backups preserve the selected credit details. Existing unlinked records retain legacy allocation. CSV export/restore and monthly Excel export preserve valid half-day bindings. Missing AM/PM, ambiguous dates, overlap or overdrawn credits are flagged instead of guessed. Comp-Off remarks use only the holiday name followed by “Comp-off”, without its date. The Excel title font is fitted to its merged heading width to avoid clipping.
- Comp-Off Ledger distinguishes earned credits from upcoming holidays. Individual eligible credits fund leave within their own 90-day windows. Upcoming credits do not fund earlier leave. See the policy guide for carry-over and legacy-record caveats.
- Singapore holidays refresh automatically through the official data.gov.sg feed. Saved or bundled dates remain available offline. Special declarations in the feed appear automatically; add a manual weekday holiday only if it is missing. Dates are deduplicated; substitute holidays are labelled “Substitute”.
- Wishes appear as Home banners. There is no push delivery service or notification preference screen.
- Light, Dark and System themes; modal background scroll locking with internal scrolling; CSV export and confirmed replacement restore; separate leave-record and factory resets.

## Timesheet Download

1. Complete Employee Profile, including Contact Number. The number is kept off the Home screen; a previously saved timesheet contact is carried into the profile.
2. In Settings → Timesheet, choose the calendar month and year. The current month is selected initially.
3. Click Export Timesheet to download the completed HR workbook directly. No monthly template upload is needed.

The filename is **Optimum India_Timesheet XXX YYYY.xlsx**. XXX uses the English month abbreviations Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov and Dec. YYYY is the chosen year. Examples: **Optimum India_Timesheet Oct 2026.xlsx** and **Optimum India_Timesheet Jan 2027.xlsx**. The employee ID is not part of the filename.

The whole selected month is filled, even when exported before month-end. Ordinary weekdays without recorded leave use 9 hours; Singapore weekday holidays use L with a holiday-name-plus-Holiday remark (for example Deepavali Holiday, without “Substitute”); weekends remain blank. Half-day leave uses 4.5 working hours. HR's original total formulas remain in place: all full-day leave, including Comp-Off and public holidays, counts through the L code, and numeric half-day entries contribute 0.5. This changes the HR report total only; public holidays do not deduct app leave balances. Remarks use the holiday name followed by “Comp-off”, such as **Hari Raya Puasa Comp-off**, without the holiday date. The disabled Comp-Off reason field is generated from the selected credit.

## Split Comp-Off Example

A Hari Raya Puasa credit supplies 1 day. Book 0.5 AM on one working date and the remaining 0.5 AM or PM on another eligible date. AM plus PM on the same date is also allowed. A repeated AM/AM or PM/PM session on the same date is blocked. The credit cannot fund more than 1 day in total, and all leave dates must remain inside its original 90-day window. CSV restore checks these same session and capacity rules; it does not create additional credit.

See the [implementation function reference](POLICY_AND_VALIDATION_GUIDE.md#10-implementation-function-reference) for the code responsible for these behaviors.

## Data, Backups and Offline Use

Profile, settings, custom holidays and leave records are stored locally in browser localStorage under cutisg_* keys. Personal leave/profile data is not sent by application code to the holiday API. The holiday refresh and app updates still require network requests; hosting can log those requests.

Record writes use an origin-wide Web Lock, with an IndexedDB transaction mutex as fallback. Records themselves stay in localStorage. Multiple windows synchronize changes; a stale restore preview cannot overwrite newer history. Failed safe-saving operations show an error.

CSV exports contain leave records only, including remarks and half-day details. They do not back up profile, photos, settings or custom holidays. Exported dates use YYYY-MM-DD; UI dates usually use DD/MM/YYYY. Restore validates the entire incoming file, then asks before replacing existing history. An invalid row rejects the file without partial replacement.

The complete production app, local fonts and icons become available offline after a successful online service-worker installation. Use the installed home-screen app for a standalone window. Opening its URL opens a browser tab. Clearing browser/site storage or browser storage eviction can remove saved records and offline assets; export backups regularly.

## Updates and Version

Version remains **1.0.0**. package.json is canonical; shared build metadata supplies Settings, About, update dialogs and the worker. Each production build also has a unique build ID, so deployments with the same version label remain detectable.

The complete update downloads before it is offered. Update Now approves it; Later postpones the prompt for six hours and retains the approved offline release. Settings → App Updates → Check for updates bypasses that snooze. Release notes come from public/version.json and must be rewritten in plain language for each change; they are not generated from code.

## Development

Requires npm and Node.js >=22.12.0 and <25 (CI uses Node 22 and 24).

~~~sh
npm ci --include=dev
npm run dev
npm run lint
npm run build
~~~

React 19, TypeScript, Vite, Tailwind CSS, local Inter/Material Symbols fonts and a custom service worker provide the application. api/holidays.ts is the Vercel holiday endpoint. The local Vite server alone does not provide that endpoint; offline/bundled holiday fallback remains available.

Use the test commands and release checklist in [Deployment Guide](DEPLOYMENT.md). npm run clean removes generated dist output across Windows, Linux and macOS. scripts/generate-icons.js uses sharp to regenerate PWA icon files; keep the source and generated icons together when deliberately changing branding.
