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
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setTrips(data)
      }
      setLoading(false)
    }

    fetchTrips()
  }, [user, setTrips, setLoading])

  const handleSelectTrip = (trip: Trip) => {
    setCurrentTrip(trip)
    navigate('/')
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
          <header className="mb-24">
            <h1 className="text-5xl font-black text-white tracking-tighter">
              我的旅程
            </h1>
          </header>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card h-48 rounded-[32px] animate-pulse" />
              ))}
            </div>
          ) : trips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <motion.div
                  key={trip.id}
                  onClick={() => handleSelectTrip(trip)}
                  onMouseEnter={() => setHoveredId(trip.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  whileTap={{ scale: 0.98 }}
                  className="group relative cursor-pointer"
                >
                  <div className={`glass-card p-8 rounded-[40px] h-full transition-all duration-500 border-white/5 ${
                    hoveredId === trip.id ? 'border-white/10 bg-white/5 -translate-y-2 shadow-[0_30px_60px_rgba(0,0,0,0.6)]' : ''
                  }`}>
                    <div className="flex justify-between items-start mb-10">
                      <span className="text-[10px] font-black text-text-sub uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        {trip.currency}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight group-hover:text-white transition-colors">
                      {trip.title}
                    </h3>
                    <p className="text-text-sub font-medium text-sm">
                      {trip.destination}
                    </p>
                    
                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <span className="text-[10px] font-black text-text-sub uppercase tracking-[0.2em]">Open</span>
                      <ChevronRight className="h-4 w-4 text-white/20" />
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
