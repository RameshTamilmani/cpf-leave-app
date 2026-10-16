import React, { useState, useEffect } from 'react';
import { useLeave } from '../context/LeaveContext';
import { LeaveType, LeaveStatus } from '../types/leave';
import { calculateWorkingDays, getPublicHolidayForDate, getGazettedHolidayForDate } from '../data/singaporeHolidays2026';

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
      setTitle('');
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

  const isMultiDay = Boolean(startDate && endDate && startDate !== endDate);
  const workingDays = startDate && endDate && endDate >= startDate
    ? calculateWorkingDays(startDate, endDate)
    : 0;

  // Strict Validation Rule:
  // - Single day (startDate === endDate): allowed deduction is 1.0 day or 0.5 day (AM/PM)
  // - Multi-day (startDate !== endDate):
  //   If workingDays === 0: 0 days (blocked)
  //   If workingDays >= 1: allowed deduction is STRICTLY workingDays or workingDays - 0.5 (for half-day adjustments).
  //   Any other value (< workingDays - 0.5 or > workingDays) is completely blocked!
  //   Selecting 0.5 days is allowed ONLY if startDate === endDate.
  const allowedDeductionValues: number[] = isMultiDay
    ? workingDays > 0
      ? [workingDays, Number((workingDays - 0.5).toFixed(1))]
      : []
    : [1.0, 0.5];

  const maxAllowedDays = isMultiDay
    ? workingDays
    : durationMode === 'half-am' || durationMode === 'half-pm'
    ? 0.5
    : 1.0;

  const minAllowedDays = isMultiDay
    ? workingDays > 0 ? Number((workingDays - 0.5).toFixed(1)) : 0
    : 0.5;

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

    if (isMultiDay) {
      if (durationMode === 'half-am' || durationMode === 'half-pm') {
        setDurationMode('full');
      }
      if (workingDays > 0) {
        // Keep within allowed values [workingDays, workingDays - 0.5]
        const halfAdj = Number((workingDays - 0.5).toFixed(1));
        if (daysToDeduct !== workingDays && daysToDeduct !== halfAdj) {
          setDaysToDeduct(workingDays);
        }
      } else {
        setDaysToDeduct(0);
      }
      return;
    }

    // Single day
    if (durationMode === 'half-am' || durationMode === 'half-pm') {
      setDaysToDeduct(0.5);
    } else {
      setDaysToDeduct(1.0);
    }
  }, [startDate, endDate, durationMode, isMultiDay, workingDays]);

  // Whenever daysToDeduct or dates change, enforce strict validation
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

    // STRICT CHECK: Gazetted public holidays cannot have leave applied.
    // Special holidays added under Comp-off ARE permitted!
    if (!isMultiDay) {
      const gazettedPH = getGazettedHolidayForDate(startDate);
      if (gazettedPH) {
        setValidationError(
          `Cannot apply for leave on gazetted public holiday (${gazettedPH.name}). Public holidays are official paid non-working days under MOM guidelines.`
        );
        return;
      }
    } else {
      const startPH = getGazettedHolidayForDate(startDate);
      if (startPH) {
        setValidationError(
          `Leave cannot start on gazetted public holiday (${startPH.name}). Please select your first actual working day.`
        );
        return;
      }
      const endPH = getGazettedHolidayForDate(endDate);
      if (endPH) {
        setValidationError(
          `Leave cannot end on gazetted public holiday (${endPH.name}). Please select your last actual working day.`
        );
        return;
      }
      if (workingDays === 0) {
        setValidationError(
          'Selected date range contains 0 working days (dates fall on weekends or gazetted public holidays). Leave cannot be applied solely for non-working days.'
        );
        return;
      }
    }

    // STRICT CHECK: 0.5 days is ONLY allowed if start date and end date are the same!
    if (isMultiDay && daysToDeduct === 0.5) {
      setValidationError(
        'Selecting 0.5 days is only allowed if the start date and end date are the same.'
      );
      return;
    }

    // STRICT RULE: The "Days to Deduct" value must strictly match the selected date range:
    // For example, if 5 working days are selected, allow only 5 days or 4.5 days (for half-day adjustments). Any value less or greater must be blocked.
    if (isMultiDay && workingDays > 0) {
      const isExactMatch = daysToDeduct === workingDays || daysToDeduct === Number((workingDays - 0.5).toFixed(1));
      if (!isExactMatch) {
        setValidationError(
          `Validation Rule: For the ${workingDays} working days selected in the date picker (${startDate} to ${endDate}), the system allows deducting strictly ${workingDays} days or ${(workingDays - 0.5).toFixed(1)} days (for half-day adjustments). Entering ${daysToDeduct} days is blocked.`
        );
        return;
      }
    }

    if (!isMultiDay && daysToDeduct !== 1.0 && daysToDeduct !== 0.5) {
      setValidationError('For a single day leave, you may only select 1.0 day (full day) or 0.5 days (half day).');
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
  }, [duplicateConflict, daysToDeduct, isMultiDay, workingDays, startDate, endDate, type, alAvailable, slAvailable, coAvailable]);

  if (!isApplyModalOpen) return null;

  const holidayOnStart = getPublicHolidayForDate(startDate);
  const gazettedHolidayOnStart = getGazettedHolidayForDate(startDate);

  const getAvailableBalance = () => {
    if (type === 'AL') return alAvailable;
    if (type === 'SL') return slAvailable;
    return coAvailable;
  };

  const isDeductionMismatch = isMultiDay
    ? workingDays <= 0 || (daysToDeduct !== workingDays && daysToDeduct !== Number((workingDays - 0.5).toFixed(1)))
    : daysToDeduct !== 1.0 && daysToDeduct !== 0.5;

  const gazettedPHSingle = !isMultiDay && Boolean(getGazettedHolidayForDate(startDate));
  const gazettedPHRange = isMultiDay && (Boolean(getGazettedHolidayForDate(startDate)) || Boolean(getGazettedHolidayForDate(endDate)) || workingDays === 0);
  const isPHBlocked = Boolean(gazettedPHSingle || gazettedPHRange);

  const isTitleMissing = !title.trim();
  const isExceedingQuota = daysToDeduct > getAvailableBalance();
  const isInvalidDate = Boolean(startDate && endDate && endDate < startDate);
  const isHalfDayMultiDay = Boolean(isMultiDay && daysToDeduct === 0.5);
  const isFormInvalid = Boolean(
    isTitleMissing ||
    isDuplicate ||
    isPHBlocked ||
    isDeductionMismatch ||
    isExceedingQuota ||
    isInvalidDate ||
    isHalfDayMultiDay ||
    daysToDeduct <= 0
  );

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

    // Public holiday validation
    if (!isMultiDay) {
      const gazettedPH = getGazettedHolidayForDate(startDate);
      if (gazettedPH) {
        setValidationError(
          `Cannot apply for leave on gazetted public holiday (${gazettedPH.name}). Public holidays are official paid non-working days under MOM guidelines.`
        );
        return;
      }
    } else {
      const startPH = getGazettedHolidayForDate(startDate);
      if (startPH) {
        setValidationError(
          `Leave cannot start on gazetted public holiday (${startPH.name}). Please select your first actual working day.`
        );
        return;
      }
      const endPH = getGazettedHolidayForDate(endDate);
      if (endPH) {
        setValidationError(
          `Leave cannot end on gazetted public holiday (${endPH.name}). Please select your last actual working day.`
        );
        return;
      }
      if (workingDays === 0) {
        setValidationError('Selected date range contains 0 working days (dates fall on weekends or gazetted public holidays).');
        return;
      }
    }

    // STRICT CONSTRAINT: Selecting 0.5 days is allowed ONLY if start date and end date are the same!
    if (startDate !== endDate && daysToDeduct === 0.5) {
      setValidationError('Selecting 0.5 days is only allowed if the start date and end date are the same.');
      return;
    }

    // STRICT VALIDATION RULE: Days to Deduct must strictly match selected working days range
    if (isMultiDay) {
      const isExactMatch = daysToDeduct === workingDays || daysToDeduct === Number((workingDays - 0.5).toFixed(1));
      if (!isExactMatch) {
        setValidationError(
          `For ${workingDays} working days selected, only ${workingDays} days or ${(workingDays - 0.5).toFixed(1)} days can be deducted.`
        );
        return;
      }
    }

    if (!title.trim()) {
      setValidationError('Reason / Leave Title is mandatory. Please enter a reason.');
      return;
    }

    if (daysToDeduct > getAvailableBalance()) {
      setValidationError(
        `Requested ${daysToDeduct} days exceeds your available ${type} quota of ${getAvailableBalance()} day(s).`
      );
      return;
    }

    const finalTitle = title.trim();
    const finalDays = Math.max(0.5, Number(daysToDeduct) || 1.0);
    const status: LeaveStatus = endDate < todayDateStr ? 'taken' : 'planned';
    const halfDay = durationMode === 'half-am' ? 'am' : durationMode === 'half-pm' ? 'pm' : 'full';

    addRecord({
      type,
      title: finalTitle,
      startDate,
      endDate,
      days: finalDays,
      halfDay,
      status,
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
                onClick={() => setType('AL')}
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
                onClick={() => setType('SL')}
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
                onClick={() => setType('CO')}
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

          {/* Title / Description - MANDATORY, NO AUTO-FILLER */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-label-md text-label-md text-on-surface-variant font-semibold">
                REASON / LEAVE TITLE <span className="text-error">*</span>
              </label>
              <span className="text-[11px] text-error font-medium">Required</span>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationError && validationError.includes('Reason')) {
                  setValidationError(null);
                }
              }}
              placeholder="Enter reason for leave (mandatory)"
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
                onChange={(e) => {
                  const newEnd = e.target.value;
                  setEndDate(newEnd);
                }}
                className="w-full px-3 py-2 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface font-label-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Duration Mode Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block">
                DURATION SELECTION
              </label>
              <span className="text-[11px] text-on-surface-variant font-medium">
                {isMultiDay
                  ? `${workingDays} working day${workingDays !== 1 ? 's' : ''} in range`
                  : 'Single day leave (1.0d or 0.5d)'}
              </span>
            </div>

            {isMultiDay ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDurationMode('full');
                    setDaysToDeduct(workingDays);
                  }}
                  className={`py-2 px-3 text-center rounded-lg font-label-sm text-label-sm border cursor-pointer transition-colors ${
                    daysToDeduct === workingDays
                      ? 'bg-primary-fixed text-on-primary-fixed border-primary font-semibold shadow-xs'
                      : 'bg-surface-container-low border-surface-container text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <div className="font-bold">Full Period</div>
                  <div className="text-[11px] opacity-85">{workingDays} Working Days</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDurationMode('full');
                    setDaysToDeduct(Math.max(1.0, Number((workingDays - 0.5).toFixed(1))));
                  }}
                  className={`py-2 px-3 text-center rounded-lg font-label-sm text-label-sm border cursor-pointer transition-colors ${
                    daysToDeduct === Number((workingDays - 0.5).toFixed(1))
                      ? 'bg-primary-fixed text-on-primary-fixed border-primary font-semibold shadow-xs'
                      : 'bg-surface-container-low border-surface-container text-on-surface-variant hover:bg-surface-container'
                  }`}
                  title="Deduct 0.5 day less for half-day on start/end date"
                >
                  <div className="font-bold">Half-Day Adjustment</div>
                  <div className="text-[11px] opacity-85">{(workingDays - 0.5).toFixed(1)} Days (-0.5d)</div>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDurationMode('full');
                    setDaysToDeduct(1.0);
                  }}
                  className={`py-2 text-center rounded-lg font-label-sm text-label-sm border cursor-pointer transition-colors ${
                    durationMode === 'full'
                      ? 'bg-primary-fixed text-on-primary-fixed border-primary font-semibold'
                      : 'bg-surface-container-low border-surface-container text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  Full Day (1.0d)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDurationMode('half-am');
                    setDaysToDeduct(0.5);
                  }}
                  className={`py-2 text-center rounded-lg font-label-sm text-label-sm border cursor-pointer transition-colors ${
                    durationMode === 'half-am'
                      ? 'bg-primary-fixed text-on-primary-fixed border-primary font-semibold'
                      : 'bg-surface-container-low border-surface-container text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  Half Day (AM)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDurationMode('half-pm');
                    setDaysToDeduct(0.5);
                  }}
                  className={`py-2 text-center rounded-lg font-label-sm text-label-sm border cursor-pointer transition-colors ${
                    durationMode === 'half-pm'
                      ? 'bg-primary-fixed text-on-primary-fixed border-primary font-semibold'
                      : 'bg-surface-container-low border-surface-container text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  Half Day (PM)
                </button>
              </div>
            )}
          </div>

          {/* Interactive Days to Deduct Stepper strictly bound to Validation Rule */}
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
                  disabled={
                    isMultiDay
                      ? daysToDeduct <= minAllowedDays
                      : daysToDeduct <= 0.5
                  }
                  onClick={() => {
                    if (isMultiDay) {
                      setDaysToDeduct(minAllowedDays);
                    } else {
                      setDurationMode('half-am');
                      setDaysToDeduct(0.5);
                    }
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    (isMultiDay ? daysToDeduct <= minAllowedDays : daysToDeduct <= 0.5)
                      ? 'opacity-40 cursor-not-allowed bg-surface-container text-on-surface-variant'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95 cursor-pointer'
                  }`}
                  title={
                    isMultiDay
                      ? `Minimum allowed is ${minAllowedDays}d (half-day adjustment)`
                      : 'Set to 0.5 days'
                  }
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>

                <span className="font-title-md text-title-md text-on-surface font-bold w-12 text-center">
                  {daysToDeduct.toFixed(1)}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant mr-1">
                  Day{daysToDeduct !== 1 ? 's' : ''}
                </span>

                {/* Increment Button */}
                <button
                  type="button"
                  disabled={daysToDeduct >= maxAllowedDays}
                  onClick={() => {
                    if (isMultiDay) {
                      setDaysToDeduct(maxAllowedDays);
                    } else {
                      setDurationMode('full');
                      setDaysToDeduct(1.0);
                    }
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    daysToDeduct >= maxAllowedDays
                      ? 'opacity-40 cursor-not-allowed bg-surface-container text-on-surface-variant'
                      : 'bg-primary-container text-on-primary-fixed hover:bg-primary-fixed active:scale-95 cursor-pointer'
                  }`}
                  title={
                    isMultiDay
                      ? `Maximum allowed is ${maxAllowedDays}d (${workingDays} working days)`
                      : 'Set to 1.0 day'
                  }
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
              </div>
            </div>

            {/* Range helper caption strictly enforcing matching rule */}
            <div className="flex items-center justify-between pt-1 border-t border-surface-container text-[11px] text-on-surface-variant">
              <span>
                {isMultiDay
                  ? `Selected: ${workingDays} Working Day${workingDays !== 1 ? 's' : ''} (${startDate} to ${endDate})`
                  : `Selected: Single Day (${startDate})`}
              </span>
              <span>
                Allowed: <strong className="text-primary">{isMultiDay ? `${workingDays}d or ${(workingDays - 0.5).toFixed(1)}d` : '1.0d or 0.5d'}</strong>
              </span>
            </div>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-body-sm flex items-start gap-2.5 border border-error/20 animate-fade-in">
              <span className="material-symbols-outlined text-[20px] text-error shrink-0 mt-0.5">error</span>
              <div className="flex-1">
                <span className="font-title-sm text-title-sm font-semibold text-error block">
                  {isDuplicate ? 'Duplicate Leave Blocked' : 'Validation Error'}
                </span>
                <p className="mt-0.5 leading-snug">{validationError}</p>
                {isDeductionMismatch && isMultiDay && workingDays > 0 && (
                  <button
                    type="button"
                    onClick={() => setDaysToDeduct(workingDays)}
                    className="mt-1.5 inline-flex items-center gap-1 font-label-sm text-label-sm font-bold text-error hover:underline cursor-pointer bg-white/40 px-2 py-0.5 rounded-md"
                  >
                    <span>Fix: Reset to {workingDays} Day{workingDays !== 1 ? 's' : ''}</span>
                    <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                  </button>
                )}
              </div>
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
              <p className={`font-body-sm text-body-sm flex items-center gap-1 ${gazettedHolidayOnStart ? 'text-holiday-public font-medium' : 'text-leave-compoff'}`}>
                <span className="material-symbols-outlined text-[16px]">flag</span>
                <span>
                  {gazettedHolidayOnStart
                    ? `${holidayOnStart.name} (Gazetted PH — leave blocked)`
                    : `${holidayOnStart.name} (Special Holiday — leave allowed)`}
                </span>
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
              {isTitleMissing
                ? 'Enter Reason / Leave Title'
                : isDuplicate
                ? 'Date Already Booked (Duplicate)'
                : isHalfDayMultiDay
                ? '0.5d Allowed Only for Same Dates'
                : isDeductionMismatch
                ? 'Days Must Match Date Range'
                : isExceedingQuota
                ? 'Exceeds Available Balance'
                : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
