import { Trip } from '@/types/trip'
import TiltedCard from '@/components/TiltedCard'
import { MapPin, Calendar, ArrowUpRight } from 'lucide-react'
import { format } from 'date-fns'

interface TripCardProps {
  trip: Trip
  onClick: () => void
}

export default function TripCard({ trip, onClick }: TripCardProps) {
  return (
    <div onClick={onClick} className="group cursor-pointer">
      <TiltedCard
        imageSrc={trip.cover_image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop'}
        altText={trip.title}
        captionText={trip.destination}
        containerHeight="260px"
        containerWidth="100%"
        imageHeight="260px"
        imageWidth="100%"
        rotateAmplitude={12}
        scaleOnHover={1.05}
        showMobileWarning={false}
        showTooltip={false}
        displayOverlayContent={true}
        overlayContent={
          <div className="absolute inset-0 p-6 flex flex-col justify-end text-white w-full h-full bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent rounded-[15px]">
            <div className="flex items-center justify-between gap-2 mb-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
               <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                <Calendar className="h-3 w-3 text-accent-cyan" />
                {trip.start_date ? format(new Date(trip.start_date), 'MM.dd') : '待定'}
               </div>
               <div className="h-8 w-8 bg-accent-blue rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.4)] transform rotate-45 group-hover:rotate-0 transition-transform duration-500">
                <ArrowUpRight className="h-4 w-4 text-slate-950" />
               </div>
            </div>
            
            <h3 className="text-2xl font-black tracking-tight drop-shadow-md mb-1 line-clamp-1">{trip.title}</h3>
            
            <div className="flex items-center gap-1 text-white/90 text-sm font-bold">
              <MapPin className="h-3 w-3 text-accent-cyan" />
              <span className="truncate">{trip.destination}</span>
            </div>
          </div>
        }
      />
    </div>
  )
}

// 补充类型定义兼容性
declare module '@/types/trip' {
  interface Trip {
    cover_image?: string;
  }
}
