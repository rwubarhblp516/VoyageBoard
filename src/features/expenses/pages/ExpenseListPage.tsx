import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTripStore } from '@/stores/useTripStore'
import { Plus, Loader2, Utensils, Fuel, Car, MapPin, Ticket, ShoppingBag, Hotel, Zap, MoreHorizontal } from 'lucide-react'
import FadeContent from '@/components/FadeContent'
import AddExpenseForm from '../components/AddExpenseForm'
import { ExpenseCategory } from '@/types/expense'
import { format } from 'date-fns'

const categoryIcons: Record<ExpenseCategory, React.ReactNode> = {
  food: <Utensils className="h-5 w-5" />,
  gas: <Fuel className="h-5 w-5" />,
  car_rental: <Car className="h-5 w-5" />,
  parking: <MapPin className="h-5 w-5" />,
  toll: <Zap className="h-5 w-5" />,
  ticket: <Ticket className="h-5 w-5" />,
  shopping: <ShoppingBag className="h-5 w-5" />,
  hotel: <Hotel className="h-5 w-5" />,
  entertainment: <MoreHorizontal className="h-5 w-5" />,
  other: <MoreHorizontal className="h-5 w-5" />,
}

export default function ExpenseListPage() {
  const { currentTrip } = useTripStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const queryClient = useQueryClient()

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', currentTrip?.id],
    queryFn: async () => {
      if (!currentTrip) return []
      const { data, error } = await supabase
        .from('expenses')
        .select('*, payer:trip_members!payer_member_id(display_name)')
        .eq('trip_id', currentTrip.id)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as (any & { payer: { display_name: string } })[]
    },
    enabled: !!currentTrip,
  })

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">记账账单</h1>
          <p className="text-text-secondary mt-1">记录旅途中的每一笔开支。</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-accent-primary hover:bg-accent-primary/90 text-white p-3 rounded-full shadow-lg transition-all"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
        </div>
      ) : expenses && expenses.length > 0 ? (
        <FadeContent duration={600}>
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="glass p-4 rounded-2xl flex items-center gap-4 border-none">
                <div className="h-12 w-12 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary shrink-0">
                  {categoryIcons[expense.category as ExpenseCategory]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-text-primary font-bold truncate">{expense.title}</h3>
                  <p className="text-xs text-text-secondary">
                    {format(new Date(expense.expense_date), 'M月d日')} • {expense.payer?.display_name} 支付
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-mono font-bold text-text-primary">
                    {(Number(expense.amount) / 100).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-text-muted uppercase font-bold">{currentTrip?.currency}</p>
                </div>
              </div>
            ))}
          </div>
        </FadeContent>
      ) : (
        <div className="text-center py-20 glass rounded-3xl border-none">
          <p className="text-text-muted mb-4">暂无账单记录</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-accent-primary font-bold hover:underline"
          >
            记录第一笔开支
          </button>
        </div>
      )}

      {showAddForm && (
        <AddExpenseForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['expenses', currentTrip?.id] })}
        />
      )}
    </div>
  )
}
