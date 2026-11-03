import test from 'node:test';
import assert from 'node:assert/strict';
import { getTodayDate, validateReading } from './validation.js';

// Test: Validation should reject invalid readings
test('rejects empty, out-of-range, fractional, future and invalid slot readings', () => {
  const today = getTodayDate();

  // Empty value
  assert.equal(
    validateReading({ date: today, slot: 'Morning (fasting)', value: '' }),
    'Please enter a glucose value.'
  );

  // Value too high
  assert.equal(
    validateReading({ date: today, slot: 'Morning (fasting)', value: 601 }),
    'Value must be between 40 and 600 mg/dl.'
  );

  // Fractional value (not a whole number)
  assert.equal(
    validateReading({ date: today, slot: 'Morning (fasting)', value: 80.5 }),
    'Value must be between 40 and 600 mg/dl.'
  );

  // Future date
  assert.equal(
    validateReading({ date: '2999-01-01', slot: 'Morning (fasting)', value: 100 }),
    'Date cannot be in the future.'
  );

  // Invalid slot
  assert.equal(
    validateReading({ date: today, slot: 'snack', value: 100 }),
    'Please choose a valid time slot.'
  );
});

// Test: Validation should accept valid readings
test('accepts valid reading', () => {
  assert.equal(
    validateReading({ date: getTodayDate(), slot: 'After lunch', value: '128' }),
    null
  );
});

// Test: Validation should reject impossible calendar dates
test('rejects impossible calendar dates', () => {
  assert.equal(
    validateReading({ date: '2026-02-30', slot: 'After lunch', value: 128 }),
    'Please choose a valid date.'
  );
});
