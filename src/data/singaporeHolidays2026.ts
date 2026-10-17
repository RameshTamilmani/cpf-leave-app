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
    longWeekendText: 'Observed Mon 1 Jun (Long Weekend)',
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
    longWeekendText: 'Observed Mon 10 Aug (Long Weekend)',
    description: "Singapore's 61st National Day. As 9 Aug is a Sunday, the following Monday 10 Aug is an official observed public holiday.",
    emoji: '🇸🇬',
    momSection: 'MOM Section 88'
  },
  {
    date: '2026-11-08',
    name: 'Deepavali',
    dayOfWeek: 'Sunday',
    isLongWeekend: true,
    observedDate: '2026-11-09',
    longWeekendText: 'Observed Mon 9 Nov (Long Weekend)',
    description: 'Festival of Lights. As 8 Nov is a Sunday, Monday 9 Nov is observed as the official statutory off-day under MOM Section 88.',
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
    longWeekendText: 'Observed Mon 8 Feb (Long Weekend)',
    description: 'Falls on a Sunday; the following Monday 8 Feb is observed as statutory paid public holiday.',
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
    longWeekendText: 'Observed Mon 17 May (Long Weekend)',
    description: 'Falls on Sunday; following Monday 17 May observed as statutory off-day.',
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
    longWeekendText: 'Observed Mon 28 Feb (Long Weekend)',
    description: 'Falls on Sunday; following Monday observed as statutory off-day.',
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

// Format date string to DD-MM-YYYY
export function formatDateDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}
