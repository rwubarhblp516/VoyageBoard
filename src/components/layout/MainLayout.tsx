import { Outlet, useNavigate } from 'react-router-dom'
import Dock from '@/components/Dock'
import { 
  LayoutDashboard, 
  Map, 
  Receipt, 
  Calculator, 
  Users, 
  Settings 
} from 'lucide-react'

export default function MainLayout() {
  const navigate = useNavigate()

  const dockItems = [
    {
      label: '总览',
      icon: <LayoutDashboard className="h-full w-full text-accent-primary" />,
      onClick: () => navigate('/'),
    },
    {
      label: '行程',
      icon: <Map className="h-full w-full text-accent-primary" />,
      onClick: () => navigate('/itinerary'),
    },
    {
      label: '账单',
      icon: <Receipt className="h-full w-full text-accent-primary" />,
      onClick: () => navigate('/expenses'),
    },
    {
      label: '结算',
      icon: <Calculator className="h-full w-full text-accent-primary" />,
      onClick: () => navigate('/settlement'),
    },
    {
      label: '成员',
      icon: <Users className="h-full w-full text-accent-primary" />,
      onClick: () => navigate('/members'),
    },
    {
      label: '设置',
      icon: <Settings className="h-full w-full text-accent-primary" />,
      onClick: () => navigate('/settings'),
    },
  ]

  return (
    <div className="relative min-h-screen pb-24 overflow-x-hidden">
      {/* Page Content */}
      <main className="max-w-5xl mx-auto px-4 pt-8">
        <Outlet />
      </main>

      {/* Floating Navigation Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Dock
          items={dockItems}
          panelHeight={68}
          baseItemSize={50}
          magnification={70}
          distance={140}
          className="glass-strong rounded-3xl p-2 px-4"
        />
      </div>
    </div>
  )
}
