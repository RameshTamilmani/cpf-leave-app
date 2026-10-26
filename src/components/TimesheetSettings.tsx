import { useState } from 'react';
import { useLeave } from '../context/LeaveContext';
import { exportTimesheet } from '../utils/timesheetExport';

export function TimesheetSettings() {
  const {settings,records,allHolidays,todayDateStr,showToast}=useLeave();
  const [month,setMonth]=useState(todayDateStr.slice(0,7));
  const [exporting,setExporting]=useState(false);
  const [error,setError]=useState('');
  async function download() {
    if(exporting)return;
    setError(''); setExporting(true);
    try {await exportTimesheet(month,settings,records,allHolidays);showToast('Timesheet exported.');}
    catch(e){setError(e instanceof Error?e.message:'Timesheet could not be exported.');}
    finally{setExporting(false);}
  }
  return <section aria-labelledby="timesheet-heading" className="flex flex-col gap-2">
    <h2 id="timesheet-heading" className="section-heading px-1">Timesheet</h2>
    <div className="rounded-2xl border border-surface-container bg-surface-card p-4 flex flex-col gap-3">
      <p className="text-xs text-on-surface-variant">CPF · Chennai · Sujatha Sambavamurthy</p>
      <label className="text-sm text-on-surface flex flex-col gap-1">Timesheet Month
        <input aria-label="Timesheet Month" type="month" min="1901-01" max="9998-12" value={month} onChange={e=>setMonth(e.target.value)} className="h-10 min-w-0 w-full rounded-xl border border-surface-outline bg-surface-container-lowest px-3 text-on-surface" />
      </label>
      <p className="text-xs text-on-surface-variant">Full month · 9-hour weekdays · Singapore holidays · Blank weekends</p>
      {error&&<p role="alert" className="text-sm text-error">{error}</p>}
      <button type="button" disabled={exporting||!month} onClick={download} className="self-start rounded-full bg-primary text-on-primary text-sm font-semibold px-5 py-2.5 disabled:opacity-50 cursor-pointer">{exporting?'Exporting…':'Export Timesheet'}</button>
    </div>
  </section>;
}
