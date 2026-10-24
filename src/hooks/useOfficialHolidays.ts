import { useCallback, useEffect, useState } from 'react';
import type { PublicHoliday } from '../types/leave';
import { parseOfficialHolidays } from '../utils/officialHolidays';

const STORAGE_KEY = 'cutisg_official_holidays';
const INTERVAL = 6 * 60 * 60 * 1000;
function savedFeed(): { holidays: PublicHoliday[]; checkedAt: number } {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved) return { holidays: parseOfficialHolidays(saved.rows), checkedAt: Number(saved.checkedAt) || 0 };
  } catch {}
  return { holidays: [], checkedAt: 0 };
}

export function useOfficialHolidays() {
  const [feed, setFeed] = useState(savedFeed);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const refresh = useCallback(async (manual = false) => {
    if (!navigator.onLine) { if (manual) setError('Connect to the internet to refresh holidays.'); return; }
    if (!manual && Date.now() - savedFeed().checkedAt < INTERVAL) return;
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/holidays', { cache: 'no-store', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Holiday source is unavailable. Saved holidays are still available.');
      const data = await response.json();
      const holidays = parseOfficialHolidays(data.rows);
      const checkedAt = Date.now();
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows: data.rows, checkedAt })); } catch {}
      setFeed({ holidays, checkedAt }); setError('');
    } catch {
      setError('Holiday source is unavailable. Using saved or built-in holidays.');
    } finally { setIsRefreshing(false); }
  }, []);
  useEffect(() => {
    const check = () => { void refresh(); };
    check();
    window.addEventListener('online', check);
    const timer = window.setInterval(check, INTERVAL);
    return () => { clearInterval(timer); window.removeEventListener('online', check); };
  }, [refresh]);
  return { ...feed, isRefreshing, error, refresh };
}
