import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ENDPOINTS } from '../../Constants/config';
import { postJson } from './authSlice';

// POST /public_app/create_job_sheet_customer — creates the customer record
// up front, on step 1's Continue. payload: { customer_name, customer_number,
// customer_alternatenumber, member_id }. Returns the created customer's id,
// which gets saved into the draft and sent along with the final
// create_job_sheet call.
export const createJobSheetCustomer = createAsyncThunk(
  'jobSheet/createCustomer',
  async (payload, { rejectWithValue }) => {
    try {
      const { response, data } = await postJson(ENDPOINTS.CREATE_JOB_SHEET_CUSTOMER, payload);
      if (!response.ok || (data && data.success === false)) {
        return rejectWithValue({
          status: response.status,
          message: (data && data.message) || 'Could not save customer details.',
        });
      }
      // Some of this backend's endpoints wrap the record in a single-element
      // array ([{ ...customer }]) instead of returning the object directly.
      const result = data.data || data;
      return Array.isArray(result) ? result[0] : result;
    } catch (err) {
      return rejectWithValue({ status: 0, message: err.message });
    }
  },
);

// POST /public_app/create_job_sheets — submits the whole job sheet. payload:
// { member_id, customer_id, device_brand, device_model, imei1, imei2, color,
// storage, screen, body, camera, speaker, chargingpoint, batterey,
// repair_category, problem_description, estimated_cost, estimated_delivery,
// devicelock, frontimage, backimage, damageimage } — built by step 7 from
// the accumulated draft (see createJobSheetStep7.jsx).
export const createJobSheet = createAsyncThunk(
  'jobSheet/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { response, data } = await postJson(ENDPOINTS.CREATE_JOB_SHEET, payload);
      if (!response.ok || (data && data.success === false)) {
        return rejectWithValue({
          status: response.status,
          message: (data && data.message) || 'Could not create job sheet.',
        });
      }
      // { job_id, job_code, device_brand, device_model, customer_name, estimated_cost, status }
      // — unwrap in case this endpoint also wraps the record in an array.
      const result = data.data;
      return Array.isArray(result) ? result[0] : result;
    } catch (err) {
      return rejectWithValue({ status: 0, message: err.message });
    }
  },
);

// POST /public_app/job_counts — Today's summary counts for a member.
export const fetchJobCounts = createAsyncThunk(
  'jobSheet/counts',
  async (payload, { rejectWithValue }) => {
    try {
      const { response, data } = await postJson(ENDPOINTS.JOB_COUNTS, payload);
      if (!response.ok || (data && data.success === false)) {
        return rejectWithValue({
          status: response.status,
          message: (data && data.message) || 'Could not load counts.',
        });
      }
      return data.data;
    } catch (err) {
      return rejectWithValue({ status: 0, message: err.message });
    }
  },
);

const initialState = {
  // Accumulates data across the 8 create-job-sheet steps.
  draft: {},
  // The job currently being worked on (set when Start repair is tapped), so the
  // repair → quality-check → handover screens know which job they act on.
  activeJob: null,
  counts: { jobs_today: 0, completed: 0, pending: 0, sales: 0, purchases: 0 },
  creating: false,
  error: null,
};

const jobSheetSlice = createSlice({
  name: 'jobSheet',
  initialState,
  reducers: {
    // Merge a step's fields into the draft (each step calls this on Continue).
    updateJobDraft(state, action) {
      state.draft = { ...state.draft, ...action.payload };
    },
    resetJobDraft(state) {
      state.draft = {};
      state.error = null;
    },
    setActiveJob(state, action) {
      state.activeJob = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(createJobSheet.pending, state => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createJobSheet.fulfilled, state => {
        state.creating = false;
        state.draft = {}; // clear after a successful create
      })
      .addCase(createJobSheet.rejected, (state, action) => {
        state.creating = false;
        state.error = (action.payload && action.payload.message) || 'Create failed.';
      })
      .addCase(fetchJobCounts.fulfilled, (state, action) => {
        state.counts = action.payload || state.counts;
      });
  },
});

export const { updateJobDraft, resetJobDraft, setActiveJob } = jobSheetSlice.actions;
export default jobSheetSlice.reducer;
