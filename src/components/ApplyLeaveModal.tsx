import { compOffReason, compOffDurationError } from '../utils/compOff';
import { workingLeaveDates, halfDaySelectionError, leavePeriodsOverlap, halfDayOnDate } from '../utils/leaveDuration';
import { LopIcon } from './LopIcon';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import React, { useState, useEffect } from 'react';
import { useLeave } from '../context/LeaveContext';
import { LeaveType, LeaveStatus } from '../types/leave';
import { calculateWorkingDays, formatDateDDMMYYYY, isValidISODate, isWeekend, addDaysToDate } from '../data/singaporeHolidays2026';
import { DatePickerField } from './DatePickerField';

export const ApplyLeaveModal: React.FC = () => {
  const {
    isApplyModalOpen,
    applyModalConfig,
    closeApplyModal,
    addRecord,
    compOffError,
    availableCompOffCredits,
    getQuotaImpact,
    records,
    allHolidays,
    todayDateStr,
    alAvailable,
    slAvailable,
    coAvailable,
    crossedSaturdayHolidays
  } = useLeave();

  const [type, setType] = useState<LeaveType>('AL');
  const isCompOff=type==='CO'||type==='CL';
  const [saving, setSaving] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [creditChoices,setCreditChoices]=useState<Record<string,string>>({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationMode, setDurationMode] = useState<'full' | 'half-am' | 'half-pm'>('full');
  const [daysToDeduct, setDaysToDeduct] = useState<number>(1.0);
  const [halfDayDate, setHalfDayDate] = useState('');
  const [halfDaySession, setHalfDaySession] = useState<'' | 'am' | 'pm'>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (newStart && (!endDate || endDate < newStart)) {
      setEndDate(newStart);
    }
  };

  const handleEndDateChange = (newEnd: string) => {
    setEndDate(newEnd);
    if (newEnd && startDate && newEnd < startDate) {
      setStartDate(newEnd);
    }
  };

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
      setHalfDayDate('');
      setHalfDaySession('');
      setDaysToDeduct(1.0);
      setValidationError(null);
      setRemarks('');
      setCreditChoices({});
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
    ? calculateWorkingDays(startDate, endDate, allHolidays)
    : 0;

  const workingDates = workingLeaveDates(startDate, endDate, allHolidays);
  const needsHalfDayChoice = isMultiDay && workingDays > 1 && daysToDeduct === workingDays - 0.5;
  const halfDayChoiceError = needsHalfDayChoice ? halfDaySelectionError(workingDates, halfDayDate, halfDaySession) : null;
  useEffect(() => {
    if (halfDayDate && !workingDates.includes(halfDayDate)) setHalfDayDate('');
  }, [startDate, endDate, allHolidays, halfDayDate]);

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
  const candidate = {
    type, startDate, endDate, days: daysToDeduct,
    halfDay: needsHalfDayChoice ? (halfDaySession || 'full') : durationMode === 'half-am' ? 'am' : durationMode === 'half-pm' ? 'pm' : 'full',
    halfDayDate: needsHalfDayChoice ? halfDayDate : durationMode==='full' ? undefined : startDate,
    compOffCredits: type==='CO'||type==='CL' ? workingDates.filter(d=>creditChoices[d]).map(d=>({leaveDate:d,holidayDate:creditChoices[d],holidayName:availableCompOffCredits.find(c=>c.date===creditChoices[d])?.name||''})) : undefined,
  } as const;
  const requestRecord = {...candidate,id:'candidate',title:'Leave',status:'planned' as const,createdAt:''};
  const creditError = halfDayChoiceError ? null : compOffError(requestRecord);
  const duplicateConflict = records.find(record => leavePeriodsOverlap(candidate, record, allHolidays));

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
  }, [startDate, endDate, durationMode, isMultiDay, workingDays, isCompOff]);

  // Whenever daysToDeduct or dates change, enforce strict validation
  useEffect(() => {
    if (startDate && endDate && endDate < startDate) {
      setValidationError('End date cannot be earlier than start date.');
      return;
    }

    if (duplicateConflict) {
      const spanStr =
        duplicateConflict.startDate === duplicateConflict.endDate
          ? formatDateDDMMYYYY(duplicateConflict.startDate)
          : `${formatDateDDMMYYYY(duplicateConflict.startDate)} to ${formatDateDDMMYYYY(duplicateConflict.endDate)}`;
      setValidationError(
        `Duplicate leave detected: You already have a booked leave '${duplicateConflict.title}' (${duplicateConflict.type}) for ${spanStr}. Duplicate leaves are not allowed for the same date.`
      );
      return;
    }

    // STRICT CHECK: Cannot apply leave on weekends (Saturday / Sunday) or holidays
    const startHol = allHolidays.find((h) => h.date === startDate || h.observedDate === startDate);
    const endHol = allHolidays.find((h) => h.date === endDate || h.observedDate === endDate);

    if (!isMultiDay) {
      if (isWeekend(startDate)) {
        setValidationError(
          'Leave cannot be applied on weekends (Saturday / Sunday). Weekends are official non-working rest days.'
        );
        return;
      }
      if (startHol) {
        setValidationError(
          `Cannot apply for leave on holiday (${startHol.name}). Holidays are official non-working days.`
        );
        return;
      }
    } else {
      if (isWeekend(startDate)) {
        setValidationError(
          'Leave cannot start on a weekend (Saturday / Sunday). Please select your first actual working day.'
        );
        return;
      }
      if (isWeekend(endDate)) {
        setValidationError(
          'Leave cannot end on a weekend (Saturday / Sunday). Please select your last actual working day.'
        );
        return;
      }
      if (startHol) {
        setValidationError(
          `Leave cannot start on a holiday (${startHol.name}). Please select your first actual working day.`
        );
        return;
      }
      if (endHol) {
        setValidationError(
          `Leave cannot end on a holiday (${endHol.name}). Please select your last actual working day.`
        );
        return;
      }
      if (workingDays === 0) {
        setValidationError(
          'Selected date range contains 0 working days (dates fall on weekends or holidays). Leave cannot be applied solely for non-working days.'
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
    if (isMultiDay && workingDays > 0) {
      const isExactMatch = daysToDeduct === workingDays || daysToDeduct === Number((workingDays - 0.5).toFixed(1));
      if (!isExactMatch) {
        setValidationError(
          `Validation Rule: For the ${workingDays} working days selected in the date picker (${formatDateDDMMYYYY(startDate)} to ${formatDateDDMMYYYY(endDate)}), the system allows deducting strictly ${workingDays} days or ${(workingDays - 0.5).toFixed(1)} days (for half-day adjustments). Entering ${daysToDeduct} days is blocked.`
        );
        return;
      }
    }

    if (!isMultiDay && daysToDeduct !== 1.0 && daysToDeduct !== 0.5) {
      setValidationError('For a single day leave, you may only select 1.0 day (full day) or 0.5 days (half day).');
      return;
    }

    if(creditError){setValidationError(creditError);return;}

    setValidationError(null);
  }, [duplicateConflict, daysToDeduct, isMultiDay, workingDays, startDate, endDate, type, alAvailable, slAvailable, coAvailable, crossedSaturdayHolidays, creditError]);

  useModalScrollLock(isApplyModalOpen);

  if (!isApplyModalOpen) return null;

  const holidayOnStart = allHolidays.find((h) => h.date === startDate || h.observedDate === startDate);
  const holidayOnEnd = allHolidays.find((h) => h.date === endDate || h.observedDate === endDate);

  const quota = getQuotaImpact(requestRecord);
  const getAvailableBalance = () => quota.available;

  const isDeductionMismatch = isMultiDay
    ? workingDays <= 0 || (daysToDeduct !== workingDays && daysToDeduct !== Number((workingDays - 0.5).toFixed(1)))
    : daysToDeduct !== 1.0 && daysToDeduct !== 0.5;

  const isWeekendSingle = !isMultiDay && isWeekend(startDate);
  const isWeekendRange = isMultiDay && (isWeekend(startDate) || isWeekend(endDate));
  const isWeekendBlocked = Boolean(isWeekendSingle || isWeekendRange);

  const isHolidaySingle = !isMultiDay && Boolean(holidayOnStart);
  const isHolidayRange = isMultiDay && (Boolean(holidayOnStart) || Boolean(holidayOnEnd) || workingDays === 0);
  const isHolidayBlocked = Boolean(isHolidaySingle || isHolidayRange);

  // Comp-off 90-day validity check:
  // "Comp-off leave should not be allowed to apply for the date post 90 days period. It should be applied for date, below the expire date. Leave apply can be done post expiry but date should be within the 90 days period."
  const isCompOffBlocked = Boolean(creditError);

  // Only Comp-off is restricted by quota; AL and SL allow exceeding quota and count as Loss of Pay (LOP)
  const isExceedingQuota = false;
  const isLOPApplicable = quota.lop > 0;
  const lopDays = quota.lop;
  const isInvalidDate = Boolean(startDate && endDate && endDate < startDate);
  const isHalfDayMultiDay = Boolean(isMultiDay && daysToDeduct === 0.5);
  const isFormInvalid = Boolean(
    saving ||
    !!compOffDurationError(requestRecord) ||
    quota.outsideCycle ||
    isDuplicate ||
    isWeekendBlocked ||
    isHolidayBlocked ||
    isCompOffBlocked ||
    isDeductionMismatch ||
    isExceedingQuota ||
    isInvalidDate ||
    isHalfDayMultiDay ||
    !!halfDayChoiceError ||
    daysToDeduct <= 0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(saving)return;

    if(quota.outsideCycle){setValidationError('Some dates fall outside the configured leave-year window. Check the cycle dates in Settings.');return;}
    if (halfDayChoiceError) { setValidationError(halfDayChoiceError); return; }
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
          ? formatDateDDMMYYYY(duplicateConflict.startDate)
          : `${formatDateDDMMYYYY(duplicateConflict.startDate)} to ${formatDateDDMMYYYY(duplicateConflict.endDate)}`;
      setValidationError(
        `Duplicate leave detected: You already have a booked leave '${duplicateConflict.title}' (${duplicateConflict.type}) on ${spanStr}. Duplicate leaves are not allowed for the same date.`
      );
      return;
    }

    // Weekend and Holiday validation: Strictly prevent applying leave on weekends or holidays
    if (!isMultiDay) {
      if (isWeekend(startDate)) {
        setValidationError('Leave cannot be applied on weekends (Saturday / Sunday). Weekends are official non-working rest days.');
        return;
      }
      if (holidayOnStart) {
        setValidationError(
          `Cannot apply for leave on holiday (${holidayOnStart.name}). Holidays are official non-working days.`
        );
        return;
      }
    } else {
      if (isWeekend(startDate)) {
        setValidationError('Leave cannot start on a weekend (Saturday / Sunday). Please select your first actual working day.');
        return;
      }
      if (isWeekend(endDate)) {
        setValidationError('Leave cannot end on a weekend (Saturday / Sunday). Please select your last actual working day.');
        return;
      }
      if (holidayOnStart) {
        setValidationError(
          `Leave cannot start on a holiday (${holidayOnStart.name}). Please select your first actual working day.`
        );
        return;
      }
      if (holidayOnEnd) {
        setValidationError(
          `Leave cannot end on a holiday (${holidayOnEnd.name}). Please select your last actual working day.`
        );
        return;
      }
      if (workingDays === 0) {
        setValidationError('Selected date range contains 0 working days (dates fall on weekends or holidays).');
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

    if(creditError){setValidationError(creditError);return;}

    // Always store the default title based on the type of leaves selected
    const defaultTitle = type === 'AL' ? 'Annual Leave' : type === 'SL' ? 'Sick Leave' : 'Comp-off Leave';
    const finalDays = Math.max(0.5, Number(daysToDeduct) || 1.0);
    // Leave on the current date is considered taken; only leave greater than current date is planned
    const status: LeaveStatus = startDate > todayDateStr ? 'planned' : 'taken';
    const halfDay = needsHalfDayChoice ? halfDaySession as 'am' | 'pm' : durationMode === 'half-am' ? 'am' : durationMode === 'half-pm' ? 'pm' : 'full';

    setSaving(true);
    const saved = await addRecord({
      type,
      title: type==='CO'&&candidate.compOffCredits?.length===1 ? candidate.compOffCredits[0].holidayName+' Comp-off' : defaultTitle,
      compOffCredits: candidate.compOffCredits,
      startDate,
      endDate,
      days: finalDays,
      halfDay,
      halfDayDate: halfDay === 'full' ? undefined : needsHalfDayChoice ? halfDayDate : startDate,
      status,
      notes: isCompOff ? compOffReason(candidate) : remarks.trim() || undefined
    });

    setSaving(false);
    if(saved)closeApplyModal();
  };

  const remainingBalanceAfter = quota.remaining;

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
              Leave Category
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

          {/* Dates & Duration Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <DatePickerField
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                required
                ariaLabel="Select Start Date"
              />
            </div>
            <div>
              <DatePickerField
                label="End Date"
                value={endDate}
                onChange={handleEndDateChange}
                min={startDate || undefined}
                required
                ariaLabel="Select End Date"
              />
            </div>
          </div>

          {(type==='CO'||type==='CL')&&<fieldset className="rounded-xl border border-surface-outline p-3 flex flex-col gap-3">
            <legend className="px-1 text-sm font-semibold text-on-surface">Comp-Off Holiday Credit</legend>
            <p className="text-xs text-on-surface-variant">Choose one credit for each leave date. A holiday credit covers 1 day, or two half days. Choose AM or PM for half-day leave.</p>
            {workingDates.map(date=><label key={date} className="text-sm text-on-surface flex flex-col gap-1">For {formatDateDDMMYYYY(date)}
              <select aria-label={'Comp-Off Credit for '+date} value={creditChoices[date]||''} required onChange={e=>setCreditChoices(prev=>({...prev,[date]:e.target.value}))} className="w-full h-11 min-w-0 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface px-2 text-sm">
                <option value="">Select a holiday credit</option>
                {availableCompOffCredits.filter(c=>c.date<=date&&c.end>=date).map(c=><option key={c.date} value={c.date} disabled={workingDates.filter(d=>d!==date&&creditChoices[d]===c.date).reduce((s,d)=>s+(halfDayOnDate(candidate,d)?0.5:1),0)+(halfDayOnDate(candidate,date)?0.5:1)>c.left}>{c.name} · {formatDateDDMMYYYY(c.date)} · {c.left} day{c.left===1?'':'s'} left</option>)}
              </select>
            </label>)}
            {workingDates.length>0&&!availableCompOffCredits.some(c=>workingDates.some(d=>c.date<=d&&c.end>=d))&&<p className="text-xs text-error">No unused holiday credits cover these leave dates.</p>}
          </fieldset>}

          {/* Duration Mode Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block">
                Duration Selection
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

          {needsHalfDayChoice && (
            <fieldset className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-3">
              <legend className="px-1 text-sm font-semibold text-on-surface">Half-Day Details</legend>
              <p className="text-xs text-on-surface-variant">Choose when you will be on half-day leave. All other working dates are full-day leave.</p>
              <label className="block text-xs font-semibold text-on-surface-variant" htmlFor="leave-half-day-date">Half-Day Date</label>
              <select id="leave-half-day-date" required value={halfDayDate} onChange={event => setHalfDayDate(event.target.value)} className="w-full h-11 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface text-sm px-3">
                <option value="">Choose a date</option>
                {workingDates.map(date => <option key={date} value={date}>{formatDateDDMMYYYY(date)} · {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' })}</option>)}
              </select>
              <div role="group" aria-label="Half-day leave session" className="grid grid-cols-2 gap-2">
                {(['am', 'pm'] as const).map(session => <button key={session} type="button" aria-pressed={halfDaySession === session} onClick={() => setHalfDaySession(session)} className={
                  'py-2.5 rounded-xl border text-sm font-semibold cursor-pointer ' + (halfDaySession === session ? 'bg-primary-fixed text-on-primary-fixed border-primary' : 'bg-surface-container-lowest text-on-surface-variant border-surface-container')
                }>{session === 'am' ? 'AM · Morning Leave' : 'PM · Afternoon Leave'}</button>)}
              </div>
              {halfDayChoiceError ? <p className="text-xs text-on-surface-variant" role="status">{halfDayChoiceError}</p>
                : <p className="text-xs font-semibold text-primary">Half-day leave: {formatDateDDMMYYYY(halfDayDate)} · {halfDaySession.toUpperCase()}</p>}
            </fieldset>
          )}

          {/* Interactive Days to Deduct Stepper strictly bound to Validation Rule */}
          <div className="flex flex-col gap-1.5 p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-title-sm text-title-sm text-on-surface font-semibold block">
                  Days to Deduct
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {type === 'AL' ? 'From Annual Leave quota' : type === 'SL' ? 'From Sick Leave quota' : 'From Comp-Off quota'}
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
                  ? `Selected: ${workingDays} Working Day${workingDays !== 1 ? 's' : ''} (${formatDateDDMMYYYY(startDate)} to ${formatDateDDMMYYYY(endDate)})`
                  : `Selected: Single Day (${formatDateDDMMYYYY(startDate)})`}
              </span>
              <span>
                Allowed: <strong className="text-primary">{isMultiDay ? `${workingDays}d or ${(workingDays - 0.5).toFixed(1)}d` : '1.0d or 0.5d'}</strong>
              </span>
            </div>
          </div>

          {/* Comp-Off reason is generated from the selected credits. */}
          <div>
            <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold block mb-1">
              {isCompOff?'Comp-Off Reason':'Remarks (Optional)'}
            </label>
            <input
              aria-label={isCompOff?'Comp-Off Reason':'Remarks'}
              type="text"
              value={isCompOff ? compOffReason(candidate) : remarks}
              disabled={isCompOff}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={isCompOff?'Select a holiday credit above':'Add optional remarks...'}
              className="w-full px-3.5 py-2 h-10 rounded-xl border border-surface-outline bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-body-md"
            />
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
              <p className="font-body-sm text-body-sm flex items-center gap-1 text-error font-medium">
                <span className="material-symbols-outlined text-[16px]">celebration</span>
                <span>
                  {holidayOnStart.name} (Holiday — leave application blocked)
                </span>
              </p>
            )}
            {isWeekend(startDate) && (
              <p className="font-body-sm text-body-sm flex items-center gap-1 text-error font-medium">
                <span className="material-symbols-outlined text-[16px]">weekend</span>
                <span>
                  Weekend (Saturday/Sunday — leave application blocked)
                </span>
              </p>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-surface-container text-label-sm">
              <span className="text-on-surface-variant">Available for This Period: <strong>{getAvailableBalance()} Days</strong></span>
              <span className={`font-semibold ${isExceedingQuota ? 'text-error' : isLOPApplicable ? 'text-error' : 'text-primary'}`}>
                Remaining after: <strong>{remainingBalanceAfter.toFixed(1)} Days{isLOPApplicable ? ` (+${lopDays}d LOP)` : ''}</strong>
              </span>
            </div>

            {/* LOP (Loss of Pay) Notice when AL/SL exceeds quota */}
            {isLOPApplicable && (
              <div className="p-2.5 rounded-lg bg-surface-container-high text-on-surface flex items-start gap-2 border border-surface-container text-xs mt-1">
                <LopIcon className="text-error shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-error block">Loss of Pay (LOP) Notice:</span>
                  <span className="text-on-surface-variant">
                    {getAvailableBalance() === 0
                      ? `Quota exhausted. All ${daysToDeduct.toFixed(1)} day(s) will be logged as Loss of Pay (LOP).`
                      : `${getAvailableBalance().toFixed(1)} day(s) deducted from your quota, and ${lopDays} day(s) will be calculated as Loss of Pay (LOP).`}
                  </span>
                </div>
              </div>
            )}


          </div>

          {quota.outsideCycle && <p role="alert" className="text-sm text-error">Some dates fall outside the configured leave-year window. Check the cycle dates in Settings.</p>}
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
              {isWeekendBlocked
                ? 'Cannot Apply on Weekends (Sat/Sun)'
                : isHolidayBlocked
                ? 'Cannot Apply on Holidays'
                : isDuplicate
                ? 'Date Already Booked (Duplicate)'
                : isHalfDayMultiDay
                ? '0.5d Allowed Only for Same Dates'
                : isDeductionMismatch
                ? 'Days Must Match Date Range'
                : isExceedingQuota
                ? 'Exceeds Available Comp-Off'
                : isCompOffBlocked
                ? 'Check Comp-Off Credits'
                : 'Confirm & Log Leave'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
