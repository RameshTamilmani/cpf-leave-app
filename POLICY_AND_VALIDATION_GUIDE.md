# CutiSG Policy and Validation Guide

Implementation reference, reviewed 27 October 2026. Version baseline: 1.0.0. These are app rules and company-policy defaults, not a legal compliance certificate or employer approval workflow.

## 1. Profile and Display

Name, numeric Employee ID, department, joining date and Contact Number are mandatory before using the app; photo is optional. Limits are 40 name characters, 12 ID digits and 25 department characters. Department is normalized to uppercase. Joining date must be a real date no later than today. Contact Number accepts local/international phone text with 7–15 digits and is shown only in profile setup/editing, not Home. Previously saved timesheet phone numbers migrate into the profile automatically. Local photo upload supports cropping with an 8 MiB input limit.

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
| Single working day (AL/SL) | 1 day, or 0.5 day with AM/PM |
| Multiple working days, N > 1 (AL/SL) | N days, or N − 0.5 days |
| Comp-Off (CO/legacy CL) | Full day, or 0.5 day with AM/PM; multi-day half-day adjustment requires an exact working date |

For a multi-day half-day adjustment, choose the exact working date and AM or PM. A five-day range can therefore deduct 4.5 days with any one of those working dates selected as the half day. Other arbitrary deductions are blocked by the Apply Leave form. A multi-date range containing only one working date is also constrained by the form's multi-day safeguards; select that working date alone for a half day.

Overlap checking compares working dates and sessions across leave categories. AM plus PM on the same date is allowed; another AM, another PM or a full day intersecting either is blocked. Duplicate/overlapping rows within an incoming CSV are rejected.

Stored statuses are planned, taken and retroactive. A planned record displays Taken once its start date arrives, consistently in Calendar, History and details. This is a date-based display status, not an external approval. Legacy CL leave type is preserved and shown as Comp Off.

## 4. Comp-Off Credits

Eligible non-excluded public holidays (normally non-working Saturdays) yield one credit each only after their holiday date. The ledger separates credited holidays from upcoming ones. Future credits are not available to fund an earlier leave date. An explicit ineligibility flag is respected, including substitute entries.

Each credit has its own window ending 90 calendar days after the holiday, inclusive. New applications explicitly select a holiday credit for each working leave date. Each credit starts with 1 day; a 0.5-day booking leaves 0.5 available for another AM or PM booking on the same or another working date. AM/PM is required for half-day leave. A full-day booking cannot consume a credit with only 0.5 left, and a third half day cannot overdraw a spent credit. Duplicate or overlapping sessions remain blocked, including elapsed dates. Every selected leave date must still fall within that credit’s original 90-day window. The selected holiday reason is filled automatically and disabled for editing. Remarks contain only the holiday name plus “Comp-off”, without a date. CSV imports reconstruct the reason from verified credit details rather than accepting an edited remarks value. For older records without a saved selection, the established earliest-expiry allocation remains in place and reserves its used credits before new selections are checked. A retrospective submission may use an eligible historical credit when the leave date was inside its window, even if submission happens after expiry. A credit must have been earned by the current app date before it can be allocated.

Current-cycle and eligible previous-cycle credit pools contribute to displayed balances according to the existing ledger rules. Saved exclusion and expiry settings remain compatible, but the current ledger does not expose manual credit, expiry or carry-over editing controls. Its displayed credited balance includes eligible earned credits even after their windows have passed, so it is not permission to book outside those windows. The allocation check, not an aggregate balance alone, decides whether a new Comp-Off booking can save.

Valid older half-day Comp-Off records retain their original deductions and recover their remaining 0.5-day balance automatically. Missing AM/PM or ambiguous half-day dates are flagged for review without rounding or deleting records. Unfunded or ambiguous older Comp-Off records remain stored and trigger a review warning. An unfunded allocation prevents additional Comp-Off saves; missing session/date details prevent a valid backup/export until corrected. Existing records are not silently rounded, reassigned or deleted. CSV restore rejects unfunded Comp-Off records or ambiguous fractional multi-day Comp-Off records. It does not silently change the type or invent a half-day date.

### Split-Credit Examples

| Saved leave against one holiday credit | Remaining credit | Next request |
| --- | --- | --- |
| None | 1.0 day | Full day or 0.5 AM/PM allowed within the window |
| Date A, 0.5 AM | 0.5 day | Date B, 0.5 AM or PM allowed; same Date A PM also allowed |
| Date A AM and Date B PM, 0.5 each | 0 days | No further deduction from that credit |
| Date A AM already logged | Unchanged | Another Date A AM is an overlapping duplicate and is blocked |
| 0.5 remains, but requested leave is outside the original 90-day window | 0.5 day | Request is blocked for that date |

