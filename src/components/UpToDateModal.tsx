import { useModalScrollLock } from '../hooks/useModalScrollLock';
import React from 'react';

interface UpToDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: string;
}

export const UpToDateModal: React.FC<UpToDateModalProps> = ({ isOpen, onClose, version }) => {
  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-surface-card p-6 shadow-2xl border border-surface-container flex flex-col items-center text-center gap-4 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
          <span className="material-symbols-outlined text-[34px]">check_circle</span>
        </div>

        <div>
          <h3 className="font-title-md text-title-md font-bold text-on-surface">
            You&apos;re Up to Date
          </h3>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              Version {version}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ Latest
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:opacity-95 active:scale-98 transition-all cursor-pointer shadow-xs mt-1"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
