import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTripStore } from '@/stores/useTripStore'
import { Plus, Loader2, Utensils, Fuel, Car, MapPin, Ticket, ShoppingBag, Hotel, Zap, MoreHorizontal, ReceiptText } from 'lucide-react'
import AddExpenseForm from '../components/AddExpenseForm'
import { ExpenseCategory } from '@/types/expense'
import { format } from 'date-fns'

const categoryIcons: Record<ExpenseCategory, React.ReactNode> = {
  food: <Utensils className="w-5 h-5" />,
  gas: <Fuel className="w-5 h-5" />,
  car_rental: <Car className="w-5 h-5" />,
  parking: <MapPin className="w-5 h-5" />,
  toll: <Zap className="w-5 h-5" />,
  ticket: <Ticket className="w-5 h-5" />,
  shopping: <ShoppingBag className="w-5 h-5" />,
  hotel: <Hotel className="w-5 h-5" />,
  entertainment: <MoreHorizontal className="w-5 h-5" />,
  other: <MoreHorizontal className="w-5 h-5" />,
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <header className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">记账账单</h1>
          <p className="text-text-sub font-medium">清楚记录，享受每一次探索。</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="group relative px-6 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-white transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden shadow-xl shrink-0"
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Plus className="w-4 h-4 relative z-10" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] relative z-10">记一笔</span>
        </button>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-white/10" />
        </div>
      ) : expenses && expenses.length > 0 ? (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <div key={expense.id} className="glass-card flex items-center gap-4 sm:gap-6 group cursor-default p-5 rounded-[28px] border-white/5 transition-all hover:border-white/10">
              <div className="w-14 h-14 rounded-[20px] bg-white/5 flex items-center justify-center text-white shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/10 border border-white/5">
                {categoryIcons[expense.category as ExpenseCategory]}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-lg truncate mb-1">{expense.title}</h3>
                <div className="flex items-center gap-2 text-xs text-text-sub font-medium">
                  <span>{format(new Date(expense.expense_date), 'M月d日')}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="truncate">{expense.payer?.display_name} 支付</span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tighter">
                  {(Number(expense.amount) / 100).toFixed(2)}
                </p>
                <p className="text-[10px] text-text-sub font-bold uppercase tracking-widest">{currentTrip?.currency}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 glass-panel rounded-[44px] border-dashed border-2 border-white/5 hover:border-white/10 transition-colors">
          <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
            <ReceiptText className="w-8 h-8 text-white/30" />
          </div>
          <p className="text-text-sub font-bold text-[10px] mb-8 uppercase tracking-[0.4em]">暂无开支记录</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="group inline-flex items-center gap-2 text-white font-bold text-xs tracking-[0.1em] transition-all"
          >
            <span className="border-b border-white/20 pb-1 group-hover:border-white transition-colors">开始记录第一笔</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
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
