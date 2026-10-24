import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMonthEntries } from '../src/utils/calendarEntries.ts';

const record = (id, startDate, endDate = startDate, extra = {}) => ({ id, title: id, type: 'AL', status: 'taken', days: 1, startDate, endDate, createdAt: startDate, ...extra });
const holiday = (date, name, extra = {}) => ({ date, name, description: name, dayOfWeek: '', isLongWeekend: false, ...extra });

test('month history expands working dates, excludes weekends and retains weekend public holidays', () => {
  const entries = getMonthEntries(2026, 10, [holiday('2026-11-08', 'Deepavali', { observedDate: '2026-11-09' })], [
    record('weekend-only', '2026-11-07', '2026-11-08'),
    record('span', '2026-11-06', '2026-11-10'),
  ]);
  assert.deepEqual(entries.map(e => [e.date, e.title]), [
    ['2026-11-06', 'span'], ['2026-11-08', 'Deepavali'],
    ['2026-11-09', 'Deepavali (Substitute)'], ['2026-11-10', 'span'],
  ]);
});
test('month boundaries clip spanning leave records and include observed holidays from the previous month', () => {
  const holidays = [holiday('2026-05-31', 'Vesak Day', { observedDate: '2026-06-01' })];
  const records = [record('cross-month', '2026-05-29', '2026-06-03')];
  assert.deepEqual(getMonthEntries(2026, 4, holidays, records).map(e => e.date), ['2026-05-29', '2026-05-31']);
  assert.deepEqual(getMonthEntries(2026, 5, holidays, records).map(e => e.date), ['2026-06-01', '2026-06-02', '2026-06-03']);
});
test('half days, overlapping records and special holidays retain their metadata without duplicate holiday rows', () => {
  const special = holiday('2028-02-29', 'Company Day', { id: 'company', isSpecial: true });
  const half = record('half', '2028-02-28', undefined, { type: 'SL', days: 0.5, halfDay: 'pm' });
  const entries = getMonthEntries(2028, 1, [special, special], [half, record('second', '2028-02-28')]);
  assert.equal(entries.length, 3);
  assert.equal(entries.find(e => e.record?.id === 'half').record.halfDay, 'pm');
  assert.equal(entries.at(-1).holiday.isSpecial, true);
  assert.deepEqual(getMonthEntries(2026, 0, [], []), []);
});
