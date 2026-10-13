import React, { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import { LeaveType, LeaveStatus, LeaveRecord } from '../types/leave';

export const HistoryScreen: React.FC = () => {
  const {
    records,
    deleteRecord,
    openApplyModal,
    exportCSV,
    alAvailable,
    settings,
    setIsEditCycleModalOpen,
    showToast
  } = useLeave();

  const [typeFilter, setTypeFilter] = useState<'ALL' | LeaveType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | LeaveStatus>('ALL');

  // Active record action sheet state
  const [selectedRecordForSheet, setSelectedRecordForSheet] = useState<LeaveRecord | null>(null);

  // Filter records
  const filteredRecords = records.filter((r) => {
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    return true;
  });

  // Calculate live stats
  const consumedDays = records
    .filter((r) => r.status === 'taken' || r.status === 'retroactive')
    .reduce((s, r) => s + (Number(r.days) || 0), 0);

  const scheduledDays = records
    .filter((r) => r.status === 'planned')
    .reduce((s, r) => s + (Number(r.days) || 0), 0);

  const statutoryLeft = alAvailable;

  const plannedCount = records.filter((r) => r.status === 'planned').length;
  const takenCount = records.filter((r) => r.status === 'taken').length;
  const retroCount = records.filter((r) => r.status === 'retroactive').length;

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
            <span className="font-title-sm text-title-sm">FY 2026</span>
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
        <div className="flex items-center gap-1">
          <button
            onClick={exportCSV}
            aria-label="Export to CSV"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-card text-primary shadow-xs hover:bg-primary-container/20 active:scale-95 transition-all cursor-pointer border border-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">ios_share</span>
            <span className="font-label-sm text-label-sm font-semibold">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Category Filter Chips (Horizontal Scroll) */}
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
          <span>Annual Leave (AL)</span>
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
          <span>Sick Leave (SL)</span>
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
          <span>Comp-off (CO)</span>
        </button>
      </div>

      {/* Status Filter Sub-row */}
      <div className="flex items-center justify-between bg-surface-container-low p-1.5 rounded-xl border border-surface-container">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`flex-1 py-1 px-2 rounded-lg font-label-sm text-label-sm transition-all text-center cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-surface-card text-on-surface font-semibold shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter('taken')}
          className={`flex-1 py-1 px-2 rounded-lg font-label-sm text-label-sm transition-all text-center cursor-pointer ${
            statusFilter === 'taken'
              ? 'bg-surface-card text-on-surface font-semibold shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Taken ({takenCount})
        </button>
        <button
          onClick={() => setStatusFilter('planned')}
          className={`flex-1 py-1 px-2 rounded-lg font-label-sm text-label-sm transition-all text-center cursor-pointer ${
            statusFilter === 'planned'
              ? 'bg-surface-card text-on-surface font-semibold shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Planned ({plannedCount})
        </button>
        <button
          onClick={() => setStatusFilter('retroactive')}
          className={`flex-1 py-1 px-2 rounded-lg font-label-sm text-label-sm transition-all text-center cursor-pointer ${
            statusFilter === 'retroactive'
              ? 'bg-surface-card text-on-surface font-semibold shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Retro MC ({retroCount})
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
          <span className="font-label-sm text-label-sm text-on-surface-variant">Statutory Left</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-title-lg text-title-lg text-primary font-semibold">
              {statutoryLeft.toFixed(1)}
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">days</span>
          </div>
        </div>
      </div>

      {/* Real Logged Records List (renders only when records exist) */}
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

            return (
              <div
                key={record.id}
                className="bg-surface-card rounded-xl p-3.5 shadow-xs border border-surface-container flex flex-col gap-2.5 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isAL
                          ? 'bg-leave-annual-container text-leave-annual-on-container'
                          : isSL
                          ? 'bg-leave-sick-container text-leave-sick-on-container'
                          : 'bg-leave-compoff-container text-leave-compoff-on-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {isAL ? 'flight_takeoff' : isSL ? 'local_hospital' : 'update'}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-title-sm text-title-sm text-on-surface font-semibold truncate">
                          {record.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold shrink-0 ${
                            isAL
                              ? 'bg-leave-annual-container text-leave-annual-on-container'
                              : isSL
                              ? 'bg-leave-sick-container text-leave-sick-on-container'
                              : 'bg-leave-compoff-container text-leave-compoff-on-container'
                          }`}
                        >
                          {record.type}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        {record.startDate} {record.startDate !== record.endDate ? `– ${record.endDate}` : ''} • {Number(record.days).toFixed(1)} day{Number(record.days) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm capitalize">
                      {record.status}
                    </span>
                    <button
                      onClick={() => setSelectedRecordForSheet(record)}
                      aria-label="Manage record"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-90 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </div>
                </div>

                  <div className="flex items-center justify-between pt-2 bg-surface-container-low/50 px-2.5 py-1.5 rounded-lg text-label-sm">
                    <div className="flex items-center gap-1.5 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-primary">
                        account_balance_wallet
                      </span>
                      <span>
                        Entitlement Impact: <strong className="text-on-surface">-{Number(record.days).toFixed(1)} {record.type}</strong>
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-leave-compoff font-medium">
                      ✓ Deducted from quota
                    </span>
                  </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Pristine Empty State Card (When no records have been entered yet) */
        <div className="bg-surface-card rounded-2xl p-6 shadow-xs border border-surface-container flex flex-col items-center text-center relative overflow-hidden">
          {/* Subtle Background Ambient Geometry */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary-fixed/20 pointer-events-none blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-secondary-fixed/30 pointer-events-none blur-xl" />

          {/* Soft Decorative Icon Container */}
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary mb-3.5 shadow-xs relative">
            <span className="material-symbols-outlined text-[32px]">event_busy</span>
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed shadow-xs">
              <span className="material-symbols-outlined text-[14px]">history</span>
            </span>
          </div>

          <h2 className="font-title-md text-title-md text-on-surface font-semibold">
            No leave entries logged yet for 2026
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1.5 max-w-xs leading-relaxed">
            Your clean slate awaits! Record approved annual vacations, medical leaves, or comp-off days to keep statutory balances compliant.
          </p>

          {/* Quick Entry CTA */}
          <div className="flex items-center justify-center mt-5 w-full max-w-xs">
            <button
              onClick={() => openApplyModal({ initialType: 'AL' })}
              className="w-full py-2.5 px-4 rounded-full bg-primary text-on-primary font-label-lg text-label-lg shadow-xs hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Apply Leave</span>
            </button>
          </div>
        </div>
      )}

      {/* Statutory MOM Compliance Notice Card */}
      <div className="bg-alert-warning-container rounded-2xl p-3.5 shadow-xs border border-alert-warning/20 flex items-start gap-3">
        <span className="material-symbols-outlined text-alert-warning text-[22px] shrink-0 mt-0.5">policy</span>
        <div className="flex flex-col">
          <span className="font-title-sm text-title-sm text-alert-warning font-semibold">
            MOM Employment Act Guide
          </span>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">
            Singapore statutory annual leave must be taken within 12 months after the end of every 12 months of continuous service. Use export to keep HR audit logs ready.
          </p>
        </div>
      </div>

      {/* Action Sheet Simulation for managing a logged entry */}
      {selectedRecordForSheet && (
        <div
          className="fixed inset-0 bg-black/40 z-50 backdrop-blur-xs flex items-end justify-center"
          onClick={() => setSelectedRecordForSheet(null)}
        >
          <div
            className="w-full max-w-md bg-surface-card rounded-t-3xl p-5 shadow-2xl flex flex-col gap-3 border-t border-surface-container animate-in slide-in-from-bottom-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 rounded-full bg-surface-variant self-center mb-1" />
            <div className="flex items-center justify-between pb-2">
              <div className="flex flex-col">
                <span className="font-title-md text-title-md text-on-surface font-semibold">
                  {selectedRecordForSheet.title}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Manage leave entry ({selectedRecordForSheet.type} • {Number(selectedRecordForSheet.days).toFixed(1)} Day{Number(selectedRecordForSheet.days) !== 1 ? 's' : ''})
                </span>
              </div>
              <button
                onClick={() => setSelectedRecordForSheet(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <button
              onClick={() => {
                const target = selectedRecordForSheet;
                setSelectedRecordForSheet(null);
                openApplyModal({ initialType: target.type, initialDate: target.startDate });
              }}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-left font-label-lg text-label-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">edit</span>
              <span>Edit Leave Details</span>
            </button>

            <button
              onClick={() => {
                const idToDelete = selectedRecordForSheet.id;
                setSelectedRecordForSheet(null);
                deleteRecord(idToDelete);
              }}
              className="flex items-center gap-3 p-3 rounded-xl bg-error-container hover:opacity-90 text-on-error-container text-left font-label-lg text-label-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-error">delete</span>
              <span>Cancel &amp; Remove Entry (Restore Balance)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
