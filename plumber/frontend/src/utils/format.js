/**
 * Shared formatting utilities for consistent data display across the app.
 */

/**
 * Format an ISO date string to a readable locale format.
 * Returns "—" if the input is missing or invalid.
 * @param {string} dateStr - ISO date string
 * @param {object} [opts] - Intl.DateTimeFormat options
 * @returns {string}
 */
export function formatDate(dateStr, opts) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

/**
 * Format a currency value with $ prefix.
 * @param {number|string} value
 * @returns {string}
 */
export function formatCurrency(value) {
  const num = Number(value);
  if (isNaN(num) || num === 0) return '$0';
  return `$${num.toLocaleString()}`;
}

/**
 * Clamp a rating between 0–5 and return as number.
 * @param {number} rating
 * @returns {number}
 */
export function clampRating(rating) {
  const n = Number(rating) || 0;
  return Math.max(0, Math.min(5, n));
}

/**
 * Safely get the first character of a name string.
 * @param {string} name
 * @returns {string}
 */
export function nameInitial(name) {
  return (name || 'U').charAt(0).toUpperCase();
}

/**
 * Safely get the first name from a full name string.
 * @param {string} name
 * @returns {string}
 */
export function firstName(name) {
  return (name || 'User').split(' ')[0];
}

/**
 * Normalize a booking status string to a known value.
 * @param {string} status
 * @returns {string}
 */
export function normalizeStatus(status) {
  const valid = ['pending', 'accepted', 'completed', 'cancelled'];
  const s = (status || '').toLowerCase();
  return valid.includes(s) ? s : 'pending';
}
