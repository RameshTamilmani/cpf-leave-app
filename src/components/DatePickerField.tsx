import React, { useState, useRef, useEffect } from 'react';
import { formatDateDDMMYYYY, parseDDMMYYYYToISO, formatDDMMYYYYWithAutoSlash, isValidISODate, isWeekend } from '../data/singaporeHolidays2026';
import { useLeave } from '../context/LeaveContext';

interface DatePickerFieldProps {
  label: string;
  value: string; // ISO string YYYY-MM-DD
  inputValue: string; // DD/MM/YYYY
  onChange: (isoDate: string, formattedDDMMYYYY: string) => void;
  minDate?: string; // ISO string YYYY-MM-DD
  maxDate?: string; // ISO string YYYY-MM-DD
  placeholder?: string;
  required?: boolean;
  className?: string;
  id?: string;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  inputValue,
  onChange,
  minDate,
  maxDate,
  placeholder = 'DD/MM/YYYY',
  required = false,
  className = '',
  id
}) => {
  const { allHolidays, todayDateStr } = useLeave();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const nativeInputRef = useRef<HTMLInputElement>(null);

  // Initialize calendar view year/month based on current value or today
  const activeDate = isValidISODate(value) ? value : (isValidISODate(todayDateStr) ? todayDateStr : '2026-10-12');
  const activeObj = new Date(activeDate + 'T00:00:00');
  const [viewYear, setViewYear] = useState<number>(activeObj.getFullYear() || 2026);
  const [viewMonth, setViewMonth] = useState<number>(activeObj.getMonth() ?? 9);

  // Update calendar view when value changes externally
  useEffect(() => {
    if (isValidISODate(value)) {
      const d = new Date(value + 'T00:00:00');
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Click outside listener to dismiss popover
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const iso = `${viewYear}-${monthStr}-${dayStr}`;
    const formatted = formatDateDDMMYYYY(iso);
    onChange(iso, formatted);
    setIsOpen(false);
  };

  const handleGoToToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = isValidISODate(todayDateStr) ? todayDateStr : new Date().toISOString().slice(0, 10);
    const todayObj = new Date(today + 'T00:00:00');
    setViewYear(todayObj.getFullYear());
    setViewMonth(todayObj.getMonth());
    onChange(today, formatDateDDMMYYYY(today));
    setIsOpen(false);
  };

  // Build calendar matrix (Monday start)
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
  const totalDays = lastDayOfMonth.getDate();
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  const daysInGrid: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    daysInGrid.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    daysInGrid.push(d);
  }

  // Handle typing numbers with auto-slash
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = formatDDMMYYYYWithAutoSlash(rawVal, inputValue);
    if (formatted.length === 10) {
      const parsedIso = parseDDMMYYYYToISO(formatted);
      if (parsedIso && isValidISODate(parsedIso)) {
        onChange(parsedIso, formatted);
        return;
      }
    }
    onChange('', formatted);
  };

  // Fallback to launch OS native picker if desired
  const handleTriggerNative = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nativeInputRef.current) {
      try {
        if (typeof nativeInputRef.current.showPicker === 'function') {
          nativeInputRef.current.showPicker();
          return;
        }
      } catch (err) {
        console.warn('Native showPicker unsupported/restricted:', err);
      }
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className={`relative flex flex-col ${className}`}>
      {label && (
        <label htmlFor={id} className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {/* Left Interactive Calendar Icon */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer z-10"
          title="Open interactive calendar"
          aria-label={`Open ${label} calendar`}
        >
          <span className="material-symbols-outlined text-[19px]">calendar_today</span>
        </button>

        {/* Text Input with auto-slash (typing numbers only) */}
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9/]*"
          required={required}
          placeholder={placeholder}
          maxLength={10}
          value={inputValue}
          onChange={handleInputChange}
          onClick={() => {
            // If empty, open picker to assist
            if (!inputValue) setIsOpen(true);
          }}
          className="w-full pl-10 pr-12 py-2 h-10 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary z-0 transition-colors"
        />

        {/* Right Calendar Action Button - Opens the Interactive Mini-Calendar Popover */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center transition-all border cursor-pointer z-10 active:scale-95 shadow-2xs ${
            isOpen
              ? 'bg-primary text-on-primary border-primary ring-2 ring-primary/20'
              : 'bg-surface-container hover:bg-surface-container-high text-primary border-surface-container'
          }`}
          title="Choose date from calendar"
          aria-label={`Choose ${label} from calendar`}
        >
          <span className="material-symbols-outlined text-[19px]">calendar_month</span>
        </button>

        {/* Hidden native input for OS-level fallback */}
        <input
          ref={nativeInputRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={isValidISODate(value) ? value : ''}
          min={minDate}
          max={maxDate}
          onChange={(e) => {
            const iso = e.target.value;
            if (iso && isValidISODate(iso)) {
              onChange(iso, formatDateDDMMYYYY(iso));
              setIsOpen(false);
            }
          }}
          className="sr-only pointer-events-none"
        />
      </div>

      {/* Interactive Floating Mini-Calendar Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-72 sm:w-80 bg-surface-card rounded-2xl shadow-2xl border border-surface-container p-3.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Popover Header: Month & Year Navigator */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-container">
            <div className="flex items-center gap-1">
              <span className="font-title-sm text-title-sm font-bold text-on-surface">
                {monthNames[viewMonth]} {viewYear}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleGoToToday}
                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                title="Jump to today"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                title="Previous month"
                aria-label="Previous month"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                title="Next month"
                aria-label="Next month"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              <button
                type="button"
                onClick={handleTriggerNative}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                title="Open system native calendar"
                aria-label="Open system native calendar"
              >
                <span className="material-symbols-outlined text-[16px]">devices</span>
              </button>
            </div>
          </div>

          {/* Weekday Labels (Mon - Sun) */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day, idx) => (
              <span
                key={day}
                className={`text-[11px] font-bold ${
                  idx >= 5 ? 'text-holiday-public/80' : 'text-on-surface-variant/70'
                }`}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysInGrid.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-8 w-8" />;
              }

              const monthStr = String(viewMonth + 1).padStart(2, '0');
              const dayStr = String(day).padStart(2, '0');
              const curIso = `${viewYear}-${monthStr}-${dayStr}`;

              const isSelected = value === curIso;
              const isToday = curIso === todayDateStr;
              const isWeekendDay = isWeekend(curIso);

              // Check if Singapore Public or Special Holiday
              const holiday = allHolidays.find(
                (h) => h.date === curIso || h.observedDate === curIso
              );

              // Check min and max date bounds
              const isDisabled =
                (minDate && curIso < minDate) || (maxDate && curIso > maxDate);

              return (
                <button
                  key={curIso}
                  type="button"
                  disabled={Boolean(isDisabled)}
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 mx-auto rounded-lg flex flex-col items-center justify-center relative text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-on-primary shadow-xs font-bold'
                      : isToday
                      ? 'border-2 border-primary text-primary font-bold hover:bg-primary-container/30'
                      : holiday
                      ? 'bg-holiday-public-container text-holiday-public-on-container font-bold hover:opacity-90'
                      : isWeekendDay
                      ? 'text-on-surface-variant/60 hover:bg-surface-container'
                      : 'text-on-surface hover:bg-surface-container'
                  } ${isDisabled ? 'opacity-25 cursor-not-allowed pointer-events-none line-through' : ''}`}
                  title={holiday ? `${holiday.name} (${holiday.category})` : isWeekendDay ? 'Weekend' : undefined}
                >
                  <span>{day}</span>
                  {holiday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-holiday-public absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Helper with Quick Close */}
          <div className="mt-2.5 pt-2 border-t border-surface-container flex items-center justify-between text-[11px] text-on-surface-variant">
            <span className="truncate max-w-[170px]">
              {isValidISODate(value) ? formatDateDDMMYYYY(value) : 'Select a date'}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-primary font-semibold hover:underline cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
