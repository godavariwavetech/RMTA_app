// Current date and time in India (UTC+05:30) as "YYYY-MM-DD HH:mm:ss", the same value as
//   moment().utcOffset("+05:30").format("YYYY-MM-DD HH:mm:ss")
// without needing moment. Works whatever time zone the phone is set to.
const pad = n => String(n).padStart(2, '0');

export function istDateTime(date = new Date()) {
  const ist = new Date(date.getTime() + 330 * 60 * 1000); // +5h30m, read back as UTC fields
  return (
    `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())} ` +
    `${pad(ist.getUTCHours())}:${pad(ist.getUTCMinutes())}:${pad(ist.getUTCSeconds())}`
  );
}

// Readable date/time for the screen, e.g. "11 Nov 2026, 2:32 PM".
// Accepts the "YYYY-MM-DD HH:mm:ss" India-time strings the app sends (read as IST,
// not as phone-local time) as well as ISO strings from the server. A date with no
// time part (or a midnight ISO value) is shown as the date only. Anything that
// can't be read as a date is returned unchanged.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDisplayDateTime(value) {
  if (value === null || value === undefined || value === '') return '';
  const str = String(value).trim();
  let parts;
  const local = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (local) {
    parts = {
      y: +local[1], mo: +local[2] - 1, d: +local[3],
      h: local[4] !== undefined ? +local[4] : null,
      mi: local[5] !== undefined ? +local[5] : 0,
    };
  } else {
    const date = new Date(str);
    if (isNaN(date)) return str;
    // Server timestamps (with Z / offset) are shown in India time.
    const ist = new Date(date.getTime() + 330 * 60 * 1000);
    const midnightUtc = /T00:00:00(\.0+)?Z?$/.test(str);
    parts = {
      y: ist.getUTCFullYear(), mo: ist.getUTCMonth(), d: ist.getUTCDate(),
      h: midnightUtc ? null : ist.getUTCHours(),
      mi: ist.getUTCMinutes(),
    };
  }
  if (parts.mo < 0 || parts.mo > 11) return str;
  const datePart = `${parts.d} ${MONTHS[parts.mo]} ${parts.y}`;
  if (parts.h === null) return datePart;
  const h12 = parts.h % 12 || 12;
  return `${datePart}, ${h12}:${pad(parts.mi)} ${parts.h < 12 ? 'AM' : 'PM'}`;
}
