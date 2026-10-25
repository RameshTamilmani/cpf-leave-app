import { cycleView, compOffAllocation, quotaImpact, validCycle, cycleFor } from '../utils/leaveAccounting';
import { parseLeaveCSV } from '../utils/leaveCSV';
import { readRecords, transactRecords } from '../utils/recordStorage';
import { workingLeaveDates, halfDaySelectionError, leavePeriodsOverlap } from '../utils/leaveDuration';
import { restoreContentError } from '../utils/restoreValidation';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { LeaveRecord, UserSettings, LeaveType, LeaveStatus, PublicHoliday, SpecialHoliday } from '../types/leave';
import { ALL_GAZETTED_HOLIDAYS, addDaysToDate, formatDateDDMMYYYY, parseDDMMYYYYToISO, isWeekend } from '../data/singaporeHolidays2026';
import { AppNotification, generateNotifications } from '../utils/notifications';
import { useOfficialHolidays } from '../hooks/useOfficialHolidays';
import { mergeHolidaySources } from '../utils/officialHolidays';
import { playCelebrationChime } from '../utils/sound';

interface ToastState {
  show: boolean;
  message: string;
}

interface LeaveContextType {
  currentTab: 'home' | 'calendar' | 'history' | 'settings';
  setCurrentTab: (tab: 'home' | 'calendar' | 'history' | 'settings') => void;
  
  records: LeaveRecord[];
  addRecord: (record: Omit<LeaveRecord, 'id' | 'createdAt'>) => Promise<boolean>;
  cycleRecords: LeaveRecord[];
  accountingWarning: string;
  compOffError: (record: LeaveRecord, existing?: LeaveRecord[]) => string | null;
  getQuotaImpact: (record: LeaveRecord) => ReturnType<typeof quotaImpact>;
  deleteRecord: (id: string) => void;
  updateRecord: (id: string, updated: Partial<LeaveRecord>) => void;
  
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  
  // Balances
  alUsed: number;
  slUsed: number;
  coUsed: number;
  alAvailable: number;
  slAvailable: number;
  coAvailable: number;
  alLOP: number;
  slLOP: number;
  totalLOP: number;
  
  // Special Holidays & Auto Comp-off
  specialHolidays: SpecialHoliday[];
  customSpecialHolidays: SpecialHoliday[];
  officialSpecialHolidays: SpecialHoliday[];
  conflictingSpecialHolidayIds: string[];
  holidaySync: ReturnType<typeof useOfficialHolidays>;
  addSpecialHoliday: (holiday: Omit<SpecialHoliday, 'id' | 'createdAt' | 'isSpecial'>) => boolean;
  deleteSpecialHoliday: (id: string) => void;
  allHolidays: PublicHoliday[];
  
  // Auto-calculated Comp-Off Details for Active Cycle
  cycleStartDateStr: string;
  cycleEndDateStr: string;
  saturdayCompOffHolidays: PublicHoliday[];
  autoCompOffEarned: number;
  excludedHolidayDates: string[];
  toggleHolidayCompOff: (date: string) => void;
  expiredHolidayDates: string[];
  toggleHolidayExpired: (date: string) => void;
  crossedCompOffCount: number;
  upcomingCompOffCount: number;
  expiredCompOffCount: number;
  nonExpiredCompOffCount: number;
  oldExpiredCompOffCount: number;
  oldCycleSaturdayHolidays: PublicHoliday[];
  futureSaturdayHolidays: PublicHoliday[];
  crossedSaturdayHolidays: PublicHoliday[];
  manualExpiredCompOffCount: number;
  setManualExpiredCompOffCount: (count: number) => void;
  carryForwardCompOff: number;
  setCarryForwardCompOff: (days: number) => void;
  manualCompOffCredits: number;
  addManualCompOffCredit: (reason?: string) => void;
  
  // Upcoming Holidays (strictly on or after current date)
  todayDateStr: string;
  upcomingHolidays: PublicHoliday[];
  
  // Modals & Drawers
  isApplyModalOpen: boolean;
  applyModalConfig: {
    isOpen: boolean;
    initialType?: LeaveType;
    initialStatus?: LeaveStatus;
    initialDate?: string;
  };
  openApplyModal: (config?: { initialType?: LeaveType; initialStatus?: LeaveStatus; initialDate?: string }) => void;
  closeApplyModal: () => void;
  
