import { create } from 'zustand'

interface UIState {
  isAddExpenseModalOpen: boolean
  editingExpense: any | null
  addExpenseDraft: any | null
  openAddExpense: (expense?: any, draft?: any) => void
  closeAddExpense: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isAddExpenseModalOpen: false,
  editingExpense: null,
  addExpenseDraft: null,
  openAddExpense: (expense = null, draft = null) => set({ isAddExpenseModalOpen: true, editingExpense: expense, addExpenseDraft: draft }),
  closeAddExpense: () => set({ isAddExpenseModalOpen: false, editingExpense: null, addExpenseDraft: null }),
}))
