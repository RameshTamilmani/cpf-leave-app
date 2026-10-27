import { useEffect, useRef, useState } from 'react';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { useLeave } from '../context/LeaveContext';
import { exportTimesheet } from '../utils/timesheetExport';

export function TimesheetExportModal({onClose}:{onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  useModalScrollLock(true);
  useEffect(()=>{dialog.current?.showModal();},[]);
  const {settings,records,allHolidays,todayDateStr,showToast}=useLeave();
  const [month,setMonth]=useState(todayDateStr.slice(0,7));
  const monthInput=useRef<HTMLInputElement>(null);
  function openMonthPicker(){
    const input=monthInput.current;if(!input)return;
    try{if(typeof input.showPicker==='function')input.showPicker();else input.focus();}catch{input.focus();}
  }
  const [exporting,setExporting]=useState(false);
  const [error,setError]=useState('');
  async function download() {
    if(exporting)return;
    setError(''); setExporting(true);
    try {await exportTimesheet(month,settings,records,allHolidays);showToast('Timesheet exported.');onClose();}
    catch(e){setError(e instanceof Error?e.message:'Timesheet could not be exported.');}
    finally{setExporting(false);}
  }
  return <dialog ref={dialog} aria-labelledby="timesheet-heading" onCancel={onClose} className="m-auto w-[calc(100%_-_2rem)] max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain rounded-2xl border border-surface-container bg-surface-card p-5 text-on-surface shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-xs">
    <div className="flex items-center justify-between gap-3 mb-5"><h2 id="timesheet-heading" className="text-lg font-semibold">Export Timesheet</h2><button type="button" aria-label="Close Timesheet" onClick={onClose} disabled={exporting} className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center cursor-pointer"><span aria-hidden="true" className="material-symbols-outlined text-[20px]">close</span></button></div>
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="timesheet-month" className="text-sm text-on-surface">Timesheet Month</label>
        <div className="relative">
          <input ref={monthInput} id="timesheet-month" aria-label="Timesheet Month" type="month" min="1901-01" max="9998-12" value={month} onChange={e=>setMonth(e.target.value)} className="timesheet-month-input h-10 min-w-0 w-full rounded-xl border border-surface-outline bg-surface-container-lowest pl-3 pr-12 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary" />
          <button type="button" onClick={openMonthPicker} aria-label="Choose Timesheet Month" title="Choose month and year" className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-colors border cursor-pointer z-10 active:scale-95 shadow-2xs bg-surface-container hover:bg-surface-container-high text-primary border-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <span aria-hidden="true" className="material-symbols-outlined text-[19px]">calendar_month</span>
          </button>
        </div>
      </div>
      {error&&<p role="alert" className="text-sm text-error">{error}</p>}
      <button type="button" disabled={exporting||!month} onClick={download} className="self-start rounded-full bg-primary text-on-primary text-sm font-semibold px-5 py-2.5 disabled:opacity-50 cursor-pointer">{exporting?'Exporting…':'Export Timesheet'}</button>
    </div>
  </dialog>;
}
