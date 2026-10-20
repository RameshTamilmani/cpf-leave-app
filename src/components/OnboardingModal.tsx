import React, { useRef, useState, useEffect } from 'react';
import { useLeave } from '../context/LeaveContext';
import { ImageCropModal } from './ImageCropModal';
import { formatDateDDMMYYYY, parseDDMMYYYYToISO } from '../data/singaporeHolidays2026';

export const OnboardingModal: React.FC = () => {
  const { settings, updateSettings, showToast } = useLeave();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState('');
  const [dateOfJoiningInput, setDateOfJoiningInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [cropModalSrc, setCropModalSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if user has already been prompted or profile is set
    const hasPrompted = localStorage.getItem('cutisg_profile_setup_prompted');
    const hasProfile = Boolean(settings.userName && settings.employeeId);

    if (!hasPrompted && !hasProfile) {
      setIsOpen(true);
      setName(settings.userName || '');
      setEmployeeId(settings.employeeId || '');
      setAvatarUrl(settings.avatarUrl || '');
      setDateOfJoining(settings.dateOfJoining || '');
      setDateOfJoiningInput(settings.dateOfJoining ? formatDateDDMMYYYY(settings.dateOfJoining) : '');
    }
  }, [settings.userName, settings.employeeId, settings.avatarUrl, settings.dateOfJoining]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Allowed up to 8MB
    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Profile photo must be 8MB or smaller.');
      showToast('Profile photo must be 8MB or smaller.');
      return;
    }

    setErrorMsg('');
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!employeeId.trim()) {
      setErrorMsg('Please enter your Employee ID.');
      return;
    }

    const finalDoj = dateOfJoiningInput.trim() ? parseDDMMYYYYToISO(dateOfJoiningInput.trim()) : '';

    updateSettings({
      userName: name.trim(),
      employeeId: employeeId.trim(),
      avatarUrl,
      dateOfJoining: finalDoj
    });

    localStorage.setItem('cutisg_profile_setup_prompted', 'true');
    setIsOpen(false);
    showToast('Profile saved successfully! Welcome to CutiSG');
  };

  const handleSkip = () => {
    localStorage.setItem('cutisg_profile_setup_prompted', 'true');
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-surface-card rounded-3xl shadow-2xl p-6 border border-surface-container flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-1.5">
          <div className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary-fixed flex items-center justify-center shadow-xs mb-1">
            <span className="material-symbols-outlined text-[32px]">badge</span>
          </div>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Welcome to CutiSG
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs leading-snug">
            Please enter your employee details to personalize your Singapore statutory leave planner.
          </p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4 mt-1">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile Preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center border-2 border-surface-container">
                  <span className="material-symbols-outlined text-[36px]">person</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md hover:opacity-90 cursor-pointer transition-transform active:scale-95"
                title="Upload Profile Picture"
              >
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold cursor-pointer transition-colors"
              >
                Upload Profile Picture
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setCropModalSrc(avatarUrl)}
                  className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold cursor-pointer transition-colors flex items-center gap-1 border border-surface-container"
                  title="Crop or adjust profile photo"
                >
                  <span className="material-symbols-outlined text-[14px]">crop</span>
                  <span>Adjust &amp; Crop</span>
                </button>
              )}
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="px-2.5 py-1 rounded-full text-error font-label-sm text-label-sm hover:bg-error-container/30 cursor-pointer transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Form Fields */}
          <div className="flex flex-col gap-3.5">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
                FULL NAME *
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">
                  person
                </span>
                <input
                  type="text"
                  required
                  maxLength={40}
                  value={name}
                  onKeyDown={(e) => {
                    if (/^[0-9]$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const stringOnly = e.target.value.replace(/[0-9]/g, '').slice(0, 40);
                    setName(stringOnly);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="Enter full name"
                  className="w-full pl-10 pr-3.5 py-2.5 h-11 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
                EMPLOYEE ID *
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">
                  badge
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={12}
                  required
                  value={employeeId}
                  onKeyDown={(e) => {
                    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) || e.ctrlKey || e.metaKey) {
                      return;
                    }
                    if (!/^[0-9]$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const numbersOnly = e.target.value.replace(/\D/g, '').slice(0, 12);
                    setEmployeeId(numbersOnly);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="e.g. 10245"
                  className="w-full pl-10 pr-3.5 py-2.5 h-11 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface font-mono font-medium text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
                DATE OF JOINING
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">
                  calendar_today
                </span>
                <input
                  type="text"
                  placeholder="DD/MM/YYYY"
                  value={dateOfJoiningInput}
                  maxLength={10}
                  onChange={(e) => {
                    const typed = e.target.value;
                    setDateOfJoiningInput(typed);
                    const parsed = parseDDMMYYYYToISO(typed);
                    setDateOfJoining(parsed);
                  }}
                  className="w-full pl-10 pr-12 py-2.5 h-11 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface font-mono text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
                />

                {/* Overlaid calendar icon + native date picker */}
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors border border-surface-container overflow-hidden">
                  <span className="material-symbols-outlined text-[18px] pointer-events-none">calendar_month</span>
                  <input
                    type="date"
                    value={dateOfJoining}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => {
                      const iso = e.target.value;
                      setDateOfJoining(iso);
                      setDateOfJoiningInput(formatDateDDMMYYYY(iso));
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Choose Date of Joining"
                  />
                </div>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-full bg-primary text-on-primary font-label-md text-label-md font-bold shadow-xs hover:opacity-95 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Save &amp; Continue</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="w-full py-2 text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm font-semibold cursor-pointer transition-colors"
            >
              Set up later in Settings
            </button>
          </div>
        </form>
      </div>

      {/* Profile Picture Crop & Adjustment Modal */}
      {cropModalSrc && (
        <ImageCropModal
          isOpen={Boolean(cropModalSrc)}
          imageSrc={cropModalSrc}
          onCropComplete={(croppedDataUrl) => {
            setAvatarUrl(croppedDataUrl);
            setCropModalSrc(null);
            showToast('Profile photo cropped & updated');
          }}
          onClose={() => setCropModalSrc(null)}
        />
      )}
    </div>
  );
};
