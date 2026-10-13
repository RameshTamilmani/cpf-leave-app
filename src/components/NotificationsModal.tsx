import React from 'react';
import { useLeave } from '../context/LeaveContext';

export const NotificationsModal: React.FC = () => {
  const { isNotificationsOpen, setIsNotificationsOpen, setCurrentTab } = useLeave();

  if (!isNotificationsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-surface-card rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-surface-container animate-in slide-in-from-bottom-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] text-primary">notifications</span>
            <div>
              <h2 className="font-title-md text-title-md text-on-surface font-bold">Notifications &amp; Alerts</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Singapore Statutory &amp; Leave Notices</p>
            </div>
          </div>
          <button
            onClick={() => setIsNotificationsOpen(false)}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex flex-col gap-3">
          {/* Notification 1 */}
          <div className="p-3.5 rounded-xl bg-holiday-public-container text-holiday-public-on-container flex items-start gap-3">
            <span className="material-symbols-outlined text-[22px] text-holiday-public shrink-0 mt-0.5">event</span>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-title-sm text-title-sm font-semibold">Upcoming: Labour Day Long Weekend</span>
                <span className="text-[10px] opacity-75">1 May 2026</span>
              </div>
              <p className="font-body-sm text-body-sm mt-1 leading-snug">
                Friday, 1 May 2026 is an official gazetted Singapore Public Holiday. Enjoy a 3-day weekend with 0 annual leave days deducted!
              </p>
            </div>
          </div>

          {/* Notification 2 */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex items-start gap-3">
            <span className="material-symbols-outlined text-[22px] text-primary shrink-0 mt-0.5">verified</span>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-title-sm text-title-sm font-semibold text-on-surface">MOM Public Holiday Sync Live</span>
                <span className="text-[10px] text-on-surface-variant">Today</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">
                11 official gazetted holidays for FY 2026 are verified and cached for offline access directly from data.gov.sg.
              </p>
            </div>
          </div>

          {/* Notification 3 */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex items-start gap-3">
            <span className="material-symbols-outlined text-[22px] text-secondary shrink-0 mt-0.5">policy</span>
            <div>
              <div className="flex items-center justify-between">
                <span className="font-title-sm text-title-sm font-semibold text-on-surface">MOM Leave Compliance Active</span>
                <span className="text-[10px] text-on-surface-variant">Active Cycle</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-snug">
                Leave deductions strictly match selected working business days with half-day adjustments supported per Singapore MOM guidelines.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-surface-container-low border-t border-surface-container flex justify-end">
          <button
            onClick={() => {
              setIsNotificationsOpen(false);
              setCurrentTab('calendar');
            }}
            className="px-4 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold cursor-pointer"
          >
            Go to Leave Calendar
          </button>
        </div>
      </div>
    </div>
  );
};
