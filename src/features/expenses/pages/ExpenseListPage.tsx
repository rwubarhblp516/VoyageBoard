import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTripStore } from '@/stores/useTripStore'
import { Plus, Loader2, Utensils, Car, Ticket, ShoppingBag, Hotel, MoreHorizontal, ReceiptText, Plane, Train, ShoppingBasket, Tag, Bus, Search, Trash2 } from 'lucide-react'
import AddExpenseForm from '../components/AddExpenseForm'
import { format } from 'date-fns'
import { motion } from 'framer-motion'

const categoryIcons: Record<string, React.ReactNode> = {
  food: <Utensils className="w-5 h-5" />,
  hotel: <Hotel className="w-5 h-5" />,
  transport: <Bus className="w-5 h-5" />,
  flight: <Plane className="w-5 h-5" />,
  train: <Train className="w-5 h-5" />,
  car_rental: <Car className="w-5 h-5" />,
  ticket: <Ticket className="w-5 h-5" />,
  shopping: <ShoppingBag className="w-5 h-5" />,
  entertainment: <MoreHorizontal className="w-5 h-5" />,
  grocery: <ShoppingBasket className="w-5 h-5" />,
  other: <Tag className="w-5 h-5" />,
}

const getCategoryIcon = (category: string) => {
  return categoryIcons[category] || <Tag className="w-5 h-5" />
}

export default function ExpenseListPage() {
  const { currentTrip } = useTripStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', currentTrip?.id],
    queryFn: async () => {
      if (!currentTrip) return []
      const { data, error } = await supabase
        .from('expenses')
        .select('*, payer:trip_members!payer_member_id(display_name), participants:expense_participants(member_id)')
        .eq('trip_id', currentTrip.id)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as (any & { payer: { display_name: string }, participants: any[] })[]
    },
    enabled: !!currentTrip,
  })

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!window.confirm('确认删除这笔账单吗？')) return
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['expenses', currentTrip?.id] })
    } catch (err: any) {
      alert(err.message)
    }
  }

  const filteredExpenses = expenses?.filter(expense => 
    expense.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    expense.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <header className="mb-12 flex flex-col items-center text-center">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-[2px] bg-white/50 rounded-full shadow-sm" />
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-[0.3em] drop-shadow-sm">EXPENSES</span>
          <div className="w-8 h-[2px] bg-white/50 rounded-full shadow-sm" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md mb-2">记账账单</h1>
        <p className="text-white/80 font-medium drop-shadow-sm mb-8">清楚记录，享受每一次探索。</p>
        
        <div className="flex items-center gap-4 w-full max-w-2xl">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-white/30" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索账单标题或分类..."
              className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white focus:outline-none focus:ring-1 focus:ring-white/30 transition-all font-medium shadow-inner placeholder:text-white/50"
            />
          </div>
        </div>
      </header>

      {/* Floating Add Button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
        <motion.button
          onClick={() => {
            setEditingExpense(null)
            setShowAddForm(true)
          }}
          whileHover={{ scale: 1.1, boxShadow: "0 20px 40px rgba(255,255,255,0.15)" }}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 bg-white text-slate-950 rounded-full flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.5)] group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white via-slate-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Plus className="h-6 w-6 relative z-10" />
        </motion.button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-white/10" />
        </div>
      ) : filteredExpenses && filteredExpenses.length > 0 ? (
        <div className="space-y-4">
          {filteredExpenses.map((expense) => {
            const isIndividual = expense.participants?.length === 1 && expense.participants[0].member_id === expense.payer_member_id
            
            return (
            <div key={expense.id} className="relative rounded-[28px] overflow-hidden w-full">
              <motion.div 
                drag="x"
                dragConstraints={{ left: -80, right: 0 }}
                dragElastic={0.1}
                onClick={() => {
                  setEditingExpense(expense)
                  setShowAddForm(true)
                }}
                className="relative z-10 glass-card flex items-center gap-4 sm:gap-6 cursor-pointer p-5 rounded-[28px] border-white/5 transition-colors hover:border-white/10 w-full"
              >
                <div className="w-14 h-14 rounded-[20px] bg-white/5 flex items-center justify-center text-white shrink-0 border border-white/5">
                  {getCategoryIcon(expense.category)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg truncate mb-1">{expense.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-white/70 font-medium flex-wrap">
                    <span>{format(new Date(expense.expense_date), 'M月d日')}</span>
                    <span className="w-1 h-1 rounded-full bg-white/40" />
                    <span className="truncate">{expense.payer?.display_name} 支付</span>
                    <span className="text-[9px] font-bold bg-white/15 text-white px-1.5 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap">
                      {isIndividual ? '个人' : 'AA'}
                    </span>
                  </div>
                </div>
                
                <div className="text-right pr-2">
                  <p className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tighter">
                    {(Number(expense.amount) / 100).toFixed(2)}
                  </p>
                  <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">{currentTrip?.currency}</p>
                </div>

                {/* Attached Delete Button */}
                <button
                  onClick={(e) => handleDelete(e, expense.id)}
                  className="absolute inset-y-0 -right-[80px] w-[80px] bg-red-500/80 hover:bg-red-500 flex flex-col items-center justify-center text-white transition-colors"
                >
                  <Trash2 className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">删除</span>
                </button>
              </motion.div>
            </div>
            )
          })}
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
          editingExpense={editingExpense}
          onClose={() => {
            setShowAddForm(false)
            setEditingExpense(null)
          }}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['expenses', currentTrip?.id] })}
        />
      )}
    </div>
  )
}
