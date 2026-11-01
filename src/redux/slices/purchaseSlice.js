import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ENDPOINTS } from '../../Constants/config';
import { postJson } from './authSlice';

// POST /public_app/create_purchase_customer — creates the seller's customer
// record up front, on step 1's Continue. payload: { customer_name,
// mobile_number, member_id, aadharnumber, address }. Returns the created
// customer's id, which gets saved into the draft and sent along with the
// final create_purchase call.
export const createPurchaseCustomer = createAsyncThunk(
  'purchase/createCustomer',
  async (payload, { rejectWithValue }) => {
    try {
      const { response, data } = await postJson(ENDPOINTS.CREATE_PURCHASE_CUSTOMER, payload);
      if (!response.ok || (data && data.success === false)) {
        return rejectWithValue({
          status: response.status,
          message: (data && data.message) || 'Could not save seller details.',
        });
      }
      // This endpoint returns the raw MySQL insert result (OkPacket) rather
      // than a record — the new customer's id is insertId. Some of this
      // backend's other endpoints instead wrap a record in a single-element
      // array, so unwrap that too just in case.
      const result = data.data || data;
      return Array.isArray(result) ? result[0] : result;
    } catch (err) {
      return rejectWithValue({ status: 0, message: err.message });
    }
  },
);

// Accumulates data across the 8 purchase-entry screens so navigating back and
// revisiting a step keeps everything that was entered (mirrors jobSheet.draft).
const initialState = {
  draft: {},
};

const purchaseSlice = createSlice({
  name: 'purchase',
  initialState,
  reducers: {
    // Merge a step's fields into the draft (each step calls this on continue/back).
    updatePurchaseDraft(state, action) {
      state.draft = { ...state.draft, ...action.payload };
    },
    // Clear the draft after a successful create (or to start a fresh purchase).
    resetPurchaseDraft(state) {
      state.draft = {};
    },
  },
});

export const { updatePurchaseDraft, resetPurchaseDraft } = purchaseSlice.actions;
export default purchaseSlice.reducer;
