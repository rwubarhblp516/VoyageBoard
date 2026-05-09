import { create } from 'zustand'
import { Trip } from '@/types/trip'

interface TripState {
  trips: Trip[]
  currentTrip: Trip | null
  loading: boolean
  setTrips: (trips: Trip[]) => void
  setCurrentTrip: (trip: Trip | null) => void
  setLoading: (loading: boolean) => void
}

export const useTripStore = create<TripState>((set) => ({
  trips: [],
  currentTrip: null,
  loading: false,
  setTrips: (trips) => set({ trips }),
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setLoading: (loading) => set({ loading }),
}))
