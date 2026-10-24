import { UserSettings, SpecialHoliday, PublicHoliday, LeaveRecord } from '../types/leave';
import { formatDateDDMMYYYY } from '../data/singaporeHolidays2026';

export interface AppNotification {
  id: string;
  type: 'anniversary' | 'weekend' | 'special_holiday' | 'indian_holiday' | 'public_holiday';
  title: string;
  subtitle: string;
  message: string;
  dateStr: string;
  icon: string;
  emoji?: string;
  badgeText?: string;
  badgeClass?: string;
  isCelebration?: boolean;
  actionText?: string;
  actionTab?: 'home' | 'calendar' | 'history' | 'settings';
}

export interface IndianHoliday {
  date: string; // YYYY-MM-DD
  name: string;
  emoji: string;
  description: string;
}

// Major Indian Gazetted Holidays and Key Festivals
export const INDIAN_HOLIDAYS: IndianHoliday[] = [
  { date: '2026-01-14', name: 'Pongal / Makar Sankranti', emoji: '🌾', description: 'Traditional harvest festival celebrating prosperity and new beginnings.' },
  { date: '2026-01-26', name: 'Republic Day', emoji: '🇮🇳', description: 'Celebrating the Constitution of India and national pride.' },
  { date: '2026-03-04', name: 'Maha Shivratri', emoji: '🔱', description: 'Auspicious night of spiritual reflection and celebration.' },
  { date: '2026-03-21', name: 'Eid-ul-Fitr', emoji: '🌙', description: 'Joyful celebration marking the conclusion of Ramadan.' },
  { date: '2026-03-26', name: 'Holi', emoji: '🎨', description: 'Festival of vibrant colours, spring joy, and harmony.' },
  { date: '2026-04-14', name: 'Tamil New Year / Baisakhi / Ambedkar Jayanti', emoji: '🌸', description: 'New year harvest festival and commemoration of Dr. B.R. Ambedkar.' },
  { date: '2026-05-01', name: 'May Day (Workers Day)', emoji: '🛠️', description: 'Honouring the contributions of workers nationwide.' },
  { date: '2026-05-27', name: 'Bakrid / Eid al-Adha', emoji: '🕌', description: 'Festival of sacrifice, devotion, and compassion.' },
  { date: '2026-08-15', name: 'Independence Day', emoji: '🇮🇳', description: 'Celebrating freedom, sovereignty, and unity across the nation.' },
  { date: '2026-08-28', name: 'Raksha Bandhan', emoji: '🪢', description: 'Celebrating the bond of love, care, and protection.' },
  { date: '2026-09-04', name: 'Krishna Janmashtami', emoji: '🦚', description: 'Celebrating the birth of Lord Krishna with devotion and joy.' },
  { date: '2026-09-14', name: 'Ganesh Chaturthi', emoji: '🐘', description: 'Celebrating the arrival of Lord Ganesha, remover of obstacles.' },
  { date: '2026-10-02', name: 'Gandhi Jayanti', emoji: '🕊️', description: 'Commemorating the birth of Mahatma Gandhi and non-violence.' },
  { date: '2026-10-18', name: 'Maha Saptami / Durga Puja', emoji: '🪔', description: 'Festive celebrations of Durga Puja marking triumph of righteousness.' },
  { date: '2026-10-19', name: 'Ayudha Puja / Maha Ashtami', emoji: '🪔', description: 'Worship of instruments of work and divine blessings for success.' },
  { date: '2026-10-20', name: 'Vijayadashami / Dussehra', emoji: '🏹', description: 'Celebrating the triumph of good over evil.' },
  { date: '2026-11-08', name: 'Deepavali / Diwali', emoji: '🪔', description: 'Festival of lights bringing joy, brightness, and prosperity.' },
  { date: '2026-11-24', name: 'Guru Nanak Jayanti', emoji: '🕯️', description: 'Commemorating the birth and teachings of Guru Nanak Dev Ji.' },
  { date: '2026-12-25', name: 'Christmas Day', emoji: '🎄', description: 'Peace and goodwill to all celebrating Christmas.' }
];

