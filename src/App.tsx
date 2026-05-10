import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTripStore } from '@/stores/useTripStore'

// Layouts
import MainLayout from '@/components/layout/MainLayout'

// Pages
import LoginPage from '@/features/auth/pages/LoginPage'
import TripListPage from '@/features/trips/pages/TripListPage'
import CreateTripPage from '@/features/trips/pages/CreateTripPage'
import MembersPage from '@/features/trips/pages/MembersPage'
import ExpenseListPage from '@/features/expenses/pages/ExpenseListPage'
import SettlementPage from '@/features/expenses/pages/SettlementPage'
import ChecklistPage from '@/features/trips/pages/ChecklistPage'
import FadeContent from '@/components/FadeContent'
import { ArrowLeft, ArrowRight, Map, Utensils, Hotel, Bus, Plane, Train, Car, Ticket, ShoppingBag, MoreHorizontal, ShoppingBasket, Tag } from 'lucide-react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { calculateTransfers, MemberBalance } from '@/lib/settlement'

const queryClient = new QueryClient()

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setUser])

  return <>{children}</>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()

  if (loading) return null

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function TripDashboard() {
  const { currentTrip } = useTripStore()

  if (!currentTrip) {
    return <Navigate to="/trips" replace />
  }

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', currentTrip.id],
    queryFn: async () => {
      // Fetch members
      const { data: members } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', currentTrip.id)

      // Fetch expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('trip_id', currentTrip.id)

      // Fetch participants
      const { data: participants } = await supabase
        .from('expense_participants')
        .select('*, expenses!inner(trip_id)')
        .eq('expenses.trip_id', currentTrip.id)

      if (!members || !expenses || !participants) return { totalExpense: 0, perCapitaExpense: 0, pendingSettlement: 0, transfers: [], categories: [] }

      const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
      const memberCount = members.length || 1
      const perCapitaExpense = totalExpense / memberCount

      const balances: MemberBalance[] = members.map(m => {
        const paidAmount = expenses
          .filter(e => e.payer_member_id === m.id)
          .reduce((sum, e) => sum + Number(e.amount), 0)

        const owedAmount = (participants as any[])
          .filter(p => p.member_id === m.id)
          .reduce((sum, p) => sum + Number(p.calculated_amount), 0)

        return {
          memberId: m.id,
          displayName: m.display_name,
          balance: paidAmount - owedAmount,
        }
      })

      const transfers = calculateTransfers(balances)
      const pendingSettlement = transfers.reduce((sum, t) => sum + t.amount, 0)

      // Category breakdown
      const categoryTotals: Record<string, number> = {}
      expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount)
      })

      const categories = Object.entries(categoryTotals)
        .map(([category, total]) => ({
          category,
          total,
          perCapita: total / memberCount
        }))
        .sort((a, b) => b.total - a.total)

      return { totalExpense, perCapitaExpense, pendingSettlement, transfers, categories }
    },
    enabled: !!currentTrip,
  })

  const totalExpenseDisplay = dashboardData ? (dashboardData.totalExpense / 100).toFixed(2) : '0.00'
  const perCapitaExpenseDisplay = dashboardData ? (dashboardData.perCapitaExpense / 100).toFixed(2) : '0.00'

  const categoryLabels: Record<string, string> = {
    food: '餐饮', hotel: '住宿', transport: '交通', flight: '机票',
    train: '火车/高铁', car_rental: '打车/租车', ticket: '门票',
    shopping: '购物', entertainment: '娱乐', grocery: '杂货/超市', other: '其他'
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
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
    return icons[category] || <Tag className="w-5 h-5" />
  }

  return (
    <FadeContent blur={true} duration={800}>
      <div className="space-y-12">
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-[2px] bg-[#0A84FF] rounded-full" />
            <span className="text-[10px] font-bold text-text-sub uppercase tracking-[0.3em]">Current Voyage</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {currentTrip.title}
          </h1>
          <div className="flex items-center gap-4 text-text-sub font-bold tracking-widest text-[10px] uppercase">
            <span className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-white/40" />
              {currentTrip.destination}
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-white/40" />
              {currentTrip.currency}
            </span>
          </div>
        </header>

        {/* 全新设计的总览大卡片 */}
        <motion.div 
          className="glass-card p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden"
        >
          {/* 大数据头部：总计与人均 */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
            <div className="space-y-3">
              <span className="text-xs font-bold text-text-sub uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0A84FF]" />
                总支出
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl sm:text-7xl font-black text-white tracking-tighter tabular-nums leading-none">{totalExpenseDisplay}</span>
                <span className="text-sm font-bold text-text-sub uppercase tracking-widest">{currentTrip.currency}</span>
              </div>
            </div>
            
            <div className="md:text-right space-y-3 p-5 md:p-0 bg-white/5 md:bg-transparent rounded-2xl md:rounded-none border border-white/5 md:border-none">
              <span className="text-xs font-bold text-text-sub uppercase tracking-[0.2em] flex items-center md:justify-end gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
                人均花费
              </span>
              <div className="flex items-baseline gap-2 md:justify-end">
                <span className="text-4xl sm:text-5xl font-black text-[#FFB800] tracking-tighter tabular-nums leading-none">{perCapitaExpenseDisplay}</span>
                <span className="text-xs font-bold text-text-sub uppercase tracking-widest">{currentTrip.currency}</span>
              </div>
            </div>
          </div>

          {/* 分类支出明细 */}
          {dashboardData && dashboardData.categories.length > 0 && (
            <div className="pt-8 border-t border-white/5">
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-6">分类支出明细</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {dashboardData.categories.map((c, idx) => (
                  <div key={idx} className="bg-white/5 hover:bg-white/10 rounded-[20px] p-4 flex items-center gap-4 transition-colors border border-white/5">
                    <div className="w-12 h-12 rounded-[14px] bg-black/20 flex items-center justify-center text-white shrink-0 border border-white/5">
                      {getCategoryIcon(c.category)}
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-sm font-bold text-white truncate pr-2">
                          {categoryLabels[c.category] || c.category}
                        </span>
                        <span className="text-base font-mono font-black text-white tracking-tight tabular-nums">
                          {(c.total / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-text-sub uppercase tracking-wider">
                        <span>总花费</span>
                        <span className="text-[#FFB800]/90">人均 {(c.perCapita / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* 核心需求：直观展示谁该付给谁多少钱 */}
        {dashboardData && dashboardData.transfers.length > 0 && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">平摊结算方案</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.transfers.map((t, i) => (
                <div key={i} className="glass-card p-5 sm:p-6 rounded-[28px] flex flex-col sm:flex-row items-center justify-between gap-4 border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex-1 text-center sm:text-left flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-text-sub uppercase tracking-widest">付款方</span>
                    <span className="text-white font-bold text-lg">{t.fromDisplayName}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 px-4">
                    <span className="text-xl sm:text-2xl font-mono font-black text-[#0A84FF]">
                      {(t.amount / 100).toFixed(2)}
                    </span>
                    <div className="flex items-center text-[#0A84FF]/60 text-[10px] font-bold uppercase tracking-widest">
                      <span>支付给</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </div>
                  </div>
                  <div className="flex-1 text-center sm:text-right flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-text-sub uppercase tracking-widest">收款方</span>
                    <span className="text-white font-bold text-lg">{t.toDisplayName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </FadeContent>
  )
}

const Settings = () => {
  const { signOut } = useAuthStore()
  const { setCurrentTrip } = useTripStore()
  const navigate = useNavigate()

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-text-primary">系统设置</h1>
      <div className="mt-8 space-y-4">
        <button
          onClick={() => {
            setCurrentTrip(null)
            navigate('/trips')
          }}
          className="w-full text-left glass p-5 rounded-2xl text-text-primary font-semibold hover:bg-white/60 transition-all flex items-center justify-between"
        >
          <span>切换旅行旅程</span>
          <ArrowLeft className="h-5 w-5 rotate-180 text-accent-primary" />
        </button>
        <button
          onClick={() => signOut()}
          className="w-full text-left glass p-5 rounded-2xl text-accent-danger font-semibold hover:bg-accent-danger/5 transition-all"
        >
          注销登录
        </button>
      </div>
    </div>
  )
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <Router>
          <div className="min-h-screen text-text-primary">
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route path="/trips" element={
                <ProtectedRoute>
                  <div className="max-w-5xl mx-auto px-4">
                    <TripListPage />
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/trips/new" element={
                <ProtectedRoute>
                  <div className="max-w-5xl mx-auto px-4">
                    <CreateTripPage />
                  </div>
                </ProtectedRoute>
              } />

              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<TripDashboard />} />
                <Route path="checklist" element={<ChecklistPage />} />
                <Route path="expenses" element={<ExpenseListPage />} />
                <Route path="settlement" element={<SettlementPage />} />
                <Route path="members" element={<MembersPage />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </AuthInitializer>
    </QueryClientProvider>
  )
}

export default App
