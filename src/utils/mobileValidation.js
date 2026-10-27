export const normalizeMobileNumber = value =>
  String(value || '').replace(/\D/g, '').slice(0, 10);

export const isValidIndianMobileNumber = value =>
  /^[6-9]\d{9}$/.test(normalizeMobileNumber(value));
