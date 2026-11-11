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

// POST /public_app/editjobsheet — saves edits to an existing job (only allowed
// until the repair is completed). payload: { job_id, member_id, ...the same
// device / condition / repair / devicelock fields as create_job_sheets }.
// Customer fields and photos are never sent: neither can be changed from here.
export const editJobSheet = createAsyncThunk(
  'jobSheet/edit',
  async (payload, { rejectWithValue }) => {
    try {
      const { response, data } = await postJson(ENDPOINTS.EDIT_JOB_SHEET, payload);
      if (!response.ok || (data && data.success === false)) {
        return rejectWithValue({
          status: response.status,
          message: (data && data.message) || 'Could not update the job sheet.',
        });
      }
      const result = data && data.data;
      return Array.isArray(result) ? result[0] : result;
    } catch (err) {
      return rejectWithValue({ status: 0, message: err.message });
    }
  },
);

// Turns a job record (job_sheet_details / list row, as shown on Job details)
// into the same draft shape the create steps fill, plus `editJob` so the steps
// know they are editing. Photos keep their server URL (no base64) so step 3 can
// show them; they are read-only while editing and never re-sent.
const FLAT_CONDITIONS = [
  ['screen', 'screen'],
  ['body', 'body'],
  ['camera', 'camera'],
  ['speaker', 'speaker'],
  ['charging_port', 'chargingpoint'],
  ['battery', 'batterey'],
];

export const jobToDraft = (job, { photoUri } = {}) => {
  const j = job || {};
  let parsed = {};
  try {
    parsed = j.details_json ? JSON.parse(j.details_json) : {};
  } catch (e) {
    parsed = {};
  }
  const conditions =
    Array.isArray(j.conditions) && j.conditions.length > 0
      ? j.conditions
          .filter(c => c && c.component)
          .map(c => ({ component: c.component, condition_value: c.condition_value }))
      : FLAT_CONDITIONS.filter(([, key]) => j[key]).map(([component, key]) => ({
          component,
          condition_value: j[key],
        }));

  const toUri = v => (photoUri ? photoUri(v) : v || null);
  const photos = (
    Array.isArray(j.photos) && j.photos.length > 0
      ? j.photos.map(p => ({ photo_type: p.photo_type, uri: toUri(p.storage_path) }))
      : [
          { photo_type: 'front', uri: toUri(j.frontimage) },
          { photo_type: 'back', uri: toUri(j.backimage) },
          { photo_type: 'damage', uri: toUri(j.damageimage) },
        ]
  ).filter(p => p.photo_type && p.uri);

  const categories = String(j.repair_category || '')
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);

  // Lock: details_json when present, otherwise inferred from devicelock the same
  // way Job details does. Patterns are stored as dot indexes joined by "-".
  const savedLock = String(
    j.unlock_value || (parsed.access && parsed.access.unlock_value) || j.devicelock || '',
  ).trim();
  const inferred = savedLock
    ? /^unknown$/i.test(savedLock)
      ? 'unknown'
      : /→|^\d(\s*[-,>]\s*\d)+$/.test(savedLock)
      ? 'pattern'
      : 'password'
    : 'none';
  const lockType = (parsed.access && parsed.access.lock_type) || inferred;
  let unlockValue = savedLock;
  if (lockType === 'pattern') unlockValue = (savedLock.match(/\d/g) || []).join('-');
  if (lockType === 'unknown') unlockValue = 'Unknown';
  if (lockType === 'none') unlockValue = '';

  const delivery = String(j.estimated_delivery || '').trim();

  return {
    editJob: {
      id: j.id || j.job_id,
      job_code: j.job_code || '',
      customer_id: j.customer_id || null,
    },
    // Shown read-only on the review step; never edited or sent.
    customer: {
      customer_id: j.customer_id || null,
      full_name: j.customer_name || '',
      mobile: j.customer_mobile || j.mobile_number || '',
    },
    device: {
      brand: j.device_brand || '',
      model: j.device_model || '',
      imei1: j.imei1 || '',
      imei2: j.imei2 || '',
      color: j.color || '',
      storage: j.storage || '',
    },
    conditions,
    photos,
    conditionPhotos: [],
    repair: {
      category: categories.join(', '),
      categories,
      problem_description: j.problem_description || '',
      estimated_cost:
        j.estimated_cost !== null && j.estimated_cost !== undefined ? String(j.estimated_cost) : '',
      estimated_delivery: null,
      estimated_delivery_text: /^\d{4}-\d{2}-\d{2}/.test(delivery) ? delivery.slice(0, 10) : '',
    },
    access: {
      lock_type: lockType,
      mode: lockType === 'password' || lockType === 'pattern' ? 'temporary_pin' : 'customer_unlocks',
      unlock_value: unlockValue,
    },
  };
};

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
    // Start editing an existing job: replaces the draft with that job's details
    // (see jobToDraft). Creating a new job always starts with resetJobDraft, so
    // an unfinished edit never leaks into a new job.
    startJobEdit(state, action) {
      state.draft = action.payload || {};
      state.error = null;
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
      .addCase(editJobSheet.pending, state => {
        state.creating = true;
        state.error = null;
      })
      .addCase(editJobSheet.fulfilled, state => {
        state.creating = false;
        state.draft = {};
      })
      .addCase(editJobSheet.rejected, (state, action) => {
        state.creating = false;
        state.error = (action.payload && action.payload.message) || 'Update failed.';
      })
      .addCase(fetchJobCounts.fulfilled, (state, action) => {
        state.counts = action.payload || state.counts;
      });
  },
});

export const { updateJobDraft, resetJobDraft, setActiveJob, startJobEdit } = jobSheetSlice.actions;
export default jobSheetSlice.reducer;
