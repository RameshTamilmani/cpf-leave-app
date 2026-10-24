import { PublicHoliday } from '../types/leave';

export const SINGAPORE_HOLIDAYS_2026: PublicHoliday[] = [
  {
    date: '2026-01-01',
    name: "New Year's Day",
    dayOfWeek: 'Thursday',
    isLongWeekend: false,
    description: 'First gazetted public holiday of 2026. MOM Employment Act mandates statutory paid off-day.',
    emoji: '🎆',
    momSection: 'MOM Section 88'
  },
  {
    date: '2026-02-17',
    name: 'Chinese New Year Day 1',
    dayOfWeek: 'Tuesday',
    isLongWeekend: false,
    description: 'First day of the Lunar New Year celebrations.',
    emoji: '🧧',
    momSection: 'MOM Section 88'
  },
  {
    date: '2026-02-18',
    name: 'Chinese New Year Day 2',
    dayOfWeek: 'Wednesday',
    isLongWeekend: false,
    description: 'Second day of Chinese New Year. Back-to-back statutory holidays.',
    emoji: '🍊',
    momSection: 'MOM Section 88'
  },
  {
    date: '2026-03-21',
    name: 'Hari Raya Puasa',
    dayOfWeek: 'Saturday',
    isLongWeekend: true,
    longWeekendText: 'Saturday PH • +1 Comp-Off Day',
    description: 'Gazetted Singapore Public Holiday marking the end of Ramadan falls on a Saturday. +1 Comp-Off day is credited.',
    emoji: '🌙',
    isCompOffEligible: true,
    momSection: 'MOM Section 88 (Saturday Rest Compensation)'
  },
  {
    date: '2026-04-03',
    name: 'Good Friday',
    dayOfWeek: 'Friday',
    isLongWeekend: true,
    longWeekendText: '3-Day Weekend 🎉',
    description: 'Christian commemoration preceding Easter Sunday. Automatic 3-day long weekend.',
    emoji: '🕊️',
    momSection: 'MOM Section 88'
  },
  {
    date: '2026-05-01',
    name: 'Labour Day',
    dayOfWeek: 'Friday',
    isLongWeekend: true,
    longWeekendText: '3-Day Weekend 🎉',
    description: 'Gazetted Singapore Public Holiday. MOM Employment Act mandates paid off-day. Long weekend in effect (1–3 May 2026).',
    emoji: '👷',
    momSection: 'MOM Section 88'
  },
  {
    date: '2026-05-27',
    name: 'Hari Raya Haji',
    dayOfWeek: 'Wednesday',
    isLongWeekend: false,
    description: 'Commemoration of faith and devotion during Hajj pilgrimage.',
    emoji: '🕌',
    momSection: 'MOM Section 88'
  },
  {
    date: '2026-05-31',
    name: 'Vesak Day',
    dayOfWeek: 'Sunday',
    isLongWeekend: true,
    observedDate: '2026-06-01',
    longWeekendText: 'Substitute Mon 1 Jun (Long Weekend)',
    description: 'Gazetted Public Holiday falls on Sunday. Pursuant to Employment Act Sec 88, Mon 1 Jun is designated public holiday in substitution.',
    emoji: '🪷',
    momSection: 'MOM Section 88'
  },
  {
    date: '2026-08-09',
    name: 'National Day',
    dayOfWeek: 'Sunday',
    isLongWeekend: true,
    observedDate: '2026-08-10',
    longWeekendText: 'Substitute Mon 10 Aug (Long Weekend)',
    description: "Singapore's 61st National Day. As 9 Aug is a Sunday, the following Monday 10 Aug is an official substitute public holiday.",
    emoji: '🇸🇬',
    momSection: 'MOM Section 88'
  },
  {
    date: '2026-11-08',
    name: 'Deepavali',
    dayOfWeek: 'Sunday',
    isLongWeekend: true,
    observedDate: '2026-11-09',
    longWeekendText: 'Substitute Mon 9 Nov (Long Weekend)',
    description: 'Festival of Lights. As 8 Nov is a Sunday, Monday 9 Nov is the substitute statutory off-day under MOM Section 88.',
    emoji: '🪔',
    momSection: 'MOM Section 88'
  },
  {
    date: '2026-12-25',
    name: 'Christmas Day',
    dayOfWeek: 'Friday',
    isLongWeekend: true,
    longWeekendText: '3-Day Weekend 🎉',
    description: 'Celebration of Christmas. Automatic 3-day holiday weekend to conclude the calendar year.',
    emoji: '🎄',
    momSection: 'MOM Section 88'
  }
];

