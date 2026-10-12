import React, { useState, useEffect } from 'react';
import { useLeave } from '../context/LeaveContext';
import { LeaveType, LeaveStatus } from '../types/leave';
import { calculateWorkingDays, getPublicHolidayForDate } from '../data/singaporeHolidays2026';

export const ApplyLeaveModal: React.FC = () => {
  const {
    isApplyModalOpen,
    applyModalConfig,
    closeApplyModal,
    addRecord,
    records,
    allHolidays,
    todayDateStr,
    alAvailable,
    slAvailable,
    coAvailable
  } = useLeave();

  const [type, setType] = useState<LeaveType>('AL');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationMode, setDurationMode] = useState<'full' | 'half-am' | 'half-pm'>('full');
  const [daysToDeduct, setDaysToDeduct] = useState<number>(1.0);
  const [isRetroactive, setIsRetroactive] = useState(false);
  const [refNo, setRefNo] = useState('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // When modal opens, initialize fields
  useEffect(() => {
    if (applyModalConfig.isOpen) {
      const selectedType = applyModalConfig.initialType || 'AL';
      setType(selectedType);

      // Default to initial date or current date
      const initial = applyModalConfig.initialDate || todayDateStr || '2026-10-12';
      setStartDate(initial);
      setEndDate(initial);
      setDurationMode('full');
      setDaysToDeduct(1.0);
      setValidationError(null);
      setIsRetroactive(applyModalConfig.initialStatus === 'retroactive');

      if (selectedType === 'SL') {
        setTitle('Medical Outpatient (MC)');
        setRefNo(`MC-SG-2026-${Math.floor(100 + Math.random() * 900)}`);
      } else if (selectedType === 'CO') {
        setTitle('Comp-Off Leave');
        setRefNo('');
      } else {
        setTitle('Annual Vacation');
        setRefNo('');
      }
    }
  }, [applyModalConfig]);

  // Calculate calendar days in selected range
  let calendarDays = 1;
  if (startDate && endDate) {
    const startObj = new Date(startDate + 'T00:00:00');
    const endObj = new Date(endDate + 'T00:00:00');
    if (endObj >= startObj) {
      calendarDays = Math.round((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    } else {
      calendarDays = 0;
    }
  }

  // Calculate maximum allowable days for the selected date range
  let maxAllowedDays = 1.0;
  if (durationMode === 'half-am' || durationMode === 'half-pm') {
    maxAllowedDays = 0.5;
  } else if (calendarDays <= 1) {
    maxAllowedDays = 1.0;
  } else {
    maxAllowedDays = calendarDays;
  }

  // Check for duplicate / overlapping leaves with existing records:
  const duplicateConflict = records.find((r) => {
    if (!startDate || !endDate) return false;
    // Check if intervals overlap
    const overlaps = startDate <= r.endDate && endDate >= r.startDate;
    if (!overlaps) return false;

    // Exception: Single-day Half-Day AM and Half-Day PM can co-exist on the same day
    const isCurrentHalfDay = durationMode === 'half-am' || durationMode === 'half-pm';
    const isExistingHalfDay = r.halfDay === 'am' || r.halfDay === 'pm';
    if (startDate === endDate && r.startDate === r.endDate && isCurrentHalfDay && isExistingHalfDay) {
      const currentHalf = durationMode === 'half-am' ? 'am' : 'pm';
      if (currentHalf !== r.halfDay) {
        return false;
      }
    }

    return true;
  });

  const isDuplicate = Boolean(duplicateConflict);

  // Automatically recalculate recommended days whenever dates, type, or duration change
  useEffect(() => {
    if (!startDate || !endDate) return;

    if (durationMode === 'half-am' || durationMode === 'half-pm') {
      setDaysToDeduct(0.5);
      return;
    }

    if (startDate === endDate) {
      setDaysToDeduct(1.0);
      return;
    }

    if (endDate > startDate) {
      const startObj = new Date(startDate + 'T00:00:00');
      const endObj = new Date(endDate + 'T00:00:00');
      const totalCalendarDays = Math.round((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const workingDays = calculateWorkingDays(startDate, endDate, allHolidays);

      if (type === 'SL') {
        // Sick Leave / MC covers all calendar days prescribed
        setDaysToDeduct(Math.min(totalCalendarDays, Math.max(1.0, totalCalendarDays)));
      } else {
        // Annual leave: working days if > 0, else total calendar days
        const target = workingDays > 0 ? workingDays : Math.max(1.0, totalCalendarDays);
        setDaysToDeduct(Math.min(totalCalendarDays, target));
      }
    }
  }, [startDate, endDate, durationMode, type]);

  // Whenever daysToDeduct or dates change, enforce validation
  useEffect(() => {
    if (startDate && endDate && endDate < startDate) {
      setValidationError('End date cannot be earlier than start date.');
      return;
    }

    if (duplicateConflict) {
      const spanStr =
        duplicateConflict.startDate === duplicateConflict.endDate
          ? duplicateConflict.startDate
          : `${duplicateConflict.startDate} to ${duplicateConflict.endDate}`;
      setValidationError(
        `Duplicate leave detected: You already have a booked leave '${duplicateConflict.title}' (${duplicateConflict.type}) for ${spanStr}. Duplicate leaves are not allowed for the same date.`
      );
      return;
    }

    if (daysToDeduct > maxAllowedDays) {
      setValidationError(
        `Invalid duration: Selected range is ${calendarDays} day${calendarDays !== 1 ? 's' : ''} (${startDate}${startDate !== endDate ? ` to ${endDate}` : ''}), but ${daysToDeduct} days is specified. Maximum allowed is ${maxAllowedDays} day${maxAllowedDays !== 1 ? 's' : ''}.`
      );
      return;
    }

    const available = type === 'AL' ? alAvailable : type === 'SL' ? slAvailable : coAvailable;
    if (daysToDeduct > available) {
      setValidationError(
        `Insufficient quota: You only have ${available} ${type} day${available !== 1 ? 's' : ''} available, cannot deduct ${daysToDeduct} days.`
      );
      return;
    }

    setValidationError(null);
  }, [duplicateConflict, daysToDeduct, maxAllowedDays, calendarDays, startDate, endDate, type, alAvailable, slAvailable, coAvailable]);

  if (!isApplyModalOpen) return null;

  const holidayOnStart = getPublicHolidayForDate(startDate);

  const getAvailableBalance = () => {
    if (type === 'AL') return alAvailable;
    if (type === 'SL') return slAvailable;
    return coAvailable;
  };

  const isExceedingRange = daysToDeduct > maxAllowedDays;
  const isExceedingQuota = daysToDeduct > getAvailableBalance();
  const isInvalidDate = Boolean(startDate && endDate && endDate < startDate);
  const isFormInvalid = Boolean(isDuplicate || isExceedingRange || isExceedingQuota || isInvalidDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      setValidationError('Please select valid start and end dates.');
      return;
    }

    if (endDate < startDate) {
      setValidationError('End date cannot be earlier than start date.');
      return;
    }

    if (duplicateConflict) {
      const spanStr =
        duplicateConflict.startDate === duplicateConflict.endDate
          ? duplicateConflict.startDate
          : `${duplicateConflict.startDate} to ${duplicateConflict.endDate}`;
      setValidationError(
        `Duplicate leave detected: You already have a booked leave '${duplicateConflict.title}' (${duplicateConflict.type}) on ${spanStr}. Duplicate leaves are not allowed for the same date.`
      );
      return;
    }

    // Strict validation: cannot deduct more days than the selected date range allows!
    if (daysToDeduct > maxAllowedDays) {
      setValidationError(
        `You selected a ${calendarDays}-day date range (${startDate} to ${endDate}), but entered ${daysToDeduct} days. Maximum allowed is ${maxAllowedDays} day(s).`
      );
      return;
    }

    if (daysToDeduct > getAvailableBalance()) {
      setValidationError(
        `Requested ${daysToDeduct} days exceeds your available ${type} quota of ${getAvailableBalance()} day(s).`
      );
      return;
    }

    const finalTitle = title.trim() || (type === 'AL' ? 'Annual Leave' : type === 'SL' ? 'Medical Leave (MC)' : 'Comp-Off');
    const finalDays = Math.max(0.5, Number(daysToDeduct) || 1.0);
    const status: LeaveStatus = isRetroactive ? 'retroactive' : 'planned';
    const halfDay = durationMode === 'half-am' ? 'am' : durationMode === 'half-pm' ? 'pm' : 'full';

    addRecord({
      type,
      title: finalTitle,
      startDate,
      endDate,
      days: finalDays,
      halfDay,
      status,
      refNo: refNo.trim() || undefined,
      notes: notes.trim() || undefined
    });

    closeApplyModal();
  };

  const remainingBalanceAfter = Math.max(0, getAvailableBalance() - daysToDeduct);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
      <div
        className="w-full max-w-lg bg-surface-card rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 border border-surface-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Handle */}
        <div className="w-12 h-1.5 rounded-full bg-surface-variant self-center mt-3 mb-1 sm:hidden" />

        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-semibold">
              <span className="material-symbols-outlined text-[20px]">event_note</span>
            </div>
            <div>
              <h2 className="font-title-md text-title-md text-on-surface font-bold">Apply / Log Leave</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Singapore MOM Statutory Compliant</p>
            </div>
          </div>
          <button
            onClick={closeApplyModal}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* Leave Type Selector Chips */}
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant font-semibold block mb-2">
              LEAVE CATEGORY
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('AL');
                  setTitle('Annual Vacation');
                }}
                className={`py-2 px-3 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                  type === 'AL'
                    ? 'bg-leave-annual-container text-leave-annual-on-container border-leave-annual font-semibold shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant border-transparent hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-leave-annual">beach_access</span>
                <span className="font-label-sm text-label-sm">Annual (AL)</span>
                <span className="text-[10px] opacity-80">{alAvailable} Available</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('SL');
                  setTitle('Medical Outpatient (MC)');
                  if (!refNo) setRefNo(`MC-SG-2026-${Math.floor(100 + Math.random() * 900)}`);
                }}
                className={`py-2 px-3 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                  type === 'SL'
                    ? 'bg-leave-sick-container text-leave-sick-on-container border-leave-sick font-semibold shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant border-transparent hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-leave-sick">medical_services</span>
                <span className="font-label-sm text-label-sm">Sick (SL)</span>
                <span className="text-[10px] opacity-80">{slAvailable} Available</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('CO');
                  setTitle('Comp-Off Leave');
                }}
                className={`py-2 px-3 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                  type === 'CO'
                    ? 'bg-leave-compoff-container text-leave-compoff-on-container border-leave-compoff font-semibold shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant border-transparent hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-leave-compoff">update</span>
                <span className="font-label-sm text-label-sm">Comp-Off</span>
                <span className="text-[10px] opacity-80">{coAvailable} Available</span>
              </button>
            </div>
          </div>

          {/* Retroactive / Past Leave Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-primary">history_toggle_off</span>
              <div>
                <span className="font-title-sm text-title-sm text-on-surface font-semibold block">Retroactive / Past MC</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Log medical slips or past days in FY 2026</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isRetroactive}
                onChange={(e) => setIsRetroactive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* Title / Description */}
          <div>
            <label className="font-label-md text-label-md text-on-surface-variant font-semibold block mb-1">
              {type === 'SL' ? 'CLINIC / MC DESCRIPTION' : 'REASON / LEAVE TITLE'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'SL' ? 'e.g., Raffles Medical Clinic (Fever)' : 'e.g., Songkran Getaway, Family Leave'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-body-md"
            />
          </div>

          {/* Dates & Duration Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
                START DATE
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  const newStart = e.target.value;
                  setStartDate(newStart);
                  if (!endDate || endDate < newStart) {
                    setEndDate(newStart);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface font-label-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
                END DATE
              </label>
              <input
                type="date"
                required
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface font-label-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Duration Mode Selector */}
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
              DURATION SELECTION
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDurationMode('full')}
                className={`py-2 text-center rounded-lg font-label-sm text-label-sm border cursor-pointer transition-colors ${
                  durationMode === 'full'
                    ? 'bg-primary-fixed text-on-primary-fixed border-primary font-semibold'
                    : 'bg-surface-container-low border-surface-container text-on-surface-variant'
                }`}
              >
                Full Day(s)
              </button>
              <button
                type="button"
                onClick={() => {
                  setDurationMode('half-am');
                  setEndDate(startDate); // Half day is always single date
                }}
                className={`py-2 text-center rounded-lg font-label-sm text-label-sm border cursor-pointer transition-colors ${
                  durationMode === 'half-am'
                    ? 'bg-primary-fixed text-on-primary-fixed border-primary font-semibold'
                    : 'bg-surface-container-low border-surface-container text-on-surface-variant'
                }`}
              >
                Half Day (AM)
              </button>
              <button
                type="button"
                onClick={() => {
                  setDurationMode('half-pm');
                  setEndDate(startDate); // Half day is always single date
                }}
                className={`py-2 text-center rounded-lg font-label-sm text-label-sm border cursor-pointer transition-colors ${
                  durationMode === 'half-pm'
                    ? 'bg-primary-fixed text-on-primary-fixed border-primary font-semibold'
                    : 'bg-surface-container-low border-surface-container text-on-surface-variant'
                }`}
              >
                Half Day (PM)
              </button>
            </div>
          </div>

          {/* Interactive Days to Deduct Stepper with Range Constraint */}
          <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-title-sm text-title-sm text-on-surface font-semibold block">
                  Days to Deduct
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {type === 'AL' ? 'From Annual Leave quota' : type === 'SL' ? 'From Outpatient Sick quota' : 'From Comp-Off quota'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-lowest px-2 py-1 rounded-full border border-surface-container shadow-2xs">
                {/* Decrement Button */}
                <button
                  type="button"
                  disabled={durationMode !== 'full' || daysToDeduct <= 0.5}
                  onClick={() => setDaysToDeduct((prev) => Math.max(0.5, Number((prev - 0.5).toFixed(1))))}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    durationMode !== 'full' || daysToDeduct <= 0.5
                      ? 'opacity-40 cursor-not-allowed bg-surface-container text-on-surface-variant'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 cursor-pointer'
                  }`}
                  title={daysToDeduct <= 0.5 ? 'Minimum is 0.5 days' : 'Decrease days'}
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>

                <span className="font-title-md text-title-md text-on-surface font-bold w-10 text-center">
                  {daysToDeduct.toFixed(1)}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant mr-1">
                  Day{daysToDeduct !== 1 ? 's' : ''}
                </span>

                {/* Increment Button with Maximum Range Validation Check */}
                <button
                  type="button"
                  disabled={durationMode !== 'full' || daysToDeduct >= maxAllowedDays}
                  onClick={() => {
                    if (daysToDeduct < maxAllowedDays) {
                      setDaysToDeduct((prev) => Math.min(maxAllowedDays, Number((prev + 0.5).toFixed(1))));
                    }
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    durationMode !== 'full' || daysToDeduct >= maxAllowedDays
                      ? 'opacity-40 cursor-not-allowed bg-surface-container text-on-surface-variant'
                      : 'bg-primary-container text-on-primary-fixed hover:bg-primary-fixed active:scale-95 cursor-pointer'
                  }`}
                  title={
                    daysToDeduct >= maxAllowedDays
                      ? `Maximum allowed for selected date range (${calendarDays} day${calendarDays !== 1 ? 's' : ''}) is ${maxAllowedDays} day(s)`
                      : 'Increase days'
                  }
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
            </div>

            {/* Range helper caption */}
            <div className="flex items-center justify-between pt-1 border-t border-surface-container text-[11px] text-on-surface-variant">
              <span>
                Date selection: <strong className="text-on-surface">{calendarDays} Day{calendarDays !== 1 ? 's' : ''}</strong> ({startDate === endDate ? 'Single Day' : `${startDate} to ${endDate}`})
              </span>
              <span>
                Max allowed: <strong className="text-primary">{maxAllowedDays} Day{maxAllowedDays !== 1 ? 's' : ''}</strong>
              </span>
            </div>
          </div>

          {/* Validation Error Banner (When user exceeds allowable range, quota, or creates duplicates) */}
          {validationError && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-body-sm flex items-start gap-2.5 border border-error/20 animate-fade-in">
              <span className="material-symbols-outlined text-[20px] text-error shrink-0 mt-0.5">error</span>
              <div className="flex-1">
                <span className="font-title-sm text-title-sm font-semibold text-error block">
                  {isDuplicate ? 'Duplicate Leave Warning' : 'Validation Notice'}
                </span>
                <p className="mt-0.5 leading-snug">{validationError}</p>
                {isExceedingRange && !isDuplicate && (
                  <button
                    type="button"
                    onClick={() => setDaysToDeduct(maxAllowedDays)}
                    className="mt-1.5 inline-flex items-center gap-1 font-label-sm text-label-sm font-bold text-error hover:underline cursor-pointer bg-white/40 px-2 py-0.5 rounded-md"
                  >
                    <span>Fix: Reset to {maxAllowedDays} Day{maxAllowedDays !== 1 ? 's' : ''}</span>
                    <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* DigiMC / Medical Slip Reference Number if SL */}
          {type === 'SL' && (
            <div>
              <label className="font-label-md text-label-md text-on-surface-variant font-semibold block mb-1">
                DIGIMC / CLINIC CERTIFICATE REF
              </label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder="e.g. MC-SG-2026-092"
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-body-md"
              />
            </div>
          )}

          {/* Statutory MOM Impact Calculation Card */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">Leave Quota Impact</span>
              <span className="font-title-sm text-title-sm font-bold text-primary">
                -{daysToDeduct.toFixed(1)} Day{daysToDeduct !== 1 ? 's' : ''} ({type})
              </span>
            </div>
            {holidayOnStart && (
              <p className="font-body-sm text-body-sm text-holiday-public flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">flag</span>
                <span>Includes {holidayOnStart.name} (Gazetted PH)</span>
              </p>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-surface-container text-label-sm">
              <span className="text-on-surface-variant">Current Available: <strong>{getAvailableBalance()} Days</strong></span>
              <span className={`font-semibold ${isExceedingQuota ? 'text-error' : 'text-primary'}`}>
                Remaining after: <strong>{remainingBalanceAfter.toFixed(1)} Days</strong>
              </span>
            </div>
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={closeApplyModal}
              className="flex-1 py-3 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-variant transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFormInvalid}
              className={`flex-1 py-3 rounded-full font-label-md text-label-md font-semibold transition-all shadow-sm ${
                isFormInvalid
                  ? 'bg-surface-container-highest text-on-surface-variant opacity-60 cursor-not-allowed'
                  : 'bg-primary text-on-primary hover:opacity-95 active:scale-98 cursor-pointer'
              }`}
            >
              {isDuplicate
                ? 'Date Already Booked (Duplicate)'
                : isExceedingRange
                ? 'Exceeds Selected Dates Range'
                : isExceedingQuota
                ? 'Exceeds Available Balance'
                : `Confirm & Log Leave (-${daysToDeduct.toFixed(1)} ${type})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
