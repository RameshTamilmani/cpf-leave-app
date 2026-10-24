# CutiSG - Singapore MOM Leave & Public Holiday Management System

**CutiSG** is a comprehensive, production-grade Singapore leave management Progressive Web Application (PWA) built strictly in accordance with the **Singapore Ministry of Manpower (MOM) Employment Act (Cap. 91)**.

---

## 🔒 Where is Your Data Stored?

**100% Client-Side & Private Storage**:
- All employee data, leave records, special holidays, and custom preferences are stored **exclusively in your browser's local storage (`localStorage`)** under the `cutisg_*` namespaces (`cutisg_records`, `cutisg_settings`, `cutisg_special_holidays`, `cutisg_manual_compoff`).
- **No external cloud database or server transmission**: Your personal records, joining date, and leave history remain entirely on your device.
- **Offline Capability**: After one successful online installation, the complete production app, fonts, and icons are cached for offline use.
- **Portability & Backups**: You can export and restore all leave records anytime in standard **CSV format** formatted with `DD/MM/YYYY`.

---

## 🇸🇬 Why the Application is Named "CutiSG"

- **"Cuti"** (pronounced *choo-tee*): The Malay word for **leave**, **holiday**, or **vacation**. Malay is the designated **National Language of Singapore** under Article 153A of the Constitution of the Republic of Singapore and is universally used in colloquial and official Singaporean vocabulary (e.g., *"ambil cuti"* = taking leave).
- **"SG"**: The international country code abbreviation for **Singapore**.
- Together, **CutiSG** translates directly to **"Singapore Leave Tracker"** — a localized, culturally resonant, and compliant leave planner designed specifically for employees, HR managers, and professionals working in Singapore.

---

## 🌟 Key Highlights & MOM Statutory Features

### 1. Streamlined Leave Application Workflow
- **Automatic Default Leave Title**: Reason / Leave Title is no longer a mandatory text input. When applying for a leave, CutiSG automatically assigns the standard title based on the selected leave type (`Annual Leave`, `Sick Leave`, or `Comp-off Leave`).
- **Optional Remarks**: An optional **Remarks** field is provided at the bottom of the form for personal notes, handover details, or comments.
- **Standardized `DD/MM/YYYY` Dates**: All dates throughout the application, input fields, date pickers, history logs, and CSV exports adhere to the Singapore standard `DD/MM/YYYY` format.
- **Dual Date Entry**: Every date field supports both direct keyboard entry (`DD/MM/YYYY`) and a one-click native calendar picker overlay that works seamlessly across iOS Safari, Android, and desktop browsers.

### 2. Clean Home Tab & Balance Cards
- **Distraction-Free Visual Cards**: Subheadings inside the balance cards (such as "0 / Annual Leave (12 Days Available)", "Sick Leave (9 / 12 Days Available)", or "Company & ad-hoc holidays") have been removed to present clean, prominent typography with clear numerical balances.
- **Simplified Quick Actions**: Direct shortcuts for **Apply Leave** and **Comp-off Ledger**. Duplicate "View Ledger" buttons and redundant comp-off expiry trackers have been removed from the home tab.
- **Distinct Category Colors**:
  - Annual Leave: Warm Amber / Gold
  - Sick Leave: Emerald Green
  - Comp-off Leave: Deep Teal
  - Loss of Pay (LOP): Rose / Crimson
  - Special Holidays: Royal Purple

### 3. Leave Year Cycle Change & Automatic Reset
- **Leave Cycle Flexibility**: Supports custom leave cycle dates (e.g., 13 June – 12 June, 1 Jan – 31 Dec calendar year, 1 Apr – 31 Mar financial year, or custom recurring intervals).
- **Safety Warning & Reset**: Changing the leave year cycle prompts an explicit confirmation warning. Confirming the change automatically clears all previous leave logs and resets leave balances to default starting entitlements (12 Days Annual Leave, 12 Days Sick Leave).

