import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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
import ExpenseListPage from '@/features/expenses/pages/ExpenseListPage'
import SettlementPage from '@/features/expenses/pages/SettlementPage'

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
    <div>
      <h1 className="text-3xl font-bold text-text-primary">{currentTrip.title}</h1>
      <p className="text-text-secondary mt-1">{currentTrip.destination}</p>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl h-40 flex flex-col justify-center">
          <span className="text-text-muted text-xs uppercase font-bold tracking-wider">当前目的地</span>
          <span className="text-2xl font-bold text-text-primary mt-1">{currentTrip.destination}</span>
        </div>
        <div className="glass p-6 rounded-3xl h-40 flex flex-col justify-center">
          <span className="text-text-muted text-xs uppercase font-bold tracking-wider">结算货币</span>
          <span className="text-3xl font-mono font-bold text-accent-primary mt-1">{currentTrip.currency}</span>
        </div>
        <div className="glass p-6 rounded-3xl h-40 flex flex-col justify-center">
          <span className="text-text-muted text-xs uppercase font-bold tracking-wider">旅程状态</span>
          <span className="text-xl font-bold text-accent-success mt-1">进行中</span>
        </div>
      </div>
    </div>
  )
}

const Itinerary = () => (
  <div className="py-8">
    <h1 className="text-3xl font-bold text-text-primary">行程规划</h1>
    <p className="text-text-secondary mt-1 italic">正在规划您的精彩冒险...</p>
    <div className="mt-8 glass p-12 rounded-3xl text-center border-dashed border-2 border-accent-primary/20">
      <p className="text-text-muted">行程管理功能即将上线。</p>
    </div>
  </div>
)

const Members = () => (
  <div className="py-8">
    <h1 className="text-3xl font-bold text-text-primary">成员管理</h1>
    <p className="text-text-secondary mt-1 italic">管理您的旅行伙伴...</p>
    <div className="mt-8 glass p-12 rounded-3xl text-center border-dashed border-2 border-accent-primary/20">
      <p className="text-text-muted">成员邀请与角色管理即将上线。</p>
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
          <span>切换旅行项目</span>
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

import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

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
                <Route path="members" element={<Members />} />
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
