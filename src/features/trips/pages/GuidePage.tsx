import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Camera, Loader2, MessageCircle, Newspaper, ReceiptText, Star, Utensils, WalletCards } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTripStore } from '@/stores/useTripStore'

type TripDay = {
  id: string
  day_index: number
  date: string
  city: string | null
}

type TimelineEntry = {
  id: string
  day_id: string
  type: string
  title: string
  content: string | null
  start_time: string | null
  end_time: string | null
  place_name: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  recommend_level: string | null
  rating: number | null
  sort_order: number
  include_in_guide: boolean
  travel_segments?: Array<{
    origin_name: string
    destination_name: string
    origin_latitude: number | null
    origin_longitude: number | null
    destination_latitude: number | null
    destination_longitude: number | null
    transport_mode: string
    distance_km: number | null
    duration_minutes: number | null
    route_polyline: string | null
  }>
  images?: Array<{ id: string; storage_path: string; original_name: string | null }>
  comments?: Array<{ id: string; content: string; created_by_member?: { display_name: string } | null }>
}

type Expense = {
  id: string
  title: string
  amount: number
  category: string
  expense_date: string
  timeline_entry_id: string | null
  participants?: Array<{ calculated_amount: number }>
}

type ExpenseSummary = {
  total: number
  count: number
  participants: number
  categories: Record<string, number>
  expenses: Expense[]
}

type GuideFilter = 'all' | 'recommend' | 'pitfall' | 'photos' | 'expenses'

declare global {
  interface Window {
    AMap?: any
    _AMapSecurityConfig?: { securityJsCode: string }
    __voyageboardGuideAMapLoader?: Promise<any>
  }
}

const typeLabels: Record<string, string> = {
  transport: '交通',
  place: '地点',
  meal: '餐饮',
  hotel: '住宿',
  activity: '活动',
  note: '笔记',
  tip: '建议',
  pitfall: '避坑',
}

const categoryLabels: Record<string, string> = {
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
  other: '其他',
}

const formatDateLabel = (dateText: string) => {
  const date = new Date(`${dateText}T00:00:00`)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const formatTime = (time?: string | null) => time ? time.slice(0, 5) : ''

const formatDuration = (minutes?: number | null) => {
  if (minutes === null || minutes === undefined) return ''
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}小时${rest}分钟` : `${hours}小时`
}

const formatMoney = (amountInCents: number, currency?: string | null) => (
  `${(amountInCents / 100).toFixed(2)} ${currency || ''}`.trim()
)

const emptyExpenseSummary = (): ExpenseSummary => ({
  total: 0,
  count: 0,
  participants: 0,
  categories: {},
  expenses: [],
})

const summarizeExpenses = (expenses: Expense[]): ExpenseSummary => (
  expenses.reduce<ExpenseSummary>((summary, expense) => {
    const participantCount = expense.participants?.length || 0
    summary.total += Number(expense.amount || 0)
    summary.count += 1
    summary.participants += participantCount
    summary.categories[expense.category] = (summary.categories[expense.category] || 0) + Number(expense.amount || 0)
    summary.expenses.push(expense)
    return summary
  }, emptyExpenseSummary())
)

const getTimelineImageUrl = (storagePath: string) => (
  supabase.storage.from('trip-images').getPublicUrl(storagePath).data.publicUrl
)

const parsePolyline = (polyline?: string | null): Array<[number, number]> => {
  if (!polyline) return []
  try {
    const points = JSON.parse(polyline)
    if (!Array.isArray(points)) return []
    return points
      .map((point) => [Number(point[0]), Number(point[1])] as [number, number])
      .filter(([longitude, latitude]) => Number.isFinite(longitude) && Number.isFinite(latitude))
  } catch {
    return []
  }
}

const sortEntries = (entries: TimelineEntry[]) => (
  [...entries].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
)

const guideFilters: Array<{ value: GuideFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'recommend', label: '推荐' },
  { value: 'pitfall', label: '避坑' },
  { value: 'photos', label: '有照片' },
  { value: 'expenses', label: '有费用' },
]

const loadAMap = async () => {
  const key = import.meta.env.VITE_AMAP_JS_API_KEY
  const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_JS_CODE
  if (!key || !securityJsCode) throw new Error('还没有配置高德地图 Key')
  if (window.AMap) return window.AMap
  if (window.__voyageboardGuideAMapLoader) return window.__voyageboardGuideAMapLoader

  window._AMapSecurityConfig = { securityJsCode }
  window.__voyageboardGuideAMapLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`
    script.onload = () => resolve(window.AMap)
    script.onerror = () => reject(new Error('地图加载失败'))
    document.head.appendChild(script)
  })
  return window.__voyageboardGuideAMapLoader
}

