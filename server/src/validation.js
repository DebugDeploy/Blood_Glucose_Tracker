// Available time slots for readings
export const SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

// Format a local date as YYYY-MM-DD.
export function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Keep the named helper used by validation and its tests.
export function getTodayDate() {
  return localDateString();
}

// Check if date is valid (YYYY-MM-DD format)
function isValidDate(dateString) {
  // Check format with regex
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  // Parse the date parts
  const [year, month, day] = dateString.split('-').map(Number);

  // Create a date object
  const date = new Date(year, month - 1, day);

  // Check if the date components match (catches invalid dates like Feb 30)
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day;
}

// Validate a glucose reading
export function validateReading(reading) {
  const { date, slot, value } = reading;

  // Rule 1: Value is required
  if (!value && value !== 0) {
    return 'Please enter a glucose value.';
  }

  // Rule 2: Value must be whole number between 40 and 600
  const numValue = Number(value);
  if (!Number.isInteger(numValue) || numValue < 40 || numValue > 600) {
    return 'Value must be between 40 and 600 mg/dl.';
  }

  // Check if slot is valid
  if (!SLOTS.includes(slot)) {
    return 'Please choose a valid time slot.';
  }

  // Check if date is valid
  if (!isValidDate(date)) {
    return 'Please choose a valid date.';
  }

  // Rule 5: Date cannot be in the future
  if (date > getTodayDate()) {
    return 'Date cannot be in the future.';
  }

  // All validations passed
  return null;
}
