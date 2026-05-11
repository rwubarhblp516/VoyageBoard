import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTripStore } from '@/stores/useTripStore'
import { Trip } from '@/types/trip'
import LightPillar from '@/components/LightPillar'
import FadeContent from '@/components/FadeContent'

export default function TripListPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { trips, setTrips, setCurrentTrip, loading, setLoading } = useTripStore()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    async function fetchTrips() {
      setLoading(true)
      const { data, error } = await supabase
        .from('trips')
        .select('*, trip_members(count), expenses(amount)')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setTrips(data.map((t: any) => ({
          ...t,
          memberCount: t.trip_members[0]?.count || 0,
          totalExpense: (t.expenses || []).reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0)
        })))
      }
      setLoading(false)
    }

    fetchTrips()
  }, [user, setTrips, setLoading])

  const handleSelectTrip = (trip: Trip) => {
    setCurrentTrip(trip)
    navigate('/')
  }

  const handleEditTrip = (e: React.MouseEvent, trip: Trip) => {
    e.stopPropagation()
    navigate(`/trips/edit/${trip.id}`)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="relative min-h-screen bg-bg-base select-none">
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

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 md:py-32">
        <FadeContent blur={true} duration={800}>
          {/* 极致简约 Header */}
          <header className="mb-24 flex flex-col items-center text-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-[2px] bg-white/50 rounded-full shadow-sm" />
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-[0.3em] drop-shadow-sm">EXPLORE</span>
              <div className="w-8 h-[2px] bg-white/50 rounded-full shadow-sm" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-md">
              我的旅程
            </h1>
            <p className="text-white/80 font-medium mt-2 drop-shadow-sm">开启您的下一段精彩冒险。</p>
          </header>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card h-64 rounded-[40px] animate-pulse" />
              ))}
            </div>
          ) : trips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {trips.map((trip: any) => (
                <motion.div
                  key={trip.id}
                  onClick={() => handleSelectTrip(trip)}
                  onMouseEnter={() => setHoveredId(trip.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  whileTap={{ scale: 0.98 }}
                  className="group relative cursor-pointer"
                >
                  <div className={`relative overflow-hidden glass-card rounded-[44px] h-80 transition-all duration-700 border-white/5 shadow-xl ${
                    hoveredId === trip.id ? 'border-white/20 -translate-y-2 shadow-[0_40px_80px_rgba(0,0,0,0.7)]' : ''
                  }`}>
                    {/* Background Image / Gradient */}
                    <div className="absolute inset-0 z-0 bg-[#0A0A0A]">
                      {trip.cover_url ? (
                        <img 
                          src={trip.cover_url} 
                          alt="" 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-60"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
                    </div>

                    {/* Content Overlay */}
                    <div className="relative z-10 h-full p-8 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-2">
                          <div className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/10 w-fit">
                            <span className="text-[9px] font-bold text-white/60 uppercase tracking-[0.2em]">
                              {trip.start_date && trip.end_date ? `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}` : '未设定日期'}
                            </span>
                          </div>
                          <h3 className="text-3xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                            {trip.title}
                          </h3>
                        </div>
                        
                        <button
                          onClick={(e) => handleEditTrip(e, trip)}
                          className="p-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-5">
                        <div className="flex items-end justify-between">
                          <div className="space-y-1.5">
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">
                              {trip.destination}
                            </p>
                            <div className="flex items-center gap-3 text-white/70 font-bold text-[10px] uppercase tracking-widest bg-white/5 w-fit px-2.5 py-1 rounded-lg border border-white/5">
                              <span className="flex items-center gap-1.5">
                                {trip.memberCount} 位成员
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-white/30 text-[9px] font-bold uppercase tracking-[0.2em] mb-1">总支出统计</p>
                            <div className="flex items-baseline gap-1.5 justify-end">
                              <span className="text-2xl font-black text-white tracking-tighter tabular-nums">
                                {((trip.totalExpense || 0) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-[10px] font-bold text-white/30 uppercase">
                                {trip.currency}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-5 border-t border-white/5 flex items-center justify-between group-hover:px-1 transition-all duration-500">
                          <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">进入旅程</span>
                          <ChevronRight className="h-4 w-4 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* 精致卡牌空状态 */
            <div className="flex flex-col items-center justify-center py-32 glass-card rounded-[40px] border-dashed border-white/10">
              <h2 className="text-2xl font-black text-white/60 tracking-tighter">待添加</h2>
            </div>
          )}
        </FadeContent>
      </div>

      {/* 灵动交互悬浮按钮 */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
        <motion.button
          onClick={() => navigate('/trips/new')}
          whileHover={{ 
            scale: 1.1,
            boxShadow: "0 20px 40px rgba(255,255,255,0.15)"
          }}
          whileTap={{ scale: 0.9 }}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20
          }}
          className="w-20 h-20 bg-white text-slate-950 rounded-full flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.5)] group overflow-hidden relative"
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-tr from-white via-slate-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
          <Plus className="h-8 w-8 relative z-10" />
        </motion.button>
      </div>
    </div>
  )
}
