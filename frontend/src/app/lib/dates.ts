/**
 * Utility for handling dates in UTC+7 (Hanoi) timezone.
 */

export const VIETNAM_OFFSET = 7;

/**
 * Returns the current date in UTC+7 as a Date object.
 */
export function getNowVietnam(): Date {
  const now = new Date();
  // Get UTC time in ms
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  // Create new Date object for Vietnam
  return new Date(utc + (3600000 * VIETNAM_OFFSET));
}

/**
 * Returns today's date in YYYY-MM-DD format (UTC+7).
 */
export function getTodayString(): string {
  const now = getNowVietnam();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current month in YYYY-MM format (UTC+7).
 */
export function getCurrentMonthString(): string {
  const now = getNowVietnam();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Formats a date string or object to locale string for Vietnam.
 */
export function formatVietnamDate(date: Date | string, options: Intl.DateTimeFormatOptions = {}): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    ...options
  });
}
