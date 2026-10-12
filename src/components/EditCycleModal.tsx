import React, { useState, useEffect } from 'react';
import { useLeave } from '../context/LeaveContext';

interface EditCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MONTHS = [
  { value: 1, label: 'January (Jan)' },
  { value: 2, label: 'February (Feb)' },
  { value: 3, label: 'March (Mar)' },
  { value: 4, label: 'April (Apr)' },
  { value: 5, label: 'May (May)' },
  { value: 6, label: 'June (Jun)' },
  { value: 7, label: 'July (Jul)' },
  { value: 8, label: 'August (Aug)' },
  { value: 9, label: 'September (Sep)' },
  { value: 10, label: 'October (Oct)' },
  { value: 11, label: 'November (Nov)' },
  { value: 12, label: 'December (Dec)' }
];

export const EditCycleModal: React.FC<EditCycleModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, allHolidays, showToast } = useLeave();

  const [startMonth, setStartMonth] = useState<number>(settings.cycleStartMonth || 6);
  const [startDay, setStartDay] = useState<number>(settings.cycleStartDay || 13);
  const [endMonth, setEndMonth] = useState<number>(settings.cycleEndMonth || 6);
  const [endDay, setEndDay] = useState<number>(settings.cycleEndDay || 12);
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');

  useEffect(() => {
    if (isOpen) {
      if (settings.cycle.includes('Jun 13') || (settings.cycleStartMonth === 6 && settings.cycleStartDay === 13)) {
        setStartMonth(6);
        setStartDay(13);
        setEndMonth(6);
        setEndDay(12);
        setSelectedPreset('jun13');
      } else if (settings.cycle.includes('1 Apr') || (settings.cycleStartMonth === 4 && settings.cycleStartDay === 1)) {
        setStartMonth(4);
        setStartDay(1);
        setEndMonth(3);
        setEndDay(31);
        setSelectedPreset('apr1');
      } else if (settings.cycle.includes('1 Jan') || (settings.cycleStartMonth === 1 && settings.cycleStartDay === 1)) {
        setStartMonth(1);
        setStartDay(1);
        setEndMonth(12);
        setEndDay(31);
        setSelectedPreset('jan1');
      } else {
        setStartMonth(settings.cycleStartMonth || 6);
        setStartDay(settings.cycleStartDay || 13);
        setEndMonth(settings.cycleEndMonth || 6);
        setEndDay(settings.cycleEndDay || 12);
        setSelectedPreset('custom');
      }
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const monthShort = (m: number) => MONTHS[m - 1]?.label.slice(0, 3) || 'Jan';

  const applyPreset = (preset: 'jun13' | 'jan1' | 'apr1' | 'jul1') => {
    setSelectedPreset(preset);
    if (preset === 'jun13') {
      setStartMonth(6);
      setStartDay(13);
      setEndMonth(6);
      setEndDay(12);
    } else if (preset === 'jan1') {
      setStartMonth(1);
      setStartDay(1);
      setEndMonth(12);
      setEndDay(31);
    } else if (preset === 'apr1') {
      setStartMonth(4);
      setStartDay(1);
      setEndMonth(3);
      setEndDay(31);
    } else if (preset === 'jul1') {
      setStartMonth(7);
      setStartDay(1);
      setEndMonth(6);
      setEndDay(30);
    }
  };

  const handleSave = () => {
    let cycleTitle = '';
    if (startMonth === 6 && startDay === 13 && endMonth === 6 && endDay === 12) {
      cycleTitle = 'Jun 13 – Jun 12 (Next Year)';
    } else if (startMonth === 1 && startDay === 1 && endMonth === 12 && endDay === 31) {
      cycleTitle = 'Calendar Year (1 Jan – 31 Dec)';
    } else if (startMonth === 4 && startDay === 1 && endMonth === 3 && endDay === 31) {
      cycleTitle = 'Financial Year (1 Apr – 31 Mar)';
    } else {
      cycleTitle = `${startDay} ${monthShort(startMonth)} – ${endDay} ${monthShort(endMonth)} (Next Year)`;
    }

    updateSettings({
      cycle: cycleTitle,
      cycleStartMonth: startMonth,
      cycleStartDay: startDay,
      cycleEndMonth: endMonth,
      cycleEndDay: endDay
    });

    const accruedText = previewSaturdayHolidays.length > 0
      ? ` • ${previewSaturdayHolidays.length} Saturday PH comp-off day${previewSaturdayHolidays.length > 1 ? 's' : ''} auto-credited!`
      : '';
    showToast(`Leave year cycle updated: ${cycleTitle}${accruedText}`);
    onClose();
  };

  // Live auto-calculation of Comp-Off days for the current modal selection
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;
  const currentDayNum = now.getDate();

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

  const previewStartDateStr = `${activeStartYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
  const previewEndDateStr = `${activeEndYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

  const previewHolidaysInCycle = allHolidays.filter(
    (h) => h.date >= previewStartDateStr && h.date <= previewEndDateStr
  );

  const previewSaturdayHolidays = previewHolidaysInCycle.filter((h) => {
    const d = new Date(h.date + 'T00:00:00');
    return d.getDay() === 6 || Boolean(h.isCompOffEligible);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface-card rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 border border-surface-container flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Handle */}
        <div className="w-12 h-1.5 rounded-full bg-surface-variant self-center mb-1 sm:hidden" />

        <div className="flex items-center justify-between pb-1 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">event_repeat</span>
            </div>
            <div>
              <h3 className="font-title-md text-title-md font-bold text-on-surface">
                Edit Leave Year Cycle
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Configure annual entitlement calculation window
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Quick Presets Selection */}
        <div className="flex flex-col gap-2">
          <label className="font-label-md text-label-md text-on-surface-variant font-semibold">
            CYCLE PRESETS
          </label>
          <div className="grid grid-cols-2 gap-2">
            {/* User Requested Preset: Jun 13 - Jun 12 */}
            <button
              type="button"
              onClick={() => applyPreset('jun13')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                selectedPreset === 'jun13' || (startMonth === 6 && startDay === 13)
                  ? 'bg-primary-fixed text-on-primary-fixed border-primary font-semibold shadow-xs'
                  : 'bg-surface-container-low text-on-surface border-surface-container hover:bg-surface-container'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-title-sm text-title-sm">Jun 13 – Jun 12</span>
                <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
              </div>
              <span className="font-label-sm text-label-sm opacity-80">Company Policy Cycle</span>
            </button>

            {/* Calendar Year: 1 Jan - 31 Dec */}
            <button
              type="button"
              onClick={() => applyPreset('jan1')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                selectedPreset === 'jan1' && !(startMonth === 6 && startDay === 13)
                  ? 'bg-primary-fixed text-on-primary-fixed border-primary font-semibold shadow-xs'
                  : 'bg-surface-container-low text-on-surface border-surface-container hover:bg-surface-container'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-title-sm text-title-sm">1 Jan – 31 Dec</span>
                <span className="material-symbols-outlined text-[18px] opacity-60">calendar_today</span>
              </div>
              <span className="font-label-sm text-label-sm opacity-80">Standard Calendar</span>
            </button>

            {/* Financial Year: 1 Apr - 31 Mar */}
            <button
              type="button"
              onClick={() => applyPreset('apr1')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                selectedPreset === 'apr1'
                  ? 'bg-primary-fixed text-on-primary-fixed border-primary font-semibold shadow-xs'
                  : 'bg-surface-container-low text-on-surface border-surface-container hover:bg-surface-container'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-title-sm text-title-sm">1 Apr – 31 Mar</span>
                <span className="material-symbols-outlined text-[18px] opacity-60">account_balance</span>
              </div>
              <span className="font-label-sm text-label-sm opacity-80">Financial Year</span>
            </button>

            {/* Mid-Year: 1 Jul - 30 Jun */}
            <button
              type="button"
              onClick={() => applyPreset('jul1')}
              className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                selectedPreset === 'jul1'
                  ? 'bg-primary-fixed text-on-primary-fixed border-primary font-semibold shadow-xs'
                  : 'bg-surface-container-low text-on-surface border-surface-container hover:bg-surface-container'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-title-sm text-title-sm">1 Jul – 30 Jun</span>
                <span className="material-symbols-outlined text-[18px] opacity-60">date_range</span>
              </div>
              <span className="font-label-sm text-label-sm opacity-80">Mid-Year Fiscal</span>
            </button>
          </div>
        </div>

        {/* Custom Start & End Date Selectors */}
        <div className="bg-surface-container-low p-3.5 rounded-xl border border-surface-container flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-title-sm text-title-sm text-on-surface font-semibold">
              Customize Cycle Boundaries
            </span>
            <span className="font-label-sm text-label-sm text-primary font-medium">Annual Window</span>
          </div>

          {/* Cycle Starts */}
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
              CYCLE STARTS ON
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={startMonth}
                onChange={(e) => {
                  setStartMonth(Number(e.target.value));
                  setSelectedPreset('custom');
                }}
                className="px-3 py-2 rounded-lg border border-surface-outline bg-surface-container-lowest text-on-surface font-label-md focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                value={startDay}
                onChange={(e) => {
                  setStartDay(Number(e.target.value));
                  setSelectedPreset('custom');
                }}
                className="px-3 py-2 rounded-lg border border-surface-outline bg-surface-container-lowest text-on-surface font-label-md focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cycle Ends */}
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
              CYCLE ENDS ON (NEXT YEAR)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={endMonth}
                onChange={(e) => {
                  setEndMonth(Number(e.target.value));
                  setSelectedPreset('custom');
                }}
                className="px-3 py-2 rounded-lg border border-surface-outline bg-surface-container-lowest text-on-surface font-label-md focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                value={endDay}
                onChange={(e) => {
                  setEndDay(Number(e.target.value));
                  setSelectedPreset('custom');
                }}
                className="px-3 py-2 rounded-lg border border-surface-outline bg-surface-container-lowest text-on-surface font-label-md focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live Preview Box with Auto-Calculated Comp-Off Details */}
        <div className="p-3.5 rounded-xl bg-primary-fixed/25 border border-primary/20 flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5">verified</span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-title-sm text-title-sm font-bold text-on-surface">
                  Active Cycle: {startDay} {monthShort(startMonth)} – {endDay} {monthShort(endMonth)}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {previewStartDateStr} to {previewEndDateStr}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-snug">
                Annual and Sick leave allocations renew for this window.
              </p>
            </div>
          </div>

          {/* Auto-Calculated Comp-off Breakdown */}
          <div className="p-3 rounded-xl bg-surface-card border border-surface-container flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-title-sm text-title-sm font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-leave-compoff">stars</span>
                Auto-Calculated Comp-off Days
              </span>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-leave-compoff-container text-leave-compoff font-bold">
                +{previewSaturdayHolidays.length} Days
              </span>
            </div>

            {previewSaturdayHolidays.length > 0 ? (
              <div className="flex flex-col gap-1.5 pt-1.5 border-t border-surface-container">
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Saturday Public Holidays Detected in Cycle:
                </span>
                {previewSaturdayHolidays.map((h) => (
                  <div key={h.date} className="flex items-center justify-between text-body-sm py-0.5">
                    <span className="text-on-surface font-medium flex items-center gap-1.5">
                      <span>{h.emoji || '🇸🇬'}</span>
                      <span>{h.name}</span>
                      <span className="text-[11px] text-on-surface-variant">({h.date})</span>
                    </span>
                    <span className="font-label-sm text-label-sm text-leave-compoff font-semibold">
                      +1 Comp-off
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-on-surface-variant pt-1 border-t border-surface-container leading-tight">
                No Saturday gazetted holidays fall in this cycle. (You can also add special holidays anytime).
              </p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-variant transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:opacity-95 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            Save Leave Cycle
          </button>
        </div>
      </div>
    </div>
  );
};
