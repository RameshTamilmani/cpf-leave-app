import { useModalScrollLock } from '../hooks/useModalScrollLock';
import React, { useRef, useState, useEffect } from 'react';
import { useLeave } from '../context/LeaveContext';
import { AboutModal } from '../components/AboutModal';
import { ImageCropModal } from '../components/ImageCropModal';
import { calculateExperience, isValidISODate, formatDateDDMMYYYY } from '../data/singaporeHolidays2026';
import { profileError } from '../utils/profile';
import { DatePickerField } from '../components/DatePickerField';

interface SettingsScreenProps { onCheckForUpdate: () => Promise<void>; isCheckingUpdate: boolean; currentVersion: string; }
export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onCheckForUpdate, isCheckingUpdate, currentVersion }) => {
  const {
    settings,
    records,
    updateSettings,
    exportCSV,
    restoreCSV,
    resetAllData,
    resetEntireAppToDefaults,
    setIsEditCycleModalOpen,
    setIsAddSpecialHolidayOpen,
    autoCompOffEarned,
    cycleStartDateStr,
    cycleEndDateStr,
    customSpecialHolidays,
    officialSpecialHolidays,
    conflictingSpecialHolidayIds,
    holidaySync,
    deleteSpecialHoliday,
    todayDateStr,
    showToast,
  } = useLeave();

  const listedSpecialHolidays = [...officialSpecialHolidays, ...customSpecialHolidays];

  // Local draft state for Employee Profile
  const [draftName, setDraftName] = useState(settings.userName || '');
  const [draftEmpId, setDraftEmpId] = useState(settings.employeeId || '');
  const [draftDepartment, setDraftDepartment] = useState(settings.department || '');
  const [draftAvatar, setDraftAvatar] = useState(settings.avatarUrl || '');
  const [draftDoj, setDraftDoj] = useState(settings.dateOfJoining || '');
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Modals state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isFactoryResetModalOpen, setIsFactoryResetModalOpen] = useState(false);
  useModalScrollLock(isResetModalOpen || isFactoryResetModalOpen);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [cropModalSrc, setCropModalSrc] = useState<string | null>(null);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Sync draft state if settings change outside
  useEffect(() => {
    setDraftName(settings.userName || '');
    setDraftEmpId(settings.employeeId || '');
    setDraftDepartment(settings.department || '');
    setDraftAvatar(settings.avatarUrl || '');
    setDraftDoj(settings.dateOfJoining || '');
  }, [settings.userName, settings.employeeId, settings.department, settings.avatarUrl, settings.dateOfJoining]);

  // Check if profile was modified
  const isProfileModified =
    draftName !== (settings.userName || '') ||
    draftEmpId !== (settings.employeeId || '') ||
    draftDepartment !== (settings.department || '') ||
    draftAvatar !== (settings.avatarUrl || '') ||
    draftDoj !== (settings.dateOfJoining || '');

  const handleSaveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    const error = profileError({ userName: draftName, employeeId: draftEmpId, department: draftDepartment, dateOfJoining: draftDoj }, todayDateStr);
    if (error) { showToast(error); return; }
    updateSettings({
      userName: draftName.trim(),
      employeeId: draftEmpId.trim(),
      department: draftDepartment.trim().slice(0, 25),
      avatarUrl: draftAvatar,
      dateOfJoining: draftDoj.trim()
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

    // Limit up to 8MB
    if (file.size > 8 * 1024 * 1024) {
      showToast('Profile photo must be under 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCropModalSrc(dataUrl);
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

        <form onSubmit={handleSaveProfile} className="rounded-2xl bg-surface-container-lowest p-space-md shadow-xs border border-surface-container space-y-space-md">
          {/* Avatar & Photo Upload (Up to 8MB with Crop & Adjustments) */}
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
                title="Upload Photo File (Up to 8MB)"
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
                    onClick={() => setCropModalSrc(draftAvatar)}
                    className="px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold hover:bg-surface-container-high transition-colors cursor-pointer flex items-center gap-1 shadow-2xs border border-surface-container"
                    title="Crop or adjust current profile photo"
                  >
                    <span className="material-symbols-outlined text-[14px]">crop</span>
                    <span>Adjust &amp; Crop</span>
                  </button>
                )}
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
            </div>
          </div>

          <div className="h-[1px] bg-surface-container" />

          {/* Employee ID, Name & Date of Joining Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
                EMPLOYEE ID
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
                  badge
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={12}
                  required
                  aria-label="Employee ID"
                  value={draftEmpId}
                  onKeyDown={(e) => {
                    // Allow navigation and edit controls
                    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) || e.ctrlKey || e.metaKey) {
                      return;
                    }
                    // Block non-numeric characters
                    if (!/^[0-9]$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const numbersOnly = e.target.value.replace(/\D/g, '').slice(0, 12);
                    setDraftEmpId(numbersOnly);
                  }}
                  placeholder="e.g. 10245"
                  className="w-full pl-9 pr-3.5 py-2 h-10 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface font-mono font-medium text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
                FULL NAME
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
                  person
                </span>
                <input
                  type="text"
                  maxLength={40}
                  required
                  aria-label="Full name"
                  value={draftName}
                  onKeyDown={(e) => {
                    // Block numeric keys (0-9)
                    if (/^[0-9]$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const stringOnly = e.target.value.replace(/[0-9]/g, '').slice(0, 40);
                    setDraftName(stringOnly);
                  }}
                  placeholder="Enter full name"
                  className="w-full pl-9 pr-3.5 py-2 h-10 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface font-medium text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="department" className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
                DEPARTMENT
              </label>
              <div className="relative flex items-center">
                <span aria-hidden="true" className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">business</span>
                <input id="department" type="text" required maxLength={25} value={draftDepartment}
                  onChange={(event) => setDraftDepartment(event.target.value.slice(0, 25))}
                  placeholder="Enter department"
                  className="w-full pl-9 pr-3.5 py-2 h-10 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface font-medium text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>

            <div>
              <DatePickerField
                required
                label="DATE OF JOINING"
                value={draftDoj}
                onChange={setDraftDoj}
                max={isValidISODate(todayDateStr) ? todayDateStr : undefined}
                ariaLabel="Choose Date of Joining"
              />
            </div>
          </div>

          {/* Save Profile Button - Enabled after modifying name, emp ID, or profile pic */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={!isProfileModified}
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
        </form>
      </section>

      {/* 2. Leave Year Cycle */}
      <section className="space-y-space-xs">
        <div className="px-1 flex items-center justify-between">
          <h2 className="font-title-sm text-title-sm text-on-surface-variant tracking-wider uppercase font-semibold">
            Leave Year Cycle
          </h2>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-xs border border-surface-container">
          <div className="flex items-center justify-between gap-space-sm">
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
              className="px-3.5 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed-dim font-label-md text-label-md font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <span>Change</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Special Holidays - Kept exactly one button */}
      <section className="space-y-space-xs">
        <div className="px-1 flex items-center justify-between">
          <h2 className="font-title-sm text-title-sm text-on-surface-variant tracking-wider uppercase font-semibold">
            Special Holidays
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
          {listedSpecialHolidays.length > 0 ? (
            <div className="flex flex-col gap-2">
              {listedSpecialHolidays.map((sh) => (
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
                          {sh.source === 'official' ? 'MOM · Auto' : 'Manual'}
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {sh.dayOfWeek}, {formatDateDDMMYYYY(sh.date)}
                      </span>
                      {conflictingSpecialHolidayIds.includes(sh.id) && <p className="text-xs text-on-surface-variant mt-1">Already a public holiday. Not counted twice; you can remove this manual entry.</p>}
                    </div>
                  </div>
                  {sh.source !== 'official' && <button
                    onClick={() => deleteSpecialHoliday(sh.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error-container transition-colors cursor-pointer"
                    title="Remove this special holiday"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-surface-container-low text-center flex flex-col items-center gap-1">
              <span className="text-on-surface-variant font-label-md text-label-md">No special holidays in the current leave cycle.</span>
            </div>
          )}
        </div>
      </section>

      {/* 5. Appearance & Theme */}
      <section className="space-y-space-xs">
        <div className="px-1 flex items-center justify-between">
          <h2 className="font-title-sm text-title-sm text-on-surface-variant tracking-wider uppercase font-semibold">
            Appearance &amp; Theme
          </h2>
          <span className="font-label-sm text-label-sm text-primary font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">
              {(settings.theme || 'light') === 'dark' ? 'dark_mode' : (settings.theme || 'light') === 'system' ? 'settings_brightness' : 'light_mode'}
            </span>
            <span className="capitalize">{(settings.theme || 'light')}</span>
          </span>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest p-space-md shadow-xs border border-surface-container space-y-3.5">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Choose your preferred color theme or match your device system settings automatically.
          </p>

          {/* Theme Selector 3-Option Card Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Light Mode */}
            <button
              type="button"
              onClick={() => {
                updateSettings({ theme: 'light' });
                showToast('Switched to Light theme');
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer relative ${
                (settings.theme || 'light') === 'light'
                  ? 'bg-primary/10 border-primary text-primary shadow-xs ring-1 ring-primary/40'
                  : 'bg-surface-container-low border-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              {(settings.theme || 'light') === 'light' && (
                <span className="absolute top-1.5 right-1.5 material-symbols-outlined text-primary text-[16px]">
                  check_circle
                </span>
              )}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 ${
                (settings.theme || 'light') === 'light' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
              }`}>
                <span className="material-symbols-outlined text-[20px]">light_mode</span>
              </div>
              <span className="font-title-sm text-title-sm font-semibold text-on-surface text-xs sm:text-sm">
                Light
              </span>
              <span className="font-label-sm text-[10px] text-on-surface-variant mt-0.5">
                Crisp &amp; clear
              </span>
            </button>

            {/* Dark Mode */}
            <button
              type="button"
              onClick={() => {
                updateSettings({ theme: 'dark' });
                showToast('Switched to Dark theme');
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer relative ${
                settings.theme === 'dark'
                  ? 'bg-primary/10 border-primary text-primary shadow-xs ring-1 ring-primary/40'
                  : 'bg-surface-container-low border-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              {settings.theme === 'dark' && (
                <span className="absolute top-1.5 right-1.5 material-symbols-outlined text-primary text-[16px]">
                  check_circle
                </span>
              )}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 ${
                settings.theme === 'dark' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
              }`}>
                <span className="material-symbols-outlined text-[20px]">dark_mode</span>
              </div>
              <span className="font-title-sm text-title-sm font-semibold text-on-surface text-xs sm:text-sm">
                Dark
              </span>
              <span className="font-label-sm text-[10px] text-on-surface-variant mt-0.5">
                Low eye strain
              </span>
            </button>

            {/* System Default */}
            <button
              type="button"
              onClick={() => {
                updateSettings({ theme: 'system' });
                showToast('Theme set to System default');
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer relative ${
                settings.theme === 'system'
                  ? 'bg-primary/10 border-primary text-primary shadow-xs ring-1 ring-primary/40'
                  : 'bg-surface-container-low border-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              {settings.theme === 'system' && (
                <span className="absolute top-1.5 right-1.5 material-symbols-outlined text-primary text-[16px]">
                  check_circle
                </span>
              )}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 ${
                settings.theme === 'system' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'
              }`}>
                <span className="material-symbols-outlined text-[20px]">settings_brightness</span>
              </div>
              <span className="font-title-sm text-title-sm font-semibold text-on-surface text-xs sm:text-sm">
                System
              </span>
              <span className="font-label-sm text-[10px] text-on-surface-variant mt-0.5">
                Auto-sync
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 6. Data Management */}
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

          {/* Action 1: Reset Leave Records Only (Preserves Profile Info) */}
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="w-full flex items-center justify-between py-2 text-left group cursor-pointer"
          >
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-lg bg-error-container/60 text-error flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">event_busy</span>
              </div>
              <div>
                <p className="font-title-sm text-title-sm text-error font-semibold">Reset Leave Records</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Clear leave history. Keep profile and settings.
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-error text-[20px]">warning</span>
          </button>

          <div className="h-[1px] bg-surface-container" />

          {/* Action 2: Factory Reset (Reset Entire App, Profile Details & Settings to Defaults) */}
          <button
            onClick={() => setIsFactoryResetModalOpen(true)}
            className="w-full flex items-center justify-between py-2 text-left group cursor-pointer"
          >
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-lg bg-error text-on-error flex items-center justify-center shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-[22px]">restart_alt</span>
              </div>
              <div>
                <p className="font-title-sm text-title-sm text-error font-semibold">Factory Reset</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Clear all personal data and restore defaults.
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-error text-[20px]">delete_forever</span>
          </button>
        </div>
      </section>



      {/* 6.5 App Updates - Positioned directly above About CutiSG */}
      <section className="space-y-space-xs" aria-label="App updates">
        <div className="px-1 flex items-center justify-between">
          <h2 className="font-title-sm text-title-sm text-on-surface-variant tracking-wider uppercase font-semibold">
            App Updates
          </h2>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-lowest p-space-md border border-surface-container shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">system_update</span>
            </div>
            <div className="min-w-0">
              <p className="font-title-sm text-title-sm font-semibold text-on-surface">Version {currentVersion}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">Stay up-to-date with new features</p>
            </div>
          </div>
          <button
            type="button"
            disabled={isCheckingUpdate}
            onClick={() => void onCheckForUpdate()}
            className="shrink-0 rounded-full px-3.5 py-2 bg-primary text-on-primary text-xs font-semibold hover:opacity-95 active:scale-95 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isCheckingUpdate ? 'Checking…' : 'Check for updates'}
          </button>
        </div>
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

      {/* Modal 1: Reset Leave Records Only (Preserves Profile) */}
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
              <span className="material-symbols-outlined text-[28px] text-error">event_busy</span>
            </div>

            <div>
              <h3 className="font-title-md text-title-md font-bold text-on-surface">
                Reset Leave Records?
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
                Delete all leave records and reset balances. Your profile and settings are kept. This cannot be undone.
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
                Reset Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Factory Reset Entire App & Profile to Defaults */}
      {isFactoryResetModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsFactoryResetModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-surface-card rounded-2xl shadow-2xl p-5 border border-surface-container flex flex-col gap-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-error text-on-error flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[28px]">restart_alt</span>
            </div>

            <div>
              <h3 className="font-title-md text-title-md font-bold text-on-surface">
                Factory Reset?
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
                Delete your profile, leave records and custom holidays, and restore default settings. This cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFactoryResetModalOpen(false)}
                className="flex-1 py-2.5 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-variant transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetEntireAppToDefaults();
                  setIsFactoryResetModalOpen(false);
                  setDraftName('');
                  setDraftEmpId('');
                  setDraftAvatar('');
                  setDraftDoj('');
                }}
                className="flex-1 py-2.5 rounded-full bg-error text-on-error font-label-md text-label-md font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Picture Crop & Adjustment Modal */}
      {cropModalSrc && (
        <ImageCropModal
          isOpen={Boolean(cropModalSrc)}
          imageSrc={cropModalSrc}
          onCropComplete={(croppedDataUrl) => {
            setDraftAvatar(croppedDataUrl);
            setCropModalSrc(null);
            showToast('Profile photo adjusted. Press Save Profile Changes to save.');
          }}
          onClose={() => setCropModalSrc(null)}
        />
      )}
    </div>
  );
};
