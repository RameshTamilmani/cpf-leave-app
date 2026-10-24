import React from 'react';
import type { UserSettings } from '../types/leave';
import { experienceLabel, tenureColors, tenureTier } from '../utils/profile';
import { isValidISODate } from '../data/singaporeHolidays2026';

export const EmployeeProfileCard: React.FC<{ settings: UserSettings; today: string; onEdit: () => void }> = ({ settings, today, onEdit }) => {
  const tier = tenureTier(settings.dateOfJoining, today);
  const colors = tenureColors[tier];
  const joined = settings.dateOfJoining && isValidISODate(settings.dateOfJoining)
    ? new Date(settings.dateOfJoining + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not set';
  return (
    <section aria-label="Employee profile" data-tenure={tier} className="rounded-2xl border border-primary/20 bg-surface-card p-3.5 sm:p-4 shadow-xs">
      <div className="flex items-center gap-3">
        <div data-testid="profile-ring" className={`relative w-14 h-14 rounded-full ring-2 ring-offset-2 ring-offset-surface-card shrink-0 ${colors.ring}`}>
          {settings.avatarUrl ? <img src={settings.avatarUrl} alt={settings.userName || 'Employee'} className="w-full h-full rounded-full object-cover" />
            : <div className="w-full h-full rounded-full bg-primary-container text-on-primary-container text-xl font-bold flex items-center justify-center">{settings.userName?.slice(0, 1).toUpperCase() || 'E'}</div>}
          <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-surface-card flex items-center justify-center ${colors.accent}`} title="Employee profile">
            <span aria-hidden="true" className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-base font-bold text-on-surface leading-snug break-words">{settings.userName || 'Employee Name'}</h1>
          <div className="mt-1 flex items-center flex-wrap gap-x-2 gap-y-1">
            <span data-testid="employee-id-badge" className={`inline-flex items-center gap-1 rounded-md border border-red-500 px-2 py-0.5 text-[11px] font-mono font-bold shadow-xs ${colors.badge}`}>
              <span aria-hidden="true" className="material-symbols-outlined text-[13px]">badge</span>EMP {settings.employeeId}
            </span>
            <span aria-label="Department" className="text-xs text-on-surface-variant break-words min-w-0">{settings.department}</span>
          </div>
        </div>
        <button type="button" onClick={onEdit} aria-label="Edit profile" className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-surface-container text-on-surface-variant hover:text-primary cursor-pointer">
          <span aria-hidden="true" className="material-symbols-outlined text-[16px]">edit</span>
        </button>
      </div>
      <div className="mt-3.5 pt-3 border-t border-surface-container grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-3">
        <div>
          <p className="text-xs text-primary flex items-center gap-1.5"><span aria-hidden="true" className="material-symbols-outlined text-[15px]">calendar_month</span>Joined</p>
          <time dateTime={settings.dateOfJoining} className="block mt-1 text-xs sm:text-sm font-semibold text-on-surface">{joined}</time>
        </div>
        <div className="text-right">
          <p className={`text-xs flex items-center justify-end gap-1.5 ${colors.accent}`}><span aria-hidden="true" className="material-symbols-outlined text-[15px]">workspace_premium</span>Experience</p>
          <p data-testid="profile-experience" className={`mt-1 text-xs sm:text-sm font-semibold ${colors.accent}`}>{experienceLabel(settings.dateOfJoining, today)}</p>
        </div>
      </div>
    </section>
  );
};
