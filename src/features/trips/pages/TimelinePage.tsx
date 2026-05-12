import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Bike,
  Bus,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  Clock3,
  Edit2,
  FileText,
  Hotel,
  Lightbulb,
  Loader2,
  MapPin,
  MapPinned,
  Navigation,
  Plane,
  Plus,
  Route,
  Ship,
  Star,
  Train,
  Trash2,
  Utensils,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTripStore } from '@/stores/useTripStore'
import { Trip } from '@/types/trip'

type TimelineEntryType = 'transport' | 'place' | 'meal' | 'hotel' | 'activity' | 'note' | 'tip' | 'pitfall'
type RecommendLevel = 'recommend' | 'normal' | 'avoid'
type DistanceSource = 'auto' | 'manual' | 'unknown'

type TripDay = {
  id: string
  trip_id: string
  day_index: number
  date: string
  city: string | null
  title: string | null
  summary: string | null
}

type TravelSegment = {
  id: string
  trip_id: string
  day_id: string
  timeline_entry_id: string | null
  origin_name: string
  destination_name: string
  transport_mode: string
  departure_time: string | null
  arrival_time: string | null
  duration_minutes: number | null
  distance_km: number | null
  distance_source: DistanceSource
  note: string | null
  sort_order: number
}

type TimelineEntry = {
  id: string
  trip_id: string
  day_id: string
  type: TimelineEntryType
  title: string
  content: string | null
  start_time: string | null
  end_time: string | null
  duration_minutes: number | null
  place_name: string | null
  address: string | null
  recommend_level: RecommendLevel | null
  rating: number | null
  tags: string[] | null
  sort_order: number
  created_by_member_id: string | null
  travel_segments?: TravelSegment[]
}

type EntryForm = {
  type: TimelineEntryType
  title: string
  content: string
  start_time: string
  end_time: string
  place_name: string
  address: string
  recommend_level: RecommendLevel
  rating: string
  tagsText: string
  origin_name: string
  destination_name: string
  transport_mode: string
  departure_time: string
  arrival_time: string
  distance_km: string
  note: string
}

const entryTypes: Array<{ value: TimelineEntryType; label: string; icon: React.ElementType; tone: string }> = [
  { value: 'transport', label: '交通', icon: Route, tone: 'bg-sky-400/15 text-sky-200 border-sky-300/20' },
  { value: 'place', label: '地点', icon: MapPin, tone: 'bg-emerald-400/15 text-emerald-200 border-emerald-300/20' },
  { value: 'meal', label: '餐饮', icon: Utensils, tone: 'bg-orange-400/15 text-orange-200 border-orange-300/20' },
  { value: 'hotel', label: '住宿', icon: Hotel, tone: 'bg-indigo-400/15 text-indigo-200 border-indigo-300/20' },
  { value: 'activity', label: '活动', icon: Star, tone: 'bg-fuchsia-400/15 text-fuchsia-200 border-fuchsia-300/20' },
  { value: 'note', label: '笔记', icon: FileText, tone: 'bg-white/10 text-white border-white/15' },
  { value: 'tip', label: '建议', icon: Lightbulb, tone: 'bg-yellow-400/15 text-yellow-100 border-yellow-300/20' },
  { value: 'pitfall', label: '避坑', icon: AlertTriangle, tone: 'bg-rose-400/15 text-rose-100 border-rose-300/20' },
]

const transportModes: Array<{ value: string; label: string; icon: React.ElementType }> = [
  { value: 'rental_car', label: '租车自驾', icon: Car },
  { value: 'car', label: '自驾', icon: Car },
  { value: 'taxi', label: '出租车', icon: Car },
  { value: 'ride_hailing', label: '网约车', icon: Car },
  { value: 'flight', label: '飞机', icon: Plane },
  { value: 'high_speed_rail', label: '高铁', icon: Train },
  { value: 'train', label: '火车', icon: Train },
  { value: 'metro', label: '地铁', icon: Train },
  { value: 'bus', label: '公交', icon: Bus },
  { value: 'coach', label: '大巴', icon: Bus },
  { value: 'walk', label: '步行', icon: Navigation },
  { value: 'bike', label: '骑行', icon: Bike },
  { value: 'ship', label: '轮船', icon: Ship },
  { value: 'ferry', label: '轮渡', icon: Ship },
  { value: 'other', label: '其他', icon: Route },
]

