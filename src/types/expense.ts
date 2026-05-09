export type ExpenseCategory =
  | 'hotel'
  | 'food'
  | 'gas'
  | 'parking'
  | 'toll'
  | 'ticket'
  | 'shopping'
  | 'car_rental'
  | 'entertainment'
  | 'other'

export interface Expense {
  id: string
  trip_id: string
  title: string
  amount: number // in cents
  currency: string
  category: ExpenseCategory
  payer_member_id: string
  expense_date: string
  day_id?: string
  note?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ExpenseParticipant {
  id: string
  expense_id: string
  member_id: string
  share_type: 'equal' | 'fixed' | 'percentage'
  share_value?: number
  calculated_amount: number // in cents
}
