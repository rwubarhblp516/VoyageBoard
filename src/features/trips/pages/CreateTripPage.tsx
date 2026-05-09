import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTripStore } from '@/stores/useTripStore'
import { useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import FadeContent from '@/components/FadeContent'
import LightPillar from '@/components/LightPillar'
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

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TripForm>({
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

      // Also create a member for the owner
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

            <div className="space-y-3">
              <label className="text-xs font-black text-white/90 ml-1 uppercase tracking-[0.2em]">目的地</label>
              <input
                {...register('destination')}
                placeholder="例如：冲绳，日本"
                className="glass-input w-full"
              />
              {errors.destination && <p className="text-accent-coral text-[10px] font-bold ml-1">{errors.destination.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-black text-white/90 ml-1 uppercase tracking-[0.2em]">开始日期</label>
                <input
                  type="date"
                  {...register('start_date')}
                  className="glass-input w-full"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-white/90 ml-1 uppercase tracking-[0.2em]">结束日期</label>
                <input
                  type="date"
                  {...register('end_date')}
                  className="glass-input w-full"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-white/90 ml-1 uppercase tracking-[0.2em]">结算货币</label>
              <select
                {...register('currency')}
                className="glass-input w-full appearance-none cursor-pointer"
              >
                <option value="CNY">CNY - 人民币</option>
                <option value="JPY">JPY - 日元</option>
                <option value="USD">USD - 美元</option>
                <option value="EUR">EUR - 欧元</option>
              </select>
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
