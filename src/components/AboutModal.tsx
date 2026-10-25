import { APP_VERSION } from '../release';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import React from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-cutisg-title"
        className="w-full max-w-md bg-surface-card rounded-2xl shadow-2xl p-5 border border-surface-container flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-surface-container pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">info</span>
            </div>
            <div className="min-w-0">
              <h3 id="about-cutisg-title" className="font-title-md text-title-md font-bold text-on-surface">About CutiSG</h3>
              <p className="text-xs text-on-surface-variant">Version {APP_VERSION}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-3 text-sm text-on-surface-variant leading-relaxed">
          <p>Your personal Singapore leave and holiday tracker. “Cuti” means leave.</p>
          <dl className="space-y-3">
            <div>
              <dt className="font-semibold text-on-surface">Leave Balances</dt>
              <dd>Track annual, sick, comp-off and unpaid leave. Default annual and sick leave: 12 days each; follow your company policy.</dd>
            </div>
            <div>
              <dt className="font-semibold text-on-surface">Comp-Off</dt>
              <dd>The app credits Saturday public holidays as comp-off.</dd>
            </div>
            <div>
              <dt className="font-semibold text-on-surface">Public Holidays</dt>
              <dd>Syncs MOM holiday dates online; uses saved or built-in dates offline.</dd>
            </div>
          </dl>
          <a
            href="https://data.gov.sg/datasets/d_8ef23381f9417e4d4254ee8b4dcdb176/view"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-primary underline"
          >
            Official holiday source
            <span aria-hidden="true" className="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:opacity-95 active:scale-98 transition-all cursor-pointer mt-1"
        >
          Close
        </button>
      </div>
    </div>
  );
};
