import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useTripStore } from '@/stores/useTripStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { Loader2, Utensils, Car, Ticket, ShoppingBag, Hotel, MoreHorizontal, ReceiptText, Plane, Train, ShoppingBasket, Tag, Bus, Trash2, CalendarDays, Target, WalletCards } from 'lucide-react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { useUIStore } from '@/stores/useUIStore'
import { useEffect, useMemo, useState } from 'react'

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

const getTodayText = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatCurrency = (amountInCents: number, currency?: string | null) => (
  `${(amountInCents / 100).toFixed(2)}${currency ? ` ${currency}` : ''}`
)

const formatExpenseDate = (dateText: string) => {
  const date = new Date(`${dateText}T00:00:00`)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export default function ExpenseListPage() {
  const { currentTrip } = useTripStore()
  const { user } = useAuthStore()
  const searchQuery = ''
  const queryClient = useQueryClient()
  const { openAddExpense } = useUIStore()
  const budgetStorageKey = currentTrip ? `voyageboard-daily-budget-${currentTrip.id}-${user?.id || 'guest'}` : ''
  const foodBudgetStorageKey = currentTrip ? `voyageboard-food-daily-budget-${currentTrip.id}-${user?.id || 'guest'}` : ''
  const [dailyBudgetText, setDailyBudgetText] = useState('')
  const [foodBudgetText, setFoodBudgetText] = useState('')

  useEffect(() => {
    if (!budgetStorageKey) return
    setDailyBudgetText(window.localStorage.getItem(budgetStorageKey) || '')
  }, [budgetStorageKey])

  useEffect(() => {
    if (!foodBudgetStorageKey) return
    setFoodBudgetText(window.localStorage.getItem(foodBudgetStorageKey) || '')
  }, [foodBudgetStorageKey])

  useEffect(() => {
    if (!budgetStorageKey) return
    if (dailyBudgetText.trim()) {
      window.localStorage.setItem(budgetStorageKey, dailyBudgetText)
    } else {
      window.localStorage.removeItem(budgetStorageKey)
    }
  }, [budgetStorageKey, dailyBudgetText])

  useEffect(() => {
    if (!foodBudgetStorageKey) return
    if (foodBudgetText.trim()) {
      window.localStorage.setItem(foodBudgetStorageKey, foodBudgetText)
    } else {
      window.localStorage.removeItem(foodBudgetStorageKey)
    }
  }, [foodBudgetStorageKey, foodBudgetText])

  const { data: currentMember } = useQuery({
    queryKey: ['currentMember', currentTrip?.id, user?.id],
    queryFn: async () => {
      if (!currentTrip || !user) return null
      const { data, error } = await supabase
        .from('trip_members')
        .select('id')
        .eq('trip_id', currentTrip.id)
        .eq('user_id', user.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!currentTrip && !!user,
  })

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', currentTrip?.id],
    queryFn: async () => {
      if (!currentTrip) return []
      const { data, error } = await supabase
        .from('expenses')
        .select('*, payer:trip_members!payer_member_id(display_name), participants:expense_participants(member_id, calculated_amount)')
        .eq('trip_id', currentTrip.id)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as (any & { payer: { display_name: string }, participants: any[] })[]
    },
    enabled: !!currentTrip,
  })

  const myExpenseStats = useMemo(() => {
    const memberId = currentMember?.id
    const dailyTotals = new Map<string, number>()
    const foodDailyTotals = new Map<string, number>()
    if (!memberId || !expenses) {
      return {
        total: 0,
        today: 0,
        todayFood: 0,
        daily: [] as Array<{ date: string; amount: number; foodAmount: number }>,
      }
    }

    expenses.forEach((expense) => {
      const participant = expense.participants?.find((item: any) => item.member_id === memberId)
      const relatedAmount = participant
        ? Number(participant.calculated_amount || 0)
        : expense.payer_member_id === memberId
          ? Number(expense.amount || 0)
          : 0

      if (relatedAmount <= 0) return
      dailyTotals.set(expense.expense_date, (dailyTotals.get(expense.expense_date) || 0) + relatedAmount)
      if (expense.category === 'food') {
        foodDailyTotals.set(expense.expense_date, (foodDailyTotals.get(expense.expense_date) || 0) + relatedAmount)
      }
    })

    const daily = Array.from(dailyTotals.entries())
      .map(([date, amount]) => ({ date, amount, foodAmount: foodDailyTotals.get(date) || 0 }))
      .sort((a, b) => b.date.localeCompare(a.date))

    return {
      total: daily.reduce((sum, item) => sum + item.amount, 0),
      today: dailyTotals.get(getTodayText()) || 0,
      todayFood: foodDailyTotals.get(getTodayText()) || 0,
      daily,
    }
  }, [currentMember?.id, expenses])

  const dailyBudget = dailyBudgetText.trim() ? Math.round(Number(dailyBudgetText) * 100) : 0
  const foodBudget = foodBudgetText.trim() ? Math.round(Number(foodBudgetText) * 100) : 0
  const budgetRatio = dailyBudget > 0 ? Math.min(100, Math.round((myExpenseStats.today / dailyBudget) * 100)) : 0
  const budgetDiff = dailyBudget - myExpenseStats.today
  const foodBudgetRatio = foodBudget > 0 ? Math.min(100, Math.round((myExpenseStats.todayFood / foodBudget) * 100)) : 0
  const foodBudgetDiff = foodBudget - myExpenseStats.todayFood

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
        
      </header>

      <section className="mb-6 glass-card rounded-[32px] border border-white/10 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black text-white/45 uppercase tracking-[0.25em]">
                <WalletCards className="h-4 w-4" />
                MY SPENDING
              </div>
              <h2 className="mt-2 text-2xl font-black text-white">我的支出概览</h2>
              <p className="mt-1 text-xs font-bold text-white/45">按我实际承担的分摊金额统计。</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                  <Target className="h-4 w-4" />
                  每日总上限
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={dailyBudgetText}
                    onChange={(event) => setDailyBudgetText(event.target.value)}
                    placeholder="可选"
                    className="w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right text-sm font-black text-white outline-none focus:border-white/30"
                  />
                  <span className="text-xs font-black text-white/45">{currentTrip?.currency || ''}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                  <Utensils className="h-4 w-4" />
                  餐饮每日上限
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={foodBudgetText}
                    onChange={(event) => setFoodBudgetText(event.target.value)}
                    placeholder="例如 200"
                    className="w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right text-sm font-black text-white outline-none focus:border-white/30"
                  />
                  <span className="text-xs font-black text-white/45">{currentTrip?.currency || ''}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-xs font-black text-white/45">
                <CalendarDays className="h-4 w-4" />
                今日
              </div>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">
                {formatCurrency(myExpenseStats.today, currentTrip?.currency)}
              </p>
              {dailyBudget > 0 && (
                <p className={`mt-2 text-xs font-bold ${budgetDiff >= 0 ? 'text-emerald-100/75' : 'text-rose-100/85'}`}>
                  {budgetDiff >= 0 ? `剩余 ${formatCurrency(budgetDiff, currentTrip?.currency)}` : `超出 ${formatCurrency(Math.abs(budgetDiff), currentTrip?.currency)}`}
                </p>
              )}
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-xs font-black text-white/45">
                <Utensils className="h-4 w-4" />
                今日餐饮
              </div>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">
                {formatCurrency(myExpenseStats.todayFood, currentTrip?.currency)}
              </p>
              {foodBudget > 0 && (
                <p className={`mt-2 text-xs font-bold ${foodBudgetDiff >= 0 ? 'text-emerald-100/75' : 'text-rose-100/85'}`}>
                  {foodBudgetDiff >= 0 ? `剩余 ${formatCurrency(foodBudgetDiff, currentTrip?.currency)}` : `超出 ${formatCurrency(Math.abs(foodBudgetDiff), currentTrip?.currency)}`}
                </p>
              )}
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="text-xs font-black text-white/45">我的总花费</div>
              <p className="mt-3 text-3xl font-black tracking-tight text-white">
                {formatCurrency(myExpenseStats.total, currentTrip?.currency)}
              </p>
              <p className="mt-2 text-xs font-bold text-white/40">{myExpenseStats.daily.length} 天有相关支出</p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="text-xs font-black text-white/45">预算状态</div>
              <p className={`mt-3 text-2xl font-black ${
                (dailyBudget > 0 && budgetDiff < 0) || (foodBudget > 0 && foodBudgetDiff < 0) ? 'text-rose-100' : 'text-white'
              }`}>
                {(dailyBudget > 0 && budgetDiff < 0) || (foodBudget > 0 && foodBudgetDiff < 0) ? '已超预算' : (dailyBudget > 0 || foodBudget > 0) ? '未超预算' : '未设置'}
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
                <div
                  className={`h-full rounded-full ${dailyBudget > 0 && budgetDiff < 0 ? 'bg-rose-400' : 'bg-emerald-400'}`}
                  style={{ width: `${dailyBudget > 0 ? budgetRatio : 0}%` }}
                />
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/30">
                <div
                  className={`h-full rounded-full ${foodBudget > 0 && foodBudgetDiff < 0 ? 'bg-rose-400' : 'bg-orange-300'}`}
                  style={{ width: `${foodBudget > 0 ? foodBudgetRatio : 0}%` }}
                />
              </div>
              <p className="mt-2 text-[10px] font-bold text-white/35">上：总预算，下：餐饮预算</p>
            </div>
          </div>

          {myExpenseStats.daily.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {myExpenseStats.daily.slice(0, 10).map((day) => {
                const overBudget = dailyBudget > 0 && day.amount > dailyBudget
                const overFoodBudget = foodBudget > 0 && day.foodAmount > foodBudget
                return (
                  <div
                    key={day.date}
                    className={`min-w-[116px] rounded-2xl border px-3 py-3 ${
                      overBudget || overFoodBudget
                        ? 'border-rose-300/20 bg-rose-400/10'
                        : 'border-white/10 bg-black/15'
                    }`}
                  >
                    <p className="text-[11px] font-black text-white/45">{formatExpenseDate(day.date)}</p>
                    <p className="mt-1 text-sm font-black text-white">{formatCurrency(day.amount, currentTrip?.currency)}</p>
                    <p className="mt-1 text-[10px] font-bold text-white/45">
                      餐饮 {formatCurrency(day.foodAmount, currentTrip?.currency)}
                    </p>
                    {(dailyBudget > 0 || foodBudget > 0) && (
                      <p className={`mt-1 text-[10px] font-bold ${overBudget || overFoodBudget ? 'text-rose-100/80' : 'text-emerald-100/70'}`}>
                        {overBudget || overFoodBudget ? '超预算' : '正常'}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

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
                  openAddExpense(expense)
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
                    {expense.timeline_entry_id && (
                      <span className="text-[9px] font-bold bg-emerald-400/15 text-emerald-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider whitespace-nowrap border border-emerald-300/15">
                        已关联行程
                      </span>
                    )}
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
            onClick={() => openAddExpense()}
            className="group inline-flex items-center gap-2 text-white font-bold text-xs tracking-[0.1em] transition-all"
          >
            <span className="border-b border-white/20 pb-1 group-hover:border-white transition-colors">开始记录第一笔</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      )}
    </div>
  )
}
