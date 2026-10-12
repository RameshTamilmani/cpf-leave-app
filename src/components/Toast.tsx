import React from 'react';
import { useLeave } from '../context/LeaveContext';

export const Toast: React.FC = () => {
  const { toast, dismissToast } = useLeave();

  if (!toast.show) return null;

  return (
    <div className="fixed bottom-28 left-4 right-4 max-w-md mx-auto bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-xl flex items-center justify-between transition-all duration-300 z-50 border border-white/10 animate-fade-in">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="material-symbols-outlined text-inverse-primary text-[20px] shrink-0">check_circle</span>
        <span className="font-body-sm text-body-sm font-medium truncate">{toast.message}</span>
      </div>
      <button
        onClick={dismissToast}
        className="text-inverse-primary font-label-md text-label-md font-semibold ml-3 shrink-0 cursor-pointer hover:underline"
      >
        Dismiss
      </button>
    </div>
  );
};
