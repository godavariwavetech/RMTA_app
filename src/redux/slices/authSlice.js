import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BASE_URL, ENDPOINTS, REQUEST_TIMEOUT } from '../../Constants/config';
import { saveUser, clearUser } from '../../utils/authStorage';
import { logApiRequest } from '../../utils/apiLogger';

// Keep response handling consistent across endpoints. Some API errors arrive
// with HTTP 200 and a string status, while proxy/server failures can be plain
// text instead of JSON; neither should be interpreted as a successful result.
export function parseApiResponseBody(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    return {
      success: false,
      message: String(raw || '').trim().slice(0, 500) || 'The server returned an invalid response.',
    };
  }

  if (Array.isArray(data)) {
    return { success: true, data };
  }
  if (!data || typeof data !== 'object') {
    return { success: false, message: 'The server returned an invalid response.' };
  }

  const status = String(data.status || '').toLowerCase();
  const successValue = String(data.success).toLowerCase();
  const numericStatus = Number(data.status);
  const statusFailed = ['error', 'failed', 'failure', 'false'].includes(status);
  const successFailed = ['false', '0'].includes(successValue);
  const httpLikeStatusFailed = numericStatus >= 400 && numericStatus < 600;

  if (data.success === false || statusFailed || successFailed || httpLikeStatusFailed) {
    return {
      ...data,
      success: false,
      message: data.message || 'The request could not be completed.',
    };
  }
  return data;
}

// A technician (staff) login adds its own `tech_id` to every form submission and
// status-update call, so the server knows which staff member did it. store.js keeps this
// in step with the logged-in user (null for admins and members).
let apiTechId = null;
export function setApiTechId(id) {
  apiTechId = id === undefined || id === null || id === '' ? null : id;
}
const TECH_TAGGED_ENDPOINTS = new Set([
  ENDPOINTS.CREATE_JOB_SHEET_CUSTOMER,
  ENDPOINTS.CREATE_JOB_SHEET,
  ENDPOINTS.CREATE_PURCHASE_CUSTOMER,
  ENDPOINTS.CREATE_PURCHASE,
  ENDPOINTS.CREATE_SALE_CUSTOMER,
  ENDPOINTS.CREATE_SALE,
  ENDPOINTS.START_REPAIR,
  ENDPOINTS.START_JOB_REPAIR,
  ENDPOINTS.MARK_JOB_READY,
  ENDPOINTS.HANDOVER_REPAIR,
]);

// Shared POST helper: builds the URL, applies a timeout, parses JSON, and
// returns { response, data }. Throws a tagged Error on network/timeout failure.
export async function postJson(endpoint, payload) {
  if (
    apiTechId &&
    TECH_TAGGED_ENDPOINTS.has(endpoint) &&
    payload &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    payload.tech_id === undefined
  ) {
    payload = { ...payload, tech_id: apiTechId };
  }
  const url = `${BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  const log = logApiRequest('POST', endpoint, url, payload);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const raw = await response.text();
    const data = parseApiResponseBody(raw);
    log.response(response.status, data);
    return { response, data };
  } catch (err) {
    clearTimeout(timeoutId);
    const message =
      err.name === 'AbortError'
        ? 'The server did not respond in time (timeout). Check your connection.'
        : `Could not reach the server (${err.message}).`;
    log.error(message);
    const tagged = new Error(message);
    tagged.isNetwork = true;
    throw tagged;
  }
}

// Shared GET helper for endpoints registered as GET (e.g. search_purchase) —
// same timeout/JSON-parse behavior as postJson, params go on the query string.
export async function getJson(endpoint, params, timeoutMs = REQUEST_TIMEOUT) {
  const query = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';
  const url = `${BASE_URL}${endpoint}${query}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const log = logApiRequest('GET', endpoint, url, params);
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const raw = await response.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      data = raw;
    }
    log.response(response.status, data);
    return { response, data };
  } catch (err) {
    clearTimeout(timeoutId);
    const message =
      err.name === 'AbortError'
        ? 'The server did not respond in time (timeout). Check your connection.'
        : `Could not reach the server (${err.message}).`;
    log.error(message);
    const tagged = new Error(message);
    tagged.isNetwork = true;
    throw tagged;
  }
}