export const SINGAPORE_HOLIDAYS_2027: PublicHoliday[] = [
  {
    date: '2027-01-01',
    name: "New Year's Day",
    dayOfWeek: 'Friday',
    isLongWeekend: true,
    longWeekendText: '3-Day Weekend 🎉',
    description: 'First gazetted public holiday of 2027. Automatic 3-day long weekend.',
    emoji: '🎆',
    momSection: 'MOM Section 88'
  },
  {
    date: '2027-02-06',
    name: 'Chinese New Year Day 1',
    dayOfWeek: 'Saturday',
    isLongWeekend: true,
    longWeekendText: 'Saturday PH • +1 Comp-Off Day',
    description: 'Gazetted Public Holiday falls on a Saturday. Pursuant to MOM Employment Act Section 88, a full 1-day comp-off credit or off-in-lieu is granted.',
    emoji: '🧧',
    momSection: 'MOM Section 88 (Saturday Rest Compensation)'
  },
  {
    date: '2027-02-07',
    name: 'Chinese New Year Day 2',
    dayOfWeek: 'Sunday',
    isLongWeekend: true,
    observedDate: '2027-02-08',
    longWeekendText: 'Substitute Mon 8 Feb (Long Weekend)',
    description: 'Falls on a Sunday; the following Monday 8 Feb is a substitute paid public holiday.',
    emoji: '🍊',
    momSection: 'MOM Section 88'
  },
  {
    date: '2027-03-10',
    name: 'Hari Raya Puasa',
    dayOfWeek: 'Wednesday',
    isLongWeekend: false,
    description: 'Gazetted Singapore Public Holiday marking the end of Ramadan.',
    emoji: '🌙',
    momSection: 'MOM Section 88'
  },
  {
    date: '2027-03-26',
    name: 'Good Friday',
    dayOfWeek: 'Friday',
    isLongWeekend: true,
    longWeekendText: '3-Day Weekend 🎉',
    description: 'Christian commemoration preceding Easter Sunday. 3-day long weekend.',
    emoji: '🕊️',
    momSection: 'MOM Section 88'
  },
  {
    date: '2027-05-01',
    name: 'Labour Day',
    dayOfWeek: 'Saturday',
    isLongWeekend: true,
    longWeekendText: 'Saturday PH • +1 Comp-Off Day',
    description: 'Gazetted Singapore Public Holiday falls on a Saturday. Accrues +1 Comp-Off Day under statutory MOM employment guidelines.',
    emoji: '👷',
    momSection: 'MOM Section 88 (Saturday Rest Compensation)'
  },
  {
    date: '2027-05-16',
    name: 'Hari Raya Haji',
    dayOfWeek: 'Sunday',
    isLongWeekend: true,
    observedDate: '2027-05-17',
    longWeekendText: 'Substitute Mon 17 May (Long Weekend)',
    description: 'Falls on Sunday; following Monday 17 May serves as statutory off-day.',
    emoji: '🕌',
    momSection: 'MOM Section 88'
  },
  {
    date: '2027-05-20',
    name: 'Vesak Day',
    dayOfWeek: 'Thursday',
    isLongWeekend: false,
    description: 'Buddhist celebration of the birth, enlightenment, and death of Buddha.',
    emoji: '🪷',
    momSection: 'MOM Section 88'
  },
  {
    date: '2027-08-09',
    name: 'National Day',
    dayOfWeek: 'Monday',
    isLongWeekend: true,
    longWeekendText: '3-Day Weekend 🎉',
    description: "Singapore's 62nd National Day. 3-day long weekend.",
    emoji: '🇸🇬',
    momSection: 'MOM Section 88'
  },
  {
    date: '2027-10-29',
    name: 'Deepavali',
    dayOfWeek: 'Friday',
    isLongWeekend: true,
    longWeekendText: '3-Day Weekend 🎉',
    description: 'Festival of Lights. 3-day long weekend.',
    emoji: '🪔',
    momSection: 'MOM Section 88'
  },
  {
    date: '2027-12-25',
    name: 'Christmas Day',
    dayOfWeek: 'Saturday',
    isLongWeekend: true,
    longWeekendText: 'Saturday PH • +1 Comp-Off Day',
    description: 'Falls on Saturday; statutory +1 comp-off credit granted.',
    emoji: '🎄',
    momSection: 'MOM Section 88'
  }
];

