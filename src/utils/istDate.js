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
