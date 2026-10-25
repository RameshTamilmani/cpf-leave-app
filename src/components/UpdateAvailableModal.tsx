import { useModalScrollLock } from '../hooks/useModalScrollLock';
import React, { useState } from 'react';
import { VersionInfo } from '../hooks/useAppUpdate';

interface UpdateAvailableModalProps {
  isOpen: boolean;
  updateInfo: VersionInfo | null;
  currentVersion: string;
  onUpdate: () => Promise<void>;
  onDismiss: () => void;
}

export const UpdateAvailableModal: React.FC<UpdateAvailableModalProps> = ({
  isOpen,
  updateInfo,
  onUpdate,
  onDismiss,
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState('');

  // Builds can differ even when their human-readable version labels match.
  useModalScrollLock(isOpen && !!updateInfo);

  if (!isOpen || !updateInfo) {
    return null;
  }

  const handleUpdateClick = async () => {
    setIsApplying(true); setError('');
    try { await onUpdate(); } catch (error) {
      setError(error instanceof Error ? error.message : 'Update failed. Please try again.');
      setIsApplying(false);
    }
  };

  const newVersion = updateInfo.version;

  // Get dynamic highlights from version info, or fallback to current release highlights
  const highlights = updateInfo.highlights && updateInfo.highlights.length > 0
    ? updateInfo.highlights
    : [{ title: 'App update', description: updateInfo.releaseNotes || 'Improvements and fixes are ready to install.', icon: 'system_update', color: 'blue' }];

  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'amber':
        return {
          bg: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300',
          icon: 'text-amber-700 dark:text-amber-300'
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300',
          icon: 'text-emerald-700 dark:text-emerald-300'
        };
      case 'blue':
        return {
          bg: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300',
          icon: 'text-blue-700 dark:text-blue-300'
        };
      case 'purple':
      default:
        return {
          bg: 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300',
          icon: 'text-purple-700 dark:text-purple-300'
        };
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={isApplying ? undefined : onDismiss}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-2xl border border-surface-container flex flex-col gap-4 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary-container text-primary flex items-center justify-center shrink-0 shadow-xs relative">
            <span className="material-symbols-outlined text-[26px]">celebration</span>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-holiday-public ring-2 ring-surface animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-title-md text-title-md font-bold text-on-surface">New Update Available</h3>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold tracking-wide">
                v{newVersion}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px] mt-0.5">
              This update has been downloaded. Apply it now or keep your current version.
            </p>
          </div>
        </div>

        {/* Dynamic Highlights from Server Version Info */}
        <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container space-y-2.5 max-h-[48vh] overflow-y-auto">
          <p className="text-[11.5px] font-bold text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
            <span>What&apos;s New in v{newVersion}</span>
          </p>

          <ul className="space-y-2.5 text-[12.5px] text-on-surface">
            {highlights.map((item, idx) => {
              const colors = getColorClasses(item.color);
              return (
                <li key={idx} className="flex items-start gap-2.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${colors.bg}`}>
                    <span className={`material-symbols-outlined text-[13px] ${colors.icon}`}>
                      {item.icon || 'star'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-on-surface">{item.title}:</span>{' '}
                    <span className="text-on-surface-variant text-[12px] leading-snug">
                      {item.description}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {error && <p role="alert" className="text-sm text-error">{error}</p>}
        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={isApplying ? undefined : onDismiss}
            className="flex-1 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-colors cursor-pointer text-center"
          >
            Later (6 hrs)
          </button>
          <button
            type="button"
            onClick={handleUpdateClick}
            disabled={isApplying}
            className="flex-1 py-2.5 rounded-full bg-primary hover:opacity-95 active:scale-95 text-on-primary font-label-md text-label-md font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className={`material-symbols-outlined text-[18px] ${isApplying ? 'animate-spin' : ''}`}>
              {isApplying ? 'progress_activity' : 'refresh'}
            </span>
            <span>{isApplying ? 'Updating...' : 'Update Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

