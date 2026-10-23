import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import techniciansReducer from './slices/techniciansSlice';
import jobSheetReducer from './slices/jobSheetSlice';
import purchaseReducer from './slices/purchaseSlice';
import saleReducer from './slices/saleSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    technicians: techniciansReducer,
    jobSheet: jobSheetReducer,
    purchase: purchaseReducer,
    sale: saleReducer,
  },
});

export default store;
