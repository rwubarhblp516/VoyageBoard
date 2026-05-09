import { Trip } from '@/types/trip'
import SpotlightCard from '@/components/SpotlightCard'
import { MapPin, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface TripCardProps {
  trip: Trip
  onClick: () => void
}

export default function TripCard({ trip, onClick }: TripCardProps) {
  return (
    <div onClick={onClick}>
      <SpotlightCard
        className="glass p-6 rounded-3xl cursor-pointer hover:border-accent-primary/50 transition-all border-none"
        spotlightColor="rgba(14, 165, 233, 0.1)"
      >
      <div className="flex flex-col h-full">
        <h3 className="text-xl font-bold text-text-primary mb-2">{trip.title}</h3>
        
        <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
          <MapPin className="h-4 w-4 text-accent-primary" />
          <span>{trip.destination}</span>
        </div>
        
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Calendar className="h-4 w-4 text-accent-primary" />
          <span>
            {format(new Date(trip.start_date), 'MMM d日')} - {format(new Date(trip.end_date), 'MMM d日, yyyy年')}
          </span>
        </div>

        <div className="mt-6 flex justify-end">
          <span className="text-xs font-mono text-accent-primary bg-accent-primary/10 px-2 py-1 rounded-full font-bold">
            {trip.currency}
          </span>
        </div>
      </div>
    </SpotlightCard>
    </div>
  )
}
