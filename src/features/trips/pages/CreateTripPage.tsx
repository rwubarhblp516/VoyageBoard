import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTripStore } from '@/stores/useTripStore'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import FadeContent from '@/components/FadeContent'
import LightPillar from '@/components/LightPillar'
import AppleDatePicker from '@/components/AppleDatePicker'
import AppleSelect from '@/components/AppleSelect'
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
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false)

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
      navigate('/trips')
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

      <div className="relative z-10 max-w-xl mx-auto px-6 py-10 md:py-16 pb-20">
        <button
          onClick={() => navigate('/trips')}
          className="group relative inline-flex items-center gap-3 py-2 px-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-500 mb-6 shadow-lg"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] relative z-10">&lt; 返回</span>
        </button>

        <FadeContent duration={600} blur={true}>
          <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-7 md:p-10 rounded-[40px] space-y-6">
            <div className="space-y-2.5">
              <label className="text-xs font-black text-white/60 uppercase tracking-[0.2em] ml-1">旅程标题</label>
              <input
                {...register('title')}
                placeholder="2026 夏日冲绳之旅"
                className="glass-input w-full placeholder:text-white/10"
              />
              {errors.title && <p className="text-accent-coral text-[10px] font-bold ml-1">{errors.title.message}</p>}
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-black text-white/60 uppercase tracking-[0.2em] ml-1">目的地</label>
              <input
                {...register('destination')}
                placeholder="冲绳，日本"
                className="glass-input w-full placeholder:text-white/10"
              />
              {errors.destination && <p className="text-accent-coral text-[10px] font-bold ml-1">{errors.destination.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Start Date */}
              <div className="space-y-2.5">
                <label className="text-xs font-black text-white/60 uppercase tracking-[0.2em] ml-1">开始日期</label>
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
              <div className="space-y-2.5">
                <label className="text-xs font-black text-white/60 uppercase tracking-[0.2em] ml-1">结束日期</label>
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

            <div className="space-y-2.5">
              <label className="text-xs font-black text-white/60 uppercase tracking-[0.2em] ml-1">结算货币</label>
              <div
                onClick={() => setIsCurrencyOpen(true)}
                className="glass-input w-full flex items-center justify-between cursor-pointer hover:bg-black/30 transition-colors"
              >
                <span className="font-bold">
                  {watch('currency') === 'CNY' && 'CNY - 人民币'}
                  {watch('currency') === 'JPY' && 'JPY - 日元'}
                  {watch('currency') === 'USD' && 'USD - 美元'}
                  {watch('currency') === 'EUR' && 'EUR - 欧元'}
                </span>
                <div className="opacity-20">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
              <AppleSelect
                isOpen={isCurrencyOpen}
                onClose={() => setIsCurrencyOpen(false)}
                title="结算货币"
                value={watch('currency')}
                onChange={(val) => setValue('currency', val)}
                options={[
                  { value: 'CNY', label: 'CNY - 人民币' },
                  { value: 'JPY', label: 'JPY - 日元' },
                  { value: 'USD', label: 'USD - 美元' },
                  { value: 'EUR', label: 'EUR - 欧元' },
                ]}
              />
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileTap={{ scale: 0.98 }}
              className="relative w-full h-16 mt-6 bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 rounded-[24px] flex items-center justify-center transition-all duration-500 overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="tracking-[0.2em] font-black">创建旅程</span>
              )}
            </motion.button>
          </form>
        </FadeContent>
      </div>
    </div>
  )
}
