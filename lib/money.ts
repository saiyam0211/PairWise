/**
 * All money is stored as integer cents (e.g. 450 = $4.50).
 * Display is always via Intl.NumberFormat to avoid JS float drift.
 */

export function formatCents(
  cents: number,
  currencyCode = 'USD',
  locale = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Parse a raw keypad string like "450" → 450 cents (already in cents). */
export function rawToCents(raw: string): number {
  const n = parseInt(raw || '0', 10);
  return isNaN(n) ? 0 : n;
}

/** Display keypad input (stored as cents integer) as "4.50" without currency. */
export function centsToDisplay(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Apply a keypad digit press to the current cents accumulator. */
export function keypadDigit(current: number, digit: string): number {
  // Max ~$99,999.99
  if (current >= 9_999_999) return current;
  return current * 10 + parseInt(digit, 10);
}

/** Backspace on the cents accumulator. */
export function keypadBackspace(current: number): number {
  return Math.floor(current / 10);
}
