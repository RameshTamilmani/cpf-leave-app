import type { LeaveRecord } from '../types/leave';
export const RECORDS_KEY = 'cutisg_records';
export function readRecords(): LeaveRecord[] {
  const value = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
  if (!Array.isArray(value)) throw Error('Saved records are not readable. Export or recover your backup before changing them.');
  return value.filter(r => !r.id?.startsWith('demo-'));
}
function applyChange(change: (records: LeaveRecord[]) => LeaveRecord[], expected?: string) {
  const raw = localStorage.getItem(RECORDS_KEY) || '[]';
  if (expected !== undefined && expected !== raw) throw Error('Records changed in another window. Review them and try again.');
  const next = change(readRecords());
  localStorage.setItem(RECORDS_KEY, JSON.stringify(next));
  return next;
}
// A read/write IndexedDB transaction holds an origin-wide lock too. The records
// stay in their existing localStorage key; this database contains no user data.
function indexedLock(change: (records: LeaveRecord[]) => LeaveRecord[], expected?: string): Promise<LeaveRecord[]> {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(Error('Safe saving is unavailable. Please update your browser.')); return; }
    let cancelled = false;
    const open = indexedDB.open('cutisg-record-write-lock', 1);
    open.onupgradeneeded = () => { open.result.createObjectStore('mutex'); };
    open.onerror = () => reject(Error('Could not open safe storage. Your records were not changed.'));
    open.onblocked = () => { cancelled = true; reject(Error('Close other app windows and try saving again.')); };
    open.onsuccess = () => {
      const db = open.result;
      if (cancelled) { db.close(); return; }
      const tx = db.transaction('mutex', 'readwrite');
      let result: LeaveRecord[] = [];
      let failure: unknown;
      tx.objectStore('mutex').get('records').onsuccess = () => {
        try { result = applyChange(change, expected); }
        catch (error) { failure = error; tx.abort(); }
      };
      tx.oncomplete = () => { db.close(); resolve(result); };
      tx.onabort = () => { db.close(); reject(failure || Error('Could not save records. Please try again.')); };
    };
  });
}
export async function transactRecords(change: (records: LeaveRecord[]) => LeaveRecord[], expected?: string): Promise<LeaveRecord[]> {
  if (navigator.locks) return navigator.locks.request('cutisg-leave-records', () => applyChange(change, expected));
  return indexedLock(change, expected);
}
