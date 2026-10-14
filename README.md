# CutiSG - Singapore MOM Leave & Public Holiday Management System

**CutiSG** is a comprehensive, production-grade Singapore leave management web application built strictly in accordance with the **Singapore Ministry of Manpower (MOM) Employment Act (Cap. 91)**.

---

## 🇸🇬 Why the Application is Named "CutiSG"

- **"Cuti"** (pronounced *choo-tee*): The Malay word for **leave**, **holiday**, or **vacation**. Malay is the designated **National Language of Singapore** under Article 153A of the Constitution of the Republic of Singapore and is universally used in colloquial and official Singaporean vocabulary (e.g., *"ambil cuti"* = taking leave).
- **"SG"**: The international country code abbreviation for **Singapore**.
- Together, **CutiSG** translates directly to **"Singapore Leave Tracker"** — a localized, culturally resonant, and compliant leave planner designed specifically for employees, HR managers, and professionals working in Singapore.

---

## 🌟 Key Highlights & MOM Statutory Features

### 1. Default Leave Entitlement (12/12 Days)
- **12 Days Annual Leave (AL) / 12 Days Statutory Default**: Standardized at 12/12 days default entitlement.
- **12 Days Outpatient Sick Leave (OSL) / 12 Days Default**: Initialized to 12 days default entitlement, fully customizable in Settings.
- **Clean Profile Initialization**: Employee Name and Employee ID fields start empty without predefined dummy values.
- **Informational Leave Balances**: Annual Leave, Sick Leave, and Comp-off balance cards display active cycle quotas (`12/12 Days Available`). Leave submissions and modifications are strictly restricted to the official **Apply Leave** workflow to eliminate accidental edits and ensure data integrity.

### 2. Year-Over-Year Automatic SG Leave Policy Updates
- Built-in multi-year database of Singapore gazetted public holidays covering **2025, 2026, 2027, and 2028**.
- Automatically adapts year-over-year according to Ministry of Manpower gazetted dates.
- Seamlessly calculates working days and non-working days without requiring external network dependencies (full offline cache support).

### 3. Strict Date Range & "Days to Deduct" Validation Logic
- **Exact Date-to-Deduction Match**: The "Days to Deduct" value strictly reflects the selected date range:
  - If **5 working days** are selected in the date picker, the system allows deducting **only 5.0 days or 4.5 days** (for half-day adjustments). Any value less or greater is blocked.
  - Selecting **0.5 days** is strictly allowed **only if the start date and end date are the same**.
  - Date ranges containing 0 working days (e.g. weekends or gazetted public holidays) require no leave deduction.
- **Duplicate & Overlap Protection**: Detects and blocks booking overlapping leaves on already scheduled or taken dates.

### 4. Concise Comp-Off Ledger (MOM Section 88)
- **Automatic Saturday Public Holiday Off-In-Lieu**: When a gazetted public holiday falls on a non-working Saturday (e.g., Chinese New Year Day 2, National Day, Deepavali), employees on a 5-day work week are legally entitled to either a day off-in-lieu or an extra day's pay under Employment Act Section 88.
- **Cleaned-up Ledger**: Displays the available comp-off balance, Saturday holidays with quick Include/Exclude toggles, and prior cycle carry-over credits without overwhelming tables.
- **Removed Irrelevant Features**: The non-applicable "Record Weekend Work" option has been completely removed.

### 5. Settings-Exclusive Sync & Employee Profile
- **Sync in Settings Only**: The manual synchronization action with Singapore MOM gazette / data.gov.sg is housed exclusively in the **Settings** screen, preventing accidental triggers from the dashboard or header.
- **Profile Picture & Employee ID**:
  - Direct local photo upload (JPG/PNG/WebP under 2MB).
  - External image URL support.
  - Instant avatar preset selection.
  - Dedicated **Employee ID** (`EMP-XXXXXX`) and full employee name configuration.

### 6. Clean CSV-Only Data Management & Restore
- **Mandatory Data Only**: CSV export and import contain strictly essential columns (`Type`, `Title`, `StartDate`, `EndDate`, `Days`, `Status`).
- **No Unnecessary Metadata**: Internal IDs, timestamps, and redundant fields are excluded.
- **Strict Duplicate Validation on Import**: Automatically detects duplicate or conflicting leaves during CSV restoration and rejects double-bookings.
- **No JSON Clutter**: JSON backup and restore options have been eliminated in favor of universal, audit-friendly CSV format.
- **Streamlined UI**: Removed the Low Leave Balance warning and legacy Medical Certificate reference number inputs.

### 7. Progressive Web App (PWA) & Offline Capabilities
- **Standards Compliant Web App Manifest**: Full Web App Manifest (`manifest.json`) with standalone display mode, orientation locking, and quick shortcuts.
- **In-App Installation Prompt**: Built-in `PWAInstallButton` mounted in both the Header and Settings screen, providing seamless installation on Chromium/Android and step-by-step guidance for iOS Safari users.
- **Offline Service Worker Caching**: Powered by Workbox to cache application code, typography, and Singapore public holiday databases for offline access.
- **Network Connectivity Indicator**: Built-in `OfflineIndicator` toast that surfaces when the user is disconnected, confirming cached MOM holiday and leave data remain active.
- **Comprehensive Icon Suite**: Features standard 192x192, 512x512 PNG icons, 180x180 Apple Touch Icon, and 512x512 maskable icon with safe zone margins.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS (Material Design 3 tonal architecture & system tokens)
- **Build Tool**: Vite
- **Icons**: Google Material Symbols Outlined
- **State & Storage**: React Context (`LeaveContext`) with persistent `localStorage` serialization
- **Policy Engine**: In-memory Singapore statutory calendar calculations (`calculateWorkingDays`, `getPublicHolidayForDate`, MOM Section 88 engine)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Installation
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

### Production Build
```bash
npm run build
```

---

## 📋 Singapore MOM Employment Act Reference Summary

| Provision | Statutory Rule | CutiSG Implementation |
| :--- | :--- | :--- |
| **Annual Leave** | Min 7–14 days based on years of service | Default 12/12 days with customizable entitlement in Settings |
| **Outpatient Sick Leave** | Up to 14 days per year (after 6 months service) | Default 12/12 days with customizable entitlement in Settings |
| **Sunday Public Holiday** | Next working day (Monday) is a paid public holiday | Automatic Monday observation |
| **Saturday Public Holiday** | Day off-in-lieu or credit for 5-day work week | Automatic +1 Comp-Off calculation per MOM Sec 88 |
| **Comp-Off Validity** | Typically within 90 days / active cycle | 90-day tracking window with cycle rollover options |
