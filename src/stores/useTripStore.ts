import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Trip } from '@/types/trip'

interface TripState {
  trips: Trip[]
  currentTrip: Trip | null
  loading: boolean
  setTrips: (trips: Trip[]) => void
  setCurrentTrip: (trip: Trip | null) => void
  setLoading: (loading: boolean) => void
}

export const useTripStore = create<TripState>()(
  persist(
    (set) => ({
      trips: [],
      currentTrip: null,
      loading: false,
      setTrips: (trips) => set({ trips }),
      setCurrentTrip: (trip) => set({ currentTrip: trip }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'voyage-trip-storage',
    }
  )
)
