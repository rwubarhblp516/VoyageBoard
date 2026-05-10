import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  Settings as SettingsIcon,
  Users,
  ListTodo,
  Calculator
} from 'lucide-react'
import { motion } from 'framer-motion'
import LightPillar from '@/components/LightPillar'

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { id: '/', icon: LayoutDashboard, label: '总览' },
    { id: '/checklist', icon: ListTodo, label: '清单' },
    { id: '/expenses', icon: Receipt, label: '记账' },
    { id: '/settlement', icon: Calculator, label: '结算' },
    { id: '/settings', icon: SettingsIcon, label: '设置' },
  ]

  return (
    <div className="relative min-h-screen bg-bg-base text-slate-200 font-sans selection:bg-white/10 selection:text-white">
      {/* 还原高保真背景：通透、明亮、动感 */}
      <div className="fixed inset-0 z-0">
        <LightPillar
          topColor="#a3e5ef" // Midnight/Slate black
          bottomColor="#f3c7f3" // Deep Ocean Cyan
          intensity={0.9}
          rotationSpeed={0.5}
          pillarRotation={25}
          pillarHeight={0.4}
          pillarWidth={2.2}
          noiseIntensity={0}
        />
      </div>

      {/* 内容区域 */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-44">
        <Outlet />
      </main>

      {/* 成员管理悬浮按钮 (FAB) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/members')}
        className="fixed right-6 bottom-32 sm:right-12 sm:bottom-36 z-50 w-14 h-14 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl flex items-center justify-center text-white shadow-2xl group transition-all"
      >
        <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <Users className="h-6 w-6 relative z-10" />
        <span className="absolute right-full mr-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none">
          成员管理
        </span>
      </motion.button>

      {/* 极简高级底部导航 (Dock Style) */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-[420px] px-6">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-black/40 backdrop-blur-[40px] saturate-[200%] border border-white/10 px-2 py-2 rounded-[36px] flex items-center justify-between shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
        >
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.id || (item.id !== '/' && location.pathname.startsWith(item.id))

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`relative flex flex-col items-center justify-center gap-1.5 flex-1 py-3 h-16 rounded-[24px] transition-all duration-500 group z-10 ${isActive
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/80'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-bg"
                    className="absolute inset-0 bg-white/10 border border-white/5 rounded-[24px] shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    style={{ zIndex: -1 }}
                  />
                )}
                <Icon className={`h-5 w-5 transition-transform duration-500 ${isActive ? 'scale-110 drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] font-bold tracking-widest uppercase transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden group-hover:opacity-100 group-hover:h-auto mt-0'}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </motion.div>
      </nav>
    </div>
  )
}
