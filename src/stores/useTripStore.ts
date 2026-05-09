import { create } from 'zustand'
import { Trip } from '@/types/trip'

interface TripState {
  currentTrip: Trip | null
  setCurrentTrip: (trip: Trip | null) => void
}

export const useTripStore = create<TripState>((set) => ({
  currentTrip: null,
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
}))
