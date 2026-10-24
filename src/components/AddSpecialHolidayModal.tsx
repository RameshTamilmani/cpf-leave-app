import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import { DatePickerField } from './DatePickerField';

export const AddSpecialHolidayModal: React.FC = () => {
  const { isAddSpecialHolidayOpen, setIsAddSpecialHolidayOpen, addSpecialHoliday, todayDateStr, settings, allHolidays } = useLeave();

  const [name, setName] = useState('');
  const [date, setDate] = useState(todayDateStr || '2026-11-20');

  if (!isAddSpecialHolidayOpen) return null;

  const dateObj = date ? new Date(date + 'T00:00:00') : null;
  const dayOfWeekIndex = dateObj ? dateObj.getDay() : -1;
  const isSaturday = dayOfWeekIndex === 6;
  const isSunday = dayOfWeekIndex === 0;
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayOfWeekIndex >= 0 ? daysOfWeek[dayOfWeekIndex] : '';

  const existingHoliday = allHolidays.find(h => h.date === date || h.observedDate === date);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (existingHoliday) return;
    const finalDate = date;
    if (!name.trim() || !finalDate) {
      alert('Please provide holiday name and date.');
      return;
    }

    const finalDateObj = new Date(finalDate + 'T00:00:00');
    const dayIdx = finalDateObj.getDay();
    const isSat = dayIdx === 6;
    const isSun = dayIdx === 0;
    const isLongWeekend = dayIdx === 5 || dayIdx === 1 || dayIdx === 0;
    const qualifiesForCompOff = isSat && settings.saturdayCompOffEnabled;

    const added = addSpecialHoliday({
      name: name.trim(),
      date: finalDate,
      dayOfWeek: daysOfWeek[dayIdx] || dayName,
      isLongWeekend,
      isCompOffEligible: qualifiesForCompOff,
      longWeekendText: qualifiesForCompOff
        ? 'Saturday PH • +1 Comp-Off'
        : isLongWeekend
        ? 'Long Weekend 🎉'
        : undefined,
      description: 'Special gazetted public holiday added to personal planner.',
      emoji: '🗳️',
      momSection: qualifiesForCompOff
        ? 'MOM Section 88 (Saturday Rest / Comp-Off Granted)'
        : 'MOM Gazetted Special Off-Day',
      category: 'gazetted_adhoc'
    });

    if (!added) return;
    setName('');
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
          {/* Holiday Name */}
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
              HOLIDAY NAME
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Singapore Polling Day"
              className="w-full px-3 py-2 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-body-sm"
            />
          </div>

          {/* Date Picker */}
          <div>
            <DatePickerField
              label={`DATE ${dayName ? `(${dayName})` : ''}`}
              value={date}
              onChange={setDate}
              required
              ariaLabel="Choose Special Holiday Date"
            />
          </div>

          {existingHoliday && <p role="alert" className="rounded-lg p-3 bg-surface-container text-on-surface text-sm">{existingHoliday.name} is already recorded on this date. No additional holiday is needed.</p>}
          {/* Statutory Auto-Calculations Notice */}
          {isSaturday && settings.saturdayCompOffEnabled && (
            <div className="p-2.5 rounded-xl bg-alert-warning-container text-alert-warning text-body-sm flex items-start gap-2 border border-alert-warning/20">
              <span className="material-symbols-outlined text-[18px] text-alert-warning shrink-0 mt-0.5">stars</span>
              <div>
                <span className="font-title-sm text-xs font-bold block">
                  Saturday Holiday: +1 Comp-Off Auto-Accrued!
                </span>
                <p className="mt-0.5 text-on-surface-variant text-[11.5px] leading-snug">
                  This holiday falls on a Saturday. Pursuant to MOM Section 88, it will automatically credit +1 Comp-Off Day to your Leave Year Cycle.
                </p>
              </div>
            </div>
          )}

          {isSunday && (
            <div className="p-2.5 rounded-xl bg-surface-container-low text-on-surface-variant text-body-sm flex items-start gap-2 border border-surface-container">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0 mt-0.5">info</span>
              <div>
                <span className="font-title-sm text-xs font-semibold text-on-surface block">
                  Sunday Holiday: Monday Observed
                </span>
                <p className="mt-0.5 text-[11.5px] leading-snug">
                  Falls on a Sunday; the following Monday is designated as a paid statutory day in lieu.
                </p>
              </div>
            </div>
          )}

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
              disabled={!!existingHoliday}
              className="flex-1 py-2.5 rounded-full bg-holiday-public text-white font-label-md text-label-md font-semibold hover:opacity-95 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Special Holiday
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
