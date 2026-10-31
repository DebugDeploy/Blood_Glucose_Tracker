export const SLOTS = ['Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner'];

export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateReading({ date, slot, value }) {
  if (value === '' || value === null || value === undefined) return 'Please enter a glucose value.';
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue < 40 || numericValue > 600) return 'Value must be between 40 and 600 mg/dl.';
  if (!SLOTS.includes(slot)) return 'Please choose a valid time slot.';
  if (!isCalendarDate(date)) return 'Please choose a valid date.';
  if (date > localDateString()) return 'Date cannot be in the future.';
  return null;
}