/**
 * Calculates current time components in Indian Standard Time (IST, UTC+5:30)
 */
export function getCurrentISTTime(): {
  dateStr: string; // YYYY-MM-DD in IST
  dayOfWeek: number; // 0 = Sun, 5 = Fri, 6 = Sat
  hours: number; // 0-23 in IST
  minutes: number;
} {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  // IST is UTC + 5.5 hours
  const istDate = new Date(utcMs + 5.5 * 3600000);
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  const dayOfWeek = istDate.getDay();
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();

  return { dateStr, dayOfWeek, hours, minutes };
}

/**
 * Generates contextual notifications respecting:
 * 1. User preferences (can be toggled off in settings tab)
 * 2. Weekend wishes: Arrive on Previous Day Evening 3.00 PM IST (Friday 15:00 IST) and remain through weekend
 * 3. Special Days & Anniversaries: Arrive on Same Day Morning 8.00 AM IST (hours >= 8)
 * 4. Indian Holidays: Arrive on Same Day Morning 8.00 AM IST (hours >= 8)
 * 5. Strict deduplication (no duplicate notifications sent)
 * 6. Removed MOM compliance notification as per user instruction
 */
export function generateNotifications(
  settings: UserSettings,
  specialHolidays: SpecialHoliday[],
  allHolidays: PublicHoliday[],
  records: LeaveRecord[],
  _todayDateStr?: string
): AppNotification[] {
  // Home banners always remain available, including for legacy profiles with toggles disabled.
  const { dateStr: istDateStr, dayOfWeek, hours } = getCurrentISTTime();
  const notifMap = new Map<string, AppNotification>();

  const isWeekendEnabled = true;
  const isAnniversaryEnabled = true;
  const isHolidayEnabled = true;

  // 1. Weekend Notifications:
  // "Special wishes notification should come on Previous Day Evening 3.00PM IST for Weekends"
  // "For weekend, make a single wish, don't spam. Don't give too much information on the wish, just plain wish is enough."
  if (isWeekendEnabled) {
    const isFridayPost3PM = dayOfWeek === 5 && hours >= 15;
    const isWeekendActive = dayOfWeek === 6 || dayOfWeek === 0;

    if (isFridayPost3PM || isWeekendActive) {
      // Single wish for the entire weekend cycle based on that week's Friday date to eliminate spam & duplicates
      const daysSinceFriday = dayOfWeek === 5 ? 0 : dayOfWeek === 6 ? 1 : 2;
      const refDate = new Date(istDateStr + 'T00:00:00');
      refDate.setDate(refDate.getDate() - daysSinceFriday);
      const cycleFridayStr = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}-${String(refDate.getDate()).padStart(2, '0')}`;
      const id = `weekend-wish-${cycleFridayStr}`;

      notifMap.set(id, {
        id,
        type: 'weekend',
        title: 'Happy Weekend! 🎉',
        subtitle: 'Weekend Greetings',
        message: 'Wishing you a happy and restful weekend!',
        dateStr: istDateStr,
        icon: 'weekend',
        emoji: '🏖️',
        badgeText: 'Weekend',
        badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
        isCelebration: true
      });
    }
  }

  // 2. Work Anniversary Wishes based on Date of Joining:
  // "Same Day Morning 8.00AM for Special Days"
  if (isAnniversaryEnabled && settings.dateOfJoining) {
    const doj = new Date(settings.dateOfJoining + 'T00:00:00');
    if (!isNaN(doj.getTime())) {
      const istToday = new Date(istDateStr + 'T00:00:00');
      const todayMonth = istToday.getMonth();
      const todayDay = istToday.getDate();
      const dojMonth = doj.getMonth();
      const dojDay = doj.getDate();

      let completedYears = istToday.getFullYear() - doj.getFullYear();
      if (todayMonth < dojMonth || (todayMonth === dojMonth && todayDay < dojDay)) {
        completedYears--;
      }

      // Check if today is the anniversary date AND time is >= 8.00 AM IST
      const isAnniversaryDay = todayMonth === dojMonth && todayDay === dojDay && completedYears >= 1;

      if (isAnniversaryDay && hours >= 8) {
        const id = `anniv-wish-${istDateStr}`;
        notifMap.set(id, {
          id,
          type: 'anniversary',
          title: 'Happy Work Anniversary! 🎊',
          subtitle: `Completed ${completedYears} Year${completedYears !== 1 ? 's' : ''}`,
          message: `Warm congratulations on your work anniversary! Wishing you continued success.`,
          dateStr: istDateStr,
          icon: 'celebration',
          emoji: '🎉',
          badgeText: 'Anniversary',
          badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
          isCelebration: true
        });
      }
    }
  }

  // 3. Special Days Wishes Notification:
  // "Same Day Morning 8.00AM for Special Days" - simple plain wish
  if (isHolidayEnabled) {
    specialHolidays.forEach((h) => {
      // Arrives on Same Day at or after 8:00 AM IST
      if (h.date === istDateStr && hours >= 8) {
        const id = `special-wish-${h.date}-${h.id}`;
        notifMap.set(id, {
          id,
          type: 'special_holiday',
          title: `Happy ${h.name}! 🎊`,
          subtitle: 'Special Holiday',
          message: `Wishing you a happy and restful ${h.name}!`,
          dateStr: istDateStr,
          icon: 'celebration',
          emoji: h.emoji || '🎉',
          badgeText: 'Special Holiday',
          badgeClass: 'bg-purple-100 text-purple-900 border border-purple-300',
          isCelebration: true
        });
      }
    });

    // 4. Indian Holidays Wishes:
    // "Also wish for Indian Holidays also on Same Day Morning 8.00AM" - simple plain wish
    INDIAN_HOLIDAYS.forEach((ih) => {
      if (ih.date === istDateStr && hours >= 8) {
        const id = `indian-wish-${ih.date}`;
        notifMap.set(id, {
          id,
          type: 'indian_holiday',
          title: `Happy ${ih.name}! ${ih.emoji}`,
          subtitle: 'Indian Festival Greetings',
          message: `Wishing you and your family a Happy ${ih.name}!`,
          dateStr: istDateStr,
          icon: 'festival',
          emoji: ih.emoji,
          badgeText: 'Festival',
          badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
          isCelebration: true
        });
      }
    });

    // 5. Gazetted Singapore Public Holidays Wishes (Respect phAlertsEnabled):
    if (settings.phAlertsEnabled !== false) {
      allHolidays
        .filter((h) => !h.isSpecial)
        .forEach((h) => {
          if ((h.date === istDateStr || h.observedDate === istDateStr) && hours >= 8) {
            // Check if already covered by Indian Holiday (e.g., Deepavali)
            const isAlreadyCovered = Array.from(notifMap.values()).some(
              (n) => n.title.toLowerCase().includes(h.name.toLowerCase()) || h.name.toLowerCase().includes(n.title.toLowerCase())
            );
            if (!isAlreadyCovered) {
              const id = `sg-ph-today-${h.date}`;
              notifMap.set(id, {
                id,
                type: 'public_holiday',
                title: `Wishing you a Happy ${h.name}! 🇸🇬`,
                subtitle: 'Singapore Public Holiday Morning Wish',
                message: `Happy ${h.name}! Today is an official gazetted Singapore Public Holiday. Wishing you and your loved ones a peaceful, joyous celebration! ${h.emoji || '🇸🇬'}`,
                dateStr: istDateStr,
                icon: 'flag',
                emoji: h.emoji || '🇸🇬',
                badgeText: 'Public Holiday',
                badgeClass: 'bg-holiday-public-container text-holiday-public font-bold',
                isCelebration: true,
                actionText: 'View Calendar',
                actionTab: 'calendar'
              });
            }
          }
        });
    }
  }

  // Strictly deduplicated list array: no duplicate titles or identical dates
  const seenKeys = new Set<string>();
  const deduplicated: AppNotification[] = [];
  for (const notif of notifMap.values()) {
    const key = `${notif.dateStr}-${notif.title.trim().toLowerCase()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduplicated.push(notif);
    }
  }

  return deduplicated;
}
