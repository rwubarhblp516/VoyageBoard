import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTripStore } from '@/stores/useTripStore'
import { useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft } from 'lucide-react'
import FadeContent from '@/components/FadeContent'
import { Trip } from '@/types/trip'

const tripSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  destination: z.string().min(2, 'Destination must be at least 2 characters'),
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
    <div className="py-8">
      <button
        onClick={() => navigate('/trips')}
        className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>返回列表</span>
      </button>

      <FadeContent duration={400}>
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold text-text-primary mb-8">开启新旅程</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 glass p-8 rounded-3xl">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">旅程标题</label>
              <input
                {...register('title')}
                placeholder="例如：海南环岛自驾"
                className="glass-input w-full"
              />
              {errors.title && <p className="text-accent-danger text-xs">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">目的地</label>
              <input
                {...register('destination')}
                placeholder="例如：三亚，中国"
                className="glass-input w-full"
              />
              {errors.destination && <p className="text-accent-danger text-xs">{errors.destination.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">开始日期</label>
                <input
                  type="date"
                  {...register('start_date')}
                  className="glass-input w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">结束日期</label>
                <input
                  type="date"
                  {...register('end_date')}
                  className="glass-input w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">默认货币</label>
              <select
                {...register('currency')}
                className="glass-input w-full appearance-none"
              >
                <option value="CNY">CNY - 人民币</option>
                <option value="USD">USD - 美元</option>
                <option value="EUR">EUR - 欧元</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent-primary hover:bg-accent-primary/90 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : '立即创建'}
            </button>
          </form>
        </div>
      </FadeContent>
    </div>
  )
}
