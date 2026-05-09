import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTripStore } from '@/stores/useTripStore'
import { useNavigate } from 'react-router-dom'
import TripCard from '../components/TripCard'
import { Plus, Loader2, Compass, Ship } from 'lucide-react'
import FadeContent from '@/components/FadeContent'
import Waves from '@/components/Waves'
import { Trip } from '@/types/trip'

export default function TripListPage() {
  const { user } = useAuthStore()
  const { setCurrentTrip } = useTripStore()
  const navigate = useNavigate()

  const { data: trips, isLoading } = useQuery({
    queryKey: ['trips', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Trip[]
    },
    enabled: !!user,
  })

  const handleSelectTrip = (trip: Trip) => {
    setCurrentTrip(trip)
    navigate('/')
  }

  return (
    <div className="relative min-h-[calc(100vh-2rem)] py-12 px-4">
      {/* 背景动态海浪 */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <Waves
          lineColor="#0EA5E9"
          backgroundColor="transparent"
          waveSpeedX={0.01}
          waveSpeedY={0.01}
          waveAmpX={30}
          waveAmpY={15}
          xGap={15}
          yGap={40}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 text-accent-primary text-[10px] font-black uppercase tracking-widest">
              <Compass className="h-3 w-3" />
              航线中心
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">我的旅行项目</h1>
            <p className="text-slate-500 font-bold text-lg">开启新旅程，或继续之前的冒险。</p>
          </div>
          
          <button
            onClick={() => navigate('/trips/new')}
            className="btn-primary px-8 flex items-center justify-center gap-3 self-start md:self-end"
          >
            <Plus className="h-5 w-5" />
            <span className="tracking-widest font-black">创建新项目</span>
          </button>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-12 w-12 animate-spin text-accent-primary/40" />
          </div>
        ) : trips && trips.length > 0 ? (
          <FadeContent duration={800} delay={200}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onClick={() => handleSelectTrip(trip)}
                />
              ))}
            </div>
          </FadeContent>
        ) : (
          <FadeContent duration={1000}>
            <div className="text-center py-32 glass-strong rounded-[40px] border-dashed border-2 border-slate-200">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Ship className="h-10 w-10 text-slate-300" />
              </div>
              <p className="text-slate-400 font-black text-lg mb-8 uppercase tracking-widest">目前暂无航行记录</p>
              <button
                onClick={() => navigate('/trips/new')}
                className="text-accent-primary font-black hover:underline underline-offset-8 decoration-4"
              >
                创建您的首条航线 →
              </button>
            </div>
          </FadeContent>
        )}
      </div>
    </div>
  )
}
