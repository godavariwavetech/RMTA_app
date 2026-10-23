import { createSlice } from '@reduxjs/toolkit';

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
