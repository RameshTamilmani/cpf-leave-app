import React, { useRef, useState } from 'react';
import { useLeave } from '../context/LeaveContext';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    triggerSync,
    isSyncing,
    exportCSV,
    backupJSON,
    restoreJSON,
    resetAllData,
    setIsHolidaysModalOpen,
    setIsEditCycleModalOpen,
    setIsAddSpecialHolidayOpen,
    autoCompOffEarned,
    saturdayCompOffHolidays,
    cycleStartDateStr,
    cycleEndDateStr,
    specialHolidays,
    deleteSpecialHoliday,
    showToast
  } = useLeave();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAlChange = (delta: number) => {
    const next = settings.alEntitlement + delta;
    if (next < 7) {
      showToast('Minimum statutory entitlement reached (7 days)');
      return;
    }
    if (next > 28) {
      showToast('Maximum entitlement reached (28 days)');
      return;
    }
    updateSettings({ alEntitlement: next });
    showToast(`Annual Leave set to ${next} days`);
  };

  const handleSlChange = (delta: number) => {
    const next = settings.slEntitlement + delta;
    if (next < 5) {
      showToast('Minimum statutory entitlement reached (5 days)');
      return;
    }
    if (next > 24) {
      showToast('Maximum entitlement reached (24 days)');
      return;
    }
    updateSettings({ slEntitlement: next });
    showToast(`Sick Leave set to ${next} days`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        restoreJSON(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col w-full px-margin space-y-space-md max-w-xl mx-auto pb-8">
      {/* Sub-header profile / context banner */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container p-space-md shadow-xs border border-surface-container">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-fixed flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[26px]">manage_accounts</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-title-md text-title-md text-on-surface truncate font-semibold">Settings &amp; Policy</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold">
                  FY 2026
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate mt-0.5">
                Personal Leave Profile • Singapore MOM EA
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[20px]">verified_user</span>
          </div>
        </div>

        {/* Mini statutory health pill */}
        <div className="mt-space-sm pt-2 flex items-center justify-between border-t border-surface-container-highest/60 text-on-surface-variant font-label-sm text-label-sm">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px] text-primary">gavel</span>
            MOM Employment Act Sec 88 Compliant
          </span>
          <span className="text-primary font-semibold">Ready</span>
        </div>
      </div>

      {/* Section 1: Leave Entitlements Configuration */}
      <section className="space-y-space-xs">
        <div className="px-1 flex items-center justify-between">
          <h2 className="font-title-sm text-title-sm text-on-surface-variant tracking-wider uppercase">
            Leave Entitlements (FY 2026)
          </h2>
          <span className="font-label-sm text-label-sm text-primary font-medium">Auto-Prorated</span>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-xs border border-surface-container space-y-space-md">
          {/* Annual Leave Item */}
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-leave-annual-container text-leave-annual-on-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">flight_takeoff</span>
              </div>
              <div className="min-w-0">
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">Annual Leave</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Full-pay paid annual vacation</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-low px-2 py-1 rounded-full shrink-0 border border-surface-container">
              <button
                onClick={() => handleAlChange(-1)}
                aria-label="Decrease Annual Leave"
                className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">remove</span>
              </button>
              <span className="font-title-md text-title-md text-on-surface font-semibold w-6 text-center">
                {settings.alEntitlement}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mr-1">Days</span>
              <button
                onClick={() => handleAlChange(1)}
                aria-label="Increase Annual Leave"
                className="w-7 h-7 rounded-full bg-primary-container text-on-primary-fixed flex items-center justify-center hover:bg-primary-fixed active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
            </div>
          </div>

          <div className="h-[1px] bg-surface-container" />

          {/* Sick Leave Item */}
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-leave-sick-container text-leave-sick-on-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">medical_services</span>
              </div>
              <div className="min-w-0">
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">Outpatient Sick Leave</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Certified MC statutory quota</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-surface-container-low px-2 py-1 rounded-full shrink-0 border border-surface-container">
              <button
                onClick={() => handleSlChange(-1)}
                aria-label="Decrease Sick Leave"
                className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">remove</span>
              </button>
              <span className="font-title-md text-title-md text-on-surface font-semibold w-6 text-center">
                {settings.slEntitlement}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mr-1">Days</span>
              <button
                onClick={() => handleSlChange(1)}
                aria-label="Increase Sick Leave"
                className="w-7 h-7 rounded-full bg-primary-container text-on-primary-fixed flex items-center justify-center hover:bg-primary-fixed active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
            </div>
          </div>

          <div className="h-[1px] bg-surface-container" />

          {/* Leave Year Cycle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">event_repeat</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-title-sm text-title-sm text-on-surface font-semibold">Leave Year Cycle</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-leave-compoff-container text-leave-compoff">
                    +{autoCompOffEarned} Comp-off Days
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {settings.cycle} ({cycleStartDateStr} to {cycleEndDateStr})
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEditCycleModalOpen(true)}
              className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <span>Change</span>
              <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Singapore Holiday & Sync Settings */}
      <section className="space-y-space-xs">
        <div className="px-1 flex items-center justify-between">
          <h2 className="font-title-sm text-title-sm text-on-surface-variant tracking-wider uppercase">
            Singapore Holiday Sync
          </h2>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-leave-compoff-container text-leave-compoff-on-container font-label-sm text-label-sm font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-leave-compoff animate-pulse" />
            Connected
          </div>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-xs border border-surface-container space-y-space-md">
          <div className="flex items-start justify-between gap-space-sm">
            <div className="flex items-start gap-space-sm">
              <div className="w-10 h-10 rounded-lg bg-holiday-public-container text-holiday-public-on-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">cloud_sync</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-title-sm text-title-sm text-on-surface font-semibold">
                    data.gov.sg / MOM Gazette
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-snug">
                  Official Ministry of Manpower gazetted public holidays calendar for 2026.
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-on-surface-variant font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
                  <span>Last Synced: <span className="font-medium text-on-surface">{settings.lastSynced}</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="flex-1 h-10 px-4 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[18px] ${isSyncing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{isSyncing ? 'Syncing MOM Gazette...' : 'Sync Now'}</span>
            </button>
            <button
              onClick={() => setIsHolidaysModalOpen(true)}
              className="h-10 px-3 rounded-full bg-surface-container text-on-surface font-label-md text-label-md flex items-center justify-center gap-1 hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>11 Gazetted Days</span>
            </button>
          </div>

          {/* Offline Cache banner */}
          <div className="rounded-lg bg-surface-container-low p-2.5 flex items-center justify-between border border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">offline_pin</span>
              <span className="font-body-sm text-body-sm text-on-surface font-medium">Offline Cache Enabled</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Singapore Gazetted PH</span>
          </div>
        </div>
      </section>

      {/* Section 2.5: Additional Special Holidays (Rare Cases) */}
      <section className="space-y-space-xs">
        <div className="px-1 flex items-center justify-between">
          <h2 className="font-title-sm text-title-sm text-on-surface-variant tracking-wider uppercase">
            Special Holidays (Rare Cases)
          </h2>
          <button
            onClick={() => setIsAddSpecialHolidayOpen(true)}
            className="font-label-sm text-label-sm text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Add Special</span>
          </button>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-xs border border-surface-container space-y-space-sm">
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
            Add rare non-scheduled public holidays, such as Singapore General Election / Presidential Polling Day, National Jubilee declarations, or company off-days.
          </p>

          {specialHolidays.length > 0 ? (
            <div className="flex flex-col gap-2 pt-1">
              {specialHolidays.map((sh) => (
                <div
                  key={sh.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-surface-container"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{sh.emoji || '🗳️'}</span>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-title-sm text-title-sm font-semibold text-on-surface">
                          {sh.name}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary-fixed text-on-primary-fixed">
                          {sh.category === 'gazetted_adhoc' ? 'Ad-Hoc' : sh.category === 'national' ? 'National' : 'Company'}
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {sh.dayOfWeek}, {sh.date}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSpecialHoliday(sh.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-error hover:bg-error-container transition-colors cursor-pointer"
                    title="Remove this special holiday"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-surface-container-low text-center flex flex-col items-center gap-1">
              <span className="text-on-surface-variant font-label-md text-label-md">No custom special holidays added</span>
              <button
                onClick={() => setIsAddSpecialHolidayOpen(true)}
                className="mt-1 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-semibold hover:bg-primary-fixed-dim transition-colors cursor-pointer"
              >
                + Add Special Holiday
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Section 3: Weekend & Employment Rules */}
      <section className="space-y-space-xs">
        <div className="px-1 flex items-center justify-between">
          <h2 className="font-title-sm text-title-sm text-on-surface-variant tracking-wider uppercase">
            Policy &amp; Comp-off Rules
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Employment Act</span>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-xs border border-surface-container space-y-space-md">
          {/* Weekend Days */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">weekend</span>
              </div>
              <div>
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">Standard Rest Days</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Saturday &amp; Sunday</p>
              </div>
            </div>
            <button
              onClick={() => showToast('Singapore 5-day standard rest workweek (Sat & Sun rest days)')}
              className="w-8 h-8 rounded-full bg-surface-container-low text-on-surface flex items-center justify-center hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          <div className="h-[1px] bg-surface-container" />

          {/* Saturday Comp Off Toggle */}
          <div className="flex items-start justify-between gap-space-sm">
            <div className="flex items-start gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-leave-compoff-container text-leave-compoff-on-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">add_circle</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-title-sm text-title-sm text-on-surface font-semibold">Saturday Holiday Compensation</p>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-snug">
                  Automatically credit +1 Comp-Off Day when a gazetted public holiday falls on a non-working Saturday.
                </p>
                <div className="inline-flex items-center gap-1 mt-1 text-leave-compoff font-label-sm text-label-sm font-semibold">
                  <span className="material-symbols-outlined text-[14px]">task_alt</span>
                  <span>Earn +1 Comp-off Credit</span>
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={settings.saturdayCompOffEnabled}
                onChange={(e) => {
                  updateSettings({ saturdayCompOffEnabled: e.target.checked });
                  showToast(e.target.checked ? 'Saturday holidays will earn +1 Comp-Off day' : 'Saturday holiday compensation turned off');
                }}
                className="sr-only peer"
              />
              <div className="w-12 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          <div className="h-[1px] bg-surface-container" />

          {/* Sunday Rule */}
          <div className="flex items-start justify-between gap-space-sm">
            <div className="flex items-start gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-holiday-public-container text-holiday-public-on-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">next_plan</span>
              </div>
              <div className="min-w-0">
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">Sunday Holiday Rule</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-snug">
                  Observe following Monday as paid public holiday per MOM Employment Act Section 88.
                </p>
                <span className="inline-block mt-1 font-label-sm text-label-sm text-primary font-semibold">
                  Always active (Statutory Mandate)
                </span>
              </div>
            </div>
            <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0 mt-1">
              <span className="material-symbols-outlined text-[16px]">lock</span>
            </div>
          </div>

          <div className="h-[1px] bg-surface-container" />

          {/* Comp-Off Validity Period */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">hourglass_top</span>
              </div>
              <div>
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">Comp-off Validity Window</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">3 Calendar Months (MOM Standard)</p>
              </div>
            </div>
            <button
              onClick={() => showToast('Comp-off validity window is calibrated to MOM standard (90 days)')}
              className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface font-label-md text-label-md flex items-center gap-1 hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <span>90 Days</span>
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          </div>
        </div>
      </section>

      {/* Section 4: Notifications & Reminders */}
      <section className="space-y-space-xs">
        <div className="px-1 flex items-center justify-between">
          <h2 className="font-title-sm text-title-sm text-on-surface-variant tracking-wider uppercase">
            Alerts &amp; Reminders
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Push</span>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-xs border border-surface-container space-y-space-md">
          {/* Toggle 1 */}
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">campaign</span>
              </div>
              <div className="min-w-0">
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">Singapore Public Holiday Alerts</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Notify 3 days before upcoming gazetted holiday</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.phAlertsEnabled}
                onChange={(e) => {
                  updateSettings({ phAlertsEnabled: e.target.checked });
                  showToast(e.target.checked ? 'Public holiday alerts enabled' : 'Public holiday alerts disabled');
                }}
                className="sr-only peer"
              />
              <div className="w-12 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          <div className="h-[1px] bg-surface-container" />

          {/* Toggle 2 */}
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-alert-warning-container text-alert-warning flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">notification_important</span>
              </div>
              <div className="min-w-0">
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">Comp-off Expiry Alerts</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Nudge 30 days &amp; 7 days prior to lapse</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.expiryAlertsEnabled}
                onChange={(e) => {
                  updateSettings({ expiryAlertsEnabled: e.target.checked });
                  showToast(e.target.checked ? 'Expiry alerts enabled' : 'Expiry alerts disabled');
                }}
                className="sr-only peer"
              />
              <div className="w-12 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          <div className="h-[1px] bg-surface-container" />

          {/* Toggle 3 */}
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">battery_alert</span>
              </div>
              <div className="min-w-0">
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">Low Leave Balance Warning</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Warn when remaining Annual Leave ≤ 2 days</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.lowBalanceWarningEnabled}
                onChange={(e) => {
                  updateSettings({ lowBalanceWarningEnabled: e.target.checked });
                  showToast(e.target.checked ? 'Low balance warning turned on' : 'Low balance warning turned off');
                }}
                className="sr-only peer"
              />
              <div className="w-12 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
        </div>
      </section>

      {/* Section 5: Data Management & Backup */}
      <section className="space-y-space-xs">
        <div className="px-1 flex items-center justify-between">
          <h2 className="font-title-sm text-title-sm text-on-surface-variant tracking-wider uppercase">
            Data &amp; Storage
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Local SQLite / Offline</span>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-xs border border-surface-container space-y-space-sm">
          {/* Export CSV */}
          <button
            onClick={exportCSV}
            className="w-full flex items-center justify-between py-2 text-left group cursor-pointer"
          >
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-lg bg-surface-container text-on-surface-variant group-hover:bg-primary-container group-hover:text-on-primary-fixed transition-colors flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">download</span>
              </div>
              <div>
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">Export Leave Records (CSV)</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Compatible with Microsoft Excel &amp; Google Sheets</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
          </button>

          <div className="h-[1px] bg-surface-container" />

          {/* Backup & Restore */}
          <div className="flex items-center justify-between py-2 text-left group">
            <button
              onClick={backupJSON}
              className="flex items-center gap-space-sm flex-1 cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-surface-container text-on-surface-variant group-hover:bg-primary-container group-hover:text-on-primary-fixed transition-colors flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">settings_backup_restore</span>
              </div>
              <div>
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">Backup &amp; Restore</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Save encrypted JSON snapshot or restore</p>
              </div>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={backupJSON}
                className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Backup
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm hover:bg-primary-fixed-dim transition-colors cursor-pointer"
              >
                Restore
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>

          <div className="h-[1px] bg-surface-container" />

          {/* Destructive Action: Reset */}
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="w-full flex items-center justify-between py-2 text-left group cursor-pointer"
          >
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-lg bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">delete_forever</span>
              </div>
              <div>
                <p className="font-title-sm text-title-sm text-error font-semibold">Reset All Leave Data</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Erase FY 2026 logs, balance credits, and custom events
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-error text-[20px]">warning</span>
          </button>
        </div>
      </section>

      {/* Section 6: About & Version Footer */}
      <div className="py-space-md text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-on-surface-variant">
          <span className="font-label-md text-label-md font-semibold text-on-surface">CutiSG</span>
          <span className="text-on-surface-variant">•</span>
          <span className="font-label-md text-label-md">v1.0.0 (Build 2026.04)</span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Singapore Personal Edition • Made for SG Professionals
        </p>
        <div className="pt-2 flex items-center justify-center gap-4 text-primary font-label-sm text-label-sm font-medium">
          <button onClick={() => showToast('Singapore MOM Data Protection & Privacy Standard')} className="hover:underline cursor-pointer">
            Privacy Policy
          </button>
          <span>•</span>
          <button onClick={() => showToast('MOM Employment Act Sec 88: Gazetted Public Holidays Compliance')} className="hover:underline cursor-pointer">
            MOM EA Guidelines
          </button>
          <span>•</span>
          <button onClick={() => showToast('Built with React 19, Tailwind CSS and Material You Design tokens')} className="hover:underline cursor-pointer">
            Open Source Licenses
          </button>
        </div>
      </div>

      {/* In-App Confirmation Modal for Reset Leave Data */}
      {isResetModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in"
          onClick={() => setIsResetModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-surface-card rounded-2xl shadow-2xl p-5 border border-surface-container flex flex-col gap-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px] text-error">warning</span>
            </div>

            <div>
              <h3 className="font-title-md text-title-md font-bold text-on-surface">
                Reset All FY 2026 Leave Data?
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 leading-relaxed">
                This will erase all logged Annual Leave and Sick Leave requests, reset your leave calendar, and restore balances back to the initial Singapore statutory entitlements (12 days AL, 12 days SL).
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 py-2.5 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-variant transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllData();
                  setIsResetModalOpen(false);
                }}
                className="flex-1 py-2.5 rounded-full bg-error text-on-error font-label-md text-label-md font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