// Variant of getJson for endpoints that are registered as GET but still read
// their params from a JSON body (e.g. search_purchase) instead of the query
// string. fetch()/Request refuses a body on GET ("Body not allowed for GET
// or HEAD requests") before the call ever reaches the network, so this uses
// XMLHttpRequest directly, which doesn't enforce that restriction.
export function getJsonWithBody(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${endpoint}`;
    const xhr = new XMLHttpRequest();
    const timeoutId = setTimeout(() => xhr.abort(), REQUEST_TIMEOUT);

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return;
      clearTimeout(timeoutId);
      let data;
      try {
        data = JSON.parse(xhr.responseText);
      } catch (e) {
        data = xhr.responseText;
      }
      resolve({
        response: { ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status },
        data,
      });
    };
    xhr.onerror = () => {
      clearTimeout(timeoutId);
      const tagged = new Error('Could not reach the server.');
      tagged.isNetwork = true;
      reject(tagged);
    };
    xhr.ontimeout = () => {
      clearTimeout(timeoutId);
      const tagged = new Error(
        'The server did not respond in time (timeout). Check your connection.',
      );
      tagged.isNetwork = true;
      reject(tagged);
    };

    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(payload));
  });
}

// POST /public_app/member_registertion
// payload: { full_name, mobile, shop_name, address, city, state, password, membership_status }
//
// Backend responses:
//   200 { status:200, success:true, data:{ user_id, member_id, member_code, membership_status } }
//   409 { success:false, message:"An account with this mobile number already exists. Please log in." }
//   300 (HTTP status or the `status` in the body): the mobile number already has an account
//   500 { success:false, message:"Server error. Please try again." }
export const registerMember = createAsyncThunk(
  'auth/registerMember',
  async (payload, { rejectWithValue }) => {
    const url = `${BASE_URL}${ENDPOINTS.MEMBER_REGISTRATION}`;

    // Fail fast after REQUEST_TIMEOUT instead of hanging on the platform default.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const log = logApiRequest('POST', ENDPOINTS.MEMBER_REGISTRATION, url, payload);
    try {
      console.log('🌐 POST →', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const raw = await response.text();
      const data = parseApiResponseBody(raw);
      log.response(response.status, data);
      console.log(`[API] Registration response HTTP ${response.status}`, {
        success: data && data.success,
        status: data && data.status,
      });

      // 300 means the mobile number is already registered. It can arrive as the HTTP
      // status or as `status` inside a 200 response body.
      if (response.status === 300 || Number(data && data.status) === 300) {
        return rejectWithValue({
          status: 300,
          message: 'You already have an account with this mobile number. Please log in.',
        });
      }

      // Duplicate (409) or server error (500) → surface the server's message.
      if (!response.ok || (data && data.success === false)) {
        return rejectWithValue({
          status: response.status,
          message:
            (data && data.message) || 'Registration failed. Please try again.',
        });
      }

      // Success → return the created member object.
      return data.data || data;
    } catch (err) {
      clearTimeout(timeoutId);
      const message =
        err.name === 'AbortError'
          ? 'The server did not respond in time (timeout). Check your connection and that the backend is running.'
          : `Could not reach the server (${err.message}).`;
      console.log('🔴 Network error —', message);
      log.error(message);
      return rejectWithValue({ status: 0, message });
    }
  },
);

// POST /public_app/member_login          (admin, user_ind 1)
//   payload: { user_ind, mobile, password }
// POST /public_app/technician_login      (technician / staff, user_ind 0)
//   payload: { mobile_number, password }
//
// Backend responses:
//   200 { status:200, success:true, data:{ user_id, member_id, role, membership_status, ... } }
//   401 { success:false, message:"Invalid mobile number or password." }
//   500 { success:false, message:"Server error. Please try again." }
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (payload, { rejectWithValue }) => {
    // Technicians (staff added under a member) sign in on their own endpoint.
    const isTechnician = Number(payload.user_ind) !== 1;
    const endpoint = isTechnician ? ENDPOINTS.TECHNICIAN_LOGIN : ENDPOINTS.MEMBER_LOGIN;
    const requestBody = isTechnician
      ? { mobile_number: payload.mobile, password: payload.password }
      : payload;
    const url = `${BASE_URL}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const log = logApiRequest('POST', endpoint, url, requestBody);
    try {
      console.log('🌐 POST →', url);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const raw = await response.text();
      const data = parseApiResponseBody(raw);
      log.response(response.status, data);
      console.log(`[API] Login response HTTP ${response.status}`, {
        success: data && data.success,
        status: data && data.status,
        recordCount: Array.isArray(data && data.data) ? data.data.length : undefined,
      });

      const responseData = data && data.data;
      const responseUser = Array.isArray(responseData)
        ? responseData[0]
        : responseData || (data && data.user) || data;
      if (
        !response.ok ||
        !data ||
        data.success === false ||
        !responseUser ||
        !(responseUser.user_id || responseUser.id)
      ) {
        return rejectWithValue({
          status: response.status,
          code: data && data.code,
          message:
            (data && data.message) || 'Login failed. Please try again.',
        });
      }

      // A technician login that succeeds is an active account even when the
      // response carries no membership_status.
      const rawMembershipStatus = String(
        responseUser.membership_status ?? (isTechnician ? 'active' : ''),
      ).toLowerCase();
      const membershipStatus =
        rawMembershipStatus === '1' || rawMembershipStatus === 'active'
          ? 'active'
          : rawMembershipStatus === '0'
            ? 'inactive'
            : rawMembershipStatus;
      const safeUser = { ...responseUser };
      delete safeUser.password;
      delete safeUser.qr_token_hash;
      const user = {
        ...safeUser,
        user_id: responseUser.user_id ?? responseUser.id,
        // A technician's `id` belongs to the technician table. Never treat it
        // as the parent member id when the API omits the relationship; those
        // tables have independent numeric IDs and can point at another member.
        member_id: responseUser.member_id ?? (isTechnician ? undefined : responseUser.id),
        // Some login responses omit the phone field even though the login
        // mobile is known. Preserve it as a fallback for the user's own card.
        mobile:
          responseUser.mobile ||
          responseUser.mobile_number ||
          responseUser.phone_number ||
          payload.mobile,
        // Staff rows name the person tech_name; the app reads full_name.
        full_name: responseUser.full_name ?? responseUser.tech_name,
        tech_id: isTechnician ? responseUser.id : undefined,
        // The selected login type is authoritative. Some API records omit
        // role or return a legacy role label that the app cannot route on.
        role: Number(payload.user_ind) === 1 ? 'admin' : 'technician',
        user_ind: Number(payload.user_ind) === 1 ? 1 : 0,
        membership_status: membershipStatus,
      };

      // Persist only the normalized session fields; never store credentials
      // returned by the API in Redux or local storage.
      await saveUser(user);
      return user;
    } catch (err) {
      clearTimeout(timeoutId);
      const message =
        err.name === 'AbortError'
          ? 'The server did not respond in time (timeout). Check your connection and that the backend is running.'
          : `Could not reach the server (${err.message}).`;
      console.log('🔴 Network error —', message);
      log.error(message);
      return rejectWithValue({ status: 0, message });
    }
  },
);

