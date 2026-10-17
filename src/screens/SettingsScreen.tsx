import React, { useRef, useState, useEffect } from 'react';
import { useLeave } from '../context/LeaveContext';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { AboutModal } from '../components/AboutModal';
import { formatDateDDMMYYYY } from '../data/singaporeHolidays2026';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    records,
    updateSettings,
    exportCSV,
    restoreCSV,
    resetAllData,
    setIsEditCycleModalOpen,
    setIsAddSpecialHolidayOpen,
    autoCompOffEarned,
    cycleStartDateStr,
    cycleEndDateStr,
    specialHolidays,
    deleteSpecialHoliday,
    showToast
  } = useLeave();

  // Local draft state for Employee Profile
  const [draftName, setDraftName] = useState(settings.userName || '');
  const [draftEmpId, setDraftEmpId] = useState(settings.employeeId || '');
  const [draftAvatar, setDraftAvatar] = useState(settings.avatarUrl || '');
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Modals state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Sync draft state if settings change outside
  useEffect(() => {
    setDraftName(settings.userName || '');
    setDraftEmpId(settings.employeeId || '');
    setDraftAvatar(settings.avatarUrl || '');
  }, [settings.userName, settings.employeeId, settings.avatarUrl]);

  // Check if profile was modified
  const isProfileModified =
    draftName !== (settings.userName || '') ||
    draftEmpId !== (settings.employeeId || '') ||
    draftAvatar !== (settings.avatarUrl || '');

  const handleSaveProfile = () => {
    updateSettings({
      userName: draftName.trim(),
      employeeId: draftEmpId.trim(),
      avatarUrl: draftAvatar
    });
    setIsSavedFeedback(true);
    showToast('Profile updated and saved successfully!');
    setTimeout(() => {
      setIsSavedFeedback(false);
    }, 3000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit up to 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast('Profile photo must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setDraftAvatar(dataUrl);
        showToast('Photo selected. Press Save to confirm changes.');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        restoreCSV(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const activeYearSpan = `${cycleStartDateStr.slice(0, 4)}–${cycleEndDateStr.slice(0, 4)}`;

  return (
    <div className="flex flex-col w-full px-margin space-y-space-md max-w-xl mx-auto pb-8">
      {/* 1. Employee Profile & Identity Configuration */}
      <section className="space-y-space-xs">
        <div className="px-1 flex items-center justify-between">
          <h2 className="font-title-sm text-title-sm text-on-surface-variant tracking-wider uppercase font-semibold">
            Employee Profile
          </h2>
          <span className="font-label-sm text-label-sm text-primary font-semibold">
            {activeYearSpan}
          </span>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest p-space-md shadow-xs border border-surface-container space-y-space-md">
          {/* Avatar & Photo Upload (Up to 5MB, No URL field) */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0 mt-1">
              {draftAvatar ? (
                <img
                  src={draftAvatar}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-fixed flex items-center justify-center font-bold text-2xl shadow-xs">
                  {(draftName || 'E').slice(0, 1).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xs hover:opacity-90 cursor-pointer transition-transform active:scale-95"
                title="Upload Photo File (Up to 5MB)"
              >
                <span className="material-symbols-outlined text-[14px]">photo_camera</span>
              </button>
            </div>

            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              <span className="font-title-sm text-title-sm font-semibold text-on-surface">
                Profile Picture
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="px-3 py-1 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:opacity-95 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[14px]">upload</span>
                  <span>Upload Photo</span>
                </button>
                {draftAvatar && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftAvatar('');
                      showToast('Photo removed. Press Save to confirm.');
                    }}
                    className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                )}
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <span className="text-[11px] text-on-surface-variant">Allowed file size up to 5MB</span>
            </div>
          </div>

          <div className="h-[1px] bg-surface-container" />

          {/* Employee ID & Name Inputs (No suggestions like 'Ramesh') */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
                EMPLOYEE ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={draftEmpId}
                  onChange={(e) => setDraftEmpId(e.target.value)}
                  placeholder="Enter Employee ID"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface font-mono font-medium text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[18px] text-on-surface-variant">
                  badge
                </span>
              </div>
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
                FULL NAME
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface font-medium text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[18px] text-on-surface-variant">
                  person
                </span>
              </div>
            </div>
          </div>

          {/* Save Profile Button - Enabled after modifying name, emp ID, or profile pic */}
          <div className="pt-1">
            <button
              type="button"
              disabled={!isProfileModified}
              onClick={handleSaveProfile}
              className={`w-full py-2.5 px-4 rounded-xl font-label-md text-label-md font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isProfileModified
                  ? 'bg-primary text-on-primary hover:opacity-95 active:scale-98 shadow-xs ring-2 ring-primary/30'
                  : isSavedFeedback
                  ? 'bg-leave-compoff-container text-leave-compoff font-bold border border-leave-compoff/30'
                  : 'bg-surface-container text-on-surface-variant opacity-60 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isSavedFeedback ? 'check_circle' : 'save'}
              </span>
              <span>
                {isSavedFeedback
                  ? '✓ Profile Changes Saved'
                  : isProfileModified
                  ? 'Save Profile Changes'
                  : 'Profile Saved'}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Leave Entitlements (Default statutory 12 days Annual Leave, 12 days Sick Leave - non-modifiable) */}
      <section className="space-y-space-xs">
        <div className="px-1 flex items-center justify-between">
          <h2 className="font-title-sm text-title-sm text-on-surface-variant tracking-wider uppercase font-semibold">
            Leave Entitlements
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Default Statutory</span>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-xs border border-surface-container space-y-space-md">
          {/* Annual Leave Item (Consistent beach_access icon) */}
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-leave-annual-container text-leave-annual-on-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  beach_access
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">Annual Leave</p>
              </div>
            </div>
            <div className="flex items-center px-3 py-1 rounded-full bg-surface-container-low border border-surface-container shrink-0">
              <span className="font-title-md text-title-md text-on-surface font-bold">12</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant ml-1 font-medium">Days</span>
            </div>
          </div>

          <div className="h-[1px] bg-surface-container" />

          {/* Sick Leave Item (Consistent medical_services icon) */}
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-leave-sick-container text-leave-sick-on-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  medical_services
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">Sick Leave</p>
              </div>
            </div>
            <div className="flex items-center px-3 py-1 rounded-full bg-surface-container-low border border-surface-container shrink-0">
              <span className="font-title-md text-title-md text-on-surface font-bold">12</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant ml-1 font-medium">Days</span>
            </div>
          </div>

          <div className="h-[1px] bg-surface-container" />

          {/* Leave Year Cycle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">event_repeat</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-title-sm text-title-sm text-on-surface font-semibold">Leave Year Cycle</p>
                  {autoCompOffEarned > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-leave-compoff-container text-leave-compoff">
                      +{autoCompOffEarned} Comp-off
                    </span>
                  )}
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {settings.cycle} ({formatDateDDMMYYYY(cycleStartDateStr)} to {formatDateDDMMYYYY(cycleEndDateStr)})
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEditCycleModalOpen(true)}
              className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <span>Change</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Special Holidays (Rare Cases) - Kept exactly one button */}
      <section className="space-y-space-xs">
        <div className="px-1 flex items-center justify-between">
          <h2 className="font-title-sm text-title-sm text-on-surface-variant tracking-wider uppercase font-semibold">
            Special Holidays (Rare Cases)
          </h2>
          <button
            onClick={() => setIsAddSpecialHolidayOpen(true)}
            className="font-label-sm text-label-sm text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Add Special Holiday</span>
          </button>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-xs border border-surface-container space-y-space-sm">
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
            Add rare non-scheduled public holidays, such as Singapore Polling Day declarations or special company off-days.
          </p>

          {specialHolidays.length > 0 ? (
            <div className="flex flex-col gap-2 pt-1">
              {specialHolidays.map((sh) => (
                <div
                  key={sh.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-surface-container"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{sh.emoji || '🗳️'}</span>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-title-sm text-title-sm font-semibold text-on-surface">
                          {sh.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary-fixed text-on-primary-fixed">
                          {sh.category === 'gazetted_adhoc' ? 'Ad-Hoc' : sh.category === 'national' ? 'National' : 'Company'}
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {sh.dayOfWeek}, {formatDateDDMMYYYY(sh.date)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSpecialHoliday(sh.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error-container transition-colors cursor-pointer"
                    title="Remove this special holiday"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-surface-container-low text-center flex flex-col items-center gap-1">
              <span className="text-on-surface-variant font-label-md text-label-md">No custom special holidays added</span>
            </div>
          )}
        </div>
      </section>

      {/* 4. Alerts & Reminders */}
      <section className="space-y-space-xs">
        <div className="px-1 flex items-center justify-between">
          <h2 className="font-title-sm text-title-sm text-on-surface-variant tracking-wider uppercase font-semibold">
            Alerts &amp; Reminders
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Notifications</span>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-xs border border-surface-container space-y-space-md">
          {/* Toggle 1: Public Holiday Alerts */}
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">campaign</span>
              </div>
              <div className="min-w-0">
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">Public Holiday Alerts</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Notify 3 days before upcoming gazetted holiday</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.phAlertsEnabled}
                onChange={(e) => {
                  updateSettings({ phAlertsEnabled: e.target.checked });
                  showToast(e.target.checked ? 'Public holiday alerts enabled' : 'Public holiday alerts disabled');
                }}
                className="sr-only peer"
              />
              <div className="w-12 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          <div className="h-[1px] bg-surface-container" />

          {/* Toggle 2: Comp-off Expiry Alerts */}
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-alert-warning-container text-alert-warning flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">notification_important</span>
              </div>
              <div className="min-w-0">
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">Comp-off Expiry Alerts</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Nudge prior to lapse</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.expiryAlertsEnabled}
                onChange={(e) => {
                  updateSettings({ expiryAlertsEnabled: e.target.checked });
                  showToast(e.target.checked ? 'Expiry alerts enabled' : 'Expiry alerts disabled');
                }}
                className="sr-only peer"
              />
              <div className="w-12 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
        </div>
      </section>

      {/* 5. Data Management */}
      <section className="space-y-space-xs">
        <div className="px-1 flex items-center justify-between">
          <h2 className="font-title-sm text-title-sm text-on-surface-variant tracking-wider uppercase font-semibold">
            Data Management
          </h2>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-xs border border-surface-container space-y-sm">
          {/* Export Records */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">download</span>
              </div>
              <div>
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">Export Leave Records</p>
              </div>
            </div>
            <button
              onClick={exportCSV}
              disabled={records.length === 0}
              className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md font-semibold transition-all shadow-2xs shrink-0 ${
                records.length > 0
                  ? 'bg-primary text-on-primary hover:opacity-95 active:scale-95 cursor-pointer'
                  : 'bg-surface-container text-on-surface-variant/40 cursor-not-allowed opacity-50 pointer-events-none'
              }`}
              title={records.length > 0 ? 'Export records to CSV' : 'No records available to export'}
            >
              Export
            </button>
          </div>

          <div className="h-[1px] bg-surface-container" />

          {/* Restore Records */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">upload_file</span>
              </div>
              <div>
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">Restore Leave Records</p>
              </div>
            </div>
            <button
              onClick={() => csvInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-md text-label-md font-semibold hover:bg-primary-fixed-dim transition-colors cursor-pointer shrink-0"
            >
              Restore
            </button>
            <input
              type="file"
              ref={csvInputRef}
              onChange={handleCsvUpload}
              accept=".csv"
              className="hidden"
            />
          </div>

          <div className="h-[1px] bg-surface-container" />

          {/* Destructive Action: Reset */}
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="w-full flex items-center justify-between py-2 text-left group cursor-pointer"
          >
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-lg bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">delete_forever</span>
              </div>
              <div>
                <p className="font-title-sm text-title-sm text-error font-semibold">Reset All Leave Data</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Erase leave logs and reset balances to default 12 AL &amp; 12 SL
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-error text-[20px]">warning</span>
          </button>
        </div>
      </section>

      {/* 6. Install PWA */}
      <section className="space-y-space-xs">
        <div className="px-1 flex items-center justify-between">
          <h2 className="font-title-sm text-title-sm text-on-surface-variant tracking-wider uppercase font-semibold">
            Install App &amp; Offline PWA
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Home Screen</span>
        </div>
        <PWAInstallButton variant="card" />
      </section>

      {/* 7. About CutiSG - Separate Button opening modal */}
      <section className="pt-1">
        <button
          type="button"
          onClick={() => setIsAboutModalOpen(true)}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-container-lowest border border-surface-container hover:bg-surface-container transition-all cursor-pointer text-left shadow-xs active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-fixed flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">info</span>
            </div>
            <div>
              <p className="font-title-sm text-title-sm text-on-surface font-semibold">About CutiSG</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Origin of CutiSG &amp; Singapore leave policy details
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-[22px]">chevron_right</span>
        </button>
      </section>

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsResetModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-surface-card rounded-2xl shadow-2xl p-5 border border-surface-container flex flex-col gap-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px] text-error">warning</span>
            </div>

            <div>
              <h3 className="font-title-md text-title-md font-bold text-on-surface">
                Reset All Leave Data?
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
                This will erase all logged Annual Leave and Sick Leave requests, reset your calendar, and restore balances back to the initial default entitlements (12 days AL, 12 days SL).
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 py-2.5 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-variant transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllData();
                  setIsResetModalOpen(false);
                }}
                className="flex-1 py-2.5 rounded-full bg-error text-on-error font-label-md text-label-md font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
