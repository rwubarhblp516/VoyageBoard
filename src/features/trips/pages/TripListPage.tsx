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
          totalExpense: t.expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0)
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
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#1a2c2f] to-[#15252b]">
        <LightPillar
          topColor="#7ee3f2ff"
          bottomColor="#73d5f3"
          intensity={0.9}
          rotationSpeed={0.5}
          pillarRotation={25}
          pillarHeight={0.4}
          pillarWidth={3.5}
          noiseIntensity={0}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 md:py-32">
        <FadeContent blur={true} duration={800}>
          {/* 极致简约 Header */}
          <header className="mb-20 flex flex-col items-center text-center">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-[2px] bg-white/30 rounded-full" />
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.4em]">EXPLORE</span>
              <div className="w-8 h-[2px] bg-white/30 rounded-full" />
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-md mb-2">
              我的旅程
            </h1>
            <p className="text-white/60 font-medium">开启您的下一段精彩冒险。</p>
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
                  <div className={`relative overflow-hidden glass-card rounded-[32px] min-h-[280px] transition-all duration-500 border-white/10 shadow-2xl ${hoveredId === trip.id ? 'border-white/30 -translate-y-2 shadow-[0_30px_60px_rgba(0,0,0,0.3)] bg-white/[0.08]' : ''
                    }`}>
                    {/* Background Layer */}
                    <div className="absolute inset-0 z-0">
                      {(() => {
                        const effectiveCover = localStorage.getItem(`voyage_local_cover_${trip.id}`) || trip.cover_url;
                        if (!effectiveCover) return null;
                        return (
                          <>
                            <img
                              src={effectiveCover}
                              alt=""
                              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                          </>
                        );
                      })()}
                    </div>

                    {/* Content Overlay */}
                    <div className="relative z-10 h-full p-8 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-3">
                          <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 w-fit">
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                              {trip.start_date && trip.end_date ? `${formatDate(trip.start_date)} - ${formatDate(trip.end_date)}` : '未设定日期'}
                            </span>
                          </div>
                          <h3 className="text-3xl font-black text-white tracking-tight leading-tight">
                            {trip.title}
                          </h3>
                        </div>

                        <button
                          onClick={(e) => handleEditTrip(e, trip)}
                          className="p-3 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl text-white/60 hover:text-white hover:bg-white/20 transition-all shadow-lg active:scale-90"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-end justify-between">
                          <div className="space-y-2">
                            <p className="text-white text-sm font-bold tracking-wide">
                              {trip.destination || '未设定目的地'}
                            </p>
                            <div className="flex items-center gap-1.5 text-white/80 font-bold text-xs">
                              <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              {trip.memberCount} 位成员
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">总支出</p>
                            <div className="flex items-baseline gap-1.5 justify-end">
                              <span className="text-2xl font-black text-white tabular-nums">
                                {(trip.totalExpense / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-[10px] font-bold text-white/60 uppercase">
                                {trip.currency}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-5 border-t border-white/20 flex items-center justify-between group-hover:translate-x-1 transition-all duration-300">
                          <span className="text-[11px] font-black text-white uppercase tracking-[0.3em] opacity-90">进入旅程</span>
                          <ChevronRight className="h-4 w-4 text-white opacity-90" />
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
