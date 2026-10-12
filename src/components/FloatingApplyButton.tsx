import React from 'react';
import { useLeave } from '../context/LeaveContext';

export const FloatingApplyButton: React.FC = () => {
  const { openApplyModal } = useLeave();

  return (
    <aside className="fixed bottom-24 right-4 z-30 pointer-events-auto">
      <button
        onClick={() => openApplyModal({ initialType: 'AL', initialStatus: 'planned' })}
        aria-label="Apply Leave"
        className="h-14 px-space-lg rounded-full bg-primary-fixed text-on-primary-fixed shadow-[0_4px_12px_rgba(0,32,28,0.16)] hover:bg-primary-fixed-dim active:scale-95 transition-all flex items-center gap-space-xs font-label-lg text-label-lg cursor-pointer border border-primary/10"
      >
        <span className="material-symbols-outlined text-[24px]">add</span>
        <span className="font-semibold tracking-wide">Apply Leave</span>
      </button>
    </aside>
  );
};
