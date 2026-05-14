import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  Settings as SettingsIcon,
  Users,
  ListTodo,
  Calculator,
  Plus,
  Home,
  Route
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import LightPillar from '@/components/LightPillar'
import { useUIStore } from '@/stores/useUIStore'
import AddExpenseForm from '@/features/expenses/components/AddExpenseForm'
import { useQueryClient } from '@tanstack/react-query'

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { id: '/', icon: LayoutDashboard, label: '总览' },
    { id: '/checklist', icon: ListTodo, label: '清单' },
    { id: '/expenses', icon: Receipt, label: '记账', isCenter: true },
    { id: '/settlement', icon: Calculator, label: '结算' },
    { id: '/timeline', icon: Route, label: '记录' },
  ]

  const { isAddExpenseModalOpen, openAddExpense, closeAddExpense, editingExpense } = useUIStore()
  const queryClient = useQueryClient()

  return (
    <div className="relative min-h-screen bg-bg-base text-slate-200 font-sans selection:bg-white/10 selection:text-white">
      {/* 顶部导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/trips')}
            className="p-2.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90 shadow-lg group"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/members')}
              className={`group flex h-11 items-center gap-2 rounded-2xl border px-3 text-white/70 shadow-lg backdrop-blur-xl transition-all active:scale-90 ${
                location.pathname.startsWith('/members')
                  ? 'border-white/20 bg-white text-black'
                  : 'border-white/10 bg-white/5 hover:bg-white/10 hover:text-white'
              }`}
              aria-label="成员管理"
            >
              <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="hidden text-xs font-black tracking-widest sm:inline">成员</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className={`p-2.5 backdrop-blur-xl border rounded-2xl transition-all active:scale-90 shadow-lg group ${
                location.pathname.startsWith('/settings')
                  ? 'border-white/20 bg-white text-black'
                  : 'border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
              }`}
              aria-label="设置"
            >
              <SettingsIcon className="w-5 h-5 group-hover:rotate-45 transition-transform" />
            </button>
          </div>
        </div>
      </nav>

      {/* 还原高保真背景：通透、明亮、动感 */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#1a2c2f] to-[#15252b]">
        <LightPillar
          topColor="#7ee3f2ff" // Midnight/Slate black
          bottomColor="#73d5f3" // Deep Ocean Cyan
          intensity={0.9}
          rotationSpeed={0.5}
          pillarRotation={25}
          pillarHeight={0.4}
          pillarWidth={3.5}
          noiseIntensity={0}
        />
      </div>

      {/* 内容区域 */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-44">
        <Outlet />
      </main>

      {/* 极简高级底部导航 (Dock Style) */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-[420px] px-6">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/10 backdrop-blur-[24px] border border-white/10 px-2 py-2 rounded-[36px] flex items-center justify-between shadow-[0_15px_40px_rgba(0,0,0,0.2)] relative"
        >
          {navItems.map((item: any) => {
            const Icon = item.icon
            const isActive = location.pathname === item.id || (item.id !== '/' && location.pathname.startsWith(item.id))
            const isCenter = item.isCenter

            if (isCenter) {
              return (
                <div key={item.id} className="relative flex-1 flex flex-col items-center justify-center">
                  <motion.button
                    onClick={() => {
                      if (isActive) {
                        openAddExpense()
                      } else {
                        navigate(item.id)
                      }
                    }}
                    animate={{
                      y: isActive ? -28 : 0,
                      backgroundColor: isActive ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.05)",
                      borderRadius: isActive ? "9999px" : "24px",
                      color: isActive ? "rgba(0, 0, 0, 1)" : "rgba(255, 255, 255, 0.6)",
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 35, mass: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center justify-center z-20 ${isActive
                      ? 'w-16 h-16 shadow-[0_15px_30px_rgba(0,0,0,0.2)] border-4 border-black/10'
                      : 'w-12 h-12 border border-white/5'
                      }`}
                  >
                    {isActive ? (
                      <Plus className="h-7 w-7" strokeWidth={3} />
                    ) : (
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    )}
                  </motion.button>

                  <span className={`absolute transition-all duration-200 text-[10px] font-bold uppercase tracking-widest ${isActive
                    ? 'top-14 opacity-100 text-white'
                    : 'top-10 opacity-0'
                    }`}>
                    记一笔
                  </span>
                </div>
              )
            }

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`relative flex flex-col items-center justify-center gap-1.5 flex-1 py-3 h-16 rounded-[24px] transition-all duration-200 group z-10 ${isActive
                  ? 'text-white'
                  : 'text-white/50 hover:text-white/90'
                  }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-white/10 border border-white/5 rounded-[24px] -z-10" />
                )}
                <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110 drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] font-bold tracking-widest uppercase transition-all duration-200 ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden group-hover:opacity-100 group-hover:h-auto mt-0'}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </motion.div>
      </nav>

      {/* Global Add Expense Modal */}
      <AnimatePresence>
        {isAddExpenseModalOpen && (
          <AddExpenseForm
            editingExpense={editingExpense}
            onClose={closeAddExpense}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['expenses'] })
              queryClient.invalidateQueries({ queryKey: ['dashboard'] })
              queryClient.invalidateQueries({ queryKey: ['settlement'] })
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
