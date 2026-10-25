# CutiSG - Singapore MOM Leave & Public Holiday Management System (v1.0.0)

**CutiSG** is a comprehensive, production-grade Singapore personal leave management Progressive Web Application (PWA) built strictly in accordance with the **Singapore Ministry of Manpower (MOM) Employment Act (Cap. 91)**.

---

## 🔒 Where is Your Data Stored?

**100% Client-Side & Private Storage**:
- All employee data, leave records, special holidays, and custom preferences are stored **exclusively in your browser's local storage (`localStorage`)** under the `cutisg_*` namespaces (`cutisg_records`, `cutisg_settings`, `cutisg_special_holidays`, `cutisg_manual_compoff`).
- **Zero external cloud transmission**: Your personal records, employee ID, joining date, and leave history remain entirely on your device.
- **Offline Reliability**: After one successful online load, the complete production app, fonts, and icons are cached by the Service Worker for offline use.
- **Portability & Backups**: You can export and restore all leave records anytime in standard **CSV format** formatted with Singapore standard `DD/MM/YYYY`.

---

## 🇸🇬 Why the Application is Named "CutiSG"

- **"Cuti"** (pronounced *choo-tee*): The Malay word for **leave**, **holiday**, or **vacation**. Malay is the designated **National Language of Singapore** under Article 153A of the Constitution of the Republic of Singapore and is universally used in colloquial and workplace vocabulary (e.g., *"ambil cuti"* = taking leave).
- **"SG"**: The international country code abbreviation for **Singapore**.
- Together, **CutiSG** translates directly to **"Singapore Leave Tracker"** — a localized, culturally resonant, and statutory-compliant leave planner designed specifically for employees and professionals working in Singapore.

---

## 🌟 Key Highlights & Current Features (v1.0.0)

### 1. Executive Employee Profile & Tenure Styling
- **Mandatory Profile Setup**: Name (up to 40 characters), numeric Employee ID (up to 12 digits), Department (up to 25 characters), and Date of Joining (non-future date). Photo upload is optional and supports square cropping up to 8MB.
- **Theme-Adaptive Department Badge**: Styled in a distinctive violet/indigo badge that dynamically adapts across light and dark modes.
- **Tenure Tier Accents**: Dynamic color based on length of service applies strictly to the **photo circle ring**, **verification tick mark**, and **EMP ID badge** (no red outline):
  - *Tier 1 (Green)*: Under 1 year of service.
  - *Tier 2 (Blue)*: 1 to 2 years of service.
  - *Tier 3 (Gold)*: Over 2 years of service.
- **Unified Joined & Experience Styling**: Both Joined and Experience labels share an elegant teal color (`text-teal-700 dark:text-teal-400`), while their values are rendered in high-legibility bold text (`text-on-surface font-semibold`).

### 2. Clean Home Screen & Uniform Leave Balances
- **Uniform Balance Typography**: All 5 leave cards (**Annual Leave**, **Sick Leave**, **Comp-off Leave**, **Loss of Pay (LOP)**, and **Special Holidays**) maintain the exact same `text-lg font-bold` font size and vertical baseline across numerators and denominators (`11/12`, `12/12`, `0/1`, `0`, `0`).
- **Static Celebration Greetings**: Celebrations and work anniversaries appear as a non-intrusive, warm greeting ribbon directly on the Home Screen without disruptive pop-up windows.
- **Distinct Category Colors**:
  - Annual Leave: Warm Amber / Gold
  - Sick Leave: Emerald Green (standardized as Sick Leave across all screens)
  - Comp-off Leave: Deep Teal
  - Loss of Pay (LOP): Rose / Crimson
  - Special Holidays: Royal Purple
- **Direct Shortcuts**: Quick actions include **Leave History** and **Comp-off Ledger**.

### 3. Streamlined Monthly Calendar
- **Uncluttered Grid**: Removed redundant color legend strips and single-day employment rule boxes.
- **Monthly Holidays & Leave History**: Displays a dedicated breakdown below the calendar for the viewed month, showcasing all public holidays, special declarations, and leaves taken (strictly excluding non-working weekend days).

### 4. Device-Smart PWA Installation
- **Google Chrome on Android**: Early `beforeinstallprompt` capture triggers 1-tap direct automatic installation with zero intermediary modals.
- **Samsung Browser & Non-Chrome Android**: Intelligent detection provides a 1-tap **"Open in Google Chrome"** intent button for direct installation, a **"Copy Link"** button, and native Samsung Internet steps (Menu ☰ → Add page to → Home screen).
- **iPhone / iOS Safari**: Tailored 3-step guide detailing the Apple Share button `[⎋]` → **Add to Home Screen** action.
- **Overscroll Lock**: Suppressed browser pull-to-refresh gestures to ensure a native mobile app feel.

### 5. Reliable App Updates (v1.0.0)
- **Positioning**: The **App Updates** card is positioned directly above the **About CutiSG** button in Settings.
- **Clear Status Modals**:
  - Clicking **"Check for updates"** when already up-to-date opens a dedicated, prominent **"You're Up to Date"** confirmation dialog (`UpToDateModal`) with a green verified badge.
  - When a new version is detected, `UpdateAvailableModal` displays what's new, offering **Update Now** and a 6-hour **Later** snooze option.

### 6. Statutory MOM Leave Entitlements & Section 88 Comp-Off
- **Standard Entitlements**: 12 days Annual Leave and 12 days Sick Leave per leave year cycle.
- **Automatic Saturday Comp-Off (Section 88)**: Gazetted public holidays falling on a non-working Saturday automatically credit +1 day comp-off to the active cycle with 90-day validity tracking.
- **Streamlined Special Holidays Dialog**: Minimalist form requiring only Holiday Name and Date Picker. Strictly prohibits applying special holidays for weekends (Saturday or Sunday) as weekends are already statutory non-working rest days.
- **MOM Dataset Synchronization**: Background dataset sync details and official data.gov.sg source links are organized cleanly inside the **About CutiSG** dialog.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite + `vite-plugin-pwa`
- **Icons**: Google Material Symbols Outlined
- **Service Worker**: Custom offline service worker with precached application shell
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

## Reproducible deployment and updates

Use npm ci --include=dev with the committed package-lock.json. Deploy a new commit containing the repaired lockfile; retrying an old failed commit cannot pick up local changes. See DEPLOYMENT.md for clean-install validation and Vercel settings. Updates are downloaded completely before they are offered, require Update Now approval, and preserve the approved offline release when postponed or when a check fails.

Modal dialogs lock background scrolling while keeping their own content scrollable. The Comp-Off Ledger separates credited credits from upcoming holidays. Use npm run test:modals after a build to check these interactions.



## App version

The app version is defined in package.json. Settings, About CutiSG, update dialogs, the service worker, and generated version.json use the same bundled release metadata. Run npm version patch --no-git-tag-version (or minor/major) to update the package and lockfile; the version lifecycle script synchronizes public/version.json and README version labels. Edit release notes in public/version.json. Rebuild and deploy to publish a version change.

Update notes are written for each release in public/version.json. After changing the app and its plain-language highlights, run npm run release:notes before building. See DEPLOYMENT.md for the release checklist.
