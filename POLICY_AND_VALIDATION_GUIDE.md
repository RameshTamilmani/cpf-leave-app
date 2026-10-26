# CutiSG Policy and Validation Guide

Implementation reference, reviewed 26 October 2026. Version baseline: 1.0.0. These are app rules and company-policy defaults, not a legal compliance certificate or employer approval workflow.

## 1. Profile and Display

Name, numeric Employee ID, department and joining date are mandatory before using the app; photo is optional. Limits are 40 name characters, 12 ID digits and 25 department characters. Department is normalized to uppercase. Joining date must be a real date no later than today. Local photo upload supports cropping with an 8 MiB input limit.

Tenure accents on the photo ring, tick and Employee ID badge are green below one year, blue through the second anniversary, and gold after that. Joined/Experience labels remain teal. Home leave cards open details; Apply Leave creates leave records. Wishes use a Home banner without push delivery.

## 2. Leave Year and Balances

Annual Leave (AL) and Sick Leave (SL) each have a fixed 12-day allocation per leave year. Default cycle is 13 June through 12 June of the following year. Presets also cover calendar, April–March and July–June years. All four saved boundary values are retained when reopening a custom cycle.

Month/day limits are enforced; February boundaries allow 1–28 because the cycle recurs every year. This does not prohibit leave on a valid leap day. Working dates in gaps left by a shortened custom cycle cannot be logged or restored as AL/SL. Changing the cycle requires a warning confirmation and clears all leave records, resets manual Comp-Off credits and restores 12-day allocations while retaining profile and other settings.

Only the active cycle's portions of AL/SL records reduce Home balances. A booking across cycles is allocated by working date, including the explicit half-day date. Planned records reserve quota as well as taken records. AL/SL deductions beyond the allocation appear as Loss of Pay (LOP); the app does not implement salary/payroll calculations.

Existing records wholly inside a cycle retain their saved totals. An old fractional record spanning cycles without its half-day date is reserved conservatively and flagged rather than rewritten or assigned an invented date. Export and re-enter it with correct details when needed.

## 3. Dates, Half Days and Overlaps

Leave must begin and end on working dates. Saturday, Sunday and resolved public/special holidays do not consume leave. A range with no working dates is blocked.

| Selection | Allowed deduction |
| --- | --- |
| Single working day | 1 day, or 0.5 day with AM/PM |
| Multiple working days, N > 1 | N days, or N − 0.5 days |

For a multi-day half-day adjustment, choose the exact working date and AM or PM. A five-day range can therefore deduct 4.5 days with any one of those working dates selected as the half day. Other arbitrary deductions are blocked by the Apply Leave form. A multi-date range containing only one working date is also constrained by the form's multi-day safeguards; select that working date alone for a half day.

Overlap checking compares working dates and sessions across leave categories. AM plus PM on the same date is allowed; another AM, another PM or a full day intersecting either is blocked. Duplicate/overlapping rows within an incoming CSV are rejected.

Stored statuses are planned, taken and retroactive. A planned record displays Taken once its start date arrives, consistently in Calendar, History and details. This is a date-based display status, not an external approval. Legacy CL leave type is preserved and shown as Comp Off.

## 4. Comp-Off Credits

Eligible non-excluded public holidays (normally non-working Saturdays) yield one credit each only after their holiday date. The ledger separates credited holidays from upcoming ones. Future credits are not available to fund an earlier leave date. An explicit ineligibility flag is respected, including substitute entries.

Each credit has its own window ending 90 calendar days after the holiday, inclusive. Deductions allocate against eligible credits in earliest-expiry order, by actual leave date and half-day amount. A retrospective submission may use an eligible historical credit when the leave date was inside its window, even if submission happens after expiry. A credit must have been earned by the current app date before it can be allocated.

Current-cycle and eligible previous-cycle credit pools contribute to displayed balances according to the existing ledger rules. Saved exclusion and expiry settings remain compatible, but the current ledger does not expose manual credit, expiry or carry-over editing controls. Its displayed credited balance includes eligible earned credits even after their windows have passed, so it is not permission to book outside those windows. The allocation check, not an aggregate balance alone, decides whether a new Comp-Off booking can save.

