import { effectiveStatus } from '../utils/leaveAccounting';
import { halfDaySummary } from '../utils/leaveDuration';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { compOffReason } from '../utils/compOff';
import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import { LeaveType, LeaveRecord } from '../types/leave';
import { formatDateDDMMYYYY } from '../data/singaporeHolidays2026';

export const HistoryScreen: React.FC = () => {
  const {
    records,
    deleteRecord,
    exportCSV,
    alAvailable,
    slAvailable,
    coAvailable,
    todayDateStr
  } = useLeave();

  const [typeFilter, setTypeFilter] = useState<'ALL' | LeaveType>('ALL');

  // Active record action sheet state for delete confirmation
  const [selectedRecordForSheet, setSelectedRecordForSheet] = useState<LeaveRecord | null>(null);

  useModalScrollLock(!!selectedRecordForSheet);

  // Helper to determine effective status:
  // "Leave on the current date should be considered taken, not planned. Only leave greater than the current date should be considered as planned."
  const getEffectiveStatus = (r: LeaveRecord) => effectiveStatus(r,todayDateStr);

  // Filter records by leave type
  const filteredRecords = records.filter((r) => {
    if (typeFilter !== 'ALL' && r.type !== typeFilter && !(typeFilter === 'CO' && r.type === 'CL')) return false;
    return true;
  });

  // Sort logged entries based on Leave Date in descending order
  const sortedRecords = [...filteredRecords].sort((a, b) => b.startDate.localeCompare(a.startDate));

  // Calculate live stats respecting the taken/planned rule
  const consumedDays = records
    .filter((r) => {
      const eff = getEffectiveStatus(r);
      return eff === 'taken' || eff === 'retroactive';
    })
    .reduce((s, r) => s + (Number(r.days) || 0), 0);

  const scheduledDays = records
    .filter((r) => {
      const eff = getEffectiveStatus(r);
      return eff === 'planned';
    })
    .reduce((s, r) => s + (Number(r.days) || 0), 0);

  const statutoryLeft = alAvailable + slAvailable + coAvailable;

  // Helper to get full name consistently (never show AL/SL abbreviations in display)
  const getLeaveTypeFullName = (type: LeaveType) => {
    switch (type) {
      case 'AL':
        return 'Annual Leave';
      case 'SL':
        return 'Sick Leave';
      case 'CL':
      case 'CO':
        return 'Comp Off';
      default:
        return 'Leave';
    }
  };

  return (
    <div className="flex flex-col w-full px-margin pb-6 gap-space-md max-w-xl mx-auto pt-2">
      {/* Category Filter Chips - Displays full names only */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-margin px-margin py-1">
        <button
          onClick={() => setTypeFilter('ALL')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
            typeFilter === 'ALL'
              ? 'bg-primary text-on-primary font-semibold'
              : 'bg-surface-card text-on-surface-variant hover:bg-surface-container border border-surface-container'
          }`}
        >
          <span>All Records</span>
          <span className="w-4 h-4 rounded-full bg-surface-card/25 flex items-center justify-center text-[10px]">
            {records.length}
          </span>
        </button>

        <button
          onClick={() => setTypeFilter('AL')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
            typeFilter === 'AL'
              ? 'bg-primary text-on-primary font-semibold'
              : 'bg-surface-card text-on-surface-variant hover:bg-surface-container border border-surface-container'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-leave-annual" />
          <span>Annual Leave</span>
        </button>

        <button
          onClick={() => setTypeFilter('SL')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
            typeFilter === 'SL'
              ? 'bg-primary text-on-primary font-semibold'
              : 'bg-surface-card text-on-surface-variant hover:bg-surface-container border border-surface-container'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-leave-sick" />
          <span>Sick Leave</span>
        </button>

        <button
          onClick={() => setTypeFilter('CO')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full font-label-md text-label-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
            typeFilter === 'CO'
              ? 'bg-primary text-on-primary font-semibold'
              : 'bg-surface-card text-on-surface-variant hover:bg-surface-container border border-surface-container'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-leave-compoff" />
          <span>Comp Off</span>
        </button>
      </div>

      {/* Summary Metric Strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-card p-3 rounded-xl shadow-xs border border-surface-container flex flex-col">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Consumed</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-title-lg text-title-lg text-on-surface font-semibold">
              {consumedDays.toFixed(1)}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">days</span>
          </div>
        </div>

        <div className="bg-surface-card p-3 rounded-xl shadow-xs border border-surface-container flex flex-col">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Scheduled</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-title-lg text-title-lg text-leave-annual font-semibold">
              {scheduledDays.toFixed(1)}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">days</span>
          </div>
        </div>

        <div className="bg-surface-card p-3 rounded-xl shadow-xs border border-surface-container flex flex-col">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Available Left</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-title-lg text-title-lg text-primary font-semibold">
              {Number.isInteger(statutoryLeft) ? statutoryLeft : statutoryLeft.toFixed(1)}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">days</span>
          </div>
        </div>
      </div>

      {/* Logged Entries Header with Export Button */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
          Logged Entries ({sortedRecords.length})
        </h3>
        {/* Export button placed near Logged Entries, enabled only when records exist */}
        <button
          onClick={exportCSV}
          disabled={records.length === 0}
          aria-label="Export leave records"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-xs transition-all font-label-sm text-label-sm font-semibold border ${
            records.length > 0
              ? 'bg-surface-card text-primary border-surface-container hover:bg-primary-container/20 active:scale-95 cursor-pointer'
              : 'bg-surface-container-low text-on-surface-variant/40 border-surface-container cursor-not-allowed opacity-50 pointer-events-none'
          }`}
          title={records.length > 0 ? 'Export leave entries to CSV' : 'No records to export'}
        >
          <span className="material-symbols-outlined text-[18px]">ios_share</span>
          <span>Export</span>
        </button>
      </div>

      {/* Real Logged Records List (Sorted by date descending, dates in DD-MM-YYYY) */}
      {sortedRecords.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {sortedRecords.map((record) => {
            const isAL = record.type === 'AL';
            const isSL = record.type === 'SL';
            const fullName = getLeaveTypeFullName(record.type);
            const effStatus = getEffectiveStatus(record);

            return (
              <div
                key={record.id}
                className="bg-surface-card rounded-xl p-3.5 shadow-xs border border-surface-container flex flex-col gap-2 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Consistent icons: beach_access for AL, medical_services for SL, update for CO */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isAL
                          ? 'bg-leave-annual-container text-leave-annual-on-container'
                          : isSL
                          ? 'bg-leave-sick-container text-leave-sick-on-container'
                          : 'bg-leave-compoff-container text-leave-compoff-on-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isAL ? 'beach_access' : isSL ? 'medical_services' : 'update'}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-title-sm text-title-sm text-on-surface font-semibold truncate">
                          {record.title}
                        </span>
                        {/* Always display Sick Leave, Annual Leave, Comp Off in full */}
                        <span
                          className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold shrink-0 ${
                            isAL
                              ? 'bg-leave-annual-container text-leave-annual-on-container'
                              : isSL
                              ? 'bg-leave-sick-container text-leave-sick-on-container'
                              : 'bg-leave-compoff-container text-leave-compoff-on-container'
                          }`}
                        >
                          {fullName}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        {formatDateDDMMYYYY(record.startDate)}
                        {record.startDate !== record.endDate ? ` – ${formatDateDDMMYYYY(record.endDate)}` : ''} • {Number(record.days).toFixed(1)} day{Number(record.days) !== 1 ? 's' : ''}
                        {compOffReason(record)&&<span className="block mt-1 text-xs text-on-surface-variant">Comp-Off: {compOffReason(record)}</span>}
                        {halfDaySummary(record) && <span className="block mt-1 text-xs text-primary">{halfDaySummary(record)}</span>}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm capitalize font-medium">
                      {effStatus}
                    </span>
                    {/* Only delete option - editing is not allowed */}
                    <button
                      onClick={() => setSelectedRecordForSheet(record)}
                      aria-label="Delete leave record"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error-container/30 active:scale-90 transition-all cursor-pointer"
                      title="Delete Leave Record"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State Card - No apply button or clean slate text */
        <div className="bg-surface-card rounded-2xl p-6 shadow-xs border border-surface-container flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-2">
            <span className="material-symbols-outlined text-[28px]">event_busy</span>
          </div>
          <h2 className="font-title-md text-title-md text-on-surface font-semibold">
            No Leave Entries Logged Yet
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Recorded leaves will be listed here.
          </p>
        </div>
      )}

      {/* Delete Confirmation Sheet (NO EDIT OPTION) */}
      {selectedRecordForSheet && (
        <div
          className="fixed inset-0 bg-black/40 z-50 backdrop-blur-xs flex items-end justify-center"
          onClick={() => setSelectedRecordForSheet(null)}
        >
          <div
            className="w-full max-w-md bg-surface-card rounded-t-3xl p-5 shadow-2xl flex flex-col gap-3.5 border-t border-surface-container animate-in slide-in-from-bottom-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 rounded-full bg-surface-variant self-center mb-1" />
            <div className="flex items-center justify-between pb-1">
              <div className="flex flex-col">
                <span className="font-title-md text-title-md text-on-surface font-bold">
                  Delete Leave Record
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {selectedRecordForSheet.title} ({getLeaveTypeFullName(selectedRecordForSheet.type)} • {Number(selectedRecordForSheet.days).toFixed(1)} Day{Number(selectedRecordForSheet.days) !== 1 ? 's' : ''})
                </span>
              </div>
              <button
                onClick={() => setSelectedRecordForSheet(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-error-container/20 border border-error/20 flex flex-col gap-1">
              <span className="font-title-sm text-title-sm text-error font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>Confirm Deletion</span>
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Are you sure you want to delete this {getLeaveTypeFullName(selectedRecordForSheet.type)} booking? Balances for its leave year will be recalculated.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setSelectedRecordForSheet(null)}
                className="flex-1 py-3 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-variant transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteRecord(selectedRecordForSheet.id);
                  setSelectedRecordForSheet(null);
                }}
                className="flex-1 py-3 rounded-full bg-error text-on-error font-label-md text-label-md font-semibold hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-xs"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
