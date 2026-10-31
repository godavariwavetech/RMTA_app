import { configureStore } from '@reduxjs/toolkit';
import authReducer, { setApiTechId } from './slices/authSlice';
import techniciansReducer from './slices/techniciansSlice';
import jobSheetReducer from './slices/jobSheetSlice';
import purchaseReducer from './slices/purchaseSlice';
import saleReducer from './slices/saleSlice';
import supportersReducer from './slices/supportersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    technicians: techniciansReducer,
    jobSheet: jobSheetReducer,
    purchase: purchaseReducer,
    sale: saleReducer,
    supporters: supportersReducer,
  },
});

// Keep the API helper's tech_id in step with the logged-in user: set at login or session
// restore, cleared at logout.
const syncTechId = () => setApiTechId(store.getState().auth.user?.tech_id);
store.subscribe(syncTechId);
syncTechId();

export default store;
