import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTripStore } from '@/stores/useTripStore'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, X, ChevronDown, Check, ImagePlus, Star, Newspaper, Trash2, CalendarDays } from 'lucide-react'
import { useState } from 'react'
import { TripMember } from '@/types/trip'
import AppleSelect from '@/components/AppleSelect'

const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Amount must be positive'),
  category: z.string(),
  payer_member_id: z.string().min(1, 'Please select a payer'),
  expense_date: z.string(),
  participant_ids: z.array(z.string()).min(1, 'At least one participant required'),
  split_type: z.enum(['equal', 'individual']),
})

type ExpenseForm = z.infer<typeof expenseSchema>

type TimelineEntryType = 'place' | 'meal' | 'hotel' | 'activity' | 'note'

type TripDay = {
  id: string
  trip_id: string
  day_index: number
  date: string
}

const knownCategories = ['food','hotel','transport','flight','train','car_rental','ticket','shopping','entertainment','grocery','other']

const timelineTypeOptions: Array<{ label: string; value: TimelineEntryType }> = [
  { label: '地点', value: 'place' },
  { label: '餐饮', value: 'meal' },
  { label: '住宿', value: 'hotel' },
  { label: '活动', value: 'activity' },
  { label: '笔记', value: 'note' },
]

const mapCategoryToTimelineType = (category: string): TimelineEntryType => {
  if (category === 'food') return 'meal'
  if (category === 'hotel') return 'hotel'
  if (category === 'ticket' || category === 'entertainment') return 'activity'
  if (category === 'shopping' || category === 'grocery') return 'place'
  return 'note'
}

const calculateDayIndex = (tripStartDate: string, dateText: string) => {
  const start = new Date(`${tripStartDate}T00:00:00`)
  const date = new Date(`${dateText}T00:00:00`)
  const diff = Math.round((date.getTime() - start.getTime()) / 86400000)
  return Math.max(1, diff + 1)
}

const getLocalDateText = (offsetDays = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getCategoryLabel = (category: string, customCategoryText: string) => {
  const labels: Record<string, string> = {
    food: '餐饮',
    hotel: '住宿',
    transport: '交通',
    flight: '机票',
    train: '火车/高铁',
    car_rental: '打车/租车',
    ticket: '门票',
    shopping: '购物',
    entertainment: '娱乐',
    grocery: '杂货/超市',
    other: customCategoryText.trim() || '其他',
  }
  return labels[category] || category
}

const imageCompressionMaxSide = 1280
const imageCompressionQuality = 0.75

const compressImageToWebp = async (file: File) => {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, imageCompressionMaxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('当前浏览器不支持图片压缩')
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', imageCompressionQuality)
  })
  if (!blob) throw new Error('图片压缩失败')

  return { blob, width, height }
}

const uploadTimelineImagesInBackground = (
  timelineEntryId: string,
  dayId: string,
  files: File[],
  tripId: string,
  memberId: string,
) => {
  files.forEach((file, index) => {
    compressImageToWebp(file)
      .then(async ({ blob, width, height }) => {
        const storagePath = `${tripId}/${timelineEntryId}/${crypto.randomUUID()}.webp`
        const { error: uploadError } = await supabase.storage
          .from('trip-images')
          .upload(storagePath, blob, {
            contentType: 'image/webp',
            cacheControl: '31536000',
            upsert: false,
          })
        if (uploadError) throw uploadError

        const { error: imageError } = await supabase
          .from('timeline_entry_images')
          .insert({
            trip_id: tripId,
            day_id: dayId,
            timeline_entry_id: timelineEntryId,
            storage_path: storagePath,
            original_name: file.name,
            mime_type: 'image/webp',
            width,
            height,
            size_bytes: blob.size,
            sort_order: index + 1,
            created_by_member_id: memberId,
          })
        if (imageError) throw imageError
      })
      .catch((error: any) => {
        alert(error.message || '图片后台上传失败，请稍后重新编辑记录上传。')
      })
  })
}

interface AddExpenseFormProps {
  onClose: () => void
  onSuccess: () => void
  editingExpense?: any
  expenseDraft?: {
    title?: string
    category?: string
    expense_date?: string
    timeline_entry_id?: string
    timeline_entry_title?: string
  } | null
}

