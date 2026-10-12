import React, { createContext, useContext, useState, useEffect } from 'react';
import { LeaveRecord, UserSettings, LeaveType, LeaveStatus, PublicHoliday, SpecialHoliday } from '../types/leave';
import { ALL_GAZETTED_HOLIDAYS } from '../data/singaporeHolidays2026';

interface ToastState {
  show: boolean;
  message: string;
}

interface LeaveContextType {
  currentTab: 'home' | 'calendar' | 'history' | 'settings';
  setCurrentTab: (tab: 'home' | 'calendar' | 'history' | 'settings') => void;
  
  records: LeaveRecord[];
  addRecord: (record: Omit<LeaveRecord, 'id' | 'createdAt'>) => void;
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
  
  // Special Holidays & Auto Comp-off
  specialHolidays: SpecialHoliday[];
  addSpecialHoliday: (holiday: Omit<SpecialHoliday, 'id' | 'createdAt' | 'isSpecial'>) => void;
  deleteSpecialHoliday: (id: string) => void;
  allHolidays: PublicHoliday[];
  
  // Auto-calculated Comp-Off Details for Active Cycle
  cycleStartDateStr: string;
  cycleEndDateStr: string;
  saturdayCompOffHolidays: PublicHoliday[];
  autoCompOffEarned: number;
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
  
  // Actions
  triggerSync: () => Promise<void>;
  isSyncing: boolean;
  exportCSV: () => void;
  backupJSON: () => void;
  restoreJSON: (jsonStr: string) => boolean;
  resetAllData: () => void;
}

