import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Receipt, 
  Settings as SettingsIcon, 
  Users,
} from 'lucide-react'
import { motion } from 'framer-motion'
import LightPillar from '@/components/LightPillar'

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { id: '/', icon: LayoutDashboard, label: '总览' },
    { id: '/expenses', icon: Receipt, label: '支出' },
    { id: '/members', icon: Users, label: '成员' },
    { id: '/settings', icon: SettingsIcon, label: '设置' },
  ]

  return (
    <div className="relative min-h-screen bg-bg-base text-slate-200 font-sans selection:bg-white/10 selection:text-white">
      {/* 还原高保真背景：通透、明亮、动感 */}
      <div className="fixed inset-0 z-0">
        <LightPillar 
          intensity={1.2} 
          rotationSpeed={0.5} 
          pillarRotation={25}
          pillarHeight={0.4}
          pillarWidth={2.2}
          noiseIntensity={0}
        />
      </div>

      {/* 内容区域 */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-40">
        <Outlet />
      </main>

      {/* 极简高级底部导航 (Dock Style) */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass px-4 py-3 rounded-[32px] flex items-center gap-2 border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
        >
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.id || (item.id !== '/' && location.pathname.startsWith(item.id))
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`relative flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-500 group ${
                  isActive 
                    ? 'bg-white text-slate-950 font-black shadow-[0_10px_20px_rgba(255,255,255,0.2)]' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className={`text-xs font-black tracking-widest transition-all duration-500 ${isActive ? 'w-auto opacity-100' : 'w-0 opacity-0 overflow-hidden hidden md:block group-hover:w-auto group-hover:opacity-100'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="nav-dot"
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-slate-950 rounded-full" 
                  />
                )}
              </button>
            )
          })}
        </motion.div>
      </nav>
    </div>
  )
}