export default function AddExpenseForm({ onClose, onSuccess, editingExpense, expenseDraft }: AddExpenseFormProps) {
  const { user } = useAuthStore()
  const { currentTrip } = useTripStore()
  const queryClient = useQueryClient()

  const { data: members } = useQuery<TripMember[]>({
    queryKey: ['members', currentTrip?.id],
    queryFn: async () => {
      if (!currentTrip) return []
      const { data, error } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', currentTrip.id)
      if (error) throw error
      return data as TripMember[]
    },
    enabled: !!currentTrip,
  })

  const currentMemberId = members?.find(m => m.user_id === user?.id)?.id || ''

  const { data: tripDays } = useQuery<TripDay[]>({
    queryKey: ['tripDays', currentTrip?.id],
    queryFn: async () => {
      if (!currentTrip) return []
      const { data, error } = await supabase
        .from('trip_days')
        .select('id, trip_id, day_index, date')
        .eq('trip_id', currentTrip.id)
        .order('day_index', { ascending: true })
      if (error) throw error
      return data as TripDay[]
    },
    enabled: !!currentTrip,
  })

  const { register, handleSubmit, watch, setValue, formState: { isSubmitting, errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    values: {
      title: editingExpense?.title || expenseDraft?.title || '',
      amount: editingExpense ? (Number(editingExpense.amount) / 100).toString() : '',
      category: editingExpense?.category
        ? (knownCategories.includes(editingExpense.category) ? editingExpense.category : 'other')
        : (expenseDraft?.category && knownCategories.includes(expenseDraft.category) ? expenseDraft.category : 'other'),
      payer_member_id: editingExpense?.payer_member_id || currentMemberId,
      expense_date: editingExpense?.expense_date || expenseDraft?.expense_date || getLocalDateText(),
      participant_ids: editingExpense?.participants?.map((p: any) => p.member_id) || members?.map(m => m.id) || [],
      split_type: editingExpense?.participants?.length === 1 && editingExpense.participants[0].member_id === editingExpense.payer_member_id ? 'individual' : 'equal',
    }
  })

  const selectedParticipants = watch('participant_ids') || []
  const splitType = watch('split_type')
  const payerId = watch('payer_member_id')
  const categoryId = watch('category')
  const expenseDate = watch('expense_date')

  const [categoryOpen, setCategoryOpen] = useState(false)
  const [payerOpen, setPayerOpen] = useState(false)
  const linkedTimelineEntryId = expenseDraft?.timeline_entry_id || null
  const [syncTimeline, setSyncTimeline] = useState(Boolean(editingExpense?.timeline_entry_id || linkedTimelineEntryId))
  const [timelineType, setTimelineType] = useState<TimelineEntryType>(() => mapCategoryToTimelineType(editingExpense?.category || expenseDraft?.category || 'other'))
  const [timelineContent, setTimelineContent] = useState('')
  const [timelineRating, setTimelineRating] = useState('')
  const [includeInGuide, setIncludeInGuide] = useState(true)
  const [timelineImages, setTimelineImages] = useState<File[]>([])
  const [customCategoryText, setCustomCategoryText] = useState(() => {
    if (editingExpense && !knownCategories.includes(editingExpense.category)) {
      return editingExpense.category
    }
    return ''
  })

  // Handle Split Type changes
  const handleSplitTypeChange = (type: 'equal' | 'individual') => {
    setValue('split_type', type)
    if (type === 'individual') {
      const individualPayerId = payerId || currentMemberId
      if (individualPayerId) {
        setValue('payer_member_id', individualPayerId)
        setValue('participant_ids', [individualPayerId])
      } else {
        setValue('participant_ids', [])
      }
    } else if (type === 'equal') {
      setValue('participant_ids', members?.map(m => m.id) || [])
    }
  }

  const handlePayerChange = (memberId: string) => {
    setValue('payer_member_id', memberId)
    if (splitType === 'individual') {
      setValue('participant_ids', [memberId])
    }
  }

  const handleSelectTimelineImages = (files: FileList | null) => {
    if (!files) return
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
    setTimelineImages((current) => [...current, ...imageFiles].slice(0, 8))
  }

  const getOrCreateTripDay = async (expenseDate: string) => {
    if (!currentTrip) throw new Error('当前旅程不存在')
    const existing = tripDays?.find((day) => day.date === expenseDate)
    if (existing) return existing

    const dayIndex = calculateDayIndex(currentTrip.start_date, expenseDate)
    const { data, error } = await supabase
      .from('trip_days')
      .upsert({
        trip_id: currentTrip.id,
        day_index: dayIndex,
        date: expenseDate,
      }, { onConflict: 'trip_id,day_index' })
      .select('id, trip_id, day_index, date')
      .single()

    if (error) throw error
    queryClient.invalidateQueries({ queryKey: ['tripDays', currentTrip.id] })
    return data as TripDay
  }

  const upsertLinkedTimelineEntry = async (values: ExpenseForm, amountInCents: number) => {
    if (!currentTrip || !currentMemberId || !syncTimeline) return editingExpense?.timeline_entry_id || null
    if (!editingExpense && linkedTimelineEntryId) return linkedTimelineEntryId

    const day = await getOrCreateTripDay(values.expense_date)
    const payerName = members?.find((member) => member.id === values.payer_member_id)?.display_name || '未知成员'
    const categoryLabel = getCategoryLabel(values.category, customCategoryText)
    const amountText = `${(amountInCents / 100).toFixed(2)} ${currentTrip.currency || ''}`.trim()
    const contentParts = [
      `账单：${amountText}`,
      `付款人：${payerName}`,
      `分类：${categoryLabel}`,
      timelineContent.trim(),
    ].filter(Boolean)
    const entryPayload = {
      trip_id: currentTrip.id,
      day_id: day.id,
      type: timelineType,
      title: values.title,
      content: contentParts.join('\n'),
      start_time: null,
      end_time: null,
      duration_minutes: null,
      place_name: ['meal', 'hotel', 'place', 'activity'].includes(timelineType) ? values.title : null,
      address: null,
      recommend_level: 'normal',
      rating: timelineRating ? Number(timelineRating) : null,
      tags: ['消费', categoryLabel].filter(Boolean),
      sort_order: (await getNextTimelineSortOrder(day.id)),
      created_by_member_id: currentMemberId,
      include_in_guide: includeInGuide,
      updated_at: new Date().toISOString(),
    }

    let timelineEntryId = editingExpense?.timeline_entry_id || null
    if (timelineEntryId) {
      const { error } = await supabase
        .from('timeline_entries')
        .update(entryPayload)
        .eq('id', timelineEntryId)
      if (error) throw error
    } else {
      const { data, error } = await supabase
        .from('timeline_entries')
        .insert(entryPayload)
        .select('id')
        .single()
      if (error) throw error
      timelineEntryId = data.id
    }

    if (timelineEntryId && timelineImages.length > 0) {
      uploadTimelineImagesInBackground(timelineEntryId, day.id, timelineImages, currentTrip.id, currentMemberId)
    }

    queryClient.invalidateQueries({ queryKey: ['timelineEntries', currentTrip.id, day.id] })
    return timelineEntryId
  }

  const getNextTimelineSortOrder = async (dayId: string) => {
    if (!currentTrip) return 1
    const { data, error } = await supabase
      .from('timeline_entries')
      .select('sort_order')
      .eq('trip_id', currentTrip.id)
      .eq('day_id', dayId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return Number(data?.sort_order || 0) + 1
  }

  const onSubmit = async (values: ExpenseForm) => {
    if (!currentTrip || !user) return

    try {
      const amountInCents = Math.round(Number(values.amount) * 100)
      
      let expenseId = editingExpense?.id

      if (editingExpense) {
        const timelineEntryId = await upsertLinkedTimelineEntry(values, amountInCents)
        // Update Expense
        const { error: expError } = await supabase
          .from('expenses')
          .update({
            title: values.title,
            amount: amountInCents,
            category: values.category === 'other' && customCategoryText.trim() ? customCategoryText.trim() : values.category,
            payer_member_id: values.payer_member_id,
            expense_date: values.expense_date,
            timeline_entry_id: syncTimeline ? timelineEntryId : null,
          })
          .eq('id', editingExpense.id)

        if (expError) throw expError

        // Delete old participants
        await supabase.from('expense_participants').delete().eq('expense_id', expenseId)
      } else {
        const createdExpenseId = crypto.randomUUID()
        expenseId = createdExpenseId
        const timelineEntryId = await upsertLinkedTimelineEntry(values, amountInCents)
        // Create Expense
        const { data: expense, error: expError } = await supabase
          .from('expenses')
          .insert({
            id: createdExpenseId,
            trip_id: currentTrip.id,
            title: values.title,
            amount: amountInCents,
            category: values.category === 'other' && customCategoryText.trim() ? customCategoryText.trim() : values.category,
            payer_member_id: values.payer_member_id,
            expense_date: values.expense_date,
            timeline_entry_id: syncTimeline ? timelineEntryId : null,
            created_by: user.id,
          })
          .select()
          .single()

        if (expError) throw expError
        expenseId = expense.id
      }

      // 2. Create Participants
      const shareAmount = Math.floor(amountInCents / values.participant_ids.length)
      const remainder = amountInCents % values.participant_ids.length

      const participants = values.participant_ids.map((memberId, index) => ({
        expense_id: expenseId,
        member_id: memberId,
        share_type: 'equal',
        calculated_amount: shareAmount + (index === 0 ? remainder : 0)
      }))

      const { error: partError } = await supabase
        .from('expense_participants')
        .insert(participants)

      if (partError) throw partError

      onSuccess()
      onClose()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const categories: { label: string, value: string }[] = [
    { label: '餐饮', value: 'food' },
    { label: '住宿', value: 'hotel' },
    { label: '交通', value: 'transport' },
    { label: '机票', value: 'flight' },
    { label: '火车/高铁', value: 'train' },
    { label: '打车/租车', value: 'car_rental' },
    { label: '门票', value: 'ticket' },
    { label: '购物', value: 'shopping' },
    { label: '娱乐', value: 'entertainment' },
    { label: '杂货/超市', value: 'grocery' },
    { label: '其他', value: 'other' },
  ]

  const payerOptions = members?.map(m => ({ label: m.display_name, value: m.id })) || []

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg glass-strong rounded-[40px] p-6 sm:p-8 shadow-[0_32px_80px_-12px_rgba(0,0,0,1)] animate-in slide-in-from-bottom-8 duration-500 border border-white/10 max-h-[85vh] overflow-y-auto no-scrollbar pb-24 sm:pb-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-text-sub uppercase tracking-[0.3em]">{editingExpense ? '修改支出' : '新增支出'}</span>
            <h2 className="text-3xl font-black text-white tracking-tight">{editingExpense ? '编辑账单' : '记录支出'}</h2>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/5">
            <X className="h-5 w-5 text-white/70" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section className="rounded-[28px] border border-amber-300/15 bg-amber-300/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-[10px] font-bold text-amber-50/80 uppercase tracking-widest">
                <CalendarDays className="h-4 w-4" />
                消费日期
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setValue('expense_date', getLocalDateText(-1))}
                  className={`rounded-xl px-3 py-1.5 text-[11px] font-black transition-colors ${
                    expenseDate === getLocalDateText(-1)
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/70 hover:bg-white/15'
                  }`}
                >
                  昨天
                </button>
                <button
                  type="button"
                  onClick={() => setValue('expense_date', getLocalDateText())}
                  className={`rounded-xl px-3 py-1.5 text-[11px] font-black transition-colors ${
                    expenseDate === getLocalDateText()
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/70 hover:bg-white/15'
                  }`}
                >
                  今天
                </button>
              </div>
            </div>
            <input
              {...register('expense_date')}
              type="date"
              className="mt-3 w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:ring-1 focus:ring-white/30 transition-all text-base font-black shadow-inner [color-scheme:dark]"
            />
            <p className="mt-2 text-xs font-bold text-amber-50/55">补记昨天的消费时，先点“昨天”，统计和行程关联都会归到昨天。</p>
          </section>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest pl-1">金额</label>
              <input
                {...register('amount')}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:ring-1 focus:ring-white/30 transition-all font-mono text-2xl font-bold tracking-tight shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest pl-1">支出项</label>
              <input
                {...register('title')}
                placeholder="如：海鲜大餐"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:ring-1 focus:ring-white/30 transition-all text-base font-medium shadow-inner h-[66px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest pl-1">分类</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCategoryOpen(true)}
                  className="w-full flex items-center justify-between bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl px-4 py-4 text-white transition-all text-base font-medium"
                >
                  <span>{categoryId === 'other' && customCategoryText ? customCategoryText : (categories.find(c => c.value === categoryId)?.label || '选择分类')}</span>
                  <ChevronDown className="w-4 h-4 text-text-sub" />
                </button>
              </div>
              
              {/* Custom Category Input */}
              {categoryId === 'other' && (
                <div className="animate-in fade-in slide-in-from-top-2 mt-2">
                  <input
                    type="text"
                    value={customCategoryText}
                    onChange={(e) => setCustomCategoryText(e.target.value)}
                    placeholder="输入自定义分类名称..."
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-white/30 transition-all text-sm font-medium shadow-inner"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest pl-1">付款人</label>
              <button
                type="button"
                onClick={() => setPayerOpen(true)}
                className="w-full flex items-center justify-between bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl px-4 py-4 text-white transition-all text-base font-medium"
              >
                <span className="truncate pr-2">{members?.find(m => m.id === payerId)?.display_name || '选择付款人'}</span>
                <ChevronDown className="w-4 h-4 text-text-sub shrink-0" />
              </button>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest pl-1">分摊模式</label>
            </div>
            <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
              <button
                type="button"
                onClick={() => handleSplitTypeChange('equal')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${
                  splitType === 'equal' 
                    ? 'bg-white/10 text-white shadow-lg border border-white/10' 
                    : 'text-text-sub hover:text-white'
                }`}
              >
                AA 平摊
              </button>
              <button
                type="button"
                onClick={() => handleSplitTypeChange('individual')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-widest ${
                  splitType === 'individual' 
                    ? 'bg-white/10 text-white shadow-lg border border-white/10' 
                    : 'text-text-sub hover:text-white'
                }`}
              >
                个人支付
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2 pl-1">
              <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest">参与成员</label>
              {splitType === 'individual' && (
                <span className="text-[9px] font-bold bg-white/10 text-white px-2 py-0.5 rounded-full uppercase tracking-widest border border-white/5">模式锁定</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {members?.map(m => (
                <label 
                  key={m.id} 
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                    splitType === 'individual' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'
                  } ${
                    selectedParticipants.includes(m.id) 
                      ? 'bg-white/10 border-white/20 text-white shadow-lg' 
                      : 'bg-white/5 border-transparent text-text-sub'
                  }`}
                >
                  <input
                    type="checkbox"
                    value={m.id}
                    disabled={splitType === 'individual'}
                    checked={selectedParticipants.includes(m.id)}
                    onChange={(e) => {
                      const ids = e.target.checked 
                        ? [...selectedParticipants, m.id]
                        : selectedParticipants.filter(id => id !== m.id)
                      setValue('participant_ids', ids)
                    }}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    selectedParticipants.includes(m.id) ? 'bg-white border-white' : 'border-white/20'
                  }`}>
                    {selectedParticipants.includes(m.id) && <Check className="w-3 h-3 text-black" />}
                  </div>
                  <span className="text-sm font-semibold truncate">{m.display_name}</span>
                </label>
              ))}
            </div>
            {errors.participant_ids && <p className="text-red-400 text-[10px] mt-2 font-bold uppercase tracking-widest pl-1">{errors.participant_ids.message}</p>}
          </div>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-4 space-y-4">
            <button
              type="button"
              onClick={() => setSyncTimeline((value) => !value)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Newspaper className="h-5 w-5 shrink-0 text-white/70" />
                <span className="min-w-0">
                  <span className="block text-sm font-black text-white">同步到行程记录</span>
                  <span className="mt-0.5 block text-xs font-bold text-white/45">评价、照片和消费体验会进入攻略素材。</span>
                </span>
              </span>
              <span className={`shrink-0 w-11 h-6 rounded-full border p-0.5 transition-colors ${
                syncTimeline ? 'bg-white border-white' : 'bg-black/20 border-white/15'
              }`}>
                <span className={`block h-5 w-5 rounded-full transition-transform ${
                  syncTimeline ? 'translate-x-5 bg-emerald-500' : 'translate-x-0 bg-white/50'
                }`} />
              </span>
            </button>

            {syncTimeline && (
              <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                {linkedTimelineEntryId && !editingExpense ? (
                  <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-4">
                    <p className="text-sm font-black text-emerald-50">已关联行程记录</p>
                    <p className="mt-1 text-xs font-bold leading-5 text-emerald-50/65">
                      {expenseDraft?.timeline_entry_title || expenseDraft?.title || '当前行程记录'}。保存后，这笔账单会归到这条记录下面。
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest pl-1">记录类型</label>
                        <div className="grid grid-cols-2 gap-2">
                          {timelineTypeOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setTimelineType(option.value)}
                              className={`rounded-2xl border px-3 py-2.5 text-xs font-black transition-all ${
                                timelineType === option.value
                                  ? 'border-white bg-white text-black'
                                  : 'border-white/10 bg-black/10 text-white/60 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest pl-1">评分</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={timelineRating}
                            onChange={(event) => setTimelineRating(event.target.value)}
                            placeholder="1-5"
                            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-4 pr-11 text-white focus:outline-none focus:ring-1 focus:ring-white/30 transition-all text-sm font-bold shadow-inner"
                          />
                          <Star className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest pl-1">评价 / 消费清单</label>
                      <textarea
                        value={timelineContent}
                        onChange={(event) => setTimelineContent(event.target.value)}
                        placeholder="例如：推荐菜、购物清单、排队情况、避坑点..."
                        rows={4}
                        className="w-full resize-none bg-black/20 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:ring-1 focus:ring-white/30 transition-all text-sm font-medium shadow-inner"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setIncludeInGuide((value) => !value)}
                      className={`w-full rounded-2xl border px-4 py-3 flex items-center justify-between gap-4 transition-all ${
                        includeInGuide
                          ? 'bg-emerald-400/15 border-emerald-300/20 text-emerald-50'
                          : 'bg-black/10 border-white/10 text-white/55'
                      }`}
                    >
                      <span className="text-sm font-black">{includeInGuide ? '进入攻略素材' : '不进入攻略'}</span>
                      <Check className={`h-4 w-4 ${includeInGuide ? 'opacity-100' : 'opacity-25'}`} />
                    </button>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-text-sub uppercase tracking-widest pl-1">照片</label>
                        <span className="text-[10px] font-black text-white/35">{timelineImages.length}/8</span>
                      </div>
                      {timelineImages.length > 0 && (
                        <div className="space-y-2">
                          {timelineImages.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 border border-white/10 px-3 py-2">
                              <span className="min-w-0 truncate text-xs font-bold text-white/70">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => setTimelineImages((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                                className="shrink-0 rounded-xl p-1.5 text-white/45 hover:bg-white/10 hover:text-white"
                                aria-label="移除图片"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="cursor-pointer rounded-2xl border border-white/10 bg-black/10 px-4 py-3.5 text-white/75 hover:bg-white/10 transition-all flex items-center justify-center gap-2 font-black">
                        <ImagePlus className="w-4 h-4" />
                        添加照片
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(event) => {
                            handleSelectTimelineImages(event.target.files)
                            event.target.value = ''
                          }}
                        />
                      </label>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-black font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 mt-8 text-base tracking-widest uppercase"
          >
            {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin text-black/50" /> : '保存账单'}
          </button>
        </form>

        <AppleSelect
          isOpen={categoryOpen}
          onClose={() => setCategoryOpen(false)}
          options={categories}
          value={categoryId}
          onChange={(val) => {
            setValue('category', val)
            setTimelineType(mapCategoryToTimelineType(val))
          }}
          title="选择支出分类"
        />

        <AppleSelect
          isOpen={payerOpen}
          onClose={() => setPayerOpen(false)}
          options={payerOptions}
          value={payerId}
          onChange={handlePayerChange}
          title="选择付款人"
        />
      </div>
    </div>
  )
}
