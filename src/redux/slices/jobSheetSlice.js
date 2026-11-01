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

// First value found under any of the candidate keys, as a number.
const pickCount = (obj, keys) => {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      const n = Number(obj[key]);
      if (!Number.isNaN(n)) return n;
    }
  }
  return 0;
};

// Maps whatever shape the endpoint returns (an object, or a one-element array)
// onto the five dashboard counts. Several key spellings are accepted because
// the getscroll response format isn't documented yet.
const normalizeCounts = raw => {
  const row = Array.isArray(raw) ? raw[0] || {} : raw || {};
  // getcounts reports today's jobs by stage: inserted (new), pending, working,
  // completed and delivered. Jobs today = everything created today; delivered
  // counts as completed, and working counts as still pending.
  const hasStages = ['today_inserted', 'today_pending', 'today_working', 'today_completed', 'today_delivered']
    .some(k => row[k] !== undefined);
  if (hasStages) {
    return {
      jobs_today: pickCount(row, ['today_inserted']),
      completed: pickCount(row, ['today_completed']) + pickCount(row, ['today_delivered']),
      pending: pickCount(row, ['today_pending']) + pickCount(row, ['today_working']),
      sales: pickCount(row, ['today_sales', 'today_sale', 'sales', 'sales_count']),
      purchases: pickCount(row, ['today_purchase', 'today_purchases', 'purchases', 'purchase_count']),
    };
  }
  return {
    jobs_today: pickCount(row, ['jobs_today', 'today_jobs', 'jobs', 'job_count', 'total_jobs']),
    completed: pickCount(row, ['completed', 'completed_jobs', 'completed_count', 'complete']),
    pending: pickCount(row, ['pending', 'pending_jobs', 'pending_count']),
    sales: pickCount(row, ['sales', 'sales_count', 'sale_count', 'total_sales']),
    purchases: pickCount(row, ['purchases', 'purchase_count', 'purchases_count', 'total_purchases']),
  };
};

// POST /public_app/getcounts { member_id } — dashboard counts for a member.
export const fetchJobCounts = createAsyncThunk(
  'jobSheet/counts',
  async (payload, { rejectWithValue }) => {
    try {
      const { response, data } = await postJson(ENDPOINTS.JOB_COUNTS, {
        member_id: payload && payload.member_id,
      });
      if (!response.ok || (data && data.success === false)) {
        return rejectWithValue({
          status: response.status,
          message: (data && (data.message || data.msg)) || 'Could not load counts.',
        });
      }
      return normalizeCounts(data && (data.data !== undefined ? data.data : data));
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
