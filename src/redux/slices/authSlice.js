import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BASE_URL, ENDPOINTS, REQUEST_TIMEOUT } from '../../Constants/config';
import { saveUser, clearUser } from '../../utils/authStorage';

// Shared POST helper: builds the URL, applies a timeout, parses JSON, and
// returns { response, data }. Throws a tagged Error on network/timeout failure.
export async function postJson(endpoint, payload) {
  const url = `${BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
    return { response, data };
  } catch (err) {
    clearTimeout(timeoutId);
    const message =
      err.name === 'AbortError'
        ? 'The server did not respond in time (timeout). Check your connection.'
        : `Could not reach the server (${err.message}).`;
    const tagged = new Error(message);
    tagged.isNetwork = true;
    throw tagged;
  }
}

// Shared GET helper for endpoints registered as GET (e.g. search_purchase) —
// same timeout/JSON-parse behavior as postJson, params go on the query string.
export async function getJson(endpoint, params) {
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
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
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
    return { response, data };
  } catch (err) {
    clearTimeout(timeoutId);
    const message =
      err.name === 'AbortError'
        ? 'The server did not respond in time (timeout). Check your connection.'
        : `Could not reach the server (${err.message}).`;
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
//   500 { success:false, message:"Server error. Please try again." }
export const registerMember = createAsyncThunk(
  'auth/registerMember',
  async (payload, { rejectWithValue }) => {
    const url = `${BASE_URL}${ENDPOINTS.MEMBER_REGISTRATION}`;

    // Fail fast after REQUEST_TIMEOUT instead of hanging on the platform default.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

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
      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        data = raw;
      }
      console.log(`✅ Reached backend — HTTP ${response.status}`, data);

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
      return rejectWithValue({ status: 0, message });
    }
  },
);

// POST /public_app/member_login
// payload: { user_ind, mobile, password }   (user_ind: 1 = admin, 0 = technician)
//
// Backend responses:
//   200 { status:200, success:true, data:{ user_id, member_id, role, membership_status, ... } }
//   401 { success:false, message:"Invalid mobile number or password." }
//   500 { success:false, message:"Server error. Please try again." }
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (payload, { rejectWithValue }) => {
    const url = `${BASE_URL}${ENDPOINTS.MEMBER_LOGIN}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

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
      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        data = raw;
      }
      console.log(`✅ Reached backend — HTTP ${response.status}`, data);

      if (!response.ok || (data && data.success === false)) {
        return rejectWithValue({
          status: response.status,
          code: data && data.code,
          message:
            (data && data.message) || 'Login failed. Please try again.',
        });
      }

      // Success → persist the session, then return the user/member object.
      // The backend wraps it in a single-element array ([{ ...member }]) —
      // unwrap it so callers get the plain object.
      const responseData = data.data || data;
      const record = Array.isArray(responseData) ? responseData[0] : responseData;

      // The backend's record only has `id` (no user_id/member_id) and no
      // `role` at all — fill those in from what we know client-side
      // (which tab the person logged in from) so the rest of the app
      // (profile fetches, job counts, admin checks) can rely on them.
      const user = record
        ? {
            ...record,
            user_id: record.user_id ?? record.id,
            member_id: record.member_id ?? record.id,
            role: record.role ?? (payload.user_ind === 1 ? 'admin' : 'technician'),
          }
        : record;

      await saveUser(user);
      return user;
    } catch (err) {
      clearTimeout(timeoutId);
      const message =
        err.name === 'AbortError'
          ? 'The server did not respond in time (timeout). Check your connection and that the backend is running.'
          : `Could not reach the server (${err.message}).`;
      console.log('🔴 Network error —', message);
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
  hydrateUser,
} = authSlice.actions;
export default authSlice.reducer;
