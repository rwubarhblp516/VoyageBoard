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
import FadeContent from '@/components/FadeContent'
import { ArrowLeft, Receipt, LayoutDashboard } from 'lucide-react'
import { motion } from 'framer-motion'

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

  return (
    <FadeContent blur={true} duration={800}>
      <div className="space-y-12">
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-[2px] bg-[#0A84FF] rounded-full" />
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Current Voyage</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {currentTrip.title}
          </h1>
          <div className="flex items-center gap-4 text-white/30 font-bold tracking-widest text-[10px] uppercase">
            <span className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-white/20" />
              {currentTrip.destination}
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-white/20" />
              {currentTrip.currency}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-card p-8 rounded-[32px] space-y-6 relative overflow-hidden group border border-white/5"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Receipt className="w-12 h-12 text-white" />
            </div>
            <span className="block text-sm font-bold text-white/40 uppercase tracking-[0.15em]">总支出</span>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white tracking-tighter">0.00</span>
                <span className="text-xs font-bold text-white/20 uppercase tracking-widest">{currentTrip.currency}</span>
              </div>
              <p className="text-[10px] text-white/20 font-medium">本旅程所有成员累计支出</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-card p-8 rounded-[32px] space-y-6 relative overflow-hidden group border border-white/5"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <LayoutDashboard className="w-12 h-12 text-white" />
            </div>
            <span className="block text-sm font-bold text-white/40 uppercase tracking-[0.15em]">待结算</span>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white tracking-tighter text-[#FFB800]">0.00</span>
                <span className="text-xs font-bold text-white/20 uppercase tracking-widest">{currentTrip.currency}</span>
              </div>
              <p className="text-[10px] text-white/20 font-medium">当前仍有待确认的款项</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-card p-8 rounded-[32px] space-y-6 relative overflow-hidden group border border-white/5"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
            <span className="block text-sm font-bold text-white/40 uppercase tracking-[0.15em]">旅程状态</span>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                </div>
                <span className="text-xl font-bold text-white tracking-tight">进行中</span>
              </div>
              <p className="text-[10px] text-white/20 font-medium">当前旅程处于活跃状态</p>
            </div>
          </motion.div>
        </div>
      </div>
    </FadeContent>
  )
}

const Itinerary = () => (
  <div className="py-8">
    <h1 className="text-3xl font-bold text-text-primary">行程规划</h1>
    <p className="text-text-secondary mt-1 italic">为您规划更高效的路线...</p>
    <div className="mt-8 glass p-12 rounded-3xl text-center border-dashed border-2 border-accent-primary/20">
      <p className="text-text-muted">行程管理功能即将上线。</p>
    </div>
  </div>
)

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
                <Route path="itinerary" element={<Itinerary />} />
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
