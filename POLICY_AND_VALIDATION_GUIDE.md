# Singapore Leave Policy & Validation Guide

This document specifies the business rules, statutory legal requirements, and data validation rules implemented in **CutiSG**.

---

## 1. Statutory Leave Entitlements & Defaults

### 1.1 Annual Leave (AL)
- **Default Allocation**: **12 / 12 Days** (12 days total entitlement, 12 days available on initialization).
- **Singapore Employment Act Context**: Section 88A / Part IV specifies statutory annual leave beginning at 7 days for the first year of service, progressing by 1 day per additional year of service up to 14 days. Companies commonly standardize base entitlements at 12 or 14 days.
- **Card Restriction**: The Annual Leave card on the dashboard is strictly informational. Clicking it does not open edit or creation dialogs. All leave submissions must proceed through the **Apply Leave** button.

### 1.2 Outpatient Sick Leave (SL / OSL)
- **Default Allocation**: **12 / 12 Days** (12 days total entitlement, 12 days available on initialization).
- **Employment Act Context**: Employees covered under the Employment Act who have served an employer for at least 6 months are entitled to paid outpatient sick leave. Standardized in CutiSG to 12 days statutory default.
- **Certificate References**: Reference inputs for clinic certificates or DigiMC numbers are removed to streamline leave application without requiring redundant medical clinic metadata.

### 1.3 Comp-Off Leave (CO)
- **Earned Automatically**: Based on gazetted Saturday public holidays occurring within the employee's active leave year cycle.
- **Statutory Basis**: Ministry of Manpower (MOM) Employment Act Section 88: For employees working on a 5-day week, a public holiday falling on a non-working Saturday must be replaced with either an alternative day off-in-lieu (comp-off) or 1 extra day of basic pay.

---

## 2. Leave Date & Deduction Validation Rules

### 2.1 "Days to Deduct" Strict Matching Rules
The deduction field strictly matches the selected date range:

| Selection Type | Working Days in Range | Allowed "Days to Deduct" Values | Disallowed Values (Blocked) |
| :--- | :--- | :--- | :--- |
| **Single Day** (`start === end`) | 1 working day | `1.0` or `0.5` (AM / PM) | Any value $\neq 1.0$ and $\neq 0.5$ |
| **Single Day (Weekend/PH)** | 0 working days | `0` (Blocked with notice) | Cannot deduct leave on non-working day |
| **Multi-Day** (`start !== end`) | $N$ working days ($N \ge 1$) | Strictly $N$ or $N - 0.5$ | Any value $< N - 0.5$, any value $> N$, or `0.5` |
| **Multi-Day** (`start !== end`) | 0 working days | `0` (Blocked with notice) | Range contains no working days |

#### Example Scenarios:
1. **User selects Mon to Fri (5 working days)**:
   - System permits deducting: **5.0 days** or **4.5 days** (half-day adjustment).
   - Entering 4.0, 3.5, 2.0, or 0.5 days is **strictly blocked** by validation.
2. **User selects Mon to next Wed (8 working days, including weekend)**:
   - System permits deducting: **8.0 days** or **7.5 days**.
   - Entering 1.0 day or 0.5 days is **strictly blocked**.
3. **Half-day constraint**:
   - Selecting **0.5 days** is permitted **only** when `startDate === endDate`.

### 2.2 Duplicate & Overlap Validation
- If a user attempts to book a leave for dates overlapping an existing approved or planned leave record, the system detects the collision and blocks submission:
  - Error: *"Duplicate leave detected: You already have a booked leave '[Title]' ([Type]) for [Date Range]. Duplicate leaves are not allowed for the same date."*
### 2.3 Public Holiday Blocking vs Special Holiday Allowance
- **Gazetted Public Holidays (Blocked)**: Employees are strictly prevented from applying for leave on official Singapore MOM gazetted public holidays. Gazetted public holidays are statutory paid non-working days under Section 88 of the Employment Act; thus, applying leave or deducting personal annual leave is blocked with an explanatory validation error.
- **Special Holidays under Comp-off (Allowed)**: Special holidays declared and added under Comp-off (e.g. ad-hoc company days or national observances) remain eligible for leave application. Employees can take full or half-day leave on these dates as required by their personal schedule.

---

## 3. CSV Data Management & Clean-up

### 3.1 Strict CSV-Only Format
- All JSON export, import, and backup capabilities have been removed.
- All export and restore operations use standard RFC 4180 compliant CSV format.

### 3.2 Mandatory Columns Only
To protect user privacy and eliminate redundant metadata, CSV files contain only mandatory fields:

```csv
Type,Title,StartDate,EndDate,Days,Status
AL,Annual Vacation,2026-06-15,2026-06-19,5,planned
SL,Medical Outpatient,2026-07-02,2026-07-02,1,taken
```

Excluded non-mandatory data:
- Database IDs (`id`)
- Creation timestamps (`createdAt`)
- Internal UI flags

### 3.3 Strict Duplicate Validation on CSV Import
When a CSV is uploaded via **Restore Leave Records (CSV)**:
1. Validates file header and mandatory columns.
2. Performs row-by-row duplicate and overlap checking against current records.
3. Automatically skips identical duplicate records and flags overlapping dates.
4. Alerts the user with the exact count of imported versus blocked duplicate rows.

---

## 4. Comp-Off Ledger Rules

- **Display**: Concise ledger showing available balance, gazetted Saturday holidays with Include/Exclude toggles, and prior cycle carry-over credits.
- **Excluded**: "Record Weekend Work" option has been permanently removed as it does not apply to corporate 5-day work arrangements.

---

## 5. Synchronization & User Settings

- **Sync Location**: Synchronize with MOM Gazette is accessible **only** within the **Settings** screen.
- **Profile Configuration**:
  - Employee ID (`EMP-XXXXXX`)
  - Full Name
  - Profile Picture (Local File Upload, URL input, or Avatar presets)
- **UI Alerts**: Low Leave Balance warning has been removed from the application interface.
