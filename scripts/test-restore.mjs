import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restoreFileError, restoreContentError } from '../src/utils/restoreValidation.ts';

test('restore accepts CSV extensions regardless of platform MIME and rejects other file types', () => {
  for (const name of ['photo.png', 'backup.xlsx', 'file.pdf', 'notes.txt', 'backup.csv.exe']) assert.match(restoreFileError({name,size:10}), /Unsupported file/);
  assert.equal(restoreFileError({name:'BACKUP.CSV',size:10}),null);
  assert.match(restoreFileError({name:'backup.csv',size:0}),/empty/);
});
test('CSV must contain leave export headers and data, including quoted headers and BOM', () => {
  const headers='Type,Title,Start Date,End Date,Days,Status,Remarks';
  const row='AL,Annual Leave,2026-10-26,2026-10-26,1,planned,';
  assert.equal(restoreContentError(headers+'\r\n'+row),null);
  assert.equal(restoreContentError('\uFEFF"Type","Title","Start Date","End Date","Days","Status","Remarks"\n'+row),null);
  for(const content of ['Name,Email\nPerson,person@example.com','%PDF-1.7','PK\0binary','{}']) assert.match(restoreContentError(content),/Unsupported file contents/);
  assert.match(restoreContentError(headers),/No leave records/);
  assert.match(restoreContentError('  '),/empty/);
});