Unfunded or ambiguous older Comp-Off records remain stored, trigger a warning and block additional Comp-Off bookings until reviewed. CSV restore rejects unfunded Comp-Off records or ambiguous fractional multi-day Comp-Off records. It does not silently change the type or invent a half-day date.

## 5. Holidays and Special Dates

The app requests /api/holidays automatically on startup/reconnection when a refresh is due, and every six hours while mounted. The Vercel endpoint reads the official data.gov.sg MOM dataset. Invalid/unavailable responses leave saved or bundled dates usable. Supported bundled years are those present in src/data/singaporeHolidays2026.ts; the filename is historical and is not a single-year guarantee.

Official years containing at least 11 returned dates replace bundled dates for that year; smaller feeds merge by date. That threshold is an implementation completeness heuristic, not a guarantee that every future declaration has already been published. Official corrections are used consistently by Calendar and working-day deductions. Substitute dates display “Substitute”.

Recognized non-regular official declarations count as Special Holidays in the active cycle. Manual weekday additions are available for missing dates/company off-days. Manual weekends and dates already covered by public/substitute/special holidays are blocked. Existing manual conflicts are omitted from the merged calendar; official data takes precedence. Do not add a second holiday when the date is already present.

Calendar's monthly history omits ordinary weekend leave and keeps public holidays even when they fall on a weekend. All AM/PM sessions for a working date are summarized in the grid.

## 6. CSV Export and Replacement Restore

CSV is the supported backup format. Export includes all stored leave records, sorted by start date. It excludes profile, photos, preferences, custom holidays, internal IDs and creation timestamps. Dates are exported in ISO form; supported ISO and DD/MM/YYYY dates are accepted on restore.

Actual export headings and a valid example:

~~~csv
Type,Title,Start Date,End Date,Days,Status,Remarks,Half Day Date,Half Day Session
AL,Annual Leave,2026-10-26,2026-10-30,4.5,planned,Personal,2026-10-28,pm
~~~

Type, title, start/end dates, days and status are required. Remarks and half-day columns are optional for compatible older exports, subject to ambiguity checks. Supported types: AL, SL, CO and legacy CL. Supported statuses: planned, taken, retroactive. Quoted commas, escaped quotes and multiline remarks round-trip correctly.

Restore checks the file extension, non-empty content, headings, row widths, real dates, known values, working-day amounts, half-day consistency, overlaps within the incoming file, cycle gaps and eligible Comp-Off funding. Unsupported uploads show a warning. Any invalid row rejects the file, leaving current records unchanged; no valid subset is silently imported.

After validation, Replace Leave Records? shows incoming/existing counts. Replace & Restore replaces the entire history; it does not merge with existing records or skip duplicates against the old history. Cancel preserves current records. If records changed after preview, replacement fails so the user can review again. Missing half-day information in older exports is not fabricated; ambiguous cross-cycle fractional records require correction before restore.

## 7. Storage and Resets

Records use cutisg_records in localStorage. Origin-wide Web Locks serialize mutations; an IndexedDB transaction provides a lock fallback without storing personal records in that database. Save operations read the latest records before applying changes and synchronize other windows. If safe storage is unavailable, saving reports failure.

Reset Leave Records is disabled when history is empty. It clears leave history and manual Comp-Off credits, preserving profile, custom holidays and settings. Factory Reset clears records, profile, custom holidays and settings to defaults, returning to mandatory onboarding. It is an app-data reset, not browser storage/cache erasure; offline release caches and separate saved holiday/update metadata are not a complete factory-wipe guarantee.

## 8. Installation and Updates

This is a web PWA with standalone installation, not a native Android package. Offline use requires a complete online installation first. Browser storage eviction or user-cleared site data can remove records/cache.

Updates are identified by build ID, downloaded fully and offered with release-specific notes. Update Now approves the downloaded release; Later snoozes six hours and preserves the approved release. Manual Settings checks bypass snooze. Failed checks do not report Up to Date. package.json supplies the shared version (currently 1.0.0); release highlights must be maintained in public/version.json.