Two half-day requests on different dates may both be AM or both be PM. AM/PM identifies the session on each leave date; it is not a unique AM or PM slot belonging to the original holiday. Concurrent windows recheck the latest stored deductions under a lock before saving. Duplicate elapsed sessions and overdrawn CSV files cannot bypass these checks.

## 5. Holidays and Special Dates

The app requests /api/holidays automatically on startup/reconnection when a refresh is due, and every six hours while mounted. The Vercel endpoint reads the official data.gov.sg MOM dataset. Invalid/unavailable responses leave saved or bundled dates usable. Supported bundled years are those present in src/data/singaporeHolidays2026.ts; the filename is historical and is not a single-year guarantee.

Official years containing at least 11 returned dates replace bundled dates for that year; smaller feeds merge by date. That threshold is an implementation completeness heuristic, not a guarantee that every future declaration has already been published. Official corrections are used consistently by Calendar and working-day deductions. Substitute dates display “Substitute”.

Recognized non-regular official declarations count as Special Holidays in the active cycle. Manual weekday additions are available for missing dates/company off-days. Manual weekends and dates already covered by public/substitute/special holidays are blocked. Existing manual conflicts are omitted from the merged calendar; official data takes precedence. Do not add a second holiday when the date is already present.

Calendar's monthly history omits ordinary weekend leave and keeps public holidays even when they fall on a weekend. All AM/PM sessions for a working date are summarized in the grid.

## 6. CSV Export and Replacement Restore

CSV is the supported backup format. Export includes all stored leave records, sorted by start date. It excludes profile, photos, preferences, custom holidays, internal IDs and creation timestamps. Dates are exported in ISO form; supported ISO and DD/MM/YYYY dates are accepted on restore.

Actual export headings and a valid example:

~~~csv
Type,Title,Start Date,End Date,Days,Status,Remarks,Half Day Date,Half Day Session,Comp Off Credits
AL,Annual Leave,2026-10-26,2026-10-30,4.5,planned,Personal,2026-10-28,pm,
~~~

Type, title, start/end dates, days and status are required. Remarks, half-day columns and Comp Off Credits are optional for compatible older exports, subject to ambiguity checks. The Comp Off Credits column stores quoted JSON containing the selected holiday date/name and its leave date. Explicit selections are validated for eligibility and duplicates during restore. Deleting an application releases only its deducted portion of each selected credit. For example, deleting one 0.5-day booking restores 0.5 without affecting the other half-day booking. Supported types: AL, SL, CO and legacy CL. Supported statuses: planned, taken, retroactive. Quoted commas, escaped quotes and multiline remarks round-trip correctly.

Restore checks the file extension, non-empty content, headings, row widths, real dates, known values, working-day amounts, half-day consistency, overlaps within the incoming file, cycle gaps and eligible Comp-Off funding. Unsupported uploads show a warning. Any invalid row rejects the file, leaving current records unchanged; no valid subset is silently imported.

After file/row validation, Replace Leave Records? shows incoming/existing counts. Credit capacity, cycle rules and the unchanged-history snapshot are checked again before replacement is committed. Replace & Restore replaces the entire history; it does not merge with existing records or skip duplicates against the old history. Cancel preserves current records. If records changed after preview, replacement fails so the user can review again. Missing half-day information in older exports is not fabricated; ambiguous cross-cycle fractional records require correction before restore.

## 7. Storage and Resets

Records use cutisg_records in localStorage. Origin-wide Web Locks serialize mutations; an IndexedDB transaction provides a lock fallback without storing personal records in that database. Save operations read the latest records before applying changes and synchronize other windows. If safe storage is unavailable, saving reports failure.

Reset Leave Records is disabled when history is empty. It clears leave history and manual Comp-Off credits, preserving profile, custom holidays and settings. Factory Reset clears records, profile, custom holidays and settings to defaults, returning to mandatory onboarding. It is an app-data reset, not browser storage/cache erasure; offline release caches and separate saved holiday/update metadata are not a complete factory-wipe guarantee.

## 8. HR Timesheet Export

Employee Profile contains the required Contact Number alongside ID, name, department and joining date. The Timesheet section shows only the labelled month selector, a themed calendar button matching the other date fields, and Export Timesheet. Company/manager and schedule explanation lines are omitted from the card; it reads the saved profile contact. The number is never displayed on Home. CPF, Chennai and Sujatha Sambavamurthy are built-in defaults. Employee ID/name come from the saved profile.

Downloads use Optimum India_Timesheet XXX YYYY.xlsx, where XXX is the selected English three-letter month (Jan–Dec) and YYYY is the selected year, for example Optimum India_Timesheet Oct 2026.xlsx. The employee ID is not included in the filename.

