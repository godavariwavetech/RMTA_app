import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ENDPOINTS } from '../../Constants/config';
import { postJson } from './authSlice';

// POST /public_app/create_sale_customer — creates the buyer's customer record
// up front, on step 1's Continue. payload: { customer_name, customer_number,
// member_id, aadharnumber, address }. Returns the created customer's id,
// which gets saved into the draft and sent along with the final create_sale
// call.
export const createSaleCustomer = createAsyncThunk(
  'sale/createCustomer',
  async (payload, { rejectWithValue }) => {
    try {
      const { response, data } = await postJson(ENDPOINTS.CREATE_SALE_CUSTOMER, payload);
      if (!response.ok || (data && data.success === false)) {
        return rejectWithValue({
          status: response.status,
          message: (data && data.message) || 'Could not save buyer details.',
        });
      }
      // This backend returns the raw MySQL insert result (OkPacket) rather
      // than a record — the new customer's id is insertId. Some of its other
      // endpoints instead wrap a record in a single-element array, so unwrap
      // that too just in case.
      const result = data.data || data;
      return Array.isArray(result) ? result[0] : result;
    } catch (err) {
      return rejectWithValue({ status: 0, message: err.message });
    }
  },
);

// Accumulates data across the sale-entry screens so navigating back and
// revisiting a step keeps everything that was entered (mirrors purchase.draft).
const initialState = {
  draft: {},
};

const saleSlice = createSlice({
  name: 'sale',
  initialState,
  reducers: {
    // Merge a step's fields into the draft (each step calls this on continue/back).
    updateSaleDraft(state, action) {
      state.draft = { ...state.draft, ...action.payload };
    },
    // Clear the draft after a successful create (or to start a fresh sale).
    resetSaleDraft(state) {
      state.draft = {};
    },
  },
});

export const { updateSaleDraft, resetSaleDraft } = saleSlice.actions;
export default saleSlice.reducer;