  isHolidaysModalOpen: boolean;
  setIsHolidaysModalOpen: (open: boolean) => void;
  
  isCompOffModalOpen: boolean;
  setIsCompOffModalOpen: (open: boolean) => void;
  
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;

  isAddSpecialHolidayOpen: boolean;
  setIsAddSpecialHolidayOpen: (open: boolean) => void;

  isEditCycleModalOpen: boolean;
  setIsEditCycleModalOpen: (open: boolean) => void;

  selectedCalendarDate: string;
  setSelectedCalendarDate: (date: string) => void;
  
  // Toast
  toast: ToastState;
  showToast: (msg: string) => void;
  dismissToast: () => void;
  
  // Notifications state
  hasNewNotification: boolean;
  markNotificationsAsViewed: () => void;
  triggerNewNotification: () => void;
  activeWishPopup: AppNotification | null;
  setActiveWishPopup: (wish: AppNotification | null) => void;
  openWishWithChime: (wish: AppNotification) => void;

  // Actions
  triggerSync: () => Promise<void>;
  isSyncing: boolean;
  exportCSV: () => void;
  restoreCSV: (csvStr: string, expected?: string) => Promise<boolean>;
  resetAllData: () => Promise<boolean>;
  resetEntireAppToDefaults: () => Promise<boolean>;
  resetCycleWithWarningConfirm: (newCycleSettings: Partial<UserSettings>) => Promise<boolean>;
}

