import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTripStore } from '@/stores/useTripStore'
import { useNavigate } from 'react-router-dom'
import TripCard from '../components/TripCard'
import { Plus, Loader2 } from 'lucide-react'
import FadeContent from '@/components/FadeContent'
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

  const handleSelectTrip = (trip: any) => {
    setCurrentTrip(trip)
    navigate('/')
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">我的旅行</h1>
          <p className="text-text-secondary mt-1">开启一段新旅程，或继续之前的冒险。</p>
        </div>
        <button
          onClick={() => navigate('/trips/new')}
          className="bg-accent-primary hover:bg-accent-primary/90 text-white p-3 rounded-full shadow-lg transition-all"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent-primary" />
        </div>
      ) : trips && trips.length > 0 ? (
        <FadeContent duration={600}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="text-center py-20 glass rounded-3xl">
          <p className="text-text-muted mb-4">暂无旅行记录</p>
          <button
            onClick={() => navigate('/trips/new')}
            className="text-accent-primary font-bold hover:underline"
          >
            创建您的第一个旅行
          </button>
        </div>
      )}
    </div>
  )
}
