import React from 'react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface-card rounded-2xl shadow-2xl p-5 border border-surface-container flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-surface-container pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">info</span>
            </div>
              <div className="flex items-center gap-2">
                <h3 className="font-title-md text-title-md font-bold text-on-surface">About CutiSG</h3>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">v1.2.0</span>
              </div>
              <p className="text-[12px] text-on-surface-variant">Singapore Leave Planner &amp; Public Holiday Tracker</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="flex flex-col gap-3.5 text-body-sm text-on-surface leading-relaxed text-[13px]">
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
            <h4 className="font-title-sm text-title-sm font-semibold text-primary mb-1">
              Why &ldquo;CutiSG&rdquo;?
            </h4>
            <p className="text-on-surface-variant">
              &ldquo;Cuti&rdquo; (/tʃuːti/) is the colloquial Malay and Singlish term for <em>leave</em> or <em>vacation</em> universally understood in Singaporean workplaces (e.g., &ldquo;apply cuti&rdquo;, &ldquo;on cuti&rdquo;). Paired with &ldquo;SG&rdquo;, <strong>CutiSG</strong> provides a streamlined, personal leave tracker tailored specifically to Singapore employment norms.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
            <h4 className="font-title-sm text-title-sm font-semibold text-on-surface mb-1">
              Statutory Leave Standards
            </h4>
            <p className="text-on-surface-variant">
              Under default Singapore employment provisions, employees receive 12 statutory days of paid Annual Leave and 12 days of paid Outpatient Sick Leave per leave year cycle.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
            <h4 className="font-title-sm text-title-sm font-semibold text-on-surface mb-1">
              Comp-off Leave &amp; Public Holidays
            </h4>
            <p className="text-on-surface-variant">
              When a gazetted Singapore public holiday falls on a Saturday (a non-working day under standard 5-day workweeks), employees earn an off-in-lieu or comp-off day. CutiSG automatically tracks these credits based on the Singapore official calendar.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container">
            <h4 className="font-title-sm text-title-sm font-semibold text-on-surface mb-1">
              Automatic Holiday Synchronization
            </h4>
            <p className="text-on-surface-variant">
              All Singapore gazetted public holidays are automatically synchronized according to Ministry of Manpower (MOM) standards.
            </p>
          </div>
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
