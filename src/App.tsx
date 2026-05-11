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
import JoinTripPage from '@/features/trips/pages/JoinTripPage'
import FadeContent from '@/components/FadeContent'
import { ArrowLeft, Utensils, Hotel, Bus, Plane, Train, Car, Ticket, ShoppingBag, MoreHorizontal, ShoppingBasket, Tag } from 'lucide-react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'

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

      if (!members || !expenses || !participants) return { totalExpense: 0, perCapitaExpense: 0, categories: [], memberSpending: [] }

      const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
      const memberCount = members.length || 1
      const perCapitaExpense = totalExpense / memberCount

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

      // Calculate spending for each member (how much they actually consumed/owed)
      const memberSpending = members.map(m => {
        const parts = (participants as any[]).filter(p => p.member_id === m.id)
        const total = parts.reduce((sum, p) => sum + Number(p.calculated_amount), 0)

        const catBreakdown: Record<string, number> = {}
        parts.forEach(p => {
          const expense = expenses.find(e => e.id === p.expense_id)
          const cat = expense ? expense.category : 'other'
          catBreakdown[cat] = (catBreakdown[cat] || 0) + Number(p.calculated_amount)
        })

        const topCategories = Object.entries(catBreakdown)
          .map(([cat, amt]) => ({ category: cat, amount: amt }))
          .sort((a, b) => b.amount - a.amount)

        return {
          memberId: m.id,
          displayName: m.display_name,
          total,
          topCategories
        }
      }).sort((a, b) => b.total - a.total)

      return { totalExpense, perCapitaExpense, categories, memberSpending }
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
        <header className="mb-12 flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-[2px] bg-[#0A84FF] rounded-full shadow-sm" />
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-[0.3em] drop-shadow-sm">Current Voyage</span>
            <div className="w-8 h-[2px] bg-[#0A84FF] rounded-full shadow-sm" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
            {currentTrip.title}
          </h1>
          <div className="flex items-center gap-4 text-white/70 font-bold tracking-[0.2em] text-[10px] uppercase mt-3">
            <span className="flex items-center gap-2">
              {currentTrip.destination}
            </span>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <span className="flex items-center gap-2">
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
              <span className="text-xs font-bold text-white/80 uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0A84FF]" />
                总支出
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl sm:text-7xl font-black text-white tracking-tighter tabular-nums leading-none">{totalExpenseDisplay}</span>
                <span className="text-sm font-bold text-white/80 uppercase tracking-widest">{currentTrip.currency}</span>
              </div>
            </div>

            <div className="md:text-right space-y-3 p-5 md:p-0 bg-white/5 md:bg-transparent rounded-2xl md:rounded-none border border-white/5 md:border-none">
              <span className="text-xs font-bold text-white/80 uppercase tracking-[0.2em] flex items-center md:justify-end gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
                人均花费
              </span>
              <div className="flex items-baseline gap-2 md:justify-end">
                <span className="text-4xl sm:text-5xl font-black text-[#FFB800] tracking-tighter tabular-nums leading-none">{perCapitaExpenseDisplay}</span>
                <span className="text-xs font-bold text-white/80 uppercase tracking-widest">{currentTrip.currency}</span>
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
                      <div className="flex justify-between items-center text-[10px] font-bold text-white/70 uppercase tracking-wider">
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

        {/* 成员个人消费榜单 */}
        {dashboardData && dashboardData.memberSpending.length > 0 && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">成员总花费排行</h2>
              <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest bg-black/15 px-2.5 py-1 rounded-md shadow-sm">
                包含个人消费
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.memberSpending.map((ms) => (
                <div key={ms.memberId} className="glass-card p-6 rounded-[32px] border-white/5 hover:border-white/10 transition-colors flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-2xl">{ms.displayName}</span>
                    <div className="text-right">
                      <span className="text-3xl font-mono font-black text-emerald-400 tabular-nums">
                        {(ms.total / 100).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-emerald-400/60 font-bold uppercase ml-1 tracking-widest">
                        {currentTrip?.currency}
                      </span>
                    </div>
                  </div>

                  {ms.topCategories.length > 0 && (
                    <div className="pt-4 border-t border-white/5 flex flex-wrap gap-2">
                      {ms.topCategories.map((tc, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                          <span className="text-white/40">{getCategoryIcon(tc.category)}</span>
                          <span className="text-xs font-bold text-white/80">{categoryLabels[tc.category] || tc.category}</span>
                          <span className="text-xs font-mono font-bold text-white/60 ml-1">{(tc.amount / 100).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="mb-10 flex flex-col items-center text-center">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-[2px] bg-white/50 rounded-full shadow-sm" />
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-[0.3em] drop-shadow-sm">SETTINGS</span>
          <div className="w-8 h-[2px] bg-white/50 rounded-full shadow-sm" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">系统设置</h1>
        <p className="text-white/80 font-medium mt-2 drop-shadow-sm">管理您的偏好与账号安全。</p>
      </header>
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
              <Route path="/join/:tripId" element={<JoinTripPage />} />

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
