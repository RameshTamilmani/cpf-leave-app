import React, { useState } from 'react';
import { VersionInfo } from '../hooks/useAppUpdate';

interface UpdateAvailableModalProps {
  isOpen: boolean;
  updateInfo: VersionInfo | null;
  currentVersion: string;
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdateAvailableModal: React.FC<UpdateAvailableModalProps> = ({
  isOpen,
  updateInfo,
  currentVersion,
  onUpdate,
  onDismiss,
}) => {
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const handleUpdateClick = () => {
    setIsApplying(true);
    onUpdate();
  };

  const newVersion = updateInfo?.version || 'Latest';
  const releaseNotes = updateInfo?.releaseNotes;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-2xl border border-surface-container flex flex-col gap-4 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-fixed flex items-center justify-center shrink-0 shadow-xs relative">
            <span className="material-symbols-outlined text-[28px] text-primary">system_update</span>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-holiday-public ring-2 ring-surface animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-title-md text-title-md font-bold text-on-surface">Update Available</h3>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold tracking-wide">
                NEW
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px] mt-0.5">
              A newer release of CutiSG is live on the cloud.
            </p>
          </div>
        </div>

        {/* Version info badge */}
        <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container flex items-center justify-between">
          <div className="text-left">
            <p className="text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">Installed</p>
            <p className="font-mono text-xs font-semibold text-on-surface">v{currentVersion}</p>
          </div>
          <span className="material-symbols-outlined text-primary text-[20px]">arrow_forward</span>
          <div className="text-right">
            <p className="text-[11px] font-medium text-primary uppercase tracking-wider">Cloud Release</p>
            <p className="font-mono text-xs font-bold text-primary">v{newVersion}</p>
          </div>
        </div>

        {/* Release highlights */}
        <div className="text-[12.5px] text-on-surface-variant space-y-1.5 bg-surface-container-lowest p-3.5 rounded-2xl border border-surface-container/60">
          <p className="font-semibold text-on-surface text-[12px] mb-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">stars</span>
            What&apos;s New:
          </p>
          {releaseNotes ? (
            <p className="text-[12px] leading-relaxed text-on-surface">{releaseNotes}</p>
          ) : (
            <ul className="space-y-1 text-[12px] list-disc list-inside">
              <li>Latest Singapore MOM gazetted public holidays</li>
              <li>Streamlined leave titles &amp; DD/MM/YYYY formatting</li>
              <li>Performance enhancements &amp; offline reliability</li>
            </ul>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold transition-colors cursor-pointer text-center"
          >
            Later
          </button>
          <button
            type="button"
            onClick={handleUpdateClick}
            disabled={isApplying}
            className="flex-1 py-2.5 rounded-full bg-primary hover:opacity-90 active:scale-95 text-on-primary font-label-md text-label-md font-semibold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
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