const emptyForm = (type: TimelineEntryType): EntryForm => ({
  type,
  title: '',
  content: '',
  start_time: '',
  end_time: '',
  place_name: '',
  address: '',
  recommend_level: 'normal',
  rating: '',
  tagsText: '',
  origin_name: '',
  destination_name: '',
  transport_mode: 'rental_car',
  departure_time: '',
  arrival_time: '',
  distance_km: '',
  note: '',
})

const toLocalDate = (dateText: string) => new Date(`${dateText}T00:00:00`)

const toDateText = (date: Date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDateLabel = (dateText: string) => {
  const date = toLocalDate(dateText)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const formatTime = (time?: string | null) => time ? time.slice(0, 5) : '--:--'

const calculateDuration = (start?: string, end?: string) => {
  if (!start || !end) return null
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)
  if ([startHour, startMinute, endHour, endMinute].some(Number.isNaN)) return null

  let minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute)
  if (minutes < 0) minutes += 24 * 60
  return minutes
}

const formatDuration = (minutes?: number | null) => {
  if (minutes === null || minutes === undefined) return ''
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}小时${rest}分钟` : `${hours}小时`
}

const getEntryMeta = (type: TimelineEntryType) => entryTypes.find((entryType) => entryType.value === type) || entryTypes[0]

const getTransportMeta = (mode: string) => transportModes.find((item) => item.value === mode) || transportModes[transportModes.length - 1]

const buildExpectedDays = (startDate: string, endDate: string) => {
  const start = toLocalDate(startDate)
  const end = toLocalDate(endDate)
  const days: Array<{ day_index: number; date: string }> = []

  for (let date = new Date(start), index = 1; date <= end; date.setDate(date.getDate() + 1), index += 1) {
    days.push({ day_index: index, date: toDateText(date) })
  }

  return days.length > 0 ? days : [{ day_index: 1, date: startDate }]
}

export default function TimelinePage() {
  const { currentTrip } = useTripStore()

  if (!currentTrip) return <Navigate to="/trips" replace />

  return <TimelineContent currentTrip={currentTrip} />
}

function TimelineContent({ currentTrip }: { currentTrip: Trip }) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [activeDayIndex, setActiveDayIndex] = useState(1)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimelineEntry | null>(null)
  const [form, setForm] = useState<EntryForm>(emptyForm('transport'))
  const [saving, setSaving] = useState(false)

  const expectedDays = useMemo(
    () => buildExpectedDays(currentTrip.start_date, currentTrip.end_date),
    [currentTrip.start_date, currentTrip.end_date],
  )

  const { data: currentMember } = useQuery({
    queryKey: ['currentMember', currentTrip.id, user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('trip_members')
        .select('id')
        .eq('trip_id', currentTrip.id)
        .eq('user_id', user.id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const { data: tripDays, isLoading: daysLoading } = useQuery<TripDay[]>({
    queryKey: ['tripDays', currentTrip.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_days')
        .select('*')
        .eq('trip_id', currentTrip.id)
        .order('day_index', { ascending: true })
      if (error) throw error
      return data as TripDay[]
    },
  })

  useEffect(() => {
    if (!currentTrip || !tripDays || daysLoading) return

    const existingIndexes = new Set(tripDays.map((day) => day.day_index))
    const missingDays = expectedDays
      .filter((day) => !existingIndexes.has(day.day_index))
      .map((day) => ({
        trip_id: currentTrip.id,
        day_index: day.day_index,
        date: day.date,
      }))

    if (missingDays.length === 0) return

    supabase
      .from('trip_days')
      .upsert(missingDays, { onConflict: 'trip_id,day_index' })
      .then(({ error }) => {
        if (error) alert(error.message)
        else queryClient.invalidateQueries({ queryKey: ['tripDays', currentTrip.id] })
      })
  }, [currentTrip, daysLoading, expectedDays, queryClient, tripDays])

  const activeDay = (tripDays || []).find((day) => day.day_index === activeDayIndex)

  const { data: entries, isLoading: entriesLoading } = useQuery<TimelineEntry[]>({
    queryKey: ['timelineEntries', currentTrip.id, activeDay?.id],
    queryFn: async () => {
      if (!activeDay) return []
      const { data, error } = await supabase
        .from('timeline_entries')
        .select('*, travel_segments(*)')
        .eq('trip_id', currentTrip.id)
        .eq('day_id', activeDay.id)
        .order('sort_order', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data as unknown as TimelineEntry[]
    },
    enabled: !!activeDay,
  })

  const updateForm = <K extends keyof EntryForm>(key: K, value: EntryForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const openNewForm = (type: TimelineEntryType) => {
    setForm(emptyForm(type))
    setEditingEntry(null)
    setPickerOpen(false)
    setFormOpen(true)
  }

  const openEditForm = (entry: TimelineEntry) => {
    const segment = entry.travel_segments?.[0]
    setEditingEntry(entry)
    setForm({
      type: entry.type,
      title: entry.title,
      content: entry.content || '',
      start_time: entry.start_time?.slice(0, 5) || '',
      end_time: entry.end_time?.slice(0, 5) || '',
      place_name: entry.place_name || '',
      address: entry.address || '',
      recommend_level: entry.recommend_level || 'normal',
      rating: entry.rating ? String(entry.rating) : '',
      tagsText: (entry.tags || []).join('、'),
      origin_name: segment?.origin_name || '',
      destination_name: segment?.destination_name || '',
      transport_mode: segment?.transport_mode || 'rental_car',
      departure_time: segment?.departure_time?.slice(0, 5) || '',
      arrival_time: segment?.arrival_time?.slice(0, 5) || '',
      distance_km: segment?.distance_km !== null && segment?.distance_km !== undefined ? String(segment.distance_km) : '',
      note: segment?.note || '',
    })
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingEntry(null)
    setSaving(false)
  }

  const buildEntryPayload = () => {
    const isTransport = form.type === 'transport'
    const startTime = isTransport ? form.departure_time : form.start_time
    const endTime = isTransport ? form.arrival_time : form.end_time
    const duration = calculateDuration(startTime, endTime)
    const tags = form.tagsText
      .split(/[、,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean)

    return {
      trip_id: currentTrip.id,
      day_id: activeDay!.id,
      type: form.type,
      title: isTransport ? `${form.origin_name.trim()} → ${form.destination_name.trim()}` : form.title.trim(),
      content: isTransport ? (form.note.trim() || null) : (form.content.trim() || null),
      start_time: startTime || null,
      end_time: endTime || null,
      duration_minutes: duration,
      place_name: isTransport ? null : (form.place_name.trim() || null),
      address: isTransport ? null : (form.address.trim() || null),
      recommend_level: isTransport ? null : form.recommend_level,
      rating: !isTransport && form.rating ? Number(form.rating) : null,
      tags,
      sort_order: editingEntry?.sort_order ?? ((entries?.length || 0) + 1),
      created_by_member_id: currentMember?.id || null,
      updated_at: new Date().toISOString(),
    }
  }

  const buildSegmentPayload = (timelineEntryId: string, sortOrder: number) => {
    const distance = form.distance_km.trim() ? Number(form.distance_km) : null

    return {
      trip_id: currentTrip.id,
      day_id: activeDay!.id,
      timeline_entry_id: timelineEntryId,
      origin_name: form.origin_name.trim(),
      destination_name: form.destination_name.trim(),
      transport_mode: form.transport_mode,
      departure_time: form.departure_time || null,
      arrival_time: form.arrival_time || null,
      duration_minutes: calculateDuration(form.departure_time, form.arrival_time),
      distance_km: distance,
      distance_source: distance === null ? 'unknown' : 'manual',
      note: form.note.trim() || null,
      sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    }
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!activeDay || !currentMember) {
      alert('日期或成员信息还没有准备好')
      return
    }

    if (form.type === 'transport' && (!form.origin_name.trim() || !form.destination_name.trim())) {
      alert('请填写起点和终点')
      return
    }

    if (form.type !== 'transport' && !form.title.trim()) {
      alert('请填写标题')
      return
    }

    setSaving(true)

    try {
      const entryPayload = buildEntryPayload()
      let entryId = editingEntry?.id

      if (editingEntry) {
        const { error } = await supabase
          .from('timeline_entries')
          .update({ ...entryPayload, created_by_member_id: editingEntry.created_by_member_id })
          .eq('id', editingEntry.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('timeline_entries')
          .insert(entryPayload)
          .select('id')
          .single()
        if (error) throw error
        entryId = data.id
      }

      if (form.type === 'transport' && entryId) {
        const segmentPayload = buildSegmentPayload(entryId, entryPayload.sort_order)
        const existingSegment = editingEntry?.travel_segments?.[0]

        if (existingSegment) {
          const { error } = await supabase
            .from('travel_segments')
            .update(segmentPayload)
            .eq('id', existingSegment.id)
          if (error) throw error
        } else {
          const { error } = await supabase.from('travel_segments').insert(segmentPayload)
          if (error) throw error
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['timelineEntries', currentTrip.id, activeDay.id] })
      closeForm()
    } catch (error: any) {
      alert(error.message)
      setSaving(false)
    }
  }

  const handleDelete = async (entry: TimelineEntry) => {
    if (!window.confirm('确认删除这条行程记录吗？')) return

    const { error } = await supabase.from('timeline_entries').delete().eq('id', entry.id)
    if (error) {
      alert(error.message)
      return
    }

    queryClient.invalidateQueries({ queryKey: ['timelineEntries', currentTrip.id, activeDay?.id] })
  }

  const handleMapCalculate = () => {
    alert('地图计算已预留。后续配置地图服务后，可用起点和终点自动计算距离、耗时和路线。')
  }

  const activeExpectedDay = expectedDays.find((day) => day.day_index === activeDayIndex) || expectedDays[0]
  const activeDateLabel = activeDay?.date || activeExpectedDay?.date || currentTrip.start_date

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <header className="mb-8 flex flex-col items-center text-center">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-[2px] bg-white/50 rounded-full shadow-sm" />
          <span className="text-[10px] font-bold text-white/80 uppercase tracking-[0.3em] drop-shadow-sm">TIMELINE</span>
          <div className="w-8 h-[2px] bg-white/50 rounded-full shadow-sm" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">行程记录</h1>
        <p className="text-white/80 font-medium mt-2 drop-shadow-sm">旅行中随手记录，旅行后生成攻略。</p>
      </header>

      <section className="mb-6 glass-card rounded-[28px] p-5 sm:p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black text-white/55 uppercase tracking-[0.25em] mb-2">
              <CalendarDays className="w-4 h-4" />
              {formatDateLabel(activeDateLabel)}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Day {activeDayIndex}
              {activeDay?.city ? <span className="text-white/50"> · {activeDay.city}</span> : null}
            </h2>
          </div>

          <div className="flex items-center gap-3 text-sm font-bold text-white/65">
            <MapPinned className="w-5 h-5 text-white/50" />
            <span className="truncate">{currentTrip.destination || '目的地待补充'}</span>
          </div>
        </div>
      </section>

      <div className="mb-8 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 min-w-max pb-1">
          {expectedDays.map((day) => {
            const isActive = day.day_index === activeDayIndex
            const dbDay = (tripDays || []).find((item) => item.day_index === day.day_index)
            return (
              <button
                key={day.day_index}
                type="button"
                onClick={() => setActiveDayIndex(day.day_index)}
                className={`min-w-[108px] rounded-[22px] border px-4 py-3 text-left transition-all active:scale-95 ${
                  isActive
                    ? 'bg-white text-black border-white shadow-xl'
                    : 'bg-black/20 text-white border-white/10 hover:bg-white/10'
                }`}
              >
                <span className="block text-sm font-black">Day {day.day_index}</span>
                <span className={`block text-[11px] font-bold mt-1 ${isActive ? 'text-black/60' : 'text-white/45'}`}>
                  {formatDateLabel(day.date)}
                </span>
                {dbDay?.city && (
                  <span className={`block text-[11px] font-bold truncate mt-1 ${isActive ? 'text-black/70' : 'text-white/65'}`}>
                    {dbDay.city}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {daysLoading || entriesLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-white/20" />
        </div>
      ) : entries && entries.length > 0 ? (
        <div className="relative space-y-4">
          <div className="absolute left-6 top-4 bottom-4 w-px bg-white/10 hidden sm:block" />
          <AnimatePresence mode="popLayout">
            {entries.map((entry, index) => (
              <TimelineCard
                key={entry.id}
                entry={entry}
                index={index}
                onEdit={() => openEditForm(entry)}
                onDelete={() => handleDelete(entry)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-28 bg-black/15 backdrop-blur-xl rounded-[40px] border-dashed border-2 border-white/20 shadow-lg">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
            <Route className="w-8 h-8 text-white/60" />
          </div>
          <h3 className="text-xl font-bold text-white drop-shadow-md mb-2">今天还没有记录</h3>
          <p className="text-white/75 font-medium text-sm drop-shadow-sm">先记一段路、一个地点，或一个后来者会感谢你的提醒。</p>
        </div>
      )}

      <motion.button
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setPickerOpen(true)}
        disabled={!activeDay}
        className="fixed left-1/2 bottom-32 z-50 flex h-14 -translate-x-1/2 items-center gap-3 rounded-full bg-white px-6 text-black shadow-[0_18px_40px_rgba(0,0,0,0.35)] disabled:opacity-50"
      >
        <Plus className="w-5 h-5" strokeWidth={3} />
        <span className="text-sm font-black tracking-widest">添加记录</span>
      </motion.button>

      <ModalPortal>
        <AnimatePresence>
          {pickerOpen && (
            <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.98 }}
                className="w-full max-w-xl glass-card rounded-[32px] border border-white/10 p-5 sm:p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">NEW ENTRY</span>
                    <h2 className="text-2xl font-black text-white mt-1">选择记录类型</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(false)}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {entryTypes.map((entryType) => {
                    const Icon = entryType.icon
                    return (
                      <button
                        key={entryType.value}
                        type="button"
                        onClick={() => openNewForm(entryType.value)}
                        className={`rounded-[24px] border p-4 text-left transition-all hover:bg-white/10 active:scale-95 ${entryType.tone}`}
                      >
                        <Icon className="w-6 h-6 mb-4" />
                        <span className="block text-base font-black text-white">{entryType.label}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            </div>
          )}

          {formOpen && (
            <EntryFormModal
              form={form}
              saving={saving}
              editing={!!editingEntry}
              onClose={closeForm}
              onSave={handleSave}
              onChange={updateForm}
              onMapCalculate={handleMapCalculate}
            />
          )}
        </AnimatePresence>
      </ModalPortal>
    </div>
  )
}

function ModalPortal({ children }: { children: React.ReactNode }) {
  return createPortal(children, document.body)
}

function TimelineCard({
  entry,
  index,
  onEdit,
  onDelete,
}: {
  entry: TimelineEntry
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  const meta = getEntryMeta(entry.type)
  const Icon = meta.icon
  const segment = entry.travel_segments?.[0]
  const transportMeta = segment ? getTransportMeta(segment.transport_mode) : null
  const TransportIcon = transportMeta?.icon || Route
  const time = entry.start_time || segment?.departure_time
  const summary = entry.type === 'transport'
    ? [
        transportMeta?.label,
        segment?.distance_km !== null && segment?.distance_km !== undefined ? `${segment.distance_km}km` : null,
        formatDuration(segment?.duration_minutes ?? entry.duration_minutes),
      ].filter(Boolean).join(' · ')
    : [
        entry.place_name,
        entry.rating ? `${entry.rating}星` : null,
        entry.recommend_level === 'recommend' ? '推荐' : entry.recommend_level === 'avoid' ? '避坑' : null,
      ].filter(Boolean).join(' · ')

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.98 }}
      className="relative sm:pl-16"
    >
      <div className="absolute left-[15px] top-7 hidden h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-white text-black text-xs font-black sm:flex">
        {index + 1}
      </div>

      <div className="glass-card rounded-[28px] border border-white/10 p-5 shadow-lg transition-all hover:border-white/20">
        <div className="flex items-start gap-4">
          <div className={`shrink-0 w-12 h-12 rounded-2xl border flex items-center justify-center ${meta.tone}`}>
            {entry.type === 'transport' ? <TransportIcon className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-black text-white/45 uppercase tracking-[0.2em]">{formatTime(time)}</span>
                  <span className="text-[11px] font-black text-white/35">{meta.label}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight break-words">{entry.title}</h3>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button type="button" onClick={onEdit} className="p-2 rounded-xl text-white/45 hover:text-white hover:bg-white/10">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={onDelete} className="p-2 rounded-xl text-red-300/60 hover:text-red-200 hover:bg-red-400/10">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {summary && <p className="mt-2 text-sm font-bold text-white/65">{summary}</p>}
            {(entry.content || segment?.note) && (
              <p className="mt-3 text-sm leading-6 text-white/75 break-words">{entry.content || segment?.note}</p>
            )}
            {entry.tags && entry.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white/65 border border-white/10">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  )
}

function EntryFormModal({
  form,
  saving,
  editing,
  onClose,
  onSave,
  onChange,
  onMapCalculate,
}: {
  form: EntryForm
  saving: boolean
  editing: boolean
  onClose: () => void
  onSave: (event: React.FormEvent) => void
  onChange: <K extends keyof EntryForm>(key: K, value: EntryForm[K]) => void
  onMapCalculate: () => void
}) {
  const meta = getEntryMeta(form.type)
  const Icon = meta.icon
  const isTransport = form.type === 'transport'
  const duration = calculateDuration(
    isTransport ? form.departure_time : form.start_time,
    isTransport ? form.arrival_time : form.end_time,
  )

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-4 sm:p-6">
      <motion.form
        onSubmit={onSave}
        initial={{ opacity: 0, y: 42, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.98 }}
        className="w-full max-w-2xl glass-card rounded-[36px] border border-white/10 p-5 sm:p-7 shadow-2xl max-h-[88vh] overflow-y-auto no-scrollbar pb-24 sm:pb-7"
      >
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${meta.tone}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">
                {editing ? 'EDIT ENTRY' : 'NEW ENTRY'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{meta.label}记录</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isTransport ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="起点">
                <input
                  value={form.origin_name}
                  onChange={(event) => onChange('origin_name', event.target.value)}
                  placeholder="例如：海口美兰机场"
                  className="glass-input"
                />
              </Field>
              <Field label="终点">
                <input
                  value={form.destination_name}
                  onChange={(event) => onChange('destination_name', event.target.value)}
                  placeholder="例如：文昌酒店"
                  className="glass-input"
                />
              </Field>
            </div>

            <Field label="交通方式">
              <div className="relative">
                <select
                  value={form.transport_mode}
                  onChange={(event) => onChange('transport_mode', event.target.value)}
                  className="appearance-none w-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl py-4 pl-5 pr-12 text-white focus:outline-none focus:bg-black/40 focus:border-white/30 transition-all duration-300 font-bold"
                >
                  {transportModes.map((mode) => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="出发时间">
                <input type="time" value={form.departure_time} onChange={(event) => onChange('departure_time', event.target.value)} className="glass-input" />
              </Field>
              <Field label="到达时间">
                <input type="time" value={form.arrival_time} onChange={(event) => onChange('arrival_time', event.target.value)} className="glass-input" />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
              <Field label="距离 KM">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.distance_km}
                  onChange={(event) => onChange('distance_km', event.target.value)}
                  placeholder="手动填写，例如 92"
                  className="glass-input"
                />
              </Field>
              <button
                type="button"
                onClick={onMapCalculate}
                className="h-[58px] rounded-2xl px-5 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-black flex items-center justify-center gap-2"
              >
                <MapPinned className="w-4 h-4" />
                计算距离与耗时
              </button>
            </div>

            {duration !== null && (
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/70">
                <Clock3 className="w-4 h-4" />
                已根据时间自动计算耗时：{formatDuration(duration)}
              </div>
            )}

            <Field label="备注">
              <textarea
                value={form.note}
                onChange={(event) => onChange('note', event.target.value)}
                placeholder="路况、取票、换乘、停车、注意事项..."
                rows={4}
                className="glass-input resize-none"
              />
            </Field>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="标题">
              <input
                value={form.title}
                onChange={(event) => onChange('title', event.target.value)}
                placeholder="例如：日月湾冲浪体验"
                className="glass-input"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="开始时间">
                <input type="time" value={form.start_time} onChange={(event) => onChange('start_time', event.target.value)} className="glass-input" />
              </Field>
              <Field label="结束时间">
                <input type="time" value={form.end_time} onChange={(event) => onChange('end_time', event.target.value)} className="glass-input" />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="地点">
                <input value={form.place_name} onChange={(event) => onChange('place_name', event.target.value)} placeholder="地点/店名/酒店名" className="glass-input" />
              </Field>
              <Field label="地址">
                <input value={form.address} onChange={(event) => onChange('address', event.target.value)} placeholder="可选" className="glass-input" />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="推荐程度">
                <div className="relative">
                  <select
                    value={form.recommend_level}
                    onChange={(event) => onChange('recommend_level', event.target.value as RecommendLevel)}
                    className="appearance-none w-full bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl py-4 pl-5 pr-12 text-white focus:outline-none focus:bg-black/40 focus:border-white/30 transition-all duration-300 font-bold"
                  >
                    <option value="recommend">推荐</option>
                    <option value="normal">普通</option>
                    <option value="avoid">避开</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                </div>
              </Field>
              <Field label="评分">
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={form.rating}
                  onChange={(event) => onChange('rating', event.target.value)}
                  placeholder="1-5"
                  className="glass-input"
                />
              </Field>
            </div>

            {duration !== null && (
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/70">
                <Clock3 className="w-4 h-4" />
                已根据时间自动计算耗时：{formatDuration(duration)}
              </div>
            )}

            <Field label="标签">
              <input
                value={form.tagsText}
                onChange={(event) => onChange('tagsText', event.target.value)}
                placeholder="用顿号或逗号分隔，例如：亲子、停车方便"
                className="glass-input"
              />
            </Field>

            <Field label="内容">
              <textarea
                value={form.content}
                onChange={(event) => onChange('content', event.target.value)}
                placeholder="体验、建议、避坑、适合人群..."
                rows={5}
                className="glass-input resize-none"
              />
            </Field>
          </div>
        )}

        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-black"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-12 rounded-2xl bg-white text-black disabled:bg-white/20 disabled:text-white/35 font-black flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            保存
          </button>
        </div>
      </motion.form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block pl-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/45">{label}</span>
      {children}
    </label>
  )
}