export const SINGAPORE_HOLIDAYS_2025: PublicHoliday[] = [
  {
    date: '2025-01-01',
    name: "New Year's Day",
    dayOfWeek: 'Wednesday',
    isLongWeekend: false,
    description: "First gazetted public holiday of 2025.",
    emoji: '🎆',
    momSection: 'MOM Section 88'
  },
  {
    date: '2025-01-29',
    name: 'Chinese New Year Day 1',
    dayOfWeek: 'Wednesday',
    isLongWeekend: false,
    description: 'First day of Lunar New Year celebrations.',
    emoji: '🧧',
    momSection: 'MOM Section 88'
  },
  {
    date: '2025-01-30',
    name: 'Chinese New Year Day 2',
    dayOfWeek: 'Thursday',
    isLongWeekend: false,
    description: 'Second day of Chinese New Year.',
    emoji: '🍊',
    momSection: 'MOM Section 88'
  },
  {
    date: '2025-03-31',
    name: 'Hari Raya Puasa',
    dayOfWeek: 'Monday',
    isLongWeekend: true,
    longWeekendText: '3-Day Weekend 🎉',
    description: 'Marks the end of Ramadan. 3-day long weekend.',
    emoji: '🌙',
    momSection: 'MOM Section 88'
  },
  {
    date: '2025-04-18',
    name: 'Good Friday',
    dayOfWeek: 'Friday',
    isLongWeekend: true,
    longWeekendText: '3-Day Weekend 🎉',
    description: 'Christian commemoration preceding Easter. 3-day long weekend.',
    emoji: '🕊️',
    momSection: 'MOM Section 88'
  },
  {
    date: '2025-05-01',
    name: 'Labour Day',
    dayOfWeek: 'Thursday',
    isLongWeekend: false,
    description: 'International Workers Day statutory paid off-day.',
    emoji: '👷',
    momSection: 'MOM Section 88'
  },
  {
    date: '2025-05-12',
    name: 'Vesak Day',
    dayOfWeek: 'Monday',
    isLongWeekend: true,
    longWeekendText: '3-Day Weekend 🎉',
    description: 'Buddhist celebration of Buddha. 3-day long weekend.',
    emoji: '🪷',
    momSection: 'MOM Section 88'
  },
  {
    date: '2025-06-07',
    name: 'Hari Raya Haji',
    dayOfWeek: 'Saturday',
    isLongWeekend: true,
    longWeekendText: 'Saturday PH • +1 Comp-Off Day',
    description: 'Falls on a Saturday; under MOM Employment Act Sec 88, +1 Comp-Off day is credited.',
    emoji: '🕌',
    momSection: 'MOM Section 88 (Saturday Rest Compensation)'
  },
  {
    date: '2025-08-09',
    name: 'National Day',
    dayOfWeek: 'Saturday',
    isLongWeekend: true,
    longWeekendText: 'Saturday PH • +1 Comp-Off Day',
    description: "Singapore's 60th National Day falls on Saturday; +1 Comp-Off credit granted.",
    emoji: '🇸🇬',
    momSection: 'MOM Section 88 (Saturday Rest Compensation)'
  },
  {
    date: '2025-10-20',
    name: 'Deepavali',
    dayOfWeek: 'Monday',
    isLongWeekend: true,
    longWeekendText: '3-Day Weekend 🎉',
    description: 'Festival of Lights. 3-day long weekend.',
    emoji: '🪔',
    momSection: 'MOM Section 88'
  },
  {
    date: '2025-12-25',
    name: 'Christmas Day',
    dayOfWeek: 'Thursday',
    isLongWeekend: false,
    description: 'Celebration of Christmas.',
    emoji: '🎄',
    momSection: 'MOM Section 88'
  }
];