### 4. Statutory MOM Leave Entitlements & Section 88 Comp-Off
- **Default 12/12 Entitlements**: Initialized with 12 days Annual Leave and 12 days Outpatient Sick Leave.
- **Automatic Saturday Comp-Off (Section 88)**: Whenever a gazetted public holiday falls on a non-working Saturday (e.g., Chinese New Year Day 2, National Day, Deepavali), employees on a 5-day work week are automatically credited +1 day comp-off.
- **Strict 90-Day Validity Rule**: Comp-off leaves must be scheduled on or before the 90-day expiry date from the earned Saturday holiday.

### 5. Independent Reset Controls
- **Reset All Leave Data**: Clears only the logged leave entries and comp-off records while strictly preserving employee profile details (Name, Emp ID, Date of Joining, and photo).
- **Factory Reset**: Restores the entire application, profile settings, custom special holidays, and leave records to initial factory defaults.

### 6. PWABuilder & PWA Standards Compliance
- **Complete Web App Manifest (`manifest.json`)**:
  - `lang`: `"en"`, `dir`: `"ltr"`
  - `display_override`: `["window-controls-overlay", "standalone", "minimal-ui", "browser"]`
  - `launch_handler`: Single instance navigation (`navigate-existing`)
  - `edge_side_panel`: Windows Edge sidebar dockable (`preferred_width: 400`)
  - `share_target`: Native OS share sheet integration
  - `file_handlers`: Open and restore `.csv` and `.json` leave backups
  - `note_taking`: OS quick note action
  - `screenshots`: High-resolution desktop and mobile showcase previews
  - `iarc_rating_id`: Global age classification
- **Standalone Service Worker (`sw.js`)**:
  - Precached production HTML, JavaScript, CSS, fonts, icons, and bundled holiday data.
  - Home greeting banners for weekends, holidays, and work anniversaries; no notification toggle or automatic wish pushes.
  - Push notification listener (`push` and `notificationclick` events).
  - Production-only Service Worker registration in `src/pwa.ts`.
- **In-App Install Prompt**: `PWAInstallButton` component with automatic standalone detection and step-by-step iOS Safari installation instructions.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite + `vite-plugin-pwa`
- **Icons**: Google Material Symbols Outlined
- **Service Worker**: One custom service worker with a build-injected offline asset list
- **Storage**: Client-side browser `localStorage`

---

## 🚀 Development & Build

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Lint & type check
npm run lint

# Build for production
npm run build
```

## Offline updates and deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel settings, migration from the old worker, approval-based updates, and verification.


## Profile and calendar

Employee profiles include a required department (maximum 25 characters), shown on Home. AL, SL, and comp-off cards show remaining/total balances. The calendar lists the displayed month’s holidays and leave history, excluding weekend leave dates while retaining weekend public holidays and observed dates.


## Official holidays and updates

The Vercel API at /api/holidays reads the official MOM consolidated dataset on data.gov.sg. The app refreshes while online (at most every six hours automatically), saves successful results locally, and retains built-in holidays if the source is unavailable. An additional Refresh holidays action is available in Settings. This follows dataset publication, not every government announcement in real time. Special Holiday counts refer to the active leave cycle and include official special declarations plus non-conflicting manual entries. Existing manual entries on already-known public-holiday dates remain removable in Settings but do not add a second calendar entry or count.

Settings > App updates > Check for updates bypasses the Later snooze. Updates are offered only when their offline assets are ready. Offline checks can reopen an already downloaded update; checking for a new download needs internet.


## Employee profile setup and tenure accents

Initial setup requires full name, numeric employee ID, department, and a valid non-future joining date. The photo remains optional. Previously skipped or incomplete profiles must finish setup; existing complete profiles are kept. Settings uses the same required-field checks. The profile card has a compact ID badge with a thin red outline, separate Joined and Experience columns, and matching tenure colors on the photo ring, verification mark, ID badge, and Experience text: green below one year, blue from the first anniversary through the second anniversary, and gold after the second anniversary. Leap-day anniversaries use the last valid day of February.

