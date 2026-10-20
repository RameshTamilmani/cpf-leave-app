import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import { formatDateDDMMYYYY, parseDDMMYYYYToISO } from '../data/singaporeHolidays2026';

const EMOJI_OPTIONS = ['🗳️', '🇸🇬', '🌟', '🏛️', '🎈', '🕊️', '🧧', '✨', '🏆', '🎉', '🪔'];

const QUICK_SUGGESTIONS = [
  { label: 'General Election Polling Day', cat: 'gazetted_adhoc' as const, emoji: '🗳️' },
  { label: 'Presidential Polling Day', cat: 'gazetted_adhoc' as const, emoji: '🗳️' },
  { label: 'SG60 Jubilee Special Holiday', cat: 'national' as const, emoji: '🇸🇬' },
  { label: 'Company Founder’s Off-Day', cat: 'company' as const, emoji: '🎉' },
  { label: 'Deepavali Eve Off-Day', cat: 'company' as const, emoji: '🪔' }
];

export const AddSpecialHolidayModal: React.FC = () => {
  const { isAddSpecialHolidayOpen, setIsAddSpecialHolidayOpen, addSpecialHoliday, todayDateStr, settings } = useLeave();

  const [name, setName] = useState('');
  const [date, setDate] = useState(todayDateStr || '2026-11-20');
  const [dateInput, setDateInput] = useState(formatDateDDMMYYYY(todayDateStr || '2026-11-20'));
  const [category, setCategory] = useState<'gazetted_adhoc' | 'company' | 'national'>('gazetted_adhoc');
  const [emoji, setEmoji] = useState('🗳️');
  const [notes, setNotes] = useState('');
  const [forceCompOff, setForceCompOff] = useState(false);

  if (!isAddSpecialHolidayOpen) return null;

  const dateObj = date ? new Date(date + 'T00:00:00') : null;
  const dayOfWeekIndex = dateObj ? dateObj.getDay() : -1;
  const isSaturday = dayOfWeekIndex === 6;
  const isSunday = dayOfWeekIndex === 0;
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayOfWeekIndex >= 0 ? daysOfWeek[dayOfWeekIndex] : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDate = dateInput ? parseDDMMYYYYToISO(dateInput) : date;
    if (!name.trim() || !finalDate) {
      alert('Please provide holiday name and date.');
      return;
    }

    const finalDateObj = new Date(finalDate + 'T00:00:00');
    const dayIdx = finalDateObj.getDay();
    const isSat = dayIdx === 6;
    const isSun = dayIdx === 0;
    const isLongWeekend = dayIdx === 5 || dayIdx === 1 || dayIdx === 0;
    const qualifiesForCompOff = isSat || forceCompOff;

    addSpecialHoliday({
      name: name.trim(),
      date: finalDate,
      dayOfWeek: daysOfWeek[dayIdx] || dayName,
      isLongWeekend,
      isCompOffEligible: qualifiesForCompOff,
      longWeekendText: isSaturday || forceCompOff
        ? 'Saturday PH • +1 Comp-Off'
        : isLongWeekend
        ? 'Long Weekend 🎉'
        : undefined,
      description: notes.trim() || `Special gazetted holiday added pursuant to official proclamation or company policy.`,
      emoji,
      momSection: qualifiesForCompOff
        ? 'MOM Section 88 (Saturday Rest / Comp-Off Granted)'
        : 'MOM Gazetted Special Off-Day',
      category
    });

    setName('');
    setNotes('');
    setForceCompOff(false);
    setIsAddSpecialHolidayOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in"
      onClick={() => setIsAddSpecialHolidayOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-surface-card rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 border border-surface-container flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Handle */}
        <div className="w-12 h-1.5 rounded-full bg-surface-variant self-center mb-1 sm:hidden" />

        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-holiday-public-container text-holiday-public flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </div>
            <div>
              <h3 className="font-title-md text-title-md font-bold text-on-surface">
                Add Special Public Holiday
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Ad-hoc election day, national jubilee, or company off-day
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddSpecialHolidayOpen(false)}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Category Choice */}
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant font-semibold block mb-1.5">
              HOLIDAY CLASSIFICATION
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('gazetted_adhoc')}
                className={`p-2 rounded-xl text-center font-label-sm text-label-sm border transition-colors cursor-pointer ${
                  category === 'gazetted_adhoc'
                    ? 'bg-holiday-public-container text-holiday-public border-holiday-public font-bold'
                    : 'bg-surface-container-low text-on-surface-variant border-surface-container'
                }`}
              >
                MOM Ad-Hoc Gazetted
              </button>
              <button
                type="button"
                onClick={() => setCategory('national')}
                className={`p-2 rounded-xl text-center font-label-sm text-label-sm border transition-colors cursor-pointer ${
                  category === 'national'
                    ? 'bg-primary-fixed text-on-primary-fixed border-primary font-bold'
                    : 'bg-surface-container-low text-on-surface-variant border-surface-container'
                }`}
              >
                National Special
              </button>
              <button
                type="button"
                onClick={() => setCategory('company')}
                className={`p-2 rounded-xl text-center font-label-sm text-label-sm border transition-colors cursor-pointer ${
                  category === 'company'
                    ? 'bg-leave-annual-container text-leave-annual border-leave-annual font-bold'
                    : 'bg-surface-container-low text-on-surface-variant border-surface-container'
                }`}
              >
                Company Off-Day
              </button>
            </div>
          </div>

          {/* Quick Suggestions for Rare Cases */}
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
              RARE OCCASION PRESETS
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {QUICK_SUGGESTIONS.map((sug) => (
                <button
                  key={sug.label}
                  type="button"
                  onClick={() => {
                    setName(sug.label);
                    setCategory(sug.cat);
                    setEmoji(sug.emoji);
                  }}
                  className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer border border-surface-container-highest"
                >
                  <span>{sug.emoji}</span>
                  <span>{sug.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Holiday Name */}
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant font-semibold block mb-1">
              HOLIDAY NAME
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., General Election Polling Day, SG60 Jubilee"
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-body-md"
            />
          </div>

          {/* Date Picker & Emoji */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
                DATE {dayName ? `(${dayName})` : ''}
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">
                  calendar_today
                </span>
                <input
                  type="text"
                  required
                  placeholder="DD/MM/YYYY"
                  maxLength={10}
                  value={dateInput}
                  onChange={(e) => {
                    const typed = e.target.value;
                    setDateInput(typed);
                    const parsed = parseDDMMYYYYToISO(typed);
                    setDate(parsed);
                  }}
                  className="w-full pl-9 pr-11 py-2 h-10 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />

                {/* Overlaid calendar icon + native date picker */}
                <div className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary flex items-center justify-center transition-colors border border-surface-container overflow-hidden">
                  <span className="material-symbols-outlined text-[18px] pointer-events-none">calendar_month</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      const iso = e.target.value;
                      setDate(iso);
                      setDateInput(formatDateDDMMYYYY(iso));
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    title="Choose Date"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
                EMOJI
              </label>
              <div className="flex items-center gap-1 overflow-x-auto py-1">
                {EMOJI_OPTIONS.slice(0, 4).map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEmoji(em)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg border cursor-pointer ${
                      emoji === em ? 'border-primary bg-primary-fixed/40' : 'border-transparent hover:bg-surface-container'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Statutory Auto-Calculations Notice */}
          {isSaturday && settings.saturdayCompOffEnabled && (
            <div className="p-3 rounded-xl bg-alert-warning-container text-alert-warning text-body-sm flex items-start gap-2.5 border border-alert-warning/20">
              <span className="material-symbols-outlined text-[20px] text-alert-warning shrink-0 mt-0.5">stars</span>
              <div>
                <span className="font-title-sm text-title-sm font-bold block">
                  Saturday Holiday: +1 Comp-Off Auto-Accrued!
                </span>
                <p className="mt-0.5 text-on-surface-variant leading-snug">
                  This special holiday falls on a Saturday. Pursuant to MOM Employment Act Section 88, it will automatically credit +1 Comp-Off Day to your active Leave Year Cycle.
                </p>
              </div>
            </div>
          )}

          {isSunday && (
            <div className="p-3 rounded-xl bg-surface-container-low text-on-surface-variant text-body-sm flex items-start gap-2.5 border border-surface-container">
              <span className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5">info</span>
              <div>
                <span className="font-title-sm text-title-sm font-semibold text-on-surface block">
                  Sunday Holiday: Monday Observed
                </span>
                <p className="mt-0.5 leading-snug">
                  Falls on a Sunday; the following Monday is designated as a paid statutory day in lieu.
                </p>
              </div>
            </div>
          )}

          {!isSaturday && (
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low border border-surface-container cursor-pointer">
              <input
                type="checkbox"
                checked={forceCompOff}
                onChange={(e) => setForceCompOff(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="font-label-md text-label-md font-semibold text-on-surface">
                  Credit +1 Comp-Off Day for this special holiday
                </span>
                <span className="text-[12px] text-on-surface-variant">
                  Auto-accrues an off-in-lieu comp-off day in your Leave Year Cycle balance
                </span>
              </div>
            </label>
          )}

          {/* Notes / Reason */}
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant font-semibold block mb-1">
              GAZETTE NOTES / REASON (OPTIONAL)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Gazetted by Singapore Prime Minister's Office"
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-body-md"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddSpecialHolidayOpen(false)}
              className="flex-1 py-2.5 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-variant transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-full bg-holiday-public text-white font-label-md text-label-md font-semibold hover:opacity-95 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              Add Special Holiday
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
