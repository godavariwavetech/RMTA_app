// True when `imei` is 15 digits and its last digit satisfies the Luhn checksum.
export function isValidImei(imei) {
  if (!/^\d{15}$/.test(imei)) return false;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let d = Number(imei[i]);
    if (i % 2 === 1) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    sum += d;
  }
  return (10 - (sum % 10)) % 10 === Number(imei[14]);
}
