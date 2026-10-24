import { test } from 'node:test';
import assert from 'node:assert/strict';
import { profileError, tenureTier, experienceLabel } from '../src/utils/profile.ts';

const complete = { userName: 'Ramesh Tamilmani', employeeId: '6509', department: 'HIS', dateOfJoining: '2022-11-18' };
test('all four identity fields are required; image is optional and length/date constraints are enforced', () => {
  assert.equal(profileError(complete, '2026-10-24'), '');
  for (const field of Object.keys(complete)) assert.notEqual(profileError({ ...complete, [field]: ' ' }, '2026-10-24'), '');
  assert.notEqual(profileError({ ...complete, dateOfJoining: '2026-02-30' }, '2026-10-24'), '');
  assert.notEqual(profileError({ ...complete, dateOfJoining: '2026-10-25' }, '2026-10-24'), '');
  assert.notEqual(profileError({ ...complete, employeeId: 'EMP6509' }, '2026-10-24'), '');
  assert.equal(profileError({ ...complete, department: 'x'.repeat(25) }, '2026-10-24'), '');
  assert.notEqual(profileError({ ...complete, department: 'x'.repeat(26) }, '2026-10-24'), '');
});
test('tenure boundaries switch at the first anniversary and after the second anniversary', () => {
  assert.equal(tenureTier('2025-10-25', '2026-10-24'), 'green');
  assert.equal(tenureTier('2025-10-24', '2026-10-24'), 'blue');
  assert.equal(tenureTier('2024-10-24', '2026-10-24'), 'blue');
  assert.equal(tenureTier('2024-10-23', '2026-10-24'), 'gold');
  assert.equal(tenureTier('2026-10-25', '2026-10-24'), 'neutral');
  assert.equal(tenureTier('', '2026-10-24'), 'neutral');
});
test('calendar anniversaries handle leap days and end-of-month experience accurately', () => {
  assert.equal(tenureTier('2024-02-29', '2025-02-27'), 'green');
  assert.equal(tenureTier('2024-02-29', '2025-02-28'), 'blue');
  assert.equal(tenureTier('2024-02-29', '2026-02-28'), 'blue');
  assert.equal(tenureTier('2024-02-29', '2026-03-01'), 'gold');
  assert.equal(experienceLabel('2024-02-29', '2025-02-28'), '1 year');
  assert.equal(experienceLabel('2026-01-31', '2026-02-28'), '1 month');
  assert.equal(experienceLabel('2026-10-24', '2026-10-24'), 'Joined today');
  assert.equal(experienceLabel('2022-11-18', '2026-10-24'), '3 years 11 months');
});
