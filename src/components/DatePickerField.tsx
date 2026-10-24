import React, { useState, useRef, useEffect } from 'react';
import {
  formatDateDDMMYYYY,
  parseDDMMYYYYToISO,
  formatDDMMYYYYWithAutoSlash,
  isValidISODate,
  ALL_GAZETTED_HOLIDAYS
} from '../data/singaporeHolidays2026';

export interface DatePickerFieldProps {
  label?: string;
  value: string; // ISO string 'YYYY-MM-DD'
  onChange: (isoDate: string) => void;
  placeholder?: string;
  required?: boolean;
  min?: string; // ISO string 'YYYY-MM-DD'
  max?: string; // ISO string 'YYYY-MM-DD'
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  id?: string;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = 'DD/MM/YYYY',
  required = false,
  min,
  max,
  disabled = false,
  className = '',
  ariaLabel,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value && isValidISODate(value) ? formatDateDDMMYYYY(value) : '');

  // Year and month for current calendar view
  const initialDate = value && isValidISODate(value) ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-indexed
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal display text if value changes externally
  useEffect(() => {
    inputRef.current?.setCustomValidity('');
    if (value && isValidISODate(value)) {
      setInputValue(formatDateDDMMYYYY(value));
      const d = new Date(value + 'T00:00:00');
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    } else if (!value) {
      setInputValue('');
    }
  }, [value]);

  // Click outside to dismiss calendar popover
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowYearDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDDMMYYYYWithAutoSlash(e.target.value, inputValue);
    setInputValue(formatted);
    const parsed = formatted.length === 10 ? parseDDMMYYYYToISO(formatted) : null;
    const valid = !!parsed && isValidISODate(parsed) && (!min || parsed >= min) && (!max || parsed <= max);
    e.currentTarget.setCustomValidity(!formatted || valid ? '' : max && parsed && parsed > max
      ? `Date must be on or before ${formatDateDDMMYYYY(max)}.`
      : min && parsed && parsed < min ? `Date must be on or after ${formatDateDDMMYYYY(min)}.`
      : 'Enter a valid date in DD/MM/YYYY format.');

    if (formatted.length === 10) {
      const parsed = parseDDMMYYYYToISO(formatted);
      if (parsed && isValidISODate(parsed)) {
        if (min && parsed < min) return;
        if (max && parsed > max) return;
        onChange(parsed);
        const d = new Date(parsed + 'T00:00:00');
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    } else if (!formatted) {
      onChange('');
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (isoDate: string) => {
    inputRef.current?.setCustomValidity('');
    onChange(isoDate);
    setInputValue(formatDateDDMMYYYY(isoDate));
    setIsOpen(false);
    setShowYearDropdown(false);
  };

  // Generate days for viewMonth and viewYear
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const todayIso = new Date().toISOString().slice(0, 10);

  // Year options for fast jump
  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentYear - 30; y <= currentYear + 10; y++) {
    yearOptions.push(y);
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {/* Formatted Text Input with Auto-Slash */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9/]*"
          maxLength={10}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={label || ariaLabel || 'Date'}
          value={inputValue}
          onChange={handleTextChange}
          onFocus={() => {
            // Keep open or open if empty
          }}
          className="w-full pl-3 pr-11 py-2 h-10 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary z-0"
        />

        {/* Right Calendar Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={disabled}
          className={`absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-colors border cursor-pointer z-10 active:scale-95 shadow-2xs ${
            isOpen
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-surface-container hover:bg-surface-container-high text-primary border-surface-container'
          }`}
          title="Open interactive calendar"
          aria-label={ariaLabel || 'Open calendar popover'}
        >
          <span className="material-symbols-outlined text-[19px]">calendar_month</span>
        </button>
      </div>

      {/* Floating Mini Calendar Popover */}
      {isOpen && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-50 w-72 max-w-[calc(100vw-3rem)] sm:w-80 p-3.5 bg-surface-card rounded-2xl shadow-2xl border border-surface-container animate-in fade-in zoom-in-95"
          role="dialog"
          aria-label="Calendar date selector"
        >
          {/* Calendar Header with Month/Year Navigation */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface cursor-pointer transition-colors"
              aria-label="Previous Month"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowYearDropdown((prev) => !prev)}
                className="px-2 py-1 rounded-lg hover:bg-surface-container text-on-surface font-semibold text-sm flex items-center gap-1 cursor-pointer transition-colors"
                title="Select month and year"
              >
                <span>{monthNames[viewMonth]} {viewYear}</span>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                  {showYearDropdown ? 'arrow_drop_up' : 'arrow_drop_down'}
                </span>
              </button>

              {/* Year Selector Dropdown for Fast Jumping (e.g. DOJ) */}
              {showYearDropdown && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-36 max-h-48 overflow-y-auto bg-surface-container-highest rounded-xl shadow-xl border border-surface-container p-1 z-60 grid grid-cols-2 gap-1 text-center text-xs">
                  {yearOptions.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        setViewYear(yr);
                        setShowYearDropdown(false);
                      }}
                      className={`py-1.5 rounded-md cursor-pointer transition-colors ${
                        yr === viewYear
                          ? 'bg-primary text-on-primary font-bold'
                          : 'hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface cursor-pointer transition-colors"
              aria-label="Next Month"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          {/* Day of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-[11px] text-on-surface-variant mb-1.5">
            <span className="text-error/80">Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span className="text-primary/80">Sa</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty padding slots before 1st day */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-8" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = value === dateStr;
              const isToday = todayIso === dateStr;
              const dayOfWeek = (firstDayOfWeek + idx) % 7;
              const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;

              const holiday = ALL_GAZETTED_HOLIDAYS.find((h) => h.date === dateStr || h.observedDate === dateStr);
              const isDisabled = Boolean((min && dateStr < min) || (max && dateStr > max));

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDate(dateStr)}
                  title={holiday ? `${holiday.name} (Public Holiday)` : dateStr}
                  className={`h-8 rounded-lg text-xs font-medium flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                    isDisabled
                      ? 'opacity-30 cursor-not-allowed text-on-surface-variant'
                      : isSelected
                      ? 'bg-primary text-on-primary font-bold shadow-xs scale-105'
                      : isToday
                      ? 'bg-primary-container text-primary font-bold ring-1 ring-primary'
                      : isWeekendDay
                      ? 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                      : 'hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <span>{dayNum}</span>
                  {/* Public holiday indicator dot */}
                  {holiday && (
                    <span
                      className={`w-1 h-1 rounded-full absolute bottom-1 ${
                        isSelected ? 'bg-white' : 'bg-holiday-public'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Footer Action Buttons */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-surface-container text-xs">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const nowIso = now.toISOString().slice(0, 10);
                if ((!min || nowIso >= min) && (!max || nowIso <= max)) {
                  handleSelectDate(nowIso);
                }
              }}
              className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-primary font-semibold cursor-pointer transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 rounded-full bg-primary text-on-primary font-semibold hover:opacity-90 cursor-pointer transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