export const SINGAPORE_HOLIDAYS_2028: PublicHoliday[] = [
  {
    date: '2028-01-01',
    name: "New Year's Day",
    dayOfWeek: 'Saturday',
    isLongWeekend: true,
    longWeekendText: 'Saturday PH • +1 Comp-Off Day',
    description: 'First gazetted holiday of 2028 falls on a Saturday. +1 Comp-off credit granted.',
    emoji: '🎆',
    momSection: 'MOM Section 88 (Saturday Rest Compensation)'
  },
  {
    date: '2028-01-26',
    name: 'Chinese New Year Day 1',
    dayOfWeek: 'Wednesday',
    isLongWeekend: false,
    description: 'First day of Lunar New Year celebrations.',
    emoji: '🧧',
    momSection: 'MOM Section 88'
  },
  {
    date: '2028-01-27',
    name: 'Chinese New Year Day 2',
    dayOfWeek: 'Thursday',
    isLongWeekend: false,
    description: 'Second day of Chinese New Year.',
    emoji: '🍊',
    momSection: 'MOM Section 88'
  },
  {
    date: '2028-02-27',
    name: 'Hari Raya Puasa',
    dayOfWeek: 'Sunday',
    isLongWeekend: true,
    observedDate: '2028-02-28',
    longWeekendText: 'Substitute Mon 28 Feb (Long Weekend)',
    description: 'Falls on Sunday; following Monday is the substitute statutory off-day.',
    emoji: '🌙',
    momSection: 'MOM Section 88'
  },
  {
    date: '2028-04-14',
    name: 'Good Friday',
    dayOfWeek: 'Friday',
    isLongWeekend: true,
    longWeekendText: '3-Day Weekend 🎉',
    description: 'Christian commemoration preceding Easter Sunday.',
    emoji: '🕊️',
    momSection: 'MOM Section 88'
  },
  {
    date: '2028-05-01',
    name: 'Labour Day',
    dayOfWeek: 'Monday',
    isLongWeekend: true,
    longWeekendText: '3-Day Weekend 🎉',
    description: 'International Workers Day statutory paid off-day.',
    emoji: '👷',
    momSection: 'MOM Section 88'
  },
  {
    date: '2028-05-05',
    name: 'Hari Raya Haji',
    dayOfWeek: 'Friday',
    isLongWeekend: true,
    longWeekendText: '3-Day Weekend 🎉',
    description: 'Commemoration of devotion during Hajj.',
    emoji: '🕌',
    momSection: 'MOM Section 88'
  },
  {
    date: '2028-05-09',
    name: 'Vesak Day',
    dayOfWeek: 'Tuesday',
    isLongWeekend: false,
    description: 'Buddhist celebration of Buddha.',
    emoji: '🪷',
    momSection: 'MOM Section 88'
  },
  {
    date: '2028-08-09',
    name: 'National Day',
    dayOfWeek: 'Wednesday',
    isLongWeekend: false,
    description: "Singapore's 63rd National Day.",
    emoji: '🇸🇬',
    momSection: 'MOM Section 88'
  },
  {
    date: '2028-10-17',
    name: 'Deepavali',
    dayOfWeek: 'Tuesday',
    isLongWeekend: false,
    description: 'Festival of Lights.',
    emoji: '🪔',
    momSection: 'MOM Section 88'
  },
  {
    date: '2028-12-25',
    name: 'Christmas Day',
    dayOfWeek: 'Monday',
    isLongWeekend: true,
    longWeekendText: '3-Day Weekend 🎉',
    description: 'Celebration of Christmas. 3-day long weekend.',
    emoji: '🎄',
    momSection: 'MOM Section 88'
  }
];