const defaultSettings: UserSettings = {
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
  lowBalanceWarningEnabled: false,
  lastSynced: 'Today, 09:41 AM (2h ago)'
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

  // Persistence in localStorage
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('cutisg_settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
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

  const [specialHolidays, setSpecialHolidays] = useState<SpecialHoliday[]>(() => {
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

  useEffect(() => {
    try {
      localStorage.setItem('cutisg_records', JSON.stringify(records));
    } catch (e) {
      console.error(e);
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem('cutisg_special_holidays', JSON.stringify(specialHolidays));
    } catch (e) {
      console.error(e);
    }
  }, [specialHolidays]);

  useEffect(() => {
    try {
      localStorage.setItem('cutisg_manual_compoff', String(manualCompOffCredits));
    } catch (e) {
      console.error(e);
    }
  }, [manualCompOffCredits]);

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
    setSettings((prev) => ({ ...prev, ...newSettings }));
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

  const addRecord = (record: Omit<LeaveRecord, 'id' | 'createdAt'>) => {
    const newRecord: LeaveRecord = {
      ...record,
      id: 'cuti_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      createdAt: new Date().toISOString()
    };
    setRecords((prev) => [newRecord, ...prev]);
    showToast(`Leave logged: ${record.title} (-${record.days} day${record.days !== 1 ? 's' : ''})`);
  };

  const deleteRecord = (id: string) => {
    const target = records.find((r) => r.id === id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (target) {
      showToast(`Removed entry: ${target.title} (Restored +${target.days} days)`);
    }
  };

  const updateRecord = (id: string, updated: Partial<LeaveRecord>) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
    );
    showToast('Updated leave details');
  };

  // Special Holidays Actions
  const addSpecialHoliday = (holidayData: Omit<SpecialHoliday, 'id' | 'createdAt' | 'isSpecial'>) => {
    const newSpecial: SpecialHoliday = {
      ...holidayData,
      id: 'special_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      isSpecial: true,
      createdAt: new Date().toISOString()
    };
    setSpecialHolidays((prev) => [...prev, newSpecial]);
    showToast(`Added Special Holiday: ${holidayData.name} (${holidayData.date})`);
  };

  const deleteSpecialHoliday = (id: string) => {
    const target = specialHolidays.find((h) => h.id === id);
    setSpecialHolidays((prev) => prev.filter((h) => h.id !== id));
    if (target) {
      showToast(`Removed special holiday: ${target.name}`);
    }
  };

  const addManualCompOffCredit = (reason?: string) => {
    setManualCompOffCredits((prev) => prev + 1);
    showToast(reason || '+1 Comp-Off Day credited for compensatory duty');
  };

  // Merged holiday list (Gazetted + Custom Special Holidays)
  const allHolidays: PublicHoliday[] = [
    ...ALL_GAZETTED_HOLIDAYS,
    ...specialHolidays
  ];

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

  // Holidays falling within active leave cycle
  const holidaysInCycle = allHolidays.filter(
    (h) => h.date >= cycleStartDateStr && h.date <= cycleEndDateStr
  );

  // Auto-calculated Saturday Public Holidays in Cycle (MOM Employment Act Sec 88)
  const saturdayCompOffHolidays = holidaysInCycle.filter((h) => {
    if (!settings.saturdayCompOffEnabled) return false;
    const d = new Date(h.date + 'T00:00:00');
    const isSat = d.getDay() === 6; // Saturday
    return isSat || Boolean(h.isCompOffEligible);
  });

  const autoCompOffEarned = saturdayCompOffHolidays.length;
  const totalCompOffPool = autoCompOffEarned + manualCompOffCredits;

  // Balances calculation
  const alUsed = records
    .filter((r) => r.type === 'AL')
    .reduce((sum, r) => sum + (Number(r.days) || 0), 0);

  const slUsed = records
    .filter((r) => r.type === 'SL')
    .reduce((sum, r) => sum + (Number(r.days) || 0), 0);

  const coUsed = records
    .filter((r) => r.type === 'CO')
    .reduce((sum, r) => sum + (Number(r.days) || 0), 0);

  const alAvailable = Math.max(0, settings.alEntitlement - alUsed);
  const slAvailable = Math.max(0, settings.slEntitlement - slUsed);
  const coAvailable = Math.max(0, totalCompOffPool - coUsed);

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
    showToast('Updated gazetted public holidays from data.gov.sg!');
  };

  const exportCSV = () => {
    const headers = ['ID', 'Type', 'Title', 'Start Date', 'End Date', 'Days', 'Status', 'Ref No', 'Notes', 'Created At'];
    const rows = records.map((r) => [
      `"${r.id}"`,
      `"${r.type}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      `"${r.startDate}"`,
      `"${r.endDate}"`,
      r.days,
      `"${r.status}"`,
      `"${r.refNo || ''}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
      `"${r.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CutiSG_Leave_Export_FY2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${records.length} leave record${records.length !== 1 ? 's' : ''} to CSV`);
  };

  const backupJSON = () => {
    const data = {
      app: 'CutiSG',
      version: '1.0.0 (Build 2026.04)',
      exportedAt: new Date().toISOString(),
      settings,
      records,
      specialHolidays,
      manualCompOffCredits
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `CutiSG_Backup_FY2026_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Saved encrypted JSON snapshot to device');
  };

  const restoreJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.settings) setSettings(parsed.settings);
      if (Array.isArray(parsed.records)) setRecords(parsed.records);
      if (Array.isArray(parsed.specialHolidays)) setSpecialHolidays(parsed.specialHolidays);
      if (typeof parsed.manualCompOffCredits === 'number') setManualCompOffCredits(parsed.manualCompOffCredits);
      showToast('Successfully restored backup snapshot!');
      return true;
    } catch {
      showToast('Error restoring file: Invalid JSON format');
      return false;
    }
  };

  const resetAllData = () => {
    setRecords([]);
    setSettings(defaultSettings);
    setSpecialHolidays([]);
    setManualCompOffCredits(0);
    try {
      localStorage.setItem('cutisg_records', '[]');
      localStorage.setItem('cutisg_special_holidays', '[]');
      localStorage.setItem('cutisg_manual_compoff', '0');
      localStorage.setItem('cutisg_settings', JSON.stringify(defaultSettings));
    } catch (e) {
      console.error(e);
    }
    showToast('All leave data reset to MOM initial defaults.');
  };

  return (
    <LeaveContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        records,
        addRecord,
        deleteRecord,
        updateRecord,
        settings,
        updateSettings,
        alUsed,
        slUsed,
        coUsed,
        alAvailable,
        slAvailable,
        coAvailable,
        specialHolidays,
        addSpecialHoliday,
        deleteSpecialHoliday,
        allHolidays,
        cycleStartDateStr,
        cycleEndDateStr,
        saturdayCompOffHolidays,
        autoCompOffEarned,
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
        toast,
        showToast,
        dismissToast,
        triggerSync,
        isSyncing,
        exportCSV,
        backupJSON,
        restoreJSON,
        resetAllData
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
