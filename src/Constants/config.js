// Central API configuration: base URL + all endpoint paths live here.
// Change BASE_URL in ONE place when the server host/IP or port changes.
//
//   Physical Android phone : use the PC's LAN IP (run `ipconfig`), phone on
//                            the SAME Wi-Fi, firewall open for the port.
//   Android Studio emulator: 'http://10.0.2.2:2406'
//   Genymotion emulator    : 'http://10.0.3.2:2406'
//   iOS simulator          : 'http://localhost:2406'

export const BASE_URL = 'https://rmtatech.com:1810/';
// export const BASE_URL= 'https://rmtatech.com:1810/';

// Default network request timeout (ms) — fail fast instead of hanging.
export const REQUEST_TIMEOUT = 10000;

// API endpoint paths, relative to BASE_URL.
export const ENDPOINTS = {
  // Public RMTA app (registration, login, etc.)
  
  MEMBER_REGISTRATION: 'public_app/member_registertion',
  MEMBER_LOGIN: 'public_app/member_login',
  ADMIN_DETAILS: 'public_app/admin_details',
  TECHNICIAN_DETAILS: 'public_app/technician_details',
  SEND_CUSTOMER_OTP: 'public_app/send_customer_otp',
  UPLOAD_FILE: 'public_app/upload_file',
  CREATE_JOB_SHEET: 'public_app/create_job_sheet',
  JOB_COUNTS: 'public_app/job_counts',
  RECENT_ACTIVITY: 'public_app/recent_activity',
  IMEI_CHECK: 'public_app/imei_check',
  REPAIR_REPORT: 'public_app/repair_report',
  ADMIN_REPAIR_REPORT: 'public_app/admin_repair_report',
  ADMIN_JOBS_LIST: 'public_app/admin_jobs_list',
  ADMIN_TRADE_MONITORING: 'public_app/admin_trade_monitoring',
  JOB_SHEETS_LIST: 'public_app/job_sheets_list',
  JOB_SHEET_DETAILS: 'public_app/job_sheet_details',
  START_JOB_REPAIR: 'public_app/start_job_repair',
  MARK_JOB_READY: 'public_app/mark_job_ready',
  CREATE_PURCHASE: 'public_app/create_purchase',
  PURCHASES_LIST: 'public_app/purchases_list',
  INVENTORY_LIST: 'public_app/inventory_list',
  CREATE_SALE: 'public_app/create_sale',
  SALES_LIST: 'public_app/sales_list',
  FORGOT_SEND_OTP: 'public_app/forgot_password/send_otp',
  FORGOT_VERIFY_OTP: 'public_app/forgot_password/verify_otp',
  FORGOT_RESET_PASSWORD: 'public_app/forgot_password/reset',
  TECHNICIANS_LIST: 'public_app/technicians_list',
  ADD_TECHNICIAN: 'public_app/add_technician',
  RESET_TECHNICIAN_PASSWORD: 'public_app/reset_technician_password',
  SET_TECHNICIAN_STATUS: 'public_app/set_technician_status',
};

// Build a full URL from an endpoint path, e.g. buildUrl(ENDPOINTS.MEMBER_REGISTRATION)
export const buildUrl = endpoint => `${BASE_URL}${endpoint}`;

export default { BASE_URL, REQUEST_TIMEOUT, ENDPOINTS, buildUrl };