export const ALL_GAZETTED_HOLIDAYS: PublicHoliday[] = [
  ...SINGAPORE_HOLIDAYS_2025,
  ...SINGAPORE_HOLIDAYS_2026,
  ...SINGAPORE_HOLIDAYS_2027,
  ...SINGAPORE_HOLIDAYS_2028
];

// Helper to check if a date string YYYY-MM-DD is an official gazetted Singapore public holiday
export function getGazettedHolidayForDate(dateStr: string): PublicHoliday | undefined {
  return ALL_GAZETTED_HOLIDAYS.find(
    (h) => (h.date === dateStr || h.observedDate === dateStr) && !h.isSpecial
  );
}

// Helper to check if a date string YYYY-MM-DD is any holiday (gazetted or special)
export function getPublicHolidayForDate(
  dateStr: string,
  customHolidays: PublicHoliday[] = []
): PublicHoliday | undefined {
  const merged = [...ALL_GAZETTED_HOLIDAYS, ...customHolidays];
  return merged.find(
    (h) => h.date === dateStr || h.observedDate === dateStr
  );
}

// Check if a date string is a weekend (Saturday or Sunday)
export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday=0, Saturday=6
}

// Calculate actual working days between start and end (inclusive)
// Excludes weekends (Saturday/Sunday) and all Singapore public & special holidays.
export function calculateWorkingDays(
  startDateStr: string,
  endDateStr: string,
  customHolidays: PublicHoliday[] = []
): number {
  if (!startDateStr || !endDateStr) return 0;

  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');

  if (start > end) return 0;

  const allHols = [...ALL_GAZETTED_HOLIDAYS, ...customHolidays];

  let workingDays = 0;
  const cur = new Date(start);

  while (cur <= end) {
    const year = cur.getFullYear();
    const month = String(cur.getMonth() + 1).padStart(2, '0');
    const day = String(cur.getDate()).padStart(2, '0');
    const curStr = `${year}-${month}-${day}`;

    const dayOfWeek = cur.getDay();
    const isWknd = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = allHols.some((h) => h.date === curStr || h.observedDate === curStr);

    if (!isWknd && !isHoliday) {
      workingDays++;
    }

    cur.setDate(cur.getDate() + 1);
  }

  return workingDays;
}

// Add days to date string (YYYY-MM-DD)
export function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Check if string is a valid ISO date YYYY-MM-DD
export function isValidISODate(dateStr?: string | null): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return false;
  const testDate = new Date(y, m - 1, d);
  return testDate.getFullYear() === y && testDate.getMonth() === m - 1 && testDate.getDate() === d;
}

// Check if string is a valid DD/MM/YYYY date
export function isValidDDMMYYYY(dateStr?: string | null): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const match = dateStr.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;
  const d = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const y = parseInt(match[3], 10);
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return false;
  const testDate = new Date(y, m - 1, d);
  return testDate.getFullYear() === y && testDate.getMonth() === m - 1 && testDate.getDate() === d;
}

// Auto-fill slashes '/' as the user types numbers only (DD/MM/YYYY)
export function formatDDMMYYYYWithAutoSlash(val: string, prev = ''): string {
  if (!val) return '';

  // If user pressed backspace
  if (prev && val.length < prev.length) {
    // If backspacing a slash, also strip the number before it so user isn't stuck
    if (prev.endsWith('/') && val === prev.slice(0, -1)) {
      const remainingDigits = val.replace(/\D/g, '').slice(0, -1);
      return formatDigitsToDDMMYYYY(remainingDigits);
    }
    const digits = val.replace(/\D/g, '');
    return formatDigitsToDDMMYYYY(digits);
  }

  // If user explicitly typed a slash after 1-digit day or month (e.g. "4/")
  const parts = val.split('/');
  if (parts.length === 2 && parts[1] === '' && parts[0].length === 1 && /^[1-9]$/.test(parts[0])) {
    return `0${parts[0]}/`;
  }
  if (parts.length === 3 && parts[2] === '' && parts[1].length === 1 && /^[1-9]$/.test(parts[1])) {
    const day = parts[0].padStart(2, '0');
    return `${day}/0${parts[1]}/`;
  }

  // Extract only numeric digits, max 8 (DDMMYYYY)
  const rawDigits = val.replace(/\D/g, '');
  return formatDigitsToDDMMYYYY(rawDigits);
}