export default function GuidePage() {
  const { currentTrip } = useTripStore()
  const [activeFilter, setActiveFilter] = useState<GuideFilter>('all')

  if (!currentTrip) return <Navigate to="/trips" replace />

  const { data: days, isLoading: daysLoading } = useQuery<TripDay[]>({
    queryKey: ['guideDays', currentTrip.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_days')
        .select('id, day_index, date, city')
        .eq('trip_id', currentTrip.id)
        .order('day_index', { ascending: true })
      if (error) throw error
      return data as TripDay[]
    },
  })

  const { data: entries, isLoading: entriesLoading } = useQuery<TimelineEntry[]>({
    queryKey: ['guideEntries', currentTrip.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('timeline_entries')
        .select('*, travel_segments(*), images:timeline_entry_images(*), comments:timeline_entry_comments(*, created_by_member:trip_members!timeline_entry_comments_created_by_member_id_fkey(display_name))')
        .eq('trip_id', currentTrip.id)
        .eq('include_in_guide', true)
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as unknown as TimelineEntry[]
    },
  })

  const { data: expenses } = useQuery<Expense[]>({
    queryKey: ['guideExpenses', currentTrip.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('id, title, amount, category, expense_date, timeline_entry_id, participants:expense_participants(calculated_amount)')
        .eq('trip_id', currentTrip.id)
      if (error) throw error
      return data as Expense[]
    },
  })

  const entriesByDay = useMemo(() => {
    const groups = new Map<string, TimelineEntry[]>()
    ;(entries || []).forEach((entry) => {
      groups.set(entry.day_id, [...(groups.get(entry.day_id) || []), entry])
    })
    return groups
  }, [entries])

  const guideEntries = useMemo(() => {
    const dayOrder = new Map((days || []).map((day) => [day.id, day.day_index]))
    return [...(entries || [])].sort((a, b) => {
      const dayDiff = (dayOrder.get(a.day_id) || 0) - (dayOrder.get(b.day_id) || 0)
      if (dayDiff !== 0) return dayDiff
      return (a.sort_order || 0) - (b.sort_order || 0)
    })
  }, [days, entries])

  const guideStats = useMemo(() => {
    const allEntries = entries || []
    const totalExpense = (expenses || []).reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
    const categoryTotals = (expenses || []).reduce<Record<string, number>>((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount || 0)
      return acc
    }, {})
    return {
      totalExpense,
      entryCount: allEntries.length,
      photoCount: allEntries.reduce((sum, entry) => sum + (entry.images?.length || 0), 0),
      commentCount: allEntries.reduce((sum, entry) => sum + (entry.comments?.length || 0), 0),
      recommendations: allEntries.filter((entry) => entry.recommend_level === 'recommend'),
      pitfalls: allEntries.filter((entry) => entry.type === 'pitfall' || entry.recommend_level === 'avoid'),
      categoryTotals,
    }
  }, [entries, expenses])

  const expensesByEntryId = useMemo(() => {
    const groups = new Map<string, Expense[]>()
    ;(expenses || []).forEach((expense) => {
      if (!expense.timeline_entry_id) return
      groups.set(expense.timeline_entry_id, [...(groups.get(expense.timeline_entry_id) || []), expense])
    })
    return groups
  }, [expenses])

  const expensesByDate = useMemo(() => {
    const groups = new Map<string, Expense[]>()
    ;(expenses || []).forEach((expense) => {
      groups.set(expense.expense_date, [...(groups.get(expense.expense_date) || []), expense])
    })
    return groups
  }, [expenses])

  const matchesFilter = (entry: TimelineEntry) => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'recommend') return entry.recommend_level === 'recommend'
    if (activeFilter === 'pitfall') return entry.type === 'pitfall' || entry.recommend_level === 'avoid'
    if (activeFilter === 'photos') return (entry.images || []).length > 0
    if (activeFilter === 'expenses') return (expensesByEntryId.get(entry.id) || []).length > 0
    return true
  }

  const filteredEntries = useMemo(() => (
    guideEntries.filter(matchesFilter)
  ), [activeFilter, expensesByEntryId, guideEntries])

  const filteredEntriesByDay = useMemo(() => {
    const groups = new Map<string, TimelineEntry[]>()
    filteredEntries.forEach((entry) => {
      groups.set(entry.day_id, [...(groups.get(entry.day_id) || []), entry])
    })
    return groups
  }, [filteredEntries])

  const filteredStats = useMemo(() => ({
    entryCount: filteredEntries.length,
    photoCount: filteredEntries.reduce((sum, entry) => sum + (entry.images?.length || 0), 0),
    commentCount: filteredEntries.reduce((sum, entry) => sum + (entry.comments?.length || 0), 0),
    expenseTotal: filteredEntries.reduce((sum, entry) => (
      sum + summarizeExpenses(expensesByEntryId.get(entry.id) || []).total
    ), 0),
  }), [expensesByEntryId, filteredEntries])

  const isLoading = daysLoading || entriesLoading

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      <header className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-3">
          <div className="h-[2px] w-8 rounded-full bg-white/50" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">GUIDE</span>
          <div className="h-[2px] w-8 rounded-full bg-white/50" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">{currentTrip.destination || currentTrip.title}旅行攻略</h1>
        <p className="mt-2 text-sm font-bold text-white/70">根据当前已记录素材实时生成，可随时回来重新查看。</p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-white/20" />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="glass-card rounded-[32px] border border-white/10 p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-4">
              <GuideStat icon={<Newspaper className="h-4 w-4" />} label="素材" value={`${filteredStats.entryCount} 条`} />
              <GuideStat icon={<Camera className="h-4 w-4" />} label="照片" value={`${filteredStats.photoCount} 张`} />
              <GuideStat icon={<MessageCircle className="h-4 w-4" />} label="补充" value={`${filteredStats.commentCount} 条`} />
              <GuideStat icon={<Utensils className="h-4 w-4" />} label="关联费用" value={formatMoney(filteredStats.expenseTotal, currentTrip.currency)} />
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {guideFilters.map((filter) => {
                const isActive = filter.value === activeFilter
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setActiveFilter(filter.value)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black transition-all ${
                      isActive
                        ? 'border-white bg-white text-black'
                        : 'border-white/10 bg-black/10 text-white/55 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {filter.label}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="glass-card rounded-[32px] border border-white/10 p-5 sm:p-6">
            <h2 className="mb-4 text-xl font-black text-white">行程概览</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <p className="rounded-2xl bg-white/5 p-4 text-sm font-bold leading-6 text-white/70">
                出行时间：{formatDateLabel(currentTrip.start_date)} - {formatDateLabel(currentTrip.end_date)}
              </p>
              <p className="rounded-2xl bg-white/5 p-4 text-sm font-bold leading-6 text-white/70">
                已记录：{(days || []).filter((day) => (entriesByDay.get(day.id) || []).length > 0).length} 天
              </p>
            </div>
          </section>

          <section className="glass-card rounded-[32px] border border-white/10 p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-white">全程路线总览</h2>
                <p className="mt-1 text-xs font-bold text-white/45">所有已记录点位会整合到这一张地图里，按行程顺序连线。</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-white/55">
                {filteredEntries.length} 条素材
              </span>
            </div>
            <GuideOverviewMap entries={filteredEntries} />
          </section>

          {(days || []).map((day) => {
            const dayEntries = sortEntries(filteredEntriesByDay.get(day.id) || [])
            const dayExpenseSummary = summarizeExpenses(expensesByDate.get(day.date) || [])
            if (dayEntries.length === 0) return null
            return (
              <section key={day.id} className="glass-card overflow-hidden rounded-[32px] border border-white/10">
                <div className="p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">Day {day.day_index}</p>
                      <h2 className="mt-1 text-2xl font-black text-white">{formatDateLabel(day.date)}{day.city ? ` · ${day.city}` : ''}</h2>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-white/55">
                      {dayEntries.length} 条素材
                    </span>
                  </div>

                  <DayExpenseSummary summary={dayExpenseSummary} currency={currentTrip.currency} />

                  <div className="space-y-3">
                    {dayEntries.map((entry) => (
                      <GuideEntryCard
                        key={entry.id}
                        entry={entry}
                        expenseSummary={summarizeExpenses(expensesByEntryId.get(entry.id) || [])}
                        currency={currentTrip.currency}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )
          })}

          <section className="grid gap-4 sm:grid-cols-2">
            <GuideList title="推荐清单" icon={<Star className="h-5 w-5" />} entries={guideStats.recommendations} empty="还没有明确推荐的素材。" />
            <GuideList title="避坑提醒" icon={<AlertTriangle className="h-5 w-5" />} entries={guideStats.pitfalls} empty="还没有避坑素材。" />
          </section>

          <section className="glass-card rounded-[32px] border border-white/10 p-5 sm:p-6">
            <h2 className="mb-4 text-xl font-black text-white">费用参考</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(guideStats.categoryTotals).sort((a, b) => b[1] - a[1]).map(([category, amount]) => (
                <div key={category} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-black text-white/45">{categoryLabels[category] || category}</p>
                  <p className="mt-2 text-xl font-black text-white">{(amount / 100).toFixed(2)} {currentTrip.currency || ''}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function GuideStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-xs font-black text-white/45">{icon}{label}</div>
      <p className="mt-3 text-2xl font-black text-white">{value}</p>
    </div>
  )
}

function DayExpenseSummary({ summary, currency }: { summary: ExpenseSummary; currency?: string | null }) {
  if (summary.count === 0) {
    return (
      <div className="mb-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-sm font-bold text-white/45">
        当天还没有账单记录。
      </div>
    )
  }

  const topCategories = Object.entries(summary.categories).sort((a, b) => b[1] - a[1]).slice(0, 3)

  return (
    <div className="mb-4 rounded-[22px] border border-sky-300/15 bg-sky-400/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-black text-sky-50">
          <WalletCards className="h-4 w-4" />
          当天费用 {formatMoney(summary.total, currency)}
        </div>
        <div className="flex flex-wrap gap-2">
          {topCategories.map(([category, amount]) => (
            <span key={category} className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-[11px] font-black text-white/65">
              {categoryLabels[category] || category} {formatMoney(amount, currency)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function GuideEntryCard({ entry, expenseSummary, currency }: { entry: TimelineEntry; expenseSummary: ExpenseSummary; currency?: string | null }) {
  const segment = entry.travel_segments?.[0]
  const detail = entry.type === 'transport' && segment
    ? `${segment.origin_name} -> ${segment.destination_name}${segment.distance_km ? ` · ${segment.distance_km}km` : ''}${segment.duration_minutes ? ` · ${formatDuration(segment.duration_minutes)}` : ''}`
    : [entry.place_name, entry.rating ? `${entry.rating}星` : null].filter(Boolean).join(' · ')
  const averageAmount = expenseSummary.participants > 0
    ? Math.round(expenseSummary.total / expenseSummary.participants)
    : null

  return (
    <article className="rounded-[24px] border border-white/10 bg-black/15 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black text-white/55">{typeLabels[entry.type] || entry.type}</span>
        {(entry.start_time || entry.end_time) && (
          <span className="text-[11px] font-black text-white/40">{formatTime(entry.start_time)}{entry.end_time ? ` - ${formatTime(entry.end_time)}` : ''}</span>
        )}
      </div>
      <h3 className="text-lg font-black text-white">{entry.title}</h3>
      {detail && <p className="mt-1 text-sm font-bold text-white/55">{detail}</p>}
      {expenseSummary.count > 0 && (
        <div className="mt-3 rounded-2xl border border-sky-300/15 bg-sky-400/10 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-xs font-black text-sky-50/75">
              <ReceiptText className="h-4 w-4" />
              关联费用
            </span>
            <span className="text-sm font-black text-white">
              {formatMoney(expenseSummary.total, currency)}
              {averageAmount !== null && <span className="ml-2 text-xs text-white/45">人均约 {formatMoney(averageAmount, currency)}</span>}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {expenseSummary.expenses.slice(0, 3).map((expense) => (
              <span key={expense.id} className="rounded-full bg-black/15 px-2.5 py-1 text-[10px] font-black text-white/55">
                {expense.title} · {formatMoney(Number(expense.amount || 0), currency)}
              </span>
            ))}
          </div>
        </div>
      )}
      {entry.content && <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-6 text-white/75">{entry.content}</p>}
      {entry.comments && entry.comments.length > 0 && (
        <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          {entry.comments.map((comment) => (
            <p key={comment.id} className="text-sm leading-6 text-white/65">
              <span className="font-black text-white/45">{comment.created_by_member?.display_name || '成员'}：</span>{comment.content}
            </p>
          ))}
        </div>
      )}
      {entry.images && entry.images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {entry.images.slice(0, 3).map((image) => (
            <img key={image.id} src={getTimelineImageUrl(image.storage_path)} alt={image.original_name || entry.title} className="aspect-square rounded-2xl object-cover" loading="lazy" />
          ))}
        </div>
      )}
    </article>
  )
}

function GuideList({ title, icon, entries, empty }: { title: string; icon: React.ReactNode; entries: TimelineEntry[]; empty: string }) {
  return (
    <section className="glass-card rounded-[32px] border border-white/10 p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-white">{icon}{title}</h2>
      {entries.length > 0 ? (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-2xl bg-white/5 p-3">
              <p className="font-black text-white">{entry.title}</p>
              {entry.content && <p className="mt-1 line-clamp-2 text-sm text-white/60">{entry.content}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm font-bold text-white/45">{empty}</p>
      )}
    </section>
  )
}

function GuideOverviewMap({ entries }: { entries: TimelineEntry[] }) {
  const [containerId] = useState(() => `guide-overview-map-${crypto.randomUUID()}`)
  const [mapError, setMapError] = useState('')

  const mapPoints = useMemo(() => {
    const points: Array<{ name: string; longitude: number; latitude: number }> = []
    entries.forEach((entry) => {
      const segment = entry.travel_segments?.[0]
      if (entry.type === 'transport' && segment) {
        if (segment.origin_longitude !== null && segment.origin_latitude !== null) {
          points.push({ name: segment.origin_name, longitude: segment.origin_longitude, latitude: segment.origin_latitude })
        }
        const routePoints = parsePolyline(segment.route_polyline)
        routePoints.slice(1, -1).forEach(([longitude, latitude], index) => {
          if (index % 12 === 0) points.push({ name: '', longitude, latitude })
        })
        if (segment.destination_longitude !== null && segment.destination_latitude !== null) {
          points.push({ name: segment.destination_name, longitude: segment.destination_longitude, latitude: segment.destination_latitude })
        }
        return
      }
      if (entry.longitude !== null && entry.latitude !== null && entry.place_name) {
        points.push({ name: entry.place_name, longitude: entry.longitude, latitude: entry.latitude })
      }
    })
    return points.filter((point, index, list) => (
      index === 0 || point.longitude !== list[index - 1].longitude || point.latitude !== list[index - 1].latitude
    ))
  }, [entries])

  useEffect(() => {
    if (mapPoints.length === 0) return
    let map: any
    let disposed = false
    loadAMap()
      .then((AMap) => {
        if (disposed) return
        map = new AMap.Map(containerId, {
          viewMode: '2D',
          zoom: 11,
          center: [mapPoints[0].longitude, mapPoints[0].latitude],
          mapStyle: 'amap://styles/normal',
          resizeEnable: true,
        })
        const visiblePoints = mapPoints.filter((point) => point.name)
        const markers = visiblePoints.map((point, index) => new AMap.Marker({
          position: [point.longitude, point.latitude],
          anchor: 'bottom-center',
          content: `<div style="width:30px;height:30px;border-radius:999px;background:#0ea5e9;color:white;border:2px solid white;display:flex;align-items:center;justify-content:center;font-weight:900;box-shadow:0 10px 18px rgba(0,0,0,.22);">${index + 1}</div>`,
        }))
        const polyline = mapPoints.length > 1 ? new AMap.Polyline({
          path: mapPoints.map((point) => [point.longitude, point.latitude]),
          strokeColor: '#0ea5e9',
          strokeWeight: 5,
          strokeOpacity: 0.82,
          lineJoin: 'round',
          lineCap: 'round',
        }) : null
        if (markers.length) map.add(markers)
        if (polyline) map.add(polyline)
        map.setFitView([...markers, ...(polyline ? [polyline] : [])], false, [34, 34, 34, 34])
        setMapError('')
      })
      .catch((error: any) => setMapError(error.message || '地图加载失败'))
    return () => {
      disposed = true
      if (map) map.destroy()
    }
  }, [containerId, mapPoints])

  if (mapPoints.length === 0) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm font-bold text-white/45">
        还没有可展示在地图上的点位。
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white">
      <div id={containerId} className="h-[260px] w-full sm:h-[340px]" />
      {mapError && <div className="bg-black px-4 py-2 text-xs font-bold text-rose-100">{mapError}</div>}
    </div>
  )
}
