import { createSlice } from '@reduxjs/toolkit';

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
