export type LeaveType = 'AL' | 'SL' | 'CO';

export type LeaveStatus = 'planned' | 'taken' | 'retroactive';

export interface LeaveRecord {
  id: string;
  type: LeaveType;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  days: number;
  halfDay?: 'full' | 'am' | 'pm';
  status: LeaveStatus;
  notes?: string;
  createdAt: string;
}

export interface PublicHoliday {
  date: string; // YYYY-MM-DD
  name: string;
  dayOfWeek: string;
  isLongWeekend: boolean;
  longWeekendText?: string;
  observedDate?: string;
  description: string;
  emoji?: string;
  momSection?: string;
  isSpecial?: boolean;
  id?: string;
  category?: 'gazetted_adhoc' | 'company' | 'national';
  isCompOffEligible?: boolean;
}

export interface SpecialHoliday extends PublicHoliday {
  id: string;
  isSpecial: boolean;
  category: 'gazetted_adhoc' | 'company' | 'national';
  isCompOffEligible?: boolean;
  createdAt: string;
}

export interface UserSettings {
  userName?: string;
  employeeId?: string;
  avatarUrl?: string;
  alEntitlement: number;
  slEntitlement: number;
  cycle: string;
  cycleStartMonth?: number; // 1-12
  cycleStartDay?: number;   // 1-31
  cycleEndMonth?: number;   // 1-12
  cycleEndDay?: number;     // 1-31
  saturdayCompOffEnabled: boolean;
  compOffValidityDays: number;
  phAlertsEnabled: boolean;
  expiryAlertsEnabled: boolean;
  lastSynced: string;
  excludedHolidayDates?: string[];
  carryForwardCompOff?: number;
}