Export directly downloads a filled copy of the bundled blank Optimum HR template; no monthly upload is required. The selected calendar month is filled from start to end, independently of the leave-year cycle. Weekends have blank hours/remarks. Singapore weekday public/special holidays use L. Remarks remove parenthesized Substitute/Observed labels and add Holiday, for example Deepavali Holiday or Chinese New Year Day 2 Holiday. Weekends remain blank even when a holiday falls on them. Other weekdays use 9 hours unless a leave record (including planned future leave) applies. AL/SL full days use L; full Comp-Off days also use L with their specific selected holiday reason, such as Hari Raya Puasa Comp-off. An AL/SL half day uses 4.5 hours and the recorded AM/PM remark. Two complementary AL/SL half days have zero working hours and use L, with both reasons in Remarks. Comp-Off half days use 4.5 hours; their Remarks contain only the holiday name plus “Comp-off”. The exact AM/PM is preserved in the app and CSV backup. Two same-date complementary Comp-Off half days use L, with no working hours and one deduplicated remark per holiday reason.

HR's existing formulas are retained: hours are the sum of numeric hours; leave days count L plus half of the 4/4.5-hour entries. Full-day Comp-Off and public holidays use L and therefore each contribute 1 to the HR Total Leave Days formula. Half-day Comp-Off remains numeric 4.5 and contributes 0.5. This is a timesheet reporting rule only and does not apply for leave or reduce app AL/SL/Comp-Off balances. The original HR template legend is retained, but exports no longer write PH or CO in the Hours Worked column. Unbooked future weekdays still use 9 hours; exporting does not mark them as attendance in the app or modify leave history. Ambiguous older multi-day half-day records or conflicting daily leave must be corrected before export.

Original styles, logo, hidden legend, print settings and sheet protection remain in the workbook. The title gets a font-size variant fitted to the merged D6:G7 width, using conservative width measurement and shrink-to-fit so longer month names remain fully visible. Date rows and cached totals are updated for 28/29/30/31-day months. The template is bundled and precached for offline export after a completed app installation. Existing unlinked Comp-Off reasons use their established allocation where available; records are not rewritten. CSV is still the only restore format; the HR timesheet is not a backup file.

## 9. Installation and Updates

This is a web PWA with standalone installation, not a native Android package. Offline use requires a complete online installation first. Browser storage eviction or user-cleared site data can remove records/cache.

Updates are identified by build ID, downloaded fully and offered with release-specific notes. Update Now approves the downloaded release; Later snoozes six hours and preserves the approved release. Manual Settings checks bypass snooze. Failed checks do not report Up to Date. package.json supplies the shared version (currently 1.0.0); release highlights must be maintained in public/version.json.

## 10. Implementation Function Reference

This table links the current specification to the functions changed or used by the recent corrections. It describes the implemented behavior rather than earlier, superseded full-day-only or one-use-credit proposals.

