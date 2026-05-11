import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTripStore } from '@/stores/useTripStore'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
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
  cover_url: z.string().optional().nullable(),
})

type TripForm = z.infer<typeof tripSchema>

interface CreateTripPageProps {
  isEditing?: boolean
}

export default function CreateTripPage({ isEditing = false }: CreateTripPageProps) {
  const { user } = useAuthStore()
  const { setCurrentTrip } = useTripStore()
  const navigate = useNavigate()
  const { tripId } = useParams()

  const [isStartDateOpen, setIsStartDateOpen] = useState(false)
  const [isEndDateOpen, setIsEndDateOpen] = useState(false)
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false)
  const [isLoadingTrip, setIsLoadingTrip] = useState(isEditing)

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue, reset } = useForm<TripForm>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      title: '',
      destination: '',
      currency: 'CNY',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      cover_url: '',
    }
  })

  useEffect(() => {
    if (isEditing && tripId) {
      async function fetchTrip() {
        if (!tripId) return
        const { data, error } = await supabase
          .from('trips')
          .select('*')
          .eq('id', tripId)
          .single()

        if (data && !error) {
          reset({
            title: data.title,
            destination: data.destination,
            currency: data.currency || 'CNY',
            start_date: data.start_date,
            end_date: data.end_date,
            cover_url: (data as any).cover_url || '',
          })
        }
        setIsLoadingTrip(false)
      }
      fetchTrip()
    }
  }, [isEditing, tripId, reset])

  const onSubmit = async (data: TripForm) => {
    if (!user) return

    try {
      if (isEditing && tripId) {
        const { error } = await supabase
          .from('trips')
          .update({
            ...data,
          } as any)
          .eq('id', tripId)

        if (error) throw error
        navigate('/trips')
      } else {
        const { data: trip, error } = await supabase
          .from('trips')
          .insert({
            ...data,
            owner_id: user.id,
          } as any)
          .select()
          .single()

        if (error) throw error

        const newTrip = trip as Trip

        // Save local cover if selected
        if ((window as any)._temp_local_cover) {
          localStorage.setItem(`voyage_local_cover_${newTrip.id}`, (window as any)._temp_local_cover)
          delete (window as any)._temp_local_cover
        }

        await supabase.from('trip_members').insert({
          trip_id: newTrip.id,
          user_id: user.id,
          display_name: user.email?.split('@')[0] || 'Owner',
          role: 'owner',
        })

        setCurrentTrip(newTrip)
        navigate('/trips')
      }
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

  if (isLoadingTrip) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-white/20" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-bg-base select-none">
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#1a2c2f] to-[#15252b]">
        <LightPillar
          topColor="#7ee3f2ff"
          bottomColor="#73d5f3"
          intensity={0.9}
          rotationSpeed={0.5}
          pillarRotation={25}
          pillarHeight={0.4}
          pillarWidth={3.5}
          noiseIntensity={0}
        />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-6 py-10 md:py-16 pb-20">
        <button
          onClick={() => navigate('/trips')}
          className="group relative inline-flex items-center justify-center w-12 h-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-500 mb-8 shadow-xl active:scale-90"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
        </button>

        <header className="mb-12 flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-[2px] bg-white/30 rounded-full" />
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.3em]">{isEditing ? 'EDIT' : 'ADVENTURE'}</span>
            <div className="w-8 h-[2px] bg-white/30 rounded-full" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md mb-2">
            {isEditing ? '修改旅程' : '开启新旅程'}
          </h1>
          <p className="text-white/60 font-medium">
            {isEditing ? '重新定义您的探索方案。' : '规划您的下一段精彩冒险。'}
          </p>
        </header>

        <FadeContent duration={600} blur={true}>
          <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-7 md:p-10 rounded-[32px] space-y-7">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-white/90 uppercase tracking-[0.3em] ml-1">旅程标题</label>
              <input
                {...register('title')}
                placeholder="2026 夏日冲绳之旅"
                className="glass-input w-full placeholder:text-white/30"
              />
              {errors.title && <p className="text-red-400 text-[10px] font-bold ml-1">{errors.title.message}</p>}
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-white/90 uppercase tracking-[0.3em] ml-1">目的地</label>
              <input
                {...register('destination')}
                placeholder="冲绳，日本"
                className="glass-input w-full placeholder:text-white/30"
              />
              {errors.destination && <p className="text-red-400 text-[10px] font-bold ml-1">{errors.destination.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              {/* Start Date */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-white/90 uppercase tracking-[0.3em] ml-1">开始日期</label>
                <div
                  onClick={() => setIsStartDateOpen(true)}
                  className="glass-input w-full flex items-center justify-start cursor-pointer hover:bg-white/5 transition-colors"
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
              <div className="space-y-3">
                <label className="text-[11px] font-black text-white/90 uppercase tracking-[0.3em] ml-1">结束日期</label>
                <div
                  onClick={() => setIsEndDateOpen(true)}
                  className="glass-input w-full flex items-center justify-start cursor-pointer hover:bg-white/5 transition-colors"
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

            <div className="space-y-3">
              <label className="text-[11px] font-black text-white/90 uppercase tracking-[0.3em] ml-1">结算货币</label>
              <div
                onClick={() => setIsCurrencyOpen(true)}
                className="glass-input w-full flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
              >
                <span className="font-bold text-white">
                  {watch('currency') === 'CNY' && 'CNY - 人民币'}
                  {watch('currency') === 'JPY' && 'JPY - 日元'}
                  {watch('currency') === 'USD' && 'USD - 美元'}
                  {watch('currency') === 'EUR' && 'EUR - 欧元'}
                </span>
                <div className="opacity-40">
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 20 20">
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

            <div className="space-y-3">
              <label className="text-[11px] font-black text-white/90 uppercase tracking-[0.3em] ml-1">背景图片</label>
              <div className="flex gap-3">
                <input
                  {...register('cover_url')}
                  placeholder="https://images.unsplash.com/..."
                  className="glass-input flex-1 placeholder:text-white/30"
                />
                <label className="cursor-pointer group relative overflow-hidden h-[54px] px-6 bg-white/10 backdrop-blur-xl border border-white/10 rounded-[18px] flex items-center justify-center transition-all hover:bg-white/20 active:scale-95 shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        // Check file size (limit to 2MB for localStorage)
                        if (file.size > 2 * 1024 * 1024) {
                          alert('图片过大，请选择 2MB 以下的图片以保证本地存储性能')
                          return
                        }
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          const base64String = reader.result as string
                          // If we are editing, save immediately. If new, we'll save in onSubmit.
                          if (isEditing && tripId) {
                            localStorage.setItem(`voyage_local_cover_${tripId}`, base64String)
                            alert('本地封面已保存')
                          } else {
                            // Temporary store for new trip
                            (window as any)._temp_local_cover = base64String
                            alert('本地封面已选择，创建后将生效')
                          }
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] font-bold text-white/70 group-hover:text-white uppercase tracking-widest">本地上传</span>
                  </div>
                </label>
              </div>
              <p className="text-[10px] text-white/60 font-medium ml-1">支持远程 URL 或本地图片（仅自己设备可见）。</p>
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileTap={{ scale: 0.98 }}
              className="relative w-full h-16 mt-6 bg-white text-[#15252b] hover:bg-white/90 backdrop-blur-xl border border-white/20 rounded-[24px] flex items-center justify-center transition-all duration-500 overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="tracking-[0.2em] font-black uppercase text-sm">{isEditing ? '保存修改' : '创建旅程'}</span>
              )}
            </motion.button>
          </form>
        </FadeContent>
      </div>
    </div>
  )
}
