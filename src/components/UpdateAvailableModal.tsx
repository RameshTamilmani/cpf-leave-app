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
              Exciting improvements and new features are ready for you.
            </p>
          </div>
        </div>

        {/* Essential Highlights as attractive bullet points */}
        <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container space-y-2.5">
          <p className="text-[11.5px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
            <span>What&apos;s New</span>
          </p>

          <ul className="space-y-2.5 text-[12.5px] text-on-surface">
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[12px]">✨</span>
              </div>
              <div>
                <span className="font-semibold text-on-surface">Festive Wishes &amp; Chime:</span>
                <p className="text-on-surface-variant text-[12px] leading-snug">
                  Automated celebration greetings for weekends, Singapore public holidays, and work milestones.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[13px] text-emerald-700">calendar_month</span>
              </div>
              <div>
                <span className="font-semibold text-on-surface">Reliable Date Selector:</span>
                <p className="text-on-surface-variant text-[12px] leading-snug">
                  Smooth, instant calendar picker with smart auto-slashing across all leave and profile forms.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[13px] text-purple-700">notifications</span>
              </div>
              <div>
                <span className="font-semibold text-on-surface">Simplified Notifications:</span>
                <p className="text-on-surface-variant text-[12px] leading-snug">
                  One simple toggle to control all celebration wishes and pleasant sound alerts.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[13px] text-blue-700">table_chart</span>
              </div>
              <div>
                <span className="font-semibold text-on-surface">Clean Spreadsheet Exports:</span>
                <p className="text-on-surface-variant text-[12px] leading-snug">
                  Universal date formatting recognized seamlessly by Microsoft Excel and Google Sheets.
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onDismiss}
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
