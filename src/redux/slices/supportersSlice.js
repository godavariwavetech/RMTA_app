import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ENDPOINTS } from '../../Constants/config';
import { getJson } from './authSlice';

// GET /public_app/getsupporters (no parameters)
// -> { status: 200, data: [{ id, name, phone_number, shop_name, shop_image,
//      location, created_at, updated_at, d_in }] }
// `location` is a JSON string: {"points":[{"lat":..,"lng":..}]}.
export const fetchSupporters = createAsyncThunk(
  'supporters/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { response, data } = await getJson(ENDPOINTS.GET_SUPPORTERS);
      if (!response.ok || (data && data.success === false) || !data || !Array.isArray(data.data)) {
        return rejectWithValue({
          status: response.status,
          message: (data && (data.message || data.msg)) || 'Could not load supporters.',
        });
      }
      // d_in marks deleted rows.
      return data.data.filter(row => !Number(row.d_in));
    } catch (err) {
      return rejectWithValue({ status: 0, message: err.message });
    }
  },
);

const supportersSlice = createSlice({
  name: 'supporters',
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchSupporters.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSupporters.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchSupporters.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload && action.payload.message) || 'Could not load supporters.';
      });
  },
});

export default supportersSlice.reducer;
