import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import { LeaveType, LeaveRecord } from '../types/leave';

export const HistoryScreen: React.FC = () => {
  const {
    records,
    deleteRecord,
    openApplyModal,
    exportCSV,
    alAvailable,
    slAvailable,
    coAvailable,
    settings,
    setIsEditCycleModalOpen
  } = useLeave();

  const [typeFilter, setTypeFilter] = useState<'ALL' | LeaveType>('ALL');

  // Active record action sheet state
  const [selectedRecordForSheet, setSelectedRecordForSheet] = useState<LeaveRecord | null>(null);

  // Filter records by leave type only (second filter removed as requested)
  const filteredRecords = records.filter((r) => {
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
    return true;
  });

  // Calculate live stats
  const consumedDays = records
    .filter((r) => r.status === 'taken' || r.status === 'retroactive')
    .reduce((s, r) => s + (Number(r.days) || 0), 0);

  const scheduledDays = records
    .filter((r) => r.status === 'planned')
    .reduce((s, r) => s + (Number(r.days) || 0), 0);

  const statutoryLeft = alAvailable + slAvailable + coAvailable;

  const getCycleBadgeText = () => {
    if (settings.cycleStartMonth && settings.cycleStartDay && settings.cycleEndMonth && settings.cycleEndDay) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${settings.cycleStartDay} ${months[settings.cycleStartMonth - 1]} – ${settings.cycleEndDay} ${months[settings.cycleEndMonth - 1]}`;
    }
    if (settings.cycle.includes('Jun 13')) return '13 Jun – 12 Jun';
    if (settings.cycle.includes('1 Apr')) return '1 Apr – 31 Mar';
    if (settings.cycle.includes('1 Jul')) return '1 Jul – 30 Jun';
    return 'Jan – Dec';
  };

  // Helper to get full name consistently
  const getLeaveTypeFullName = (type: LeaveType) => {
    switch (type) {
      case 'AL':
        return 'Annual Leave';
      case 'SL':
        return 'Sick Leave';
      case 'CO':
        return 'Comp Off';
      default:
        return 'Leave';
    }
  };

  return (
    <div className="flex flex-col w-full px-margin pb-6 gap-space-md max-w-xl mx-auto">
      {/* Top Action & FY Selector Bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-space-xs">
          <button
            onClick={() => setIsEditCycleModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors shadow-xs cursor-pointer"
            title="Configure Leave Year Cycle"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
            <span className="font-title-sm text-title-sm">Active Cycle</span>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">expand_more</span>
          </button>
          <button
            onClick={() => setIsEditCycleModalOpen(true)}
            className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-variant font-label-sm text-label-sm cursor-pointer transition-colors"
            title="Configure Leave Year Cycle"
          >
            {getCycleBadgeText()}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openApplyModal({ initialType: 'AL' })}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-on-primary shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer font-label-sm text-label-sm font-semibold"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Apply Leave</span>
          </button>
          <button
            onClick={exportCSV}
            aria-label="Export leave records"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-card text-primary shadow-xs hover:bg-primary-container/20 active:scale-95 transition-all cursor-pointer border border-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">ios_share</span>
            <span className="font-label-sm text-label-sm font-semibold">Export</span>
          </button>
        </div>
      </div>

      {/* Category Filter Chips - Displays full names (No AL/SL short names) */}
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

      {/* Real Logged Records List */}
      {filteredRecords.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-title-sm text-title-sm text-on-surface font-semibold">
              Logged Entries ({filteredRecords.length})
            </h3>
          </div>
          {filteredRecords.map((record) => {
            const isAL = record.type === 'AL';
            const isSL = record.type === 'SL';
            const fullName = getLeaveTypeFullName(record.type);

            return (
              <div
                key={record.id}
                className="bg-surface-card rounded-xl p-3.5 shadow-xs border border-surface-container flex flex-col gap-2 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Consistent icon: beach_access for AL, medical_services for SL, update for CO */}
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
                        {record.startDate} {record.startDate !== record.endDate ? `– ${record.endDate}` : ''} • {Number(record.days).toFixed(1)} day{Number(record.days) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm capitalize">
                      {record.status}
                    </span>
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
        /* Empty State Card */
        <div className="bg-surface-card rounded-2xl p-6 shadow-xs border border-surface-container flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-2">
            <span className="material-symbols-outlined text-[28px]">event_busy</span>
          </div>
          <h2 className="font-title-md text-title-md text-on-surface font-semibold">
            No leave entries logged yet
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Recorded leaves will be listed here.
          </p>
          <button
            onClick={() => openApplyModal({ initialType: 'AL' })}
            className="mt-3 px-4 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Apply Leave</span>
          </button>
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
                Confirm Deletion
              </span>
              <p className="text-body-sm text-on-surface-variant text-[12px] leading-snug">
                Deleting this record will restore {Number(selectedRecordForSheet.days).toFixed(1)} day(s) back to your {getLeaveTypeFullName(selectedRecordForSheet.type)} balance.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedRecordForSheet(null)}
                className="flex-1 py-2.5 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-variant transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const idToDelete = selectedRecordForSheet.id;
                  setSelectedRecordForSheet(null);
                  deleteRecord(idToDelete);
                }}
                className="flex-1 py-2.5 rounded-full bg-error text-on-error flex items-center justify-center gap-1.5 font-label-md text-label-md font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                <span>Delete Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
