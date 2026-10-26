import { compOffAllocation } from './leaveAccounting';
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import type { LeaveRecord, PublicHoliday, UserSettings } from '../types/leave';
import { buildTimesheet, TIMESHEET_DEFAULTS, validContact } from './timesheetRows';
import templateURL from '../assets/hr-timesheet-template.xlsx?url';

const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const xml = (text: string) => { const doc = new DOMParser().parseFromString(text, 'application/xml'); if (doc.getElementsByTagName('parsererror').length) throw Error('The timesheet template could not be read.'); return doc; };

export function fillTimesheet(template: Uint8Array, month: string, settings: UserSettings, records: LeaveRecord[], holidays: PublicHoliday[]) {
  if (!settings.userName?.trim() || !settings.employeeId?.trim()) throw Error('Complete your employee profile before exporting.');
  if (!validContact(settings.contactNumber ?? settings.timesheetContact ?? '')) throw Error('Enter a valid contact number in Employee Profile before exporting.');
  const allocation=compOffAllocation(records,settings.saturdayCompOffEnabled?holidays:[],new Date().toLocaleDateString('en-CA'),settings.excludedHolidayDates||[]);
  const exportRecords=records.map(r=>(r.type==='CO'||r.type==='CL')&&!r.compOffCredits?{...r,compOffCredits:allocation.assignments.get(r.id)}:r);
  const result = buildTimesheet(month, exportRecords, holidays);
  const monthCompOffIds=new Set(records.filter(r=>(r.type==='CO'||r.type==='CL')&&r.startDate<=month+'-31'&&r.endDate>=month+'-01').map(r=>r.id));
  if(allocation.unfunded.some(id=>monthCompOffIds.has(id)))throw Error('Review the selected Comp-Off credits for this month before exporting. No records were changed.');
  const files = unzipSync(template);
  const sheetPath = 'xl/worksheets/sheet1.xml';
  if (!files[sheetPath]) throw Error('The HR timesheet template is unavailable.');
  const sheet = xml(strFromU8(files[sheetPath]));
  const findCell = (address: string) => {
    let cell = [...sheet.getElementsByTagNameNS(NS, 'c')].find(c => c.getAttribute('r') === address);
    if (!cell) {
      const rowNumber = address.match(/\d+$/)![0];
      const row = [...sheet.getElementsByTagNameNS(NS, 'row')].find(r => r.getAttribute('r') === rowNumber);
      if (!row) throw Error('Unexpected HR template layout.');
      cell = sheet.createElementNS(NS, 'c'); cell.setAttribute('r', address);
      const col = address.replace(/\d/g, '');
      const next = [...row.children].find(c => (c.getAttribute('r') || '').replace(/\d/g, '') > col);
      row.insertBefore(cell, next || null);
    }
    return cell;
  };
  const set = (address: string, value: string | number, style?: string, keepFormula = false) => {
    const cell = findCell(address);
    for (const child of [...cell.children]) if (!(keepFormula && child.localName === 'f')) child.remove();
    cell.removeAttribute('t'); if (style) cell.setAttribute('s', style);
    if (value === '') return;
    if (typeof value === 'number' || keepFormula) {
      if (keepFormula && typeof value === 'string') cell.setAttribute('t', 'str');
      const v = sheet.createElementNS(NS, 'v'); v.textContent = String(value); cell.appendChild(v);
    } else {
      cell.setAttribute('t', 'inlineStr'); const is = sheet.createElementNS(NS, 'is'); const t = sheet.createElementNS(NS, 't');
      t.textContent = value; t.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve'); is.appendChild(t); cell.appendChild(is);
    }
  };
  set('E8', settings.employeeId.trim(), '24'); set('G8', settings.userName.trim(), '24');
  set('E9', TIMESHEET_DEFAULTS.businessUnit, '24'); set('G9', TIMESHEET_DEFAULTS.location, '24');
  set('E10', TIMESHEET_DEFAULTS.manager, '24'); set('G10', (settings.contactNumber ?? settings.timesheetContact)!.trim(), '24');
  const [year, m] = month.split('-').map(Number);
  const title = new Date(year,m-1,1).toLocaleDateString('en-US',{month:'long',year:'numeric'}).replace(' ', '-').toUpperCase();
  set('D6', `TIMESHEET FOR THE MONTH OF - ${title}`, undefined, true);
  for (let i=0; i<31; i++) {
    const n = 14+i, r = result.rows[i];
    // Replace mixed fixed/formula date cells with correct dates for the selected month.
    const serial = r ? (Date.UTC(year,m-1,i+1)-Date.UTC(1899,11,30))/86400000 : '';
    set(`D${n}`, serial, i===0?'60':'64'); set(`E${n}`, r?.day || '', '61');
    set(`F${n}`, r?.hours ?? '', r?.style === 'work' ? '62' : r?.style === 'leave' ? '65' : '63');
    set(`G${n}`, r?.remarks || '', r?.remarks.includes('Sick Leave') ? '68' : r?.remarks.includes('Annual Leave') ? '67' : '66');
  }
  set('F45', result.totalHours, undefined, true); set('E11', result.totalHours, undefined, true); set('G11', result.totalLeave, undefined, true);
  // Preserve HR's fonts/colors/borders; wrap only overflowing input text so a
  // specific Comp-Off reason or long name does not disappear off the page.
  const styles=xml(strFromU8(files['xl/styles.xml']));
  const xfs=styles.getElementsByTagNameNS(NS,'cellXfs')[0];
  const fonts=styles.getElementsByTagNameNS(NS,'fonts')[0];
  const wrapped=new Map<string,string>();
  const canvas=document.createElement('canvas').getContext('2d');
  for(const address of ['G8','G10',...result.rows.map((_,i)=>'G'+(i+14))]) {
    const cell=findCell(address),text=cell.getElementsByTagNameNS(NS,'t')[0]?.textContent;
    if(!text)continue;
    const styleId=cell.getAttribute('s')||'0',base=xfs.children[Number(styleId)];
    const font=fonts.children[Number(base.getAttribute('fontId')||'0')];
    const size=Number(font.getElementsByTagNameNS(NS,'sz')[0]?.getAttribute('val')||11);
    const family=font.getElementsByTagNameNS(NS,'name')[0]?.getAttribute('val')||'Arial';
    if(canvas)canvas.font=size+'pt '+family;
    const column=[...sheet.getElementsByTagNameNS(NS,'col')].find(c=>Number(c.getAttribute('min'))<=7&&Number(c.getAttribute('max'))>=7);
    const width=Number(column?.getAttribute('width')||28)*7-7;
    let lines=0;
    for(const paragraph of text.split('\n')) {
      let current='';lines++;
      for(const word of paragraph.split(/\s+/)) {
        const next=current?current+' '+word:word;
        const pixels=canvas?canvas.measureText(next).width:next.length*size*0.7;
        if(current&&pixels>width){lines++;current=word;}else current=next;
      }
    }
    if(lines<2)continue;
    if(!wrapped.has(styleId)){
      const variant=base.cloneNode(true) as Element;
      let alignment=variant.getElementsByTagNameNS(NS,'alignment')[0];
      if(!alignment){alignment=styles.createElementNS(NS,'alignment');variant.insertBefore(alignment,variant.getElementsByTagNameNS(NS,'protection')[0]||null);}
      alignment.setAttribute('wrapText','1');variant.setAttribute('applyAlignment','1');
      wrapped.set(styleId,String(xfs.children.length));xfs.appendChild(variant);
    }
    cell.setAttribute('s',wrapped.get(styleId)!);
    const row=cell.parentElement!;row.setAttribute('ht',String(Math.min(409.5,Math.max(Number(row.getAttribute('ht')||15),lines*(size+4)))));row.setAttribute('customHeight','1');
  }
  xfs.setAttribute('count',String(xfs.children.length));
  if(wrapped.size)files['xl/styles.xml']=strToU8(new XMLSerializer().serializeToString(styles));
  files[sheetPath] = strToU8(new XMLSerializer().serializeToString(sheet));
  // The old calculation chain refers to date formulas replaced above. Excel rebuilds it.
  delete files['xl/calcChain.xml'];
  const rels = xml(strFromU8(files['xl/_rels/workbook.xml.rels']));
  for (const rel of [...rels.documentElement.children]) if ((rel.getAttribute('Type')||'').endsWith('/calcChain')) rel.remove();
  files['xl/_rels/workbook.xml.rels'] = strToU8(new XMLSerializer().serializeToString(rels));
  const content = xml(strFromU8(files['[Content_Types].xml']));
  for (const part of [...content.documentElement.children]) if (part.getAttribute('PartName') === '/xl/calcChain.xml') part.remove();
  files['[Content_Types].xml'] = strToU8(new XMLSerializer().serializeToString(content));
  return zipSync(files);
}

export async function exportTimesheet(month: string, settings: UserSettings, records: LeaveRecord[], holidays: PublicHoliday[]) {
  const response = await fetch(templateURL); if (!response.ok) throw Error('Timesheet template is unavailable. Reopen online to finish installing the app, then try again.');
  const bytes = fillTimesheet(new Uint8Array(await response.arrayBuffer()),month,settings,records,holidays);
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  const link = document.createElement('a'); link.href=url; link.download=`Optimum India_Timesheet_${month}_${settings.employeeId}.xlsx`;
  document.body.appendChild(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