| Source | Functions / component | Current responsibility |
| --- | --- | --- |
| src/utils/profile.ts | profileError, validContact | Require all five profile fields, validate a 7–15-digit phone, accept the legacy timesheetContact key when the new field is absent, and reject an explicitly blank contact. |
| src/components/OnboardingModal.tsx | OnboardingModal, handleSave | Require name, numeric ID, department, joining date and phone before continuing; keep the photo optional and save the contact with the profile. |
| src/screens/SettingsScreen.tsx | SettingsScreen, handleSaveProfile, handleCsvUpload | Edit/save all profile fields together; show contact only here, outside the Timesheet section; validate restore files and ask before replacement. |
| src/context/LeaveContext.tsx | Settings initialization, updateSettings | Carry the old timesheet phone into contactNumber, normalize department to uppercase and trim the saved phone. |
| src/utils/compOff.ts | compOffDurationError, compOffReason | Validate full/half-day metadata and required AM/PM; produce a deduplicated holiday-name-plus-Comp-off reason without dates. |
| src/utils/leaveAccounting.ts | compOffAllocation | Start each eligible earned holiday with 1 day; preserve legacy allocation first, apply explicit bindings, subtract actual 1/0.5-day portions, and return balances, usage, assignments and unfunded records. Expiry/exclusion rules remain enforced. |
| src/components/ApplyLeaveModal.tsx | ApplyLeaveModal, handleSubmit | Offer Full Day, AM and PM; require a selected holiday credit per working leave date, disable credits with insufficient balance, request the exact half-day date for a multi-day adjustment, and keep the generated Comp-Off reason disabled. |
| src/context/LeaveContext.tsx | compOffError, getQuotaImpact | Validate the proposed selection against existing deductions and its 90-day window; show remaining fractional credit rather than consuming a whole credit for a half day. |
| src/context/LeaveContext.tsx | addRecord, updateRecord, deleteRecord, commitRecords | Recheck overlaps/credit funding against fresh saved history, normalize Comp-Off reasons, persist safely and release only the deleted booking's deduction. |
| src/utils/recordStorage.ts | readRecords, transactRecords | Preserve the localStorage record key, serialize changes through Web Locks or an IndexedDB mutex fallback, and prevent stale replacement snapshots from overwriting newer records. |
| src/utils/leaveDuration.ts | workingLeaveDates, halfDayOnDate, halfDaySelectionError, leavePeriodsOverlap | Resolve working dates and per-date AM/PM portions; allow complementary sessions and block duplicate or intersecting sessions across leave types. |
| src/utils/leaveAccounting.ts | validCycle, cycleDayLimit, cycleFor, daysInWindow, cycleView, quotaImpact | Enforce recurring calendar boundaries and custom-cycle gaps, scope balances to the correct year, split spanning records and preserve/flag ambiguous older totals. |
| src/utils/leaveCSV.ts | parseCSV, parseLeaveCSV | Read quoted/multiline CSV, validate every row and half-day session, preserve supported legacy types/statuses and credit bindings, rebuild selected-credit remarks and reject overlapping incoming sessions. |
| src/context/LeaveContext.tsx | exportCSV | Validate Comp-Off duration/funding, include explicit or established legacy bindings, regenerate date-free reasons, validate the outgoing rows and download the complete CSV only when valid. |
| src/context/LeaveContext.tsx | restoreCSV | Recheck cycle/credit capacity, retain AM/PM and leave-date-to-holiday bindings, normalize the verified reason and replace history atomically only if its preview snapshot is still current. |
| src/components/CompOffModal.tsx | CompOffModal | Separate credited/upcoming holidays and show each credit's actual booking portions and remaining balance, including two half days. |
| src/utils/timesheetRows.ts | buildTimesheet | Fill the whole selected month using Singapore holidays, blank weekends, 9-hour weekdays, booked leave, 4.5-hour half days and deduplicated Comp-Off remarks; retain HR's hours/leave-day counting convention. |
| src/utils/timesheetExport.ts | fillTimesheet | Populate the original workbook, update valid calendar rows and cached formula results, validate monthly credit funding, fit the title font to D6:G7 and wrap long inputs while preserving original workbook features. |
| src/utils/timesheetExport.ts | exportTimesheet | Fetch the bundled/offline-cached template and download Optimum India_Timesheet XXX YYYY.xlsx using the selected month/year, with no employee ID in the filename. |
| src/components/TimesheetSettings.tsx | TimesheetSettings, openMonthPicker, download | Provide the themed calendar button (native month picker with focus fallback), the month selector and direct export button, read the saved profile phone, prevent repeated clicks while exporting and show any export warning. There is no contact input in this section. |
| src/utils/calendarEntries.ts and src/utils/leaveAccounting.ts | getMonthEntries, effectiveStatus | Show all monthly working-date sessions, retain weekend public holidays and use the same date-based Planned/Taken display status in Calendar, History and details. |
| src/utils/officialHolidays.ts and src/hooks/useOfficialHolidays.ts | parseOfficialHolidays, mergeHolidaySources, useOfficialHolidays | Validate official holiday rows, merge/replace date sources, deduplicate special holidays and retain saved/built-in offline fallback. |
| src/hooks/useModalScrollLock.ts | useModalScrollLock, lockPageScroll | Lock background movement while preserving internal scrolling, nested dialog locks and the page position after closing. |
| src/context/LeaveContext.tsx | resetAllData, resetCycleWithWarningConfirm, resetEntireAppToDefaults | Implement the separate record, cycle-change and factory reset scopes described above without using cache deletion as an app-update mechanism. |
| src/hooks/useAppUpdate.ts, src/sw.js and src/release.ts | useAppUpdate, approved-release worker flow, APP_VERSION | Offer fully downloaded updates for explicit approval, support Later/manual checks and offline reopening, and share the canonical package version with Settings/About. |

The Comp Off Credits CSV field stores the original holiday date, holiday name and actual leave date for each binding. Date-free remarks are a display/export format; these internal dates remain necessary for accounting and expiry validation. Phone/profile data is not added to the leave-record CSV. The Excel timesheet is a monthly HR report, not a restorable app backup.

### Comp-Off booking presentation

The holiday-credit selector uses a themed dropdown with a clear arrow and focus indicator. Short guidance explains that each credit covers one full day or two half days. Duration buttons set the deduction; Comp-Off does not repeat the days stepper or range captions. The generated reason and deduction summary remain visible. Credit eligibility, capacity, expiry, AM/PM and duplicate checks are unchanged.
