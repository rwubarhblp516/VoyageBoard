import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTripStore } from '@/stores/useTripStore'
import { useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import FadeContent from '@/components/FadeContent'
import LightPillar from '@/components/LightPillar'
import AppleDatePicker from '@/components/AppleDatePicker'
import { Trip } from '@/types/trip'

const tripSchema = z.object({
  title: z.string().min(2, '标题至少需要 2 个字符'),
  destination: z.string().min(2, '目的地至少需要 2 个字符'),
  start_date: z.string(),
  end_date: z.string(),
  currency: z.string(),
})

type TripForm = z.infer<typeof tripSchema>

export default function CreateTripPage() {
  const { user } = useAuthStore()
  const { setCurrentTrip } = useTripStore()
  const navigate = useNavigate()

  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<TripForm>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      title: '',
      destination: '',
      currency: 'CNY',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
    }
  })

  const onSubmit = async (data: TripForm) => {
    if (!user) return

    try {
      const { data: trip, error } = await supabase
        .from('trips')
        .insert({
          ...data,
          owner_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      const newTrip = trip as Trip

      await supabase.from('trip_members').insert({
        trip_id: newTrip.id,
        user_id: user.id,
        display_name: user.email?.split('@')[0] || 'Owner',
        role: 'owner',
      })

      setCurrentTrip(newTrip)
      navigate('/')
    } catch (error: any) {
      alert(error.message)
    }
  }

  const startDate = watch('start_date')
  const endDate = watch('end_date')

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '-- / -- / --'
    return dateStr.replace(/-/g, ' / ')
  }

  return (
    <div className="relative min-h-screen bg-bg-base select-none">
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

      <div className="relative z-10 max-w-xl mx-auto px-6 py-16 md:py-24">
        <button
          onClick={() => navigate('/trips')}
          className="group inline-flex items-center gap-2 text-white/80 hover:text-white transition-all mb-12 font-black text-xs uppercase tracking-[0.2em]"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          返回列表
        </button>

        <FadeContent duration={600} blur={true}>

          <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-8 md:p-10 rounded-[40px] space-y-8">
            <div className="space-y-4">
              <label className="text-xs font-black text-white/90 ml-1 uppercase tracking-[0.2em]">项目标题</label>
              <input
                {...register('title')}
                placeholder="例如：2026 夏日冲绳之旅"
                className="glass-input w-full"
              />
              {errors.title && <p className="text-accent-coral text-[10px] font-bold ml-1">{errors.title.message}</p>}
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-white/90 ml-1 uppercase tracking-[0.2em]">目的地</label>
              <input
                {...register('destination')}
                placeholder="例如：冲绳，日本"
                className="glass-input w-full"
              />
              {errors.destination && <p className="text-accent-coral text-[10px] font-bold ml-1">{errors.destination.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date */}
              <div className="space-y-4">
                <label className="text-xs font-black text-white/90 ml-1 uppercase tracking-[0.2em]">开始日期</label>
                <div
                  onClick={() => setIsStartDateOpen(true)}
                  className="glass-input w-full flex items-center justify-start cursor-pointer hover:bg-black/30 transition-colors"
                >
                  {formatDisplayDate(startDate)}
                </div>
                <AppleDatePicker
                  isOpen={isStartDateOpen}
                  onClose={() => setIsStartDateOpen(false)}
                  value={startDate}
                  onChange={(date) => setValue('start_date', date)}
                />
              </div>

              {/* End Date */}
              <div className="space-y-4">
                <label className="text-xs font-black text-white/90 ml-1 uppercase tracking-[0.2em]">结束日期</label>
                <div
                  onClick={() => setIsEndDateOpen(true)}
                  className="glass-input w-full flex items-center justify-start cursor-pointer hover:bg-black/30 transition-colors"
                >
                  {formatDisplayDate(endDate)}
                </div>
                <AppleDatePicker
                  isOpen={isEndDateOpen}
                  onClose={() => setIsEndDateOpen(false)}
                  value={endDate}
                  onChange={(date) => setValue('end_date', date)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-white/90 ml-1 uppercase tracking-[0.2em]">结算货币</label>
              <div className="relative">
                <select
                  {...register('currency')}
                  className="glass-input w-full appearance-none cursor-pointer"
                >
                  <option value="CNY">CNY - 人民币</option>
                  <option value="JPY">JPY - 日元</option>
                  <option value="USD">USD - 美元</option>
                  <option value="EUR">EUR - 欧元</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full h-16 mt-4 shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="tracking-[0.2em] font-black">创建项目</span>
              )}
            </motion.button>
          </form>
        </FadeContent>
      </div>
    </div>
  )
}
