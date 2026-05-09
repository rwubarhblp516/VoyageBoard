import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Receipt } from 'lucide-react'

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  // 极简导航：只保留最核心的
  const navItems = [
    { id: '/', icon: LayoutDashboard, label: '总览' },
    { id: '/expenses', icon: Receipt, label: '账单' },
  ]

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden font-sans text-slate-900 pb-32">
      
      {/* 高级感流体背景 - 阳光海岸渐变 */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-cyan-200/40 blur-[120px] bg-mesh-1" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[80%] rounded-full bg-amber-200/30 blur-[140px] bg-mesh-2" />
        <div className="absolute -bottom-[20%] left-[10%] w-[80%] h-[60%] rounded-full bg-sky-300/30 blur-[100px] bg-mesh-3" />
        {/* 微弱的网格纹理增加质感 */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* 内容区域 */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-12">
        <Outlet />
      </main>

      {/* 极简底部浮动导航栏 */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="glass-panel rounded-full p-2 flex items-center gap-2 shadow-[0_20px_40px_-10px_rgba(2,132,199,0.15)]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.id || (item.id !== '/' && location.pathname.startsWith(item.id))
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`relative px-6 py-3 rounded-full flex items-center gap-2 font-bold transition-all duration-300 ${
                  isActive 
                    ? 'text-cyan-600 bg-white/60 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/30'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className={`text-sm ${isActive ? 'block' : 'hidden md:block'}`}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
