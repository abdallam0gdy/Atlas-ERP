/**
 * Atlas ERP — Standard Formatters
 */

/**
 * Format 24h time 'HH:mm' to Arabic 12h format 'hh:mm ص/م'
 * Example: '17:00' -> '05:00 م'
 * Example: '09:30' -> '09:30 ص'
 */
export function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let hour = parseInt(hStr, 10);
  const minute = mStr || '00';

  if (isNaN(hour)) return timeStr;

  const period = hour >= 12 ? 'م' : 'ص';
  hour = hour % 12;
  if (hour === 0) hour = 12;

  const formattedHour = String(hour).padStart(2, '0');
  return `${formattedHour}:${minute} ${period}`;
}

/**
 * Parse 24h 'HH:mm' string to 12h components
 */
export function parseTimeTo12h(timeStr) {
  if (!timeStr) return { hour: '05', minute: '00', period: 'pm' };
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const minute = mStr || '00';

  if (isNaN(h)) return { hour: '05', minute: '00', period: 'pm' };

  const period = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  if (h === 0) h = 12;

  return {
    hour: String(h).padStart(2, '0'),
    minute,
    period,
  };
}

/**
 * Convert 12h components back to 24h 'HH:mm' string
 */
export function time12hTo24h(hour, minute, period) {
  let h = parseInt(hour, 10);
  if (isNaN(h) || h < 1) h = 12;
  if (h > 12) h = 12;

  if (period === 'pm' && h < 12) {
    h += 12;
  } else if (period === 'am' && h === 12) {
    h = 0;
  }

  const m = String(minute || '00').padStart(2, '0');
  return `${String(h).padStart(2, '0')}:${m}`;
}

/**
 * Format currency in Egyptian Pounds (ج.م)
 * Example: 250 -> '250 ج.م'
 * Example: 2025 -> '2,025 ج.م'
 * Example: 0 -> '0 ج.م'
 */
export function formatEGP(amount) {
  const num = Number(amount) || 0;
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ج.م`;
}

/**
 * Format standard count (e.g. 0, 15, 1,200)
 */
export function formatCount(amount) {
  const num = Number(amount) || 0;
  return num.toLocaleString('en-US');
}

/**
 * English/Standard digits currency format with ج.م
 */
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return `${num.toFixed(2)} ج.م`;
}
