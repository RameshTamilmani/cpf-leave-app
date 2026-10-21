import React, { useRef, useState, useEffect } from 'react';
import { useLeave } from '../context/LeaveContext';
import { AboutModal } from '../components/AboutModal';
import { ImageCropModal } from '../components/ImageCropModal';
import { formatDateDDMMYYYY, parseDDMMYYYYToISO, calculateExperience, formatDDMMYYYYWithAutoSlash, isValidISODate } from '../data/singaporeHolidays2026';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { playCelebrationChime } from '../utils/sound';

export const SettingsScreen: React.FC = () => {
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
    specialHolidays,
    deleteSpecialHoliday,
    todayDateStr,
    showToast,
    openWishWithChime
  } = useLeave();

  // Local draft state for Employee Profile
  const [draftName, setDraftName] = useState(settings.userName || '');
  const [draftEmpId, setDraftEmpId] = useState(settings.employeeId || '');
  const [draftAvatar, setDraftAvatar] = useState(settings.avatarUrl || '');
  const [draftDoj, setDraftDoj] = useState(settings.dateOfJoining || '');
  const [draftDojInput, setDraftDojInput] = useState(settings.dateOfJoining ? formatDateDDMMYYYY(settings.dateOfJoining) : '');
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Modals state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isFactoryResetModalOpen, setIsFactoryResetModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [cropModalSrc, setCropModalSrc] = useState<string | null>(null);

  // App Cloud Update hook
  const { checkForUpdate, isChecking: isCheckingUpdate, currentVersion } = useAppUpdate();

  const handleManualCheckUpdate = async () => {
    const res = await checkForUpdate(true);
    if (!res.hasUpdate) {
      showToast(`You are on the latest version of CutiSG (v${currentVersion})`);
    }
  };

  const csvInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const dojPickerRef = useRef<HTMLInputElement>(null);

  const openNativeDatePicker = (pickerRef: React.RefObject<HTMLInputElement | null>) => {
    if (!pickerRef.current) return;
    try {
      if (typeof pickerRef.current.showPicker === 'function') {
        pickerRef.current.showPicker();
        return;
      }
    } catch (err) {
      console.warn('showPicker error:', err);
    }
    pickerRef.current.focus();
    pickerRef.current.click();
  };

  // Sync draft state if settings change outside
  useEffect(() => {
    setDraftName(settings.userName || '');
    setDraftEmpId(settings.employeeId || '');
    setDraftAvatar(settings.avatarUrl || '');
    setDraftDoj(settings.dateOfJoining || '');
    setDraftDojInput(settings.dateOfJoining ? formatDateDDMMYYYY(settings.dateOfJoining) : '');
  }, [settings.userName, settings.employeeId, settings.avatarUrl, settings.dateOfJoining]);

  // Check if profile was modified
  const isProfileModified =
    draftName !== (settings.userName || '') ||
    draftEmpId !== (settings.employeeId || '') ||
    draftAvatar !== (settings.avatarUrl || '') ||
    draftDoj !== (settings.dateOfJoining || '');

  const handleSaveProfile = () => {
    const finalDoj = draftDojInput ? parseDDMMYYYYToISO(draftDojInput) : '';
    updateSettings({
      userName: draftName.trim(),
      employeeId: draftEmpId.trim(),
      avatarUrl: draftAvatar,
      dateOfJoining: finalDoj
    });
    setDraftDoj(finalDoj);
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

        <div className="rounded-2xl bg-surface-container-lowest p-space-md shadow-xs border border-surface-container space-y-space-md">
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

            <div className="sm:col-span-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
                DATE OF JOINING
              </label>
              <div className="relative flex items-center w-full">
                {/* Left Clickable Calendar Icon */}
                <button
                  type="button"
                  onClick={() => openNativeDatePicker(dojPickerRef)}
                  className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer z-10"
                  title="Click to open calendar"
                  aria-label="Open Date of Joining Calendar"
                >
                  <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                </button>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9/]*"
                  placeholder="DD/MM/YYYY"
                  value={draftDojInput}
                  maxLength={10}
                  onChange={(e) => {
                    const formatted = formatDDMMYYYYWithAutoSlash(e.target.value, draftDojInput);
                    setDraftDojInput(formatted);
                    if (formatted.length === 10) {
                      const parsed = parseDDMMYYYYToISO(formatted);
                      if (parsed && isValidISODate(parsed)) {
                        setDraftDoj(parsed);
                      }
                    } else if (!formatted) {
                      setDraftDoj('');
                    }
                  }}
                  className="w-full pl-10 pr-12 py-2 h-10 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface font-mono font-medium text-body-md focus:outline-none focus:ring-2 focus:ring-primary z-0"
                />

                {/* Right Interactive Calendar Button (synchronous showPicker with click fallback) */}
                <button
                  type="button"
                  onClick={() => openNativeDatePicker(dojPickerRef)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors border border-surface-container cursor-pointer z-20 active:scale-95 shadow-2xs"
                  title="Choose Date of Joining"
                  aria-label="Choose Date of Joining"
                >
                  <span className="material-symbols-outlined text-[19px] pointer-events-none">calendar_month</span>
                  <input
                    ref={dojPickerRef}
                    type="date"
                    tabIndex={-1}
                    aria-hidden="true"
                    value={isValidISODate(draftDoj) ? draftDoj : ''}
                    max={isValidISODate(todayDateStr) ? todayDateStr : undefined}
                    onChange={(e) => {
                      const iso = e.target.value;
                      if (iso && isValidISODate(iso)) {
                        setDraftDoj(iso);
                        setDraftDojInput(formatDateDDMMYYYY(iso));
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      try {
                        (e.currentTarget as HTMLInputElement).showPicker?.();
                      } catch {}
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-30"
                  />
                </button>
              </div>
              {draftDoj && isValidISODate(draftDoj) && (
                <div className="flex items-center gap-1.5 text-[12px] text-primary font-medium mt-1">
                  <span className="material-symbols-outlined text-[15px]">work_history</span>
                  <span>Calculated Experience: {calculateExperience(draftDoj, todayDateStr) || 'Enter valid DD/MM/YYYY'}</span>
                </div>
              )}
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

      {/* 4. Notifications & Wishes Preferences - Separate Toggles */}
      <section className="space-y-space-xs">
        <div className="px-1 flex items-center justify-between">
          <h2 className="font-title-sm text-title-sm text-on-surface-variant tracking-wider uppercase font-semibold">
            Notifications &amp; Wishes
          </h2>
          <span className="font-label-sm text-label-sm text-primary font-semibold">Customizable</span>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-xs border border-surface-container space-y-3">
          {/* Toggle 1: Weekend Reminder & Wishes */}
          <div className="flex items-center justify-between gap-space-sm p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">weekend</span>
              </div>
              <div className="min-w-0">
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">Weekend Reminder &amp; Wishes</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">
                  Automated wish sent on previous day evening (Friday 3:00 PM IST) before weekend
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled !== false && settings.weekendWishesEnabled !== false}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  updateSettings({
                    weekendWishesEnabled: isChecked,
                    ...(isChecked ? { notificationsEnabled: true } : {})
                  });
                  showToast(isChecked ? 'Weekend reminder & wishes turned on' : 'Weekend wishes turned off');
                }}
                className="sr-only peer"
              />
              <div className="w-12 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-xs" />
            </label>
          </div>

          {/* Toggle 2: Special Wishes & Celebrations */}
          <div className="flex items-center justify-between gap-space-sm p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-fixed flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">celebration</span>
              </div>
              <div className="min-w-0">
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">Special Wishes &amp; Celebrations</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">
                  Work anniversaries and Indian festivals &amp; special holidays on the day at 8:00 AM IST
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled !== false && settings.wishesEnabled !== false && settings.anniversaryWishesEnabled !== false}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  updateSettings({
                    wishesEnabled: isChecked,
                    anniversaryWishesEnabled: isChecked,
                    holidayWishesEnabled: isChecked,
                    ...(isChecked ? { notificationsEnabled: true } : {})
                  });
                  showToast(isChecked ? 'Special wishes & holiday greetings turned on' : 'Special wishes & greetings turned off');
                }}
                className="sr-only peer"
              />
              <div className="w-12 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-xs" />
            </label>
          </div>

          {/* Toggle 3: Wish Notification Sound */}
          <div className="flex items-center justify-between gap-space-sm p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">volume_up</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-title-sm text-title-sm text-on-surface font-semibold">Wish Notification Sound</p>
                  <button
                    type="button"
                    onClick={() => {
                      playCelebrationChime();
                      showToast('Playing celebration chime sound');
                    }}
                    className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 hover:bg-amber-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Preview Chime Sound"
                  >
                    <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                    <span>Test Sound</span>
                  </button>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">
                  Play melodic celebratory chime when wishes and festival greetings arrive
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
              <input
                type="checkbox"
                checked={settings.wishSoundEnabled !== false}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  updateSettings({ wishSoundEnabled: isChecked });
                  if (isChecked) {
                    playCelebrationChime();
                  }
                  showToast(isChecked ? 'Wish chime sound enabled' : 'Wish chime sound muted');
                }}
                className="sr-only peer"
              />
              <div className="w-12 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-xs" />
            </label>
          </div>

          {/* Toggle 4: Wish Popup Notification */}
          <div className="flex items-center justify-between gap-space-sm p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-title-sm text-title-sm text-on-surface font-semibold">Wish Popup Notification</p>
                  <button
                    type="button"
                    onClick={() => {
                      openWishWithChime({
                        id: `test-wish-popup-${Date.now()}`,
                        type: 'anniversary',
                        title: `Happy Work Anniversary, ${settings.userName || 'Employee'}! 🎉`,
                        subtitle: 'Special Milestone Celebration Wish',
                        message: `Warm congratulations on your work anniversary! Wishing you great health, happiness, and continued success.`,
                        emoji: '🎉',
                        icon: 'celebration',
                        dateStr: todayDateStr,
                        isCelebration: true
                      });
                    }}
                    className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 hover:bg-purple-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Preview Wish Popup Notification with Sound"
                  >
                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                    <span>Test Popup</span>
                  </button>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant text-xs mt-0.5">
                  Display an animated festive celebration popup banner on screen with chime sound
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
              <input
                type="checkbox"
                checked={settings.wishPopupEnabled !== false}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  updateSettings({ wishPopupEnabled: isChecked });
                  showToast(isChecked ? 'Celebration popup notifications enabled' : 'Celebration popup notifications disabled');
                }}
                className="sr-only peer"
              />
              <div className="w-12 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-xs" />
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
                <p className="font-title-sm text-title-sm text-error font-semibold">Reset All Leave Records</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Erase leave logs and reset balances (keeps Name, Emp ID &amp; Profile info)
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
                <p className="font-title-sm text-title-sm text-error font-semibold">Factory Reset (Reset All &amp; Profile)</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Restore entire app including profile details, custom holidays &amp; settings to defaults
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-error text-[20px]">delete_forever</span>
          </button>
        </div>
      </section>

      {/* 6. App Version & Cloud Update Status */}
      <section className="space-y-space-xs">
        <div className="px-1 flex items-center justify-between">
          <h2 className="font-title-sm text-title-sm text-on-surface-variant tracking-wider uppercase font-semibold">
            App Version &amp; Updates
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">v{currentVersion}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-fixed flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[22px]">system_update</span>
            </div>
            <div className="min-w-0">
              <p className="font-title-sm text-title-sm text-on-surface font-semibold truncate">CutiSG Release v{currentVersion}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px] truncate">
                MOM 2026 Compliant • Vercel Cloud Sync
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleManualCheckUpdate}
            disabled={isCheckingUpdate}
            className="px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border border-surface-container active:scale-95"
          >
            <span className={`material-symbols-outlined text-[16px] text-primary ${isCheckingUpdate ? 'animate-spin' : ''}`}>
              {isCheckingUpdate ? 'progress_activity' : 'sync'}
            </span>
            <span>{isCheckingUpdate ? 'Checking...' : 'Check Update'}</span>
          </button>
        </div>
      </section>

      {/* 8. About CutiSG - Separate Button opening modal */}
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
                Reset Leave Records Only?
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
                This will erase all logged Annual Leave, Sick Leave, and Comp-Off records and restore your balances back to full entitlement. <strong className="text-on-surface">Your Name, Employee ID, Date of Joining, and Profile photo will be safely preserved.</strong>
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
                Factory Reset Entire App?
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
                This action is irreversible. It will erase all leave records AND reset your Name, Employee ID, Date of Joining, Profile Picture, custom holidays, and all settings back to factory defaults.
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
