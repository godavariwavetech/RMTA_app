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
// Raised from 10s: this backend is occasionally slow enough to exceed 10s
// even on requests that ultimately succeed (DB write commits before the
// HTTP response arrives), which was showing up as false "could not reach
// the server" failures in the app.
export const REQUEST_TIMEOUT = 30000;

// API endpoint paths, relative to BASE_URL.
export const ENDPOINTS = {
  // Public RMTA app (registration, login, etc.)
  
  MEMBER_REGISTRATION: 'public_app/member_registertion',
  MEMBER_LOGIN: 'public_app/member_login',
  ADMIN_DETAILS: 'public_app/admin_details',
  TECHNICIAN_DETAILS: 'public_app/technician_details',
  SEND_CUSTOMER_OTP: 'public_app/send_customer_otp',
  VERIFY_CUSTOMER_OTP: 'public_app/verify_customer_otp',
  VERIFY_SALE_CUSTOMER_OTP: 'public_app/verify_salecustomer_otp',
  UPLOAD_FILE: 'public_app/upload_file',
  CREATE_JOB_SHEET_CUSTOMER: 'public_app/create_job_sheet_customer',
  CREATE_JOB_SHEET: 'public_app/create_job_sheets',
  JOB_COUNTS: 'public_app/getcounts',
  GET_SCROLL: 'public_app/getscroll',
  GET_BANNERS: 'public_app/getbanners',
  POST_PLAYER_ID: 'public_app/postplayer_id',
  LOGIN_STATUS_DATA: 'public_app/loginstatusdata',
  GET_JOBS_DATA: 'public_app/getjobsdata',
  CREATE_TECHNICIANS_DATA: 'public_app/createtechniciansdata',
  GET_PURCHASE_DATA: 'public_app/getpurchasedata',
  GET_SALES_CUSTOMERS_DATA: 'public_app/getsalescustomersdata',
  CREATE_NOTES: 'public_app/createnotes',
  GET_NOTES: 'public_app/getnotes',
  EDIT_NOTES: 'public_app/editnotes',
  RECENT_ACTIVITY: 'public_app/recent_activity',
  IMEI_CHECK: 'public_app/imei_check',
  REPAIR_REPORT: 'public_app/repair_report',
  ADMIN_REPAIR_REPORT: 'public_app/admin_repair_report',
  ADMIN_JOBS_LIST: 'public_app/admin_jobs_list',
  ADMIN_TRADE_MONITORING: 'public_app/admin_trade_monitoring',
  GET_JOB_SHEETS: 'public_app/get_job_sheets',
  JOB_SHEETS_LIST: 'public_app/job_sheets_list',
  JOB_SHEET_DETAILS: 'public_app/job_sheet_details',
  START_JOB_REPAIR: 'public_app/start_job_repair',
  START_REPAIR: 'public_app/start_repair',
  HANDOVER_REPAIR: 'public_app/handover_repair',
  MARK_JOB_READY: 'public_app/mark_job_ready',
  CREATE_PURCHASE_CUSTOMER: 'public_app/create_purchase_customer',
  CREATE_PURCHASE: 'public_app/create_purchase',
  GET_PURCHASE_SHEETS: 'public_app/get_purchase_sheets',
  INVENTORY_LIST: 'public_app/inventory_list',
  SEARCH_PURCHASE: 'public_app/search_purchase',
  CREATE_SALE_CUSTOMER: 'public_app/create_sale_customer',
  CREATE_SALE: 'public_app/create_sale_sheets',
  GET_SALES_SHEETS: 'public_app/get_sales_sheets',
  FORGOT_SEND_OTP: 'public_app/forgot_password/send_otp',
  FORGOT_VERIFY_OTP: 'public_app/forgot_password/verify_otp',
  FORGOT_RESET_PASSWORD: 'public_app/forgot_password/reset',
  TECHNICIANS_LIST: 'public_app/technicians_list',
  GET_SUPPORTERS: 'public_app/getsupporters',
  GET_ALL_MEMBERS: 'public_app/getallmembers',
  GET_QR_DATA: 'public_app/getqrdata',
  ADD_TECHNICIAN: 'public_app/add_technician',
  RESET_TECHNICIAN_PASSWORD: 'public_app/reset_technician_password',
  SET_TECHNICIAN_STATUS: 'public_app/set_technician_status',
};

// Build a full URL from an endpoint path, e.g. buildUrl(ENDPOINTS.MEMBER_REGISTRATION)
export const buildUrl = endpoint => `${BASE_URL}${endpoint}`;

export default { BASE_URL, REQUEST_TIMEOUT, ENDPOINTS, buildUrl };