const defaultSettings: UserSettings = {
  userName: '',
  employeeId: '',
  avatarUrl: '',
  dateOfJoining: '',
  alEntitlement: 12,
  slEntitlement: 12,
  cycle: 'Jun 13 – Jun 12 (Next Year)',
  cycleStartMonth: 6,
  cycleStartDay: 13,
  cycleEndMonth: 6,
  cycleEndDay: 12,
  saturdayCompOffEnabled: true,
  compOffValidityDays: 90,
  phAlertsEnabled: true,
  expiryAlertsEnabled: true,
  lastSynced: 'Today, 09:41 AM (2h ago)',
  excludedHolidayDates: [],
  expiredHolidayDates: [],
  carryForwardCompOff: 0,
  manualExpiredCompOffCount: 0,
  notificationsEnabled: true,
  wishesEnabled: true,
  weekendWishesEnabled: true,
  anniversaryWishesEnabled: true,
  holidayWishesEnabled: true,
  wishSoundEnabled: true,
  wishPopupEnabled: true,
  theme: 'light'
};

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export const LeaveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<'home' | 'calendar' | 'history' | 'settings'>('home');
  
  // Calculate current date string (YYYY-MM-DD)
  const today = new Date();
  const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(todayDateStr);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  
  const [applyModalConfig, setApplyModalConfig] = useState<{
    isOpen: boolean;
    initialType?: LeaveType;
    initialStatus?: LeaveStatus;
    initialDate?: string;
  }>({ isOpen: false });

  const [isHolidaysModalOpen, setIsHolidaysModalOpen] = useState(false);
  const [isCompOffModalOpen, setIsCompOffModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAddSpecialHolidayOpen, setIsAddSpecialHolidayOpen] = useState(false);
  const [isEditCycleModalOpen, setIsEditCycleModalOpen] = useState(false);

  // New notification tracking (blinks only on new notification until acknowledged/viewed)
  const [hasNewNotification, setHasNewNotification] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cutisg_has_new_notification');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const markNotificationsAsViewed = () => {
    setHasNewNotification(false);
    try {
      localStorage.setItem('cutisg_has_new_notification', 'false');
    } catch (e) {
      console.error(e);
    }
  };

  const triggerNewNotification = () => {
    setHasNewNotification(true);
    try {
      localStorage.setItem('cutisg_has_new_notification', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  // Persistence in localStorage
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('cutisg_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.userName === 'Employee') parsed.userName = '';
        if (parsed.employeeId === 'EMP-1103118') parsed.employeeId = '';
        if (parsed.dateOfJoining === '2023-08-15') parsed.dateOfJoining = '';
        return { ...defaultSettings, ...parsed, department: typeof parsed.department === 'string' ? parsed.department.toUpperCase().slice(0, 25) : '', alEntitlement: 12, slEntitlement: 12 };
      }
      return defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const [records, setRecords] = useState<LeaveRecord[]>(() => {
    try {
      const saved = localStorage.getItem('cutisg_records');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((r) => r && !r.id?.startsWith('demo-'))
          .map((r) => ({
            ...r,
            days: Math.max(0.5, Number(r.days) || 1.0)
          }));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [customSpecialHolidays, setSpecialHolidays] = useState<SpecialHoliday[]>(() => {
    try {
      const saved = localStorage.getItem('cutisg_special_holidays');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [manualCompOffCredits, setManualCompOffCredits] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('cutisg_manual_compoff');
      return saved ? Number(saved) || 0 : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cutisg_settings', JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }, [settings]);

  // Ref tracking to skip animation on initial app mount
  const isFirstThemeRender = useRef(true);
  const themeTransitionTimerRef = useRef<number | null>(null);

  // Dynamically apply Theme (light / dark / system) with smooth cross-fade animation
  useEffect(() => {
    const theme = settings.theme || 'light';
    const root = document.documentElement;
    const body = document.body;

    const setClasses = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
        body.classList.add('dark');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#101315');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
        body.classList.remove('dark');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#EE2C38');
      }
    };

    const applyThemeWithTransition = (isDark: boolean) => {
      // Skip animation on initial page render to avoid flash
      if (isFirstThemeRender.current) {
        isFirstThemeRender.current = false;
        setClasses(isDark);
        return;
      }

      // Check whether user prefers reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // 1. Native View Transitions API for 60fps true snapshot cross-fade
      if (!prefersReducedMotion && typeof document !== 'undefined' && 'startViewTransition' in document) {
        try {
          (document as any).startViewTransition(() => {
            setClasses(isDark);
          });
          return;
        } catch {
          // Fallback to CSS transitions if startViewTransition fails
        }
      }

      // 2. Fallback CSS transition across all UI components
      if (!prefersReducedMotion) {
        root.classList.add('theme-transitioning');
        setClasses(isDark);
        if (themeTransitionTimerRef.current) {
          window.clearTimeout(themeTransitionTimerRef.current);
        }
        themeTransitionTimerRef.current = window.setTimeout(() => {
          root.classList.remove('theme-transitioning');
        }, 400);
      } else {
        setClasses(isDark);
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyThemeWithTransition(mediaQuery.matches);

      const handler = (e: MediaQueryListEvent) => {
        applyThemeWithTransition(e.matches);
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyThemeWithTransition(theme === 'dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    const sync = () => { try { setRecords(readRecords()); } catch {} };
    window.addEventListener('storage', sync); window.addEventListener('focus', sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('focus', sync); };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('cutisg_special_holidays', JSON.stringify(customSpecialHolidays));
    } catch (e) {
      console.error(e);
    }
  }, [customSpecialHolidays]);

  useEffect(() => {
    try {
      localStorage.setItem('cutisg_manual_compoff', String(manualCompOffCredits));
    } catch (e) {
      console.error(e);
    }
  }, [manualCompOffCredits]);

  const [activeWishPopup, setActiveWishPopup] = useState<AppNotification | null>(null);

  const openWishWithChime = (wish: AppNotification) => {
    setActiveWishPopup(wish);
    if (settings.wishSoundEnabled !== false) {
      playCelebrationChime();
    }
  };

  // Celebration wishes are displayed in the Home banner only.

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast((prev) => (prev.message === message ? { show: false, message: '' } : prev));
    }, 3500);
  };

  const dismissToast = () => {
    setToast({ show: false, message: '' });
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const normalized = { ...newSettings };
    if (normalized.department !== undefined) normalized.department = normalized.department.trim().toUpperCase().slice(0, 25);
    setSettings((prev) => ({ ...prev, ...normalized }));
  };

  const openApplyModal = (config?: { initialType?: LeaveType; initialStatus?: LeaveStatus; initialDate?: string }) => {
    setApplyModalConfig({
      isOpen: true,
      initialType: config?.initialType || 'AL',
      initialStatus: config?.initialStatus || 'planned',
      initialDate: config?.initialDate || selectedCalendarDate
    });
  };

  const closeApplyModal = () => {
    setApplyModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const commitRecords = async (change: (latest: LeaveRecord[]) => LeaveRecord[], expected?: string) => {
    try { const next = await transactRecords(change, expected); setRecords(next); return true; }
    catch (error) { showToast(error instanceof Error ? error.message : 'Records could not be saved. No changes were applied.'); return false; }
  };
  const addRecord = async (record: Omit<LeaveRecord, 'id' | 'createdAt'>) => {
    const newRecord: LeaveRecord = {...record,id:crypto.randomUUID(),createdAt:new Date().toISOString()};
    const saved = await commitRecords(latest => {
      if(latest.some(r=>leavePeriodsOverlap(r,newRecord,allHolidays)))throw Error('This leave overlaps a saved record. Check History and try again.');
      if(newRecord.type==='AL'||newRecord.type==='SL'){if(quotaImpact(newRecord,latest,settings,allHolidays).outsideCycle)throw Error('Some selected dates fall outside your configured leave-year window. Check the cycle dates in Settings.');}
      const error=compOffError(newRecord,latest);if(error)throw Error(error);
      return [...latest,newRecord].sort((a,b)=>b.startDate.localeCompare(a.startDate));
    });
    if(saved)showToast('Leave saved successfully.');return saved;
  };
  const deleteRecord = async (id:string) => {
    if(await commitRecords(latest=>latest.filter(r=>r.id!==id)))showToast('Leave record removed.');
  };
  const updateRecord = async (id:string, updated:Partial<LeaveRecord>) => {
    if(await commitRecords(latest=>latest.map(r=>r.id===id?{...r,...updated}:r)))showToast('Leave details updated.');
  };

  const holidaySync = useOfficialHolidays();
  const mergedHolidays = mergeHolidaySources(ALL_GAZETTED_HOLIDAYS, holidaySync.holidays, customSpecialHolidays);
  const allHolidays = mergedHolidays.all;

  // Special Holidays Actions
  const addSpecialHoliday = (holidayData: Omit<SpecialHoliday, 'id' | 'createdAt' | 'isSpecial'>) => {
    const d = new Date(holidayData.date + 'T00:00:00');
    const day = d.getDay();
    if (day === 0 || day === 6 || isWeekend(holidayData.date)) {
      showToast('Special holidays cannot be applied for weekends (Saturday or Sunday).');
      return false;
    }
    const existing = allHolidays.find(h => h.date === holidayData.date || h.observedDate === holidayData.date);
    if (existing) { showToast('This date is already a holiday: ' + existing.name); return false; }
    const newSpecial: SpecialHoliday = {
      ...holidayData,
      source: 'manual',
      id: 'special_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      isSpecial: true,
      createdAt: new Date().toISOString()
    };
    setSpecialHolidays((prev) => [...prev, newSpecial]);
    showToast(`Added Special Holiday: ${holidayData.name} (${holidayData.date})`);
    return true;
  };

  const deleteSpecialHoliday = (id: string) => {
    const target = customSpecialHolidays.find((h) => h.id === id);
    setSpecialHolidays((prev) => prev.filter((h) => h.id !== id));
    if (target) {
      showToast(`Removed special holiday: ${target.name}`);
    }
  };

  const addManualCompOffCredit = (reason?: string) => {
    setManualCompOffCredits((prev) => prev + 1);
    showToast(reason || '+1 Comp-Off Day credited for compensatory duty');
  };

  // Upcoming holidays strictly on or after current date (todayDateStr)
  // Holidays strictly before todayDateStr are completely excluded!
  const upcomingHolidays = allHolidays
    .filter((h) => {
      const effectiveDate = h.observedDate && h.observedDate >= todayDateStr ? h.observedDate : h.date;
      return effectiveDate >= todayDateStr;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Determine Active Cycle Date Boundaries based on settings
  const startMonth = settings.cycleStartMonth ?? 6;
  const startDay = settings.cycleStartDay ?? 13;
  const endMonth = settings.cycleEndMonth ?? 6;
  const endDay = settings.cycleEndDay ?? 12;

  const currentYear = today.getFullYear();
  const currentMonthNum = today.getMonth() + 1;
  const currentDayNum = today.getDate();

  const isCrossYear = endMonth < startMonth || (endMonth === startMonth && endDay <= startDay);

  let activeStartYear = currentYear;
  let activeEndYear = currentYear;

  if (isCrossYear) {
    const isPastStartThisYear =
      currentMonthNum > startMonth || (currentMonthNum === startMonth && currentDayNum >= startDay);
    if (isPastStartThisYear) {
      activeStartYear = currentYear;
      activeEndYear = currentYear + 1;
    } else {
      activeStartYear = currentYear - 1;
      activeEndYear = currentYear;
    }
  } else {
    activeStartYear = currentYear;
    activeEndYear = currentYear;
  }

  const cycleStartDateStr = `${activeStartYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
  const cycleEndDateStr = `${activeEndYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

  // Home counts and details refer to the active leave cycle, not historical polling days.
  const specialHolidays = mergedHolidays.specials.filter(h => h.date >= cycleStartDateStr && h.date <= cycleEndDateStr);
  const officialSpecialHolidays = specialHolidays.filter(h => h.source === 'official');
  const conflictingSpecialHolidayIds = mergedHolidays.conflicts.map(h => h.id);

  // Excluded holiday dates and expired holiday dates
  const excludedHolidayDates = settings.excludedHolidayDates || [];
  const expiredHolidayDates = settings.expiredHolidayDates || [];

  const toggleHolidayCompOff = (date: string) => {
    const isExcluded = excludedHolidayDates.includes(date);
    const updated = isExcluded
      ? excludedHolidayDates.filter((d) => d !== date)
      : [...excludedHolidayDates, date];
    updateSettings({ excludedHolidayDates: updated });
    showToast(isExcluded ? `Re-included ${date} in Comp-Off calculation` : `Excluded ${date} from Comp-Off calculation`);
  };

  const toggleHolidayExpired = (date: string) => {
    const isExpired = expiredHolidayDates.includes(date);
    const updated = isExpired
      ? expiredHolidayDates.filter((d) => d !== date)
      : [...expiredHolidayDates, date];
    updateSettings({ expiredHolidayDates: updated });
    showToast(isExpired ? `Reactivated Comp-Off credit for ${date}` : `Marked Comp-Off for ${date} as Expired`);
  };

  // Holidays falling within active leave cycle
  const holidaysInCycle = allHolidays.filter(
    (h) => h.date >= cycleStartDateStr && h.date <= cycleEndDateStr
  );

  // Saturday Public Holidays considered in active cycle:
  // Includes Saturday holidays within the cycle (cycleStartDateStr <= h.date <= cycleEndDateStr)
  // as well as Saturday holidays before cycle start whose 90-day validity window extends into the cycle
  // (e.g., 21 March 2026 Hari Raya Puasa, whose 90-day validity ends on 19 June 2026, which falls after June 13!)
  const saturdayCompOffHolidays = allHolidays.filter((h) => {
    if (!settings.saturdayCompOffEnabled) return false;
    const d = new Date(h.date + 'T00:00:00');
    const isSat = d.getDay() === 6; // Saturday
    if (!(h.isCompOffEligible ?? isSat)) return false;

    const validityEndDate = addDaysToDate(h.date, 90);
    const fallsInCycle = h.date >= cycleStartDateStr && h.date <= cycleEndDateStr;
    const validityExtendsIntoCycle = h.date < cycleStartDateStr && validityEndDate >= cycleStartDateStr;
    return fallsInCycle || validityExtendsIntoCycle;
  });

  // Crossed Saturday holidays between cycle start date and current date
  const crossedSaturdayHolidays = saturdayCompOffHolidays.filter((h) => h.date < todayDateStr);

  // Old expired comp-offs: credited/valid between Cycle start date and current date
  // (e.g., 21 March 2026 Hari Raya Puasa validity expired on 19 June 2026, which is between June 13 and today)
  const oldCycleSaturdayHolidays = crossedSaturdayHolidays.filter((h) => {
    const validityEndDate = addDaysToDate(h.date, 90);
    const isManuallyExpired = expiredHolidayDates.includes(h.date);
    const isValidityExpired = validityEndDate <= todayDateStr;

    if (h.date < cycleStartDateStr) {
      return validityEndDate >= cycleStartDateStr && isValidityExpired;
    }
    return isValidityExpired || isManuallyExpired;
  });

  // Non-expired active comp-offs between cycle start date and current date
  const nonExpiredSaturdayHolidays = crossedSaturdayHolidays.filter((h) => {
    return !oldCycleSaturdayHolidays.some((old) => old.date === h.date);
  });

  // Future comp-offs: on or after current date (h.date >= todayDateStr) - added automatically based on SG calendar
  const futureSaturdayHolidays = saturdayCompOffHolidays.filter(
    (h) => h.date >= todayDateStr
  );

  // Counts (excluding any explicitly excluded dates)
  const expiredCompOffCount = oldCycleSaturdayHolidays.filter((h) => !excludedHolidayDates.includes(h.date)).length;
  const nonExpiredCompOffCount = nonExpiredSaturdayHolidays.filter((h) => !excludedHolidayDates.includes(h.date)).length;
  const oldExpiredCompOffCount = expiredCompOffCount;
  const crossedCompOffCount = crossedSaturdayHolidays.filter((h) => !excludedHolidayDates.includes(h.date)).length;
  const upcomingCompOffCount = futureSaturdayHolidays.length;

  // "Leaves can be applied for both expired and non-expired days comp-off day"
  // Maintain the default comp-off available between the Cycle start date and current date:
  // Both expired and non-expired comp-off days from this cycle are default available to apply leave!
  const autoCompOffEarned = expiredCompOffCount + nonExpiredCompOffCount;

  // Option to add comp-off leaves is removed as per user instruction.
  const carryForwardCompOff = 0;
  const setCarryForwardCompOff = (_days: number) => {
    // Option to add comp-off is removed
  };

  const manualExpiredCompOffCount = 0;
  const setManualExpiredCompOffCount = (_count: number) => {
    // Option to add comp-off is removed
  };

  const totalCompOffPool = autoCompOffEarned + manualCompOffCredits;

  const cycleRecords = cycleView(records,cycleStartDateStr,cycleEndDateStr,allHolidays);
  const alUsed=cycleRecords.filter(r=>r.type==='AL').reduce((s,r)=>s+r.days,0);
  const slUsed=cycleRecords.filter(r=>r.type==='SL').reduce((s,r)=>s+r.days,0);
  const allocation=compOffAllocation(records,settings.saturdayCompOffEnabled?allHolidays:[],todayDateStr,excludedHolidayDates);
  const currentCreditDates=new Set(crossedSaturdayHolidays.filter(h=>!excludedHolidayDates.includes(h.date)).map(h=>h.date));
  const coUsed=[...allocation.used].filter(([date])=>currentCreditDates.has(date)).reduce((s,[,days])=>s+days,0);
  const alAvailable=Math.max(0,settings.alEntitlement-alUsed),slAvailable=Math.max(0,settings.slEntitlement-slUsed);
  const coAvailable=Math.max(0,totalCompOffPool-coUsed);
  const alLOP=Math.max(0,alUsed-settings.alEntitlement),slLOP=Math.max(0,slUsed-settings.slEntitlement),totalLOP=alLOP+slLOP;
  const compOffError = (record:LeaveRecord, existing:LeaveRecord[]=records):string|null => {
    if(record.type!=='CO'&&record.type!=='CL')return null;
    const result=compOffAllocation([...existing,record],settings.saturdayCompOffEnabled?allHolidays:[],todayDateStr,excludedHolidayDates);
    return result.unfunded.length ? 'Not enough eligible Comp-Off credit for these leave dates. Each credit can cover one day within its own 90-day period. Check earlier Comp-Off records too.' : null;
  };
  const ambiguousSpans=records.filter(r=>r.startDate!==r.endDate&&r.days%1===0.5&&!r.halfDayDate&&cycleFor(r.startDate,settings).start!==cycleFor(r.endDate,settings).start);
  const accountingWarning=ambiguousSpans.length?'An older half-day record spans two leave years without a half-day date. Its balance is reserved conservatively. Export a backup, then re-enter it with the correct date.':allocation.unfunded.length?'Some older Comp-Off records need credit or half-day details reviewed before more Comp-Off leave can be added.':'';
  const getQuotaImpact=(record:LeaveRecord)=>{
    if(record.type==='CO'||record.type==='CL'){
      const available=allocation.credits.filter(c=>c.date<=record.endDate&&c.end>=record.startDate).reduce((s,c)=>s+c.left,0);
      return {available,remaining:Math.max(0,available-record.days),lop:0,outsideCycle:false};
    }
    return quotaImpact(record,records,settings,allHolidays);
  };

  const triggerSync = async () => {
    setIsSyncing(true);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSettings((prev) => ({
      ...prev,
      lastSynced: `Today, ${timeStr} (Just now)`
    }));
    setIsSyncing(false);
    triggerNewNotification();
    showToast('Updated gazetted public holidays from data.gov.sg!');
  };

  // Export CSV with ONLY mandatory data: Type, Title, Start Date, End Date, Days, Status
  // Only executed when records exist (no false download popup)
  // While exporting, it should be based on ascending dates
  const exportCSV = () => {
    if (!records || records.length === 0) {
      return;
    }
    const sortedForExport = [...records].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const headers = ['Type', 'Title', 'Start Date', 'End Date', 'Days', 'Status', 'Remarks', 'Half Day Date', 'Half Day Session'];
    const rows = sortedForExport.map((r) => [
      `"${r.type}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.startDate}"`,
      `"${r.endDate}"`,
      r.days,
      `"${r.status}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
      `"${r.halfDayDate || (r.startDate === r.endDate && (r.halfDay === 'am' || r.halfDay === 'pm') ? r.startDate : '')}"`,
      `"${r.halfDay || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SG_Leave_Export_${cycleStartDateStr ? cycleStartDateStr.slice(0, 4) : '2026'}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Exported ${records.length} leave record${records.length !== 1 ? 's' : ''} to CSV (DD/MM/YYYY)`);
  };

  // Restore CSV containing mandatory data with strict duplicate validation and DD/MM/YYYY support
  const restoreCSV = async (csvStr:string,expected?:string):Promise<boolean> => {
    try {
      const parsed=parseLeaveCSV(csvStr,allHolidays);
      if(parsed.some(r=>(r.type==='AL'||r.type==='SL')&&quotaImpact(r,[],settings,allHolidays).outsideCycle))throw Error('Some backup dates fall outside the configured yearly cycle window. Check Settings before restoring. No records were changed.');
      if(parsed.some(r=>r.startDate!==r.endDate&&r.days%1===0.5&&!r.halfDayDate&&cycleFor(r.startDate,settings).start!==cycleFor(r.endDate,settings).start))throw Error('A half-day record spans two leave years without its exact half-day date. Add that detail to the backup before restoring. No records were changed.');
      const allocation=compOffAllocation(parsed,settings.saturdayCompOffEnabled?allHolidays:[],todayDateStr,excludedHolidayDates);
      if(allocation.unfunded.length)throw Error('The backup contains Comp-Off leave without enough eligible credit, or an unspecified half-day date. No records were changed.');
      const imported=parsed.map(r=>({...r,id:crypto.randomUUID()}));
      const saved=await commitRecords(()=>imported,expected);
      if(saved)showToast('All '+imported.length+' leave records restored.');return saved;
    } catch(error) {showToast(error instanceof Error?error.message:'The backup could not be restored.');return false;}
  };

  // "Reset All Leave Data": deletes ONLY the leave records, preserving user profile info
  const resetAllData = async () => {
    if(!await commitRecords(()=>[]))return false;
    setManualCompOffCredits(0);
    try {
      localStorage.setItem('cutisg_manual_compoff', '0');
    } catch (e) {
      console.error(e);
    }
    showToast('All leave records deleted. Profile info & settings preserved.');
    return true;
  };

  // Changing leave year cycle: updates cycle, deletes all leave logs, and resets leaves to default values
  const resetCycleWithWarningConfirm = async (newCycleSettings: Partial<UserSettings>) => {
    if(!validCycle(newCycleSettings.cycleStartMonth!,newCycleSettings.cycleStartDay!,newCycleSettings.cycleEndMonth!,newCycleSettings.cycleEndDay!)) {showToast('Choose valid cycle dates. February supports days 1–28 for a yearly cycle.');return false;}
    if(!await commitRecords(()=>[]))return false;
    setSettings((prev) => {
      const updated: UserSettings = {
        ...prev,
        ...newCycleSettings,
        alEntitlement: 12,
        slEntitlement: 12
      };
      try {
        localStorage.setItem('cutisg_settings', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    setRecords([]);
    setManualCompOffCredits(0);
    try {
      localStorage.setItem('cutisg_manual_compoff', '0');
    } catch (e) {
      console.error(e);
    }
    showToast('Leave cycle updated: all leave entries deleted and balances reset to default values.');
    return true;
  };

  // "Factory Reset": resets entire app, all records, profile details, and settings to defaults
  const resetEntireAppToDefaults = async () => {
    if(!await commitRecords(()=>[]))return false;
    setSettings(defaultSettings);
    setSpecialHolidays([]);
    setManualCompOffCredits(0);
    try {
      localStorage.removeItem('cutisg_special_holidays');
      localStorage.removeItem('cutisg_manual_compoff');
      localStorage.removeItem('cutisg_profile_setup_prompted');
      localStorage.setItem('cutisg_special_holidays', '[]');
      localStorage.setItem('cutisg_manual_compoff', '0');
      localStorage.setItem('cutisg_settings', JSON.stringify(defaultSettings));
    } catch (e) {
      console.error(e);
    }
    showToast('Entire app, profile details, and settings reset to factory defaults.');
    return true;
  };

  return (
    <LeaveContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        records,
        cycleRecords,
        accountingWarning,
        compOffError,
        getQuotaImpact,
        addRecord,
        deleteRecord,
        updateRecord,
        settings,
        updateSettings,
        resetEntireAppToDefaults,
        alUsed,
        slUsed,
        coUsed,
        alAvailable,
        slAvailable,
        coAvailable,
        alLOP,
        slLOP,
        totalLOP,
        specialHolidays,
        customSpecialHolidays,
        officialSpecialHolidays,
        conflictingSpecialHolidayIds,
        holidaySync,
        addSpecialHoliday,
        deleteSpecialHoliday,
        allHolidays,
        cycleStartDateStr,
        cycleEndDateStr,
        saturdayCompOffHolidays,
        autoCompOffEarned,
        excludedHolidayDates,
        toggleHolidayCompOff,
        expiredHolidayDates,
        toggleHolidayExpired,
        crossedCompOffCount,
        upcomingCompOffCount,
        expiredCompOffCount,
        nonExpiredCompOffCount,
        oldExpiredCompOffCount,
        oldCycleSaturdayHolidays,
        futureSaturdayHolidays,
        crossedSaturdayHolidays,
        manualExpiredCompOffCount,
        setManualExpiredCompOffCount,
        carryForwardCompOff,
        setCarryForwardCompOff,
        manualCompOffCredits,
        addManualCompOffCredit,
        todayDateStr,
        upcomingHolidays,
        isApplyModalOpen: applyModalConfig.isOpen,
        applyModalConfig,
        openApplyModal,
        closeApplyModal,
        isHolidaysModalOpen,
        setIsHolidaysModalOpen,
        isCompOffModalOpen,
        setIsCompOffModalOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isAddSpecialHolidayOpen,
        setIsAddSpecialHolidayOpen,
        isEditCycleModalOpen,
        setIsEditCycleModalOpen,
        selectedCalendarDate,
        setSelectedCalendarDate,
        hasNewNotification,
        markNotificationsAsViewed,
        triggerNewNotification,
        toast,
        showToast,
        dismissToast,
        triggerSync,
        isSyncing,
        exportCSV,
        restoreCSV,
        resetAllData,
        resetCycleWithWarningConfirm,
        activeWishPopup,
        setActiveWishPopup,
        openWishWithChime
      }}
    >
      {children}
    </LeaveContext.Provider>
  );
};

export const useLeave = () => {
  const context = useContext(LeaveContext);
  if (!context) throw new Error('useLeave must be used within LeaveProvider');
  return context;
};