// Clears the persisted session (used on logout).
export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  await clearUser();
  return true;
});

// --- Forgot password flow (OTP based) ---

// Step 1: request an OTP for a registered admin mobile number.
export const sendForgotOtp = createAsyncThunk(
  'auth/sendForgotOtp',
  async (payload, { rejectWithValue }) => {
    try {
      const { response, data } = await postJson(ENDPOINTS.FORGOT_SEND_OTP, payload);
      if (!response.ok || (data && data.success === false)) {
        return rejectWithValue({
          status: response.status,
          code: data && data.code,
          message: (data && data.message) || 'Could not send OTP.',
        });
      }
      return data; // { success, message, otp (dev) }
    } catch (err) {
      return rejectWithValue({ status: 0, message: err.message });
    }
  },
);

// Step 2: verify the entered OTP.
export const verifyForgotOtp = createAsyncThunk(
  'auth/verifyForgotOtp',
  async (payload, { rejectWithValue }) => {
    try {
      const { response, data } = await postJson(ENDPOINTS.FORGOT_VERIFY_OTP, payload);
      if (!response.ok || (data && data.success === false)) {
        return rejectWithValue({
          status: response.status,
          message: (data && data.message) || 'OTP verification failed.',
        });
      }
      return data;
    } catch (err) {
      return rejectWithValue({ status: 0, message: err.message });
    }
  },
);

// Step 3: set the new password (re-checks the OTP server-side).
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const { response, data } = await postJson(ENDPOINTS.FORGOT_RESET_PASSWORD, payload);
      if (!response.ok || (data && data.success === false)) {
        return rejectWithValue({
          status: response.status,
          message: (data && data.message) || 'Could not reset password.',
        });
      }
      return data;
    } catch (err) {
      return rejectWithValue({ status: 0, message: err.message });
    }
  },
);

const initialState = {
  loading: false,
  error: null,
  member: null, // last registered member { user_id, member_id, member_code, membership_status }
  user: null, // last logged-in user { user_id, role, membership_status, ... }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    resetAuth() {
      return initialState;
    },
    // Keep the logged-in technician's status in sync after they toggle it.
    setUserTechnicianStatus(state, action) {
      if (state.user) {
        state.user.technician_status = action.payload;
      }
    },
    // Keep a technician's assigned modules (menu ids) current after the owner changes them.
    setUserMenuIds(state, action) {
      if (state.user) {
        state.user.menu_ids = action.payload;
      }
    },
    // Restore a persisted session on app launch (from AsyncStorage).
    hydrateUser(state, action) {
      state.user = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(registerMember.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerMember.fulfilled, (state, action) => {
        state.loading = false;
        state.member = action.payload;
      })
      .addCase(registerMember.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload && action.payload.message) ||
          action.error?.message ||
          'Registration failed.';
      })
      .addCase(loginUser.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload && action.payload.message) ||
          action.error?.message ||
          'Login failed.';
      })
      .addCase(logoutUser.fulfilled, state => {
        state.user = null;
        state.member = null;
      });
  },
});

export const {
  clearAuthError,
  resetAuth,
  setUserTechnicianStatus,
  setUserMenuIds,
  hydrateUser,
} = authSlice.actions;
export default authSlice.reducer;
