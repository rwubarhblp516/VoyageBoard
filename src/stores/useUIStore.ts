import { create } from 'zustand'

interface UIState {
  isAddExpenseModalOpen: boolean
  editingExpense: any | null
  openAddExpense: (expense?: any) => void
  closeAddExpense: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isAddExpenseModalOpen: false,
  editingExpense: null,
  openAddExpense: (expense = null) => set({ isAddExpenseModalOpen: true, editingExpense: expense }),
  closeAddExpense: () => set({ isAddExpenseModalOpen: false, editingExpense: null }),
}))