function formatDigitsToDDMMYYYY(raw: string): string {
  if (!raw) return '';
  const digits = raw.slice(0, 8);

  // If first digit is 4-9, day can only be 04..09 (no day starts with 4..9)
  if (digits.length === 1) {
    const first = parseInt(digits[0], 10);
    if (first >= 4) {
      return `0${first}/`;
    }
    return digits;
  }

  // Formatting Day (digits 0..2)
  let dayStr = digits.slice(0, 2);
  let dayNum = parseInt(dayStr, 10);
  if (dayNum > 31) {
    dayStr = '31';
    dayNum = 31;
  } else if (dayNum === 0 && dayStr.length === 2) {
    dayStr = '01';
  }

  if (digits.length === 2) {
    return `${dayStr}/`;
  }

  // Formatting Month (digits 2..)
  const monthPart = digits.slice(2);
  if (monthPart.length === 1) {
    const mFirst = parseInt(monthPart[0], 10);
    // If first digit of month is 2-9, month can only be 02..09 (months are 01..12)
    if (mFirst >= 2) {
      return `${dayStr}/0${mFirst}/`;
    }
    return `${dayStr}/${monthPart}`;
  }

  let monthStr = monthPart.slice(0, 2);
  let monthNum = parseInt(monthStr, 10);
  if (monthNum > 12) {
    monthStr = '12';
  } else if (monthNum === 0 && monthStr.length === 2) {
    monthStr = '01';
  }

  if (monthPart.length === 2) {
    return `${dayStr}/${monthStr}/`;
  }

  // Formatting Year (digits 4..8)
  const yearPart = monthPart.slice(2, 6);
  return `${dayStr}/${monthStr}/${yearPart}`;
}

// Format date string to DD/MM/YYYY strictly
export function formatDateDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  const parts = trimmed.split(/[-/]/);
  // YYYY-MM-DD -> DD/MM/YYYY
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  // If already DD/MM/YYYY or DD-MM-YYYY
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
  }
  return trimmed;
}

// Parse DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD to ISO YYYY-MM-DD string
// Returns empty string if incomplete or invalid (never returns fragments like "2")
export function parseDDMMYYYYToISO(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    const candidate = `${year}-${month}-${day}`;
    return isValidISODate(candidate) ? candidate : '';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return isValidISODate(trimmed) ? trimmed : '';
  }
  return '';
}

// Calculate years and months of work experience from Date of Joining
// Formatted like: "3 Years 2 Months", "1 Year 6 Months", "5 Months", "1 Year"
export function calculateExperience(
  dateOfJoiningStr?: string,
  referenceDateStr?: string
): string | null {
  if (!dateOfJoiningStr) return null;
  const doj = new Date(dateOfJoiningStr + 'T00:00:00');
  if (isNaN(doj.getTime())) return null;

  const now = referenceDateStr ? new Date(referenceDateStr + 'T00:00:00') : new Date();
  if (doj > now) return '0 Months';

  let years = now.getFullYear() - doj.getFullYear();
  let months = now.getMonth() - doj.getMonth();
  if (now.getDate() < doj.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 0) {
    return '0 Months';
  }
  if (years === 0 && months === 0) {
    const diffMs = Math.abs(now.getTime() - doj.getTime());
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return days <= 1 ? '1 Day' : `${days} Days`;
  }
  if (years === 0) {
    return `${months} Month${months !== 1 ? 's' : ''}`;
  }
  if (months === 0) {
    return `${years} Year${years !== 1 ? 's' : ''}`;
  }
  return `${years} Year${years !== 1 ? 's' : ''} ${months} Month${months !== 1 ? 's' : ''}`;
}

