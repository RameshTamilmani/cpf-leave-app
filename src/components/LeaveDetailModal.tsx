import React from 'react';
import { useLeave } from '../context/LeaveContext';
import { LeaveRecord, SpecialHoliday } from '../types/leave';
import { formatDateDDMMYYYY } from '../data/singaporeHolidays2026';

export type DetailCategory = 'AL' | 'SL' | 'CO' | 'LOP' | 'SPECIAL';

interface LeaveDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: DetailCategory;
  onApplyLeave?: () => void;
  onAddSpecialHoliday?: () => void;
}

interface LOPRecordItem {
  record: LeaveRecord;
  lopDays: number;
  paidDays: number;
}

export const LeaveDetailModal: React.FC<LeaveDetailModalProps> = ({
  isOpen,
  onClose,
  category,
  onApplyLeave,
  onAddSpecialHoliday
}) => {
  const {
    records,
    alAvailable,
    slAvailable,
    coAvailable,
    alLOP,
    slLOP,
    totalLOP,
    settings,
    specialHolidays,
    todayDateStr
  } = useLeave();

  if (!isOpen) return null;

  // Helper to determine status
  const getEffectiveStatus = (r: LeaveRecord) => {
    if (r.status === 'planned' && r.startDate <= todayDateStr) {
      return 'taken';
    }
    return r.status;
  };

  // Filter records by category
  let title = '';
  let icon = '';
  let containerClass = '';
  let subtitle = '';
  let emptyTitle = '';
  let emptyDescription = '';
  let filteredRecords: LeaveRecord[] = [];
  let lopItems: LOPRecordItem[] = [];
  let isSpecialList = false;

  const alUsed = records
    .filter((r) => r.type === 'AL')
    .reduce((sum, r) => sum + (Number(r.days) || 0), 0);

  const slUsed = records
    .filter((r) => r.type === 'SL')
    .reduce((sum, r) => sum + (Number(r.days) || 0), 0);

  const coUsed = records
    .filter((r) => r.type === 'CO' || r.type === 'CL')
    .reduce((sum, r) => sum + (Number(r.days) || 0), 0);

  if (category === 'AL') {
    title = 'Annual Leave Records';
    icon = 'beach_access';
    containerClass = 'bg-leave-annual-container text-leave-annual-on-container';
    subtitle = `${Number.isInteger(alUsed) ? alUsed : alUsed.toFixed(1)} / ${settings.alEntitlement} Days Applied (${alAvailable} Available)`;
    emptyTitle = 'No Annual Leave records';
    emptyDescription = 'You have not logged any Annual Leave entries yet.';
    filteredRecords = records
      .filter((r) => r.type === 'AL')
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  } else if (category === 'SL') {
    title = 'Sick Leave Records';
    icon = 'medical_services';
    containerClass = 'bg-leave-sick-container text-leave-sick-on-container';
    subtitle = `${Number.isInteger(slUsed) ? slUsed : slUsed.toFixed(1)} / ${settings.slEntitlement} Days Applied (${slAvailable} Available)`;
    emptyTitle = 'No Sick Leave records';
    emptyDescription = 'You have not logged any Sick Leave entries yet.';
    filteredRecords = records
      .filter((r) => r.type === 'SL')
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  } else if (category === 'CO') {
    title = 'Comp-Off Leave Records';
    icon = 'update';
    containerClass = 'bg-leave-compoff-container text-leave-compoff-on-container';
    subtitle = `${Number.isInteger(coUsed) ? coUsed : coUsed.toFixed(1)} Days Applied (${coAvailable} Days Available)`;
    emptyTitle = 'No Comp-Off leave records';
    emptyDescription = 'You have not logged any Comp-Off leave entries yet.';
    filteredRecords = records
      .filter((r) => r.type === 'CO' || r.type === 'CL')
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  } else if (category === 'LOP') {
    title = 'Loss of Pay (LOP) Records';
    icon = 'money_off';
    containerClass = 'bg-rose-100 text-rose-800 border border-rose-200';
    subtitle = totalLOP > 0
      ? `${totalLOP} Day(s) Total Unpaid LOP (${alLOP > 0 ? `${alLOP}d AL` : ''}${alLOP > 0 && slLOP > 0 ? ' • ' : ''}${slLOP > 0 ? `${slLOP}d SL` : ''} exceeding 12-day entitlement)`
      : '0 Days (All leaves within entitlement)';
    emptyTitle = 'No Loss of Pay (LOP) records';
    emptyDescription = 'All applied leaves are within your statutory 12-day entitlement. No Loss of Pay calculated.';

    // STRICT USER REQUIREMENT: Show ONLY the latest dates that fall under LOP; don't display all leaves!
    // 1. Process AL chronologically
    const alRecordsAsc = records
      .filter((r) => r.type === 'AL')
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    let alRunningTotal = 0;
    for (const r of alRecordsAsc) {
      alRunningTotal += Number(r.days) || 0;
      if (alRunningTotal > settings.alEntitlement) {
        const lopDaysInRecord = Math.min(Number(r.days) || 0, alRunningTotal - settings.alEntitlement);
        const paidDaysInRecord = Math.max(0, (Number(r.days) || 0) - lopDaysInRecord);
        lopItems.push({
          record: r,
          lopDays: Number(lopDaysInRecord.toFixed(1)),
          paidDays: Number(paidDaysInRecord.toFixed(1))
        });
      }
    }

    // 2. Process SL chronologically
    const slRecordsAsc = records
      .filter((r) => r.type === 'SL')
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    let slRunningTotal = 0;
    for (const r of slRecordsAsc) {
      slRunningTotal += Number(r.days) || 0;
      if (slRunningTotal > settings.slEntitlement) {
        const lopDaysInRecord = Math.min(Number(r.days) || 0, slRunningTotal - settings.slEntitlement);
        const paidDaysInRecord = Math.max(0, (Number(r.days) || 0) - lopDaysInRecord);
        lopItems.push({
          record: r,
          lopDays: Number(lopDaysInRecord.toFixed(1)),
          paidDays: Number(paidDaysInRecord.toFixed(1))
        });
      }
    }

    // Sort by latest dates first (descending order)
    lopItems.sort((a, b) => b.record.startDate.localeCompare(a.record.startDate));
  } else if (category === 'SPECIAL') {
    title = 'Special Holidays';
    icon = 'celebration';
    containerClass = 'bg-purple-100 text-purple-900 border border-purple-200';
    subtitle = `${specialHolidays.length} Special Holiday${specialHolidays.length !== 1 ? 's' : ''} Configured`;
    emptyTitle = 'No Special Holidays added';
    emptyDescription = 'Custom company holidays, ad-hoc off days, or company events can be configured.';
    isSpecialList = true;
  }

  const hasItems = isSpecialList
    ? specialHolidays.length > 0
    : category === 'LOP'
    ? lopItems.length > 0
    : filteredRecords.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-card rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-surface-container animate-in slide-in-from-bottom-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container bg-surface-container-low">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${containerClass}`}>
              <span className="material-symbols-outlined text-[22px]">{icon}</span>
            </div>
            <div className="min-w-0">
              <h2 className="font-title-md text-title-md text-on-surface font-bold truncate">
                {title}
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-3 flex-1">
          {category === 'LOP' && totalLOP > 0 && (
            <div className="p-3.5 rounded-xl bg-error-container/30 border border-error/25 text-on-surface text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-error">
                <span className="material-symbols-outlined text-[16px]">info</span>
                <span>Unpaid Loss of Pay Logs</span>
              </div>
              <p className="text-on-surface-variant leading-relaxed">
                Displaying only the latest leave dates that exceeded your 12-day entitlement:
                {' '}<strong>{alLOP > 0 ? `${alLOP}d Annual Leave` : ''}</strong>
                {alLOP > 0 && slLOP > 0 ? ' and ' : ''}
                <strong>{slLOP > 0 ? `${slLOP}d Sick Leave` : ''}</strong>. Earlier leaves were fully covered by your paid quota.
              </p>
            </div>
          )}

          {!hasItems ? (
            /* Empty State */
            <div className="py-10 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant/60">
                <span className="material-symbols-outlined text-[32px]">{icon}</span>
              </div>
              <div className="max-w-xs">
                <p className="font-title-sm text-title-sm font-semibold text-on-surface">{emptyTitle}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{emptyDescription}</p>
              </div>
              {onApplyLeave && category !== 'SPECIAL' && category !== 'LOP' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onApplyLeave();
                  }}
                  className="mt-2 px-4 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:opacity-95 active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  + Apply Leave
                </button>
              )}
              {isSpecialList && onAddSpecialHoliday && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAddSpecialHoliday();
                  }}
                  className="mt-2 px-4 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:opacity-95 active:scale-95 transition-all cursor-pointer shadow-xs"
                >
                  + Add Special Holiday
                </button>
              )}
            </div>
          ) : isSpecialList ? (
            /* Special Holidays List */
            <div className="flex flex-col gap-2">
              {specialHolidays.map((h: SpecialHoliday) => (
                <div
                  key={h.id}
                  className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between gap-3 text-body-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{h.emoji || '🎉'}</span>
                    <div className="min-w-0">
                      <p className="font-title-sm text-title-sm text-on-surface font-semibold truncate">
                        {h.name}
                      </p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">
                        {formatDateDDMMYYYY(h.date)} ({h.dayOfWeek})
                        {h.isCompOffEligible ? ' • Comp-off Eligible' : ''}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-fixed text-[11px] font-semibold shrink-0">
                    Special Holiday
                  </span>
                </div>
              ))}
            </div>
          ) : category === 'LOP' ? (
            /* LOP Specific Records List - Showing ONLY dates that fall under LOP */
            <div className="flex flex-col gap-2.5">
              {lopItems.map((item) => {
                const r = item.record;
                const effStatus = getEffectiveStatus(r);
                const isAL = r.type === 'AL';

                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl bg-error-container/15 border border-error/25 flex flex-col gap-2 text-body-sm transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">money_off</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-title-sm text-title-sm text-on-surface font-semibold truncate">
                            {r.title}
                          </p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">
                            {formatDateDDMMYYYY(r.startDate)}
                            {r.startDate !== r.endDate ? ` to ${formatDateDDMMYYYY(r.endDate)}` : ''}
                            {' '}• {isAL ? 'Annual Leave' : 'Sick Leave'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full font-label-sm text-[11px] font-bold bg-error text-on-error shadow-2xs">
                          {item.lopDays.toFixed(1)}d Unpaid LOP
                        </span>
                        <span className="text-[10px] text-on-surface-variant capitalize">
                          {effStatus}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-error/15 flex items-center justify-between text-xs text-on-surface-variant">
                      <span>
                        {item.paidDays > 0
                          ? `Partial: ${item.paidDays.toFixed(1)}d covered by quota, ${item.lopDays.toFixed(1)}d unpaid LOP`
                          : `Entire ${item.lopDays.toFixed(1)} day(s) exceed 12-day entitlement`}
                      </span>
                      <span className="font-semibold text-error">Unpaid</span>
                    </div>

                    {r.notes && (
                      <p className="text-[12px] text-on-surface-variant bg-surface-container-lowest px-2.5 py-1.5 rounded-lg border border-surface-container/60">
                        {r.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Regular Leave Records List (AL, SL, CO) */
            <div className="flex flex-col gap-2.5">
              {filteredRecords.map((r) => {
                const effStatus = getEffectiveStatus(r);
                const isAL = r.type === 'AL';
                const isSL = r.type === 'SL';

                return (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-2 text-body-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isAL
                              ? 'bg-leave-annual-container text-leave-annual-on-container'
                              : isSL
                              ? 'bg-leave-sick-container text-leave-sick-on-container'
                              : 'bg-leave-compoff-container text-leave-compoff-on-container'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isAL ? 'beach_access' : isSL ? 'medical_services' : 'update'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-title-sm text-title-sm text-on-surface font-semibold truncate">
                            {r.title}
                          </p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant text-[12px]">
                            {formatDateDDMMYYYY(r.startDate)}
                            {r.startDate !== r.endDate ? ` to ${formatDateDDMMYYYY(r.endDate)}` : ''}
                            {' '}• {Number(r.days).toFixed(1)} Day{Number(r.days) !== 1 ? 's' : ''}
                            {r.halfDay && r.halfDay !== 'full' ? ` (${r.halfDay.toUpperCase()})` : ''}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full font-label-sm text-[11px] font-semibold capitalize shrink-0 ${
                          effStatus === 'taken'
                            ? 'bg-surface-container text-on-surface'
                            : 'bg-primary-container text-on-primary-fixed'
                        }`}
                      >
                        {effStatus}
                      </span>
                    </div>

                    {r.notes && (
                      <p className="text-[12px] text-on-surface-variant bg-surface-container-lowest px-2.5 py-1.5 rounded-lg border border-surface-container/60">
                        {r.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-surface-container bg-surface-container-lowest flex items-center justify-between gap-3">
          <span className="text-[12px] text-on-surface-variant font-medium">
            {isSpecialList
              ? `${specialHolidays.length} special holiday${specialHolidays.length !== 1 ? 's' : ''}`
              : category === 'LOP'
              ? `${lopItems.length} LOP log${lopItems.length !== 1 ? 's' : ''} found`
              : `${filteredRecords.length} record${filteredRecords.length !== 1 ? 's' : ''} found`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-surface-container font-label-md text-label-md font-semibold text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
