import { cycleDayLimit, validCycle } from '../utils/leaveAccounting';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import React, { useState, useEffect } from 'react';
import { useLeave } from '../context/LeaveContext';
import { formatDateDDMMYYYY } from '../data/singaporeHolidays2026';

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
  const { settings, resetCycleWithWarningConfirm } = useLeave();

  const [startMonth, setStartMonth] = useState<number>(settings.cycleStartMonth || 6);
  const [startDay, setStartDay] = useState<number>(settings.cycleStartDay || 13);
  const [endMonth, setEndMonth] = useState<number>(settings.cycleEndMonth || 6);
  const [endDay, setEndDay] = useState<number>(settings.cycleEndDay || 12);
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowWarningModal(false);
      const sm=settings.cycleStartMonth??6,sd=settings.cycleStartDay??13,em=settings.cycleEndMonth??6,ed=settings.cycleEndDay??12;
      setStartMonth(sm);setStartDay(sd);setEndMonth(em);setEndDay(ed);
      setSelectedPreset(sm===6&&sd===13&&em===6&&ed===12?'jun13':sm===1&&sd===1&&em===12&&ed===31?'jan1':sm===4&&sd===1&&em===3&&ed===31?'apr1':sm===7&&sd===1&&em===6&&ed===30?'jul1':'custom');
    }
  }, [isOpen, settings]);

  useModalScrollLock(isOpen);

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

  const getComputedCycleTitle = () => {
    if (startMonth === 6 && startDay === 13 && endMonth === 6 && endDay === 12) {
      return 'Jun 13 – Jun 12 (Next Year)';
    } else if (startMonth === 1 && startDay === 1 && endMonth === 12 && endDay === 31) {
      return 'Calendar Year (1 Jan – 31 Dec)';
    } else if (startMonth === 4 && startDay === 1 && endMonth === 3 && endDay === 31) {
      return 'Financial Year (1 Apr – 31 Mar)';
    } else {
      return `${startDay} ${monthShort(startMonth)} – ${endDay} ${monthShort(endMonth)} (Next Year)`;
    }
  };

  const handleOpenWarning = () => {
    if(validCycle(startMonth,startDay,endMonth,endDay))setShowWarningModal(true);
  };

  const handleConfirmResetAndSave = async () => {
    if(!validCycle(startMonth,startDay,endMonth,endDay))return;
    const cycleTitle = getComputedCycleTitle();

    const saved = await resetCycleWithWarningConfirm({
      cycle: cycleTitle,
      cycleStartMonth: startMonth,
      cycleStartDay: startDay,
      cycleEndMonth: endMonth,
      cycleEndDay: endDay
    });

    if(!saved)return;
    setShowWarningModal(false);
    onClose();
  };

  // Preview the selected leave-year dates
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
                Choose the start and end dates for your leave year.
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
            Cycle Presets
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
              <span className="font-label-sm text-label-sm opacity-80">Company cycle</span>
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
              <span className="font-label-sm text-label-sm opacity-80">Calendar year</span>
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
              <span className="font-label-sm text-label-sm opacity-80">Mid-year</span>
            </button>
          </div>
        </div>

        {/* Custom Start & End Date Selectors */}
        <div className="bg-surface-container-low p-3.5 rounded-xl border border-surface-container flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-title-sm text-title-sm text-on-surface font-semibold">
              Custom dates
            </span>
          </div>

          {/* Cycle Starts */}
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
              Start Date
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={startMonth}
                onChange={(e) => {
                  setStartMonth(Number(e.target.value));
                  setStartDay(day=>Math.min(day,cycleDayLimit(Number(e.target.value))));
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
                {Array.from({ length: cycleDayLimit(startMonth) }, (_, i) => i + 1).map((d) => (
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
              End Date {isCrossYear ? '(Next Year)' : ''}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={endMonth}
                onChange={(e) => {
                  setEndMonth(Number(e.target.value));
                  setEndDay(day=>Math.min(day,cycleDayLimit(Number(e.target.value))));
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
                {Array.from({ length: cycleDayLimit(endMonth) }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-low border border-surface-container p-3">
          <p className="text-xs text-on-surface-variant">Selected cycle</p>
          <p className="mt-1 text-sm font-semibold text-on-surface">{formatDateDDMMYYYY(previewStartDateStr)} – {formatDateDDMMYYYY(previewEndDateStr)}</p>
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
            onClick={handleOpenWarning}
            disabled={!validCycle(startMonth,startDay,endMonth,endDay)}
            className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:opacity-95 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            Save Leave Cycle
          </button>
        </div>

        {/* Warning Confirmation Modal */}
        {showWarningModal && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
            onClick={() => setShowWarningModal(false)}
          >
            <div
              className="w-full max-w-sm bg-surface-card rounded-2xl p-5 shadow-2xl border border-error/30 flex flex-col gap-3.5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5 text-error">
                <div className="w-10 h-10 rounded-xl bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">warning</span>
                </div>
                <div>
                  <h3 className="font-title-md text-title-md font-bold text-on-surface">Change Leave Cycle?</h3>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-error-container/20 border border-error/20 text-xs text-on-surface leading-relaxed">
                <p>Changing the cycle clears leave records and resets balances. Your profile is kept.</p>
                <div className="mt-2 pt-2 border-t border-error/20 text-[11px] text-on-surface">
                  <strong>New Cycle:</strong> {getComputedCycleTitle()}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowWarningModal(false)}
                  className="flex-1 py-2.5 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-variant transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResetAndSave}
                  className="flex-1 py-2.5 rounded-full bg-error text-on-error font-label-md text-label-md font-semibold hover:bg-error/90 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  Confirm Change
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
