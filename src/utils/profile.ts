import type { UserSettings } from '../types/leave';
import { isValidISODate } from '../data/singaporeHolidays2026';

export function validContact(value: string) { return /^\+?[\d ()-]{7,24}$/.test(value.trim()) && value.replace(/\D/g, '').length >= 7 && value.replace(/\D/g, '').length <= 15; }

export function profileError(profile: Partial<UserSettings>, today: string): string {
  if (!profile.userName?.trim() || profile.userName.trim().length > 40) return 'Enter your full name (up to 40 characters).';
  if (!/^\d{1,12}$/.test(profile.employeeId?.trim() || '')) return 'Enter your numeric Employee ID (up to 12 digits).';
  if (!profile.department?.trim() || profile.department.trim().length > 25) return 'Enter your department (up to 25 characters).';
  if (!profile.dateOfJoining || !isValidISODate(profile.dateOfJoining) || profile.dateOfJoining > today) return 'Enter a valid joining date that is today or earlier.';
  if (!validContact(profile.contactNumber ?? profile.timesheetContact ?? '')) return 'Enter a valid contact number (7–15 digits).';
  return '';
}

function addMonthsClamped(iso: string, months: number) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1 + months, 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(Math.min(day, last)).padStart(2, '0')}`;
}

export function tenureTier(joined: string | undefined, today: string): 'green' | 'blue' | 'gold' | 'neutral' {
  if (!joined || !isValidISODate(joined) || joined > today) return 'neutral';
  if (today < addMonthsClamped(joined, 12)) return 'green';
  return today <= addMonthsClamped(joined, 24) ? 'blue' : 'gold';
}

export function experienceLabel(joined: string | undefined, today: string): string {
  if (!joined || !isValidISODate(joined) || joined > today) return 'Not set';
  const start = new Date(joined + 'T00:00:00');
  const end = new Date(today + 'T00:00:00');
  let months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
  if (addMonthsClamped(joined, months) > today) months--;
  if (months === 0) {
    const days = Math.round((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86400000);
    return days === 0 ? 'Joined today' : `${days} day${days === 1 ? '' : 's'}`;
  }
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  return [years ? `${years} year${years === 1 ? '' : 's'}` : '', remaining ? `${remaining} month${remaining === 1 ? '' : 's'}` : ''].filter(Boolean).join(' ');
}

export const tenureColors = {
  green: { ring: 'ring-emerald-400', badge: 'bg-emerald-300 text-emerald-950', accent: 'text-emerald-700 dark:text-emerald-300' },
  blue: { ring: 'ring-blue-400', badge: 'bg-blue-300 text-blue-950', accent: 'text-blue-700 dark:text-blue-300' },
  gold: { ring: 'ring-amber-400', badge: 'bg-amber-300 text-amber-950', accent: 'text-amber-700 dark:text-amber-300' },
  neutral: { ring: 'ring-slate-400', badge: 'bg-slate-200 text-slate-900', accent: 'text-on-surface-variant' },
};
