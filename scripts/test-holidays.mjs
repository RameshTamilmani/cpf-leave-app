import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOfficialHolidays, mergeHolidaySources } from '../src/utils/officialHolidays.ts';
import handler from '../api/holidays.ts';

const nationalDay = { date: '2026-08-09', observedDate: '2026-08-10', name: 'National Day', dayOfWeek: 'Sunday', isLongWeekend: true, description: '' };
const custom = (id, date, name) => ({ id, date, name, dayOfWeek: '', isLongWeekend: false, isSpecial: true, category: 'gazetted_adhoc', createdAt: '', description: '' });

test('manual polling entry on National Day observed date is kept for removal but not counted or rendered twice', () => {
  const manual = custom('manual', '2026-08-10', 'General Election Polling Day');
  const merged = mergeHolidaySources([nationalDay], [], [manual]);
  assert.equal(merged.all.filter(h => h.date === '2026-08-10').length, 1);
  assert.equal(merged.all.find(h => h.date === '2026-08-10').name, 'National Day (Observed)');
  assert.equal(merged.specials.length, 0);
  assert.deepEqual(merged.conflicts, [manual]);
});
test('official polling declarations count as specials without adding normal holidays or repeated manual entries', () => {
  const official = parseOfficialHolidays([
    { date: '2026-08-09', holiday: 'National Day' },
    { date: '2026-08-10', holiday: 'National Day (Observed)' },
    // Synthetic future declaration for testing only; not a claim about an actual holiday.
    { date: '2026-10-29', holiday: 'Polling Day' },
  ]);
  const merged = mergeHolidaySources([nationalDay], official, [custom('same', '2026-10-29', 'Election'), custom('company', '2026-12-24', 'Company day')]);
  assert.deepEqual(merged.specials.map(h => h.date), ['2026-10-29', '2026-12-24']);
  assert.equal(merged.specials[0].source, 'official');
  assert.equal(merged.all.filter(h => h.date === '2026-08-10').length, 1);
});
test('invalid feeds cannot replace saved data, and complete official years replace outdated bundled dates', () => {
  assert.throws(() => parseOfficialHolidays([{ date: '2026-02-30', holiday: 'Invalid' }]));
  assert.throws(() => parseOfficialHolidays([]));
  const remote = parseOfficialHolidays(Array.from({length: 11}, (_, i) => ({ date: `2026-01-${String(i + 1).padStart(2,'0')}`, holiday: 'New Year\'s Day' })));
  assert.equal(mergeHolidaySources([nationalDay], remote, []).all.some(h => h.date === nationalDay.date), false);
});
test('server rejects incomplete upstream responses and never accepts client-specified sources', async () => {
  const previous = globalThis.fetch;
  const response = () => ({ code: 0, body: null, headers: {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; }, setHeader(key, value) { this.headers[key] = value; } });
  try {
    globalThis.fetch = async url => {
      assert.ok(String(url).startsWith('https://data.gov.sg/api/action/datastore_search?'));
      return { ok: true, json: async () => ({ success: true, result: { total: 2, records: [{ date: '2026-08-10', holiday: 'National Day (Observed)' }] } }) };
    };
    const incomplete = response(); await handler({ method: 'GET' }, incomplete); assert.equal(incomplete.code, 503);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ success: true, result: { total: 1, records: [{ date: '2026-08-10', holiday: 'National Day (Observed)' }] } }) });
    const good = response(); await handler({ method: 'GET' }, good); assert.equal(good.code, 200); assert.equal(good.body.rows[0].date, '2026-08-10');
    const invalid = response(); await handler({ method: 'POST' }, invalid); assert.equal(invalid.code, 405);
  } finally { globalThis.fetch = previous; }
});
