import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ENDPOINTS } from '../../Constants/config';
import { postJson } from './authSlice';

// POST /public_app/technicians_list
// Returns every technician account with its technician_status, plus counts:
//   { technicians: [...], counts: { total, active, inactive } }
export const fetchTechnicians = createAsyncThunk(
  'technicians/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { response, data } = await postJson(ENDPOINTS.TECHNICIANS_LIST, {});
      if (!response.ok || (data && data.success === false)) {
        return rejectWithValue({
          status: response.status,
          message: (data && data.message) || 'Could not load technicians.',
        });
      }
      return (
        data.data || { technicians: [], counts: { total: 0, active: 0, inactive: 0 } }
      );
    } catch (err) {
      return rejectWithValue({ status: 0, message: err.message });
    }
  },
);

// POST /public_app/add_technician
// Admin creates a technician account. Minimal payload:
//   { mobile, password, full_name }  (role is forced to 'technician' server-side)
// On success the technician can log in immediately with mobile + password.
export const addTechnician = createAsyncThunk(
  'technicians/add',
  async (payload, { rejectWithValue }) => {
    try {
      const { response, data } = await postJson(ENDPOINTS.ADD_TECHNICIAN, payload);
      if (!response.ok || (data && data.success === false)) {
        return rejectWithValue({
          status: response.status,
          message: (data && data.message) || 'Could not add technician.',
        });
      }
      return data.data;
    } catch (err) {
      return rejectWithValue({ status: 0, message: err.message });
    }
  },
);

// POST /public_app/reset_technician_password
// Admin sets a new password for a technician. Payload: { user_id, new_password }.
export const resetTechnicianPassword = createAsyncThunk(
  'technicians/resetPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const { response, data } = await postJson(
        ENDPOINTS.RESET_TECHNICIAN_PASSWORD,
        payload,
      );
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

// POST /public_app/set_technician_status
// A technician toggles their own status. Payload: { user_id, technician_status }.
export const setTechnicianStatus = createAsyncThunk(
  'technicians/setStatus',
  async (payload, { rejectWithValue }) => {
    try {
      const { response, data } = await postJson(
        ENDPOINTS.SET_TECHNICIAN_STATUS,
        payload,
      );
      if (!response.ok || (data && data.success === false)) {
        return rejectWithValue({
          status: response.status,
          message: (data && data.message) || 'Could not update status.',
        });
      }
      return data; // { success, technician_status }
    } catch (err) {
      return rejectWithValue({ status: 0, message: err.message });
    }
  },
);

const initialState = {
  list: [],
  counts: { total: 0, active: 0, inactive: 0 },
  loading: false,
  error: null,
};

const techniciansSlice = createSlice({
  name: 'technicians',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchTechnicians.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTechnicians.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.technicians || [];
        state.counts =
          action.payload.counts || { total: 0, active: 0, inactive: 0 };
      })
      .addCase(fetchTechnicians.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload && action.payload.message) ||
          'Could not load technicians.';
      });
  },
});

export default techniciansSlice.reducer;
