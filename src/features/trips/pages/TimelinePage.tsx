import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowUpDown,
  Bike,
  Bus,
  Camera,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit2,
  FileText,
  GripVertical,
  Hotel,
  ImagePlus,
  Lightbulb,
  Loader2,
  MapPin,
  MapPinned,
  Maximize2,
  Minimize2,
  MoveDown,
  MoveUp,
  Newspaper,
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
  ZoomIn,
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
  origin_address: string | null
  destination_address: string | null
  origin_latitude: number | null
  origin_longitude: number | null
  destination_latitude: number | null
  destination_longitude: number | null
  transport_mode: string
  departure_time: string | null
  arrival_time: string | null
  duration_minutes: number | null
  distance_km: number | null
  distance_source: DistanceSource
  route_polyline: string | null
  note: string | null
  sort_order: number
}

type TimelineImage = {
  id: string
  trip_id: string
  day_id: string
  timeline_entry_id: string
  storage_path: string
  original_name: string | null
  mime_type: string
  width: number | null
  height: number | null
  size_bytes: number | null
  sort_order: number
  created_by_member_id: string | null
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
  latitude: number | null
  longitude: number | null
  recommend_level: RecommendLevel | null
  rating: number | null
  tags: string[] | null
  sort_order: number
  created_by_member_id: string | null
  include_in_guide: boolean
  travel_segments?: TravelSegment[]
  images?: TimelineImage[]
  created_by_member?: { display_name: string } | null
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
  origin_address: string
  origin_latitude: string
  origin_longitude: string
  destination_name: string
  destination_address: string
  destination_latitude: string
  destination_longitude: string
  transport_mode: string
  departure_time: string
  arrival_time: string
  distance_km: string
  distance_source: DistanceSource
  route_duration_minutes: string
  route_polyline: string
  latitude: string
  longitude: string
  note: string
  include_in_guide: boolean
}

type LocationPoint = {
  name: string
  address: string
  latitude: number
  longitude: number
}

type RouteCalculationResult = {
  distanceKm: number
  durationMinutes: number | null
  sourceLabel: string
  origin: LocationPoint
  destination: LocationPoint
  routePolyline: string
}

type MapStyleOption = {
  value: string
  label: string
}

declare global {
  interface Window {
    AMap?: any
    _AMapSecurityConfig?: { securityJsCode: string }
    __voyageboardAMapLoader?: Promise<any>
  }
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

const mapStyleOptions: MapStyleOption[] = [
  { value: 'amap://styles/normal', label: '标准' },
  { value: 'amap://styles/fresh', label: '清爽' },
  { value: 'amap://styles/whitesmoke', label: '浅灰' },
  { value: 'amap://styles/dark', label: '深色' },
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
  origin_address: '',
  origin_latitude: '',
  origin_longitude: '',
  destination_name: '',
  destination_address: '',
  destination_latitude: '',
  destination_longitude: '',
  transport_mode: 'rental_car',
  departure_time: '',
  arrival_time: '',
  distance_km: '',
  distance_source: 'unknown',
  route_duration_minutes: '',
  route_polyline: '',
  latitude: '',
  longitude: '',
  note: '',
  include_in_guide: true,
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

const timeToMinutes = (time?: string | null) => {
  if (!time) return null
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

const getEntrySortMinutes = (entry: TimelineEntry) => (
  timeToMinutes(entry.start_time || entry.travel_segments?.[0]?.departure_time)
)

const sortTimelineEntries = (items: TimelineEntry[]) => (
  [...items].sort((a, b) => {
    const orderDiff = (a.sort_order || 0) - (b.sort_order || 0)
    if (orderDiff !== 0) return orderDiff

    const aMinutes = getEntrySortMinutes(a)
    const bMinutes = getEntrySortMinutes(b)
    if (aMinutes !== null && bMinutes !== null && aMinutes !== bMinutes) return aMinutes - bMinutes
    if (aMinutes !== null && bMinutes === null) return -1
    if (aMinutes === null && bMinutes !== null) return 1
    return a.title.localeCompare(b.title)
  })
)

const sortEntriesByTime = (items: TimelineEntry[]) => (
  [...items].sort((a, b) => {
    const aMinutes = getEntrySortMinutes(a)
    const bMinutes = getEntrySortMinutes(b)
    if (aMinutes !== null && bMinutes !== null && aMinutes !== bMinutes) return aMinutes - bMinutes
    if (aMinutes !== null && bMinutes === null) return -1
    if (aMinutes === null && bMinutes !== null) return 1
    return (a.sort_order || 0) - (b.sort_order || 0)
  })
)

const getEntryMeta = (type: TimelineEntryType) => entryTypes.find((entryType) => entryType.value === type) || entryTypes[0]

const getTransportMeta = (mode: string) => transportModes.find((item) => item.value === mode) || transportModes[transportModes.length - 1]

const routeModeByTransport: Record<string, 'driving' | 'walking' | 'riding' | 'straight'> = {
  walk: 'walking',
  bike: 'riding',
  flight: 'straight',
  train: 'straight',
  high_speed_rail: 'straight',
  ship: 'straight',
  ferry: 'straight',
}

const loadAMap = async () => {
  const key = import.meta.env.VITE_AMAP_JS_API_KEY
  const securityJsCode = import.meta.env.VITE_AMAP_SECURITY_JS_CODE

  if (!key || !securityJsCode) {
    throw new Error('还没有配置高德地图 Key。请配置 VITE_AMAP_JS_API_KEY 和 VITE_AMAP_SECURITY_JS_CODE。')
  }

  if (window.AMap) return window.AMap
  if (window.__voyageboardAMapLoader) return window.__voyageboardAMapLoader

  window._AMapSecurityConfig = { securityJsCode }
  window.__voyageboardAMapLoader = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-voyageboard-amap="true"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.AMap))
      existingScript.addEventListener('error', () => reject(new Error('高德地图脚本加载失败')))
      return
    }

    const script = document.createElement('script')
    script.dataset.voyageboardAmap = 'true'
    script.async = true
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}&plugin=AMap.Driving,AMap.Walking,AMap.Riding,AMap.Geocoder,AMap.GeometryUtil`
    script.onload = () => resolve(window.AMap)
    script.onerror = () => reject(new Error('高德地图脚本加载失败'))
    document.head.appendChild(script)
  })

  return window.__voyageboardAMapLoader
}

const loadAMapPlugin = async (pluginName: string) => {
  const AMap = await loadAMap()
  await new Promise<void>((resolve) => AMap.plugin(pluginName, resolve))
  return AMap
}

const normalizeAddress = (poi: any) => (
  [poi.district, Array.isArray(poi.address) ? poi.address.join('') : poi.address]
    .filter(Boolean)
    .join(' ')
)

const toLocationPoint = (poi: any, fallbackName: string): LocationPoint | null => {
  const location = poi?.location
  const longitude = Number(location?.lng)
  const latitude = Number(location?.lat)
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null

  return {
    name: poi.name || fallbackName,
    address: normalizeAddress(poi),
    latitude,
    longitude,
  }
}

const searchPoiSuggestions = async (keyword: string): Promise<LocationPoint[]> => {
  const trimmedKeyword = keyword.trim()
  if (trimmedKeyword.length < 2) return []

  const AMap = await loadAMapPlugin('AMap.AutoComplete')
  const autocomplete = new AMap.AutoComplete({ city: '全国', citylimit: false })

  return new Promise((resolve, reject) => {
    autocomplete.search(trimmedKeyword, (status: string, result: any) => {
      if (status === 'complete') {
        const tips = Array.isArray(result?.tips) ? result.tips : []
        resolve(tips.map((tip: any) => toLocationPoint(tip, trimmedKeyword)).filter(Boolean).slice(0, 8))
        return
      }
      if (status === 'no_data') {
        resolve([])
        return
      }
      reject(new Error(result?.info || '地点搜索失败'))
    })
  })
}

const getLocationByKeyword = async (keyword: string): Promise<LocationPoint> => {
  const suggestions = await searchPoiSuggestions(keyword)
  if (suggestions[0]) return suggestions[0]

  const AMap = await loadAMapPlugin('AMap.Geocoder')
  const geocoder = new AMap.Geocoder({ city: '全国' })
  return new Promise((resolve, reject) => {
    geocoder.getLocation(keyword, (status: string, result: any) => {
      const location = toLocationPoint(result?.geocodes?.[0], keyword)
      if (status === 'complete' && location) resolve(location)
      else reject(new Error(`无法识别地点：${keyword}`))
    })
  })
}

const serializePolyline = (points: Array<[number, number]>) => JSON.stringify(points)

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

const calculateStraightDistanceMeters = (origin: LocationPoint, destination: LocationPoint) => {
  const earthRadiusMeters = 6371000
  const toRadians = (degrees: number) => degrees * Math.PI / 180
  const originLatitude = toRadians(origin.latitude)
  const destinationLatitude = toRadians(destination.latitude)
  const latitudeDelta = toRadians(destination.latitude - origin.latitude)
  const longitudeDelta = toRadians(destination.longitude - origin.longitude)
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) ** 2
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const flattenRoutePolyline = (route: any): Array<[number, number]> => {
  const steps = Array.isArray(route?.steps) ? route.steps : []
  return steps.flatMap((step: any) => (
    Array.isArray(step?.path)
      ? step.path
        .map((point: any) => [Number(point.lng), Number(point.lat)] as [number, number])
        .filter((point: [number, number]) => Number.isFinite(point[0]) && Number.isFinite(point[1]))
      : []
  ))
}

const getRouteDistance = async (
  originText: string,
  destinationText: string,
  transportMode: string,
  knownOrigin?: LocationPoint | null,
  knownDestination?: LocationPoint | null,
): Promise<RouteCalculationResult> => {
  const routeMode = routeModeByTransport[transportMode] || 'driving'
  const [origin, destination] = await Promise.all([
    knownOrigin || getLocationByKeyword(originText),
    knownDestination || getLocationByKeyword(destinationText),
  ])
  const straightPolyline = serializePolyline([
    [origin.longitude, origin.latitude],
    [destination.longitude, destination.latitude],
  ])

  if (routeMode === 'straight') {
    const distanceMeters = calculateStraightDistanceMeters(origin, destination)
    return {
      distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
      durationMinutes: null,
      sourceLabel: '已按两点直线距离估算',
      origin,
      destination,
      routePolyline: straightPolyline,
    }
  }

  const pluginName = routeMode === 'walking'
    ? 'AMap.Walking'
    : routeMode === 'riding'
      ? 'AMap.Riding'
      : 'AMap.Driving'
  const AMap = await loadAMapPlugin(pluginName)
  const RoutePlanner = routeMode === 'walking'
    ? AMap.Walking
    : routeMode === 'riding'
      ? AMap.Riding
      : AMap.Driving
  const planner = new RoutePlanner({ city: '全国' })

  return new Promise((resolve, reject) => {
    planner.search(
      new AMap.LngLat(origin.longitude, origin.latitude),
      new AMap.LngLat(destination.longitude, destination.latitude),
      (status: string, result: any) => {
        const route = result?.routes?.[0]
        if (status === 'complete' && route?.distance !== undefined) {
          const routePoints = flattenRoutePolyline(route)
          resolve({
            distanceKm: Math.round((Number(route.distance) / 1000) * 10) / 10,
            durationMinutes: route.time !== undefined ? Math.round(Number(route.time) / 60) : null,
            sourceLabel: routeMode === 'driving' ? '已按驾车路线估算' : routeMode === 'walking' ? '已按步行路线估算' : '已按骑行路线估算',
            origin,
            destination,
            routePolyline: routePoints.length > 1 ? serializePolyline(routePoints) : straightPolyline,
          })
        } else {
          reject(new Error(result?.info || '没有找到可用路线，请补充更具体的起点和终点。'))
        }
      },
    )
  })
}

const getTimelineImageUrl = (storagePath: string) => (
  supabase.storage.from('trip-images').getPublicUrl(storagePath).data.publicUrl
)

const compressImageToWebp = async (file: File) => {
  const bitmap = await createImageBitmap(file)
  const maxSide = 1920
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
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
    canvas.toBlob(resolve, 'image/webp', 0.86)
  })
  if (!blob) throw new Error('图片压缩失败')

  return { blob, width, height }
}

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
  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [mapCalculating, setMapCalculating] = useState(false)
  const [reordering, setReordering] = useState(false)

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
        .select('id, role')
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
        .select('*, created_by_member:trip_members!timeline_entries_created_by_member_id_fkey(display_name), travel_segments(*), images:timeline_entry_images(*)')
        .eq('trip_id', currentTrip.id)
        .eq('day_id', activeDay.id)
        .order('sort_order', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: false })
      if (error) throw error
      return data as unknown as TimelineEntry[]
    },
    enabled: !!activeDay,
  })

  const sortedEntries = useMemo(() => sortTimelineEntries(entries || []), [entries])
  const sortableEntryIds = useMemo(() => sortedEntries.map((entry) => entry.id), [sortedEntries])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 140, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const updateForm = <K extends keyof EntryForm>(key: K, value: EntryForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSelectImages = (files: FileList | null) => {
    if (!files) return
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'))
    setPendingImageFiles((current) => [...current, ...imageFiles].slice(0, 12))
  }

  const handleRemovePendingImage = (index: number) => {
    setPendingImageFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))
  }

  const openNewForm = (type: TimelineEntryType) => {
    setForm(emptyForm(type))
    setPendingImageFiles([])
    setEditingEntry(null)
    setPickerOpen(false)
    setFormOpen(true)
  }

  const openEditForm = (entry: TimelineEntry) => {
    const segment = entry.travel_segments?.[0]
    setEditingEntry(entry)
    setPendingImageFiles([])
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
      origin_address: segment?.origin_address || '',
      origin_latitude: segment?.origin_latitude !== null && segment?.origin_latitude !== undefined ? String(segment.origin_latitude) : '',
      origin_longitude: segment?.origin_longitude !== null && segment?.origin_longitude !== undefined ? String(segment.origin_longitude) : '',
      destination_name: segment?.destination_name || '',
      destination_address: segment?.destination_address || '',
      destination_latitude: segment?.destination_latitude !== null && segment?.destination_latitude !== undefined ? String(segment.destination_latitude) : '',
      destination_longitude: segment?.destination_longitude !== null && segment?.destination_longitude !== undefined ? String(segment.destination_longitude) : '',
      transport_mode: segment?.transport_mode || 'rental_car',
      departure_time: segment?.departure_time?.slice(0, 5) || '',
      arrival_time: segment?.arrival_time?.slice(0, 5) || '',
      distance_km: segment?.distance_km !== null && segment?.distance_km !== undefined ? String(segment.distance_km) : '',
      distance_source: segment?.distance_source || 'unknown',
      route_duration_minutes: segment?.duration_minutes !== null && segment?.duration_minutes !== undefined ? String(segment.duration_minutes) : '',
      route_polyline: segment?.route_polyline || '',
      latitude: entry.latitude !== null && entry.latitude !== undefined ? String(entry.latitude) : '',
      longitude: entry.longitude !== null && entry.longitude !== undefined ? String(entry.longitude) : '',
      note: segment?.note || '',
      include_in_guide: entry.include_in_guide ?? true,
    })
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingEntry(null)
    setPendingImageFiles([])
    setSaving(false)
    setMapCalculating(false)
  }

  const buildEntryPayload = () => {
    const isTransport = form.type === 'transport'
    const startTime = isTransport ? form.departure_time : form.start_time
    const endTime = isTransport ? form.arrival_time : form.end_time
    const routeDuration = form.route_duration_minutes.trim() ? Number(form.route_duration_minutes) : null
    const duration = calculateDuration(startTime, endTime) ?? (isTransport ? routeDuration : null)
    const latitude = form.latitude.trim() ? Number(form.latitude) : null
    const longitude = form.longitude.trim() ? Number(form.longitude) : null
    const tags = form.tagsText
      .split(/[、,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean)

    return {
      trip_id: currentTrip.id,
      day_id: activeDay!.id,
      type: form.type,
      title: isTransport ? `${form.origin_name.trim()} → ${form.destination_name.trim()}` : (form.title.trim() || form.place_name.trim()),
      content: isTransport ? (form.note.trim() || null) : (form.content.trim() || null),
      start_time: startTime || null,
      end_time: endTime || null,
      duration_minutes: duration,
      place_name: isTransport ? null : (form.place_name.trim() || null),
      address: isTransport ? null : (form.address.trim() || null),
      latitude: isTransport ? null : latitude,
      longitude: isTransport ? null : longitude,
      recommend_level: isTransport ? null : form.recommend_level,
      rating: !isTransport && form.rating ? Number(form.rating) : null,
      tags,
      sort_order: editingEntry?.sort_order ?? ((entries?.length || 0) + 1),
      created_by_member_id: currentMember?.id || null,
      include_in_guide: form.include_in_guide,
      updated_at: new Date().toISOString(),
    }
  }

  const buildSegmentPayload = (timelineEntryId: string, sortOrder: number) => {
    const distance = form.distance_km.trim() ? Number(form.distance_km) : null
    const routeDuration = form.route_duration_minutes.trim() ? Number(form.route_duration_minutes) : null
    const originLatitude = form.origin_latitude.trim() ? Number(form.origin_latitude) : null
    const originLongitude = form.origin_longitude.trim() ? Number(form.origin_longitude) : null
    const destinationLatitude = form.destination_latitude.trim() ? Number(form.destination_latitude) : null
    const destinationLongitude = form.destination_longitude.trim() ? Number(form.destination_longitude) : null

    return {
      trip_id: currentTrip.id,
      day_id: activeDay!.id,
      timeline_entry_id: timelineEntryId,
      origin_name: form.origin_name.trim(),
      destination_name: form.destination_name.trim(),
      origin_address: form.origin_address.trim() || null,
      destination_address: form.destination_address.trim() || null,
      origin_latitude: originLatitude,
      origin_longitude: originLongitude,
      destination_latitude: destinationLatitude,
      destination_longitude: destinationLongitude,
      transport_mode: form.transport_mode,
      departure_time: form.departure_time || null,
      arrival_time: form.arrival_time || null,
      duration_minutes: calculateDuration(form.departure_time, form.arrival_time) ?? routeDuration,
      distance_km: distance,
      distance_source: distance === null ? 'unknown' : form.distance_source,
      route_polyline: form.route_polyline || null,
      note: form.note.trim() || null,
      sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    }
  }

  const uploadPendingImages = async (entryId: string) => {
    if (!activeDay || !currentMember || pendingImageFiles.length === 0) return

    const existingCount = editingEntry?.images?.length || 0
    for (const [index, file] of pendingImageFiles.entries()) {
      const { blob, width, height } = await compressImageToWebp(file)
      const storagePath = `${currentTrip.id}/${entryId}/${crypto.randomUUID()}.webp`
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
          trip_id: currentTrip.id,
          day_id: activeDay.id,
          timeline_entry_id: entryId,
          storage_path: storagePath,
          original_name: file.name,
          mime_type: 'image/webp',
          width,
          height,
          size_bytes: blob.size,
          sort_order: existingCount + index + 1,
          created_by_member_id: currentMember.id,
        })

      if (imageError) throw imageError
    }
  }

  const handleDeleteImage = async (image: TimelineImage) => {
    if (!window.confirm('确认删除这张图片吗？')) return

    const { error: storageError } = await supabase.storage.from('trip-images').remove([image.storage_path])
    if (storageError) {
      alert(storageError.message)
      return
    }

    const { error } = await supabase.from('timeline_entry_images').delete().eq('id', image.id)
    if (error) {
      alert(error.message)
      return
    }

    if (activeDay) {
      queryClient.invalidateQueries({ queryKey: ['timelineEntries', currentTrip.id, activeDay.id] })
    }
    if (editingEntry) {
      setEditingEntry({
        ...editingEntry,
        images: (editingEntry.images || []).filter((item) => item.id !== image.id),
      })
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

    if (form.type !== 'transport' && !form.title.trim() && !form.place_name.trim()) {
      alert('请填写标题或地点')
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

      if (entryId) {
        await uploadPendingImages(entryId)
      }

      await queryClient.invalidateQueries({ queryKey: ['timelineEntries', currentTrip.id, activeDay.id] })
      closeForm()
    } catch (error: any) {
      alert(error.message)
      setSaving(false)
    }
  }

  const handleDelete = async (entry: TimelineEntry) => {
    if (entry.created_by_member_id !== currentMember?.id && currentMember?.role !== 'owner') {
      alert('只有记录作者或旅程创建者可以删除这条记录')
      return
    }

    if (!window.confirm('确认删除这条行程记录吗？')) return

    const { error } = await supabase.from('timeline_entries').delete().eq('id', entry.id)
    if (error) {
      alert(error.message)
      return
    }

    queryClient.invalidateQueries({ queryKey: ['timelineEntries', currentTrip.id, activeDay?.id] })
  }

  const persistEntryOrder = async (orderedEntries: TimelineEntry[]) => {
    if (!activeDay) return
    setReordering(true)
    try {
      const entryResults = await Promise.all(orderedEntries.map((entry, index) => (
        supabase
          .from('timeline_entries')
          .update({ sort_order: index + 1 })
          .eq('id', entry.id)
      )))
      const entryError = entryResults.find((result) => result.error)?.error
      if (entryError) throw entryError

      const segmentUpdates = orderedEntries
        .filter((entry) => entry.type === 'transport')
        .map((entry, index) => (
          supabase
            .from('travel_segments')
            .update({ sort_order: index + 1 })
            .eq('timeline_entry_id', entry.id)
        ))

      const segmentResults = await Promise.all(segmentUpdates)
      const segmentError = segmentResults.find((result) => result.error)?.error
      if (segmentError) throw segmentError

      await queryClient.invalidateQueries({ queryKey: ['timelineEntries', currentTrip.id, activeDay.id] })
    } catch (error: any) {
      alert(error.message || '排序保存失败')
    } finally {
      setReordering(false)
    }
  }

  const handleAutoSortEntries = () => {
    if (sortedEntries.length < 2) return
    persistEntryOrder(sortEntriesByTime(sortedEntries))
  }

  const handleMoveEntry = (entryId: string, direction: -1 | 1) => {
    const currentIndex = sortedEntries.findIndex((entry) => entry.id === entryId)
    const nextIndex = currentIndex + direction
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= sortedEntries.length) return

    const nextEntries = [...sortedEntries]
    const currentEntry = nextEntries[currentIndex]
    nextEntries[currentIndex] = nextEntries[nextIndex]
    nextEntries[nextIndex] = currentEntry
    persistEntryOrder(nextEntries)
  }

  const handleSortDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const sourceIndex = sortedEntries.findIndex((entry) => entry.id === active.id)
    const targetIndex = sortedEntries.findIndex((entry) => entry.id === over.id)
    if (sourceIndex < 0 || targetIndex < 0) return

    const nextEntries = [...sortedEntries]
    const [movedEntry] = nextEntries.splice(sourceIndex, 1)
    nextEntries.splice(targetIndex, 0, movedEntry)
    persistEntryOrder(nextEntries)
  }

  const getKnownPoint = (
    name: string,
    address: string,
    latitude: string,
    longitude: string,
  ): LocationPoint | null => {
    const parsedLatitude = latitude.trim() ? Number(latitude) : null
    const parsedLongitude = longitude.trim() ? Number(longitude) : null
    if (parsedLatitude === null || parsedLongitude === null || !Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
      return null
    }
    return {
      name: name.trim(),
      address: address.trim(),
      latitude: parsedLatitude,
      longitude: parsedLongitude,
    }
  }

  const handleMapCalculate = async () => {
    const origin = form.origin_name.trim()
    const destination = form.destination_name.trim()
    if (!origin || !destination) {
      alert('请先填写起点和终点')
      return
    }

    if (form.distance_source === 'manual' && form.distance_km.trim()) {
      const shouldOverwrite = window.confirm('当前距离已手动修改。重新计算会覆盖手动距离，是否继续？')
      if (!shouldOverwrite) return
    }

    setMapCalculating(true)
    try {
      const result = await getRouteDistance(
        origin,
        destination,
        form.transport_mode,
        getKnownPoint(form.origin_name, form.origin_address, form.origin_latitude, form.origin_longitude),
        getKnownPoint(form.destination_name, form.destination_address, form.destination_latitude, form.destination_longitude),
      )
      setForm((current) => ({
        ...current,
        origin_name: result.origin.name,
        origin_address: result.origin.address,
        origin_latitude: String(result.origin.latitude),
        origin_longitude: String(result.origin.longitude),
        destination_name: result.destination.name,
        destination_address: result.destination.address,
        destination_latitude: String(result.destination.latitude),
        destination_longitude: String(result.destination.longitude),
        distance_km: String(result.distanceKm),
        distance_source: 'auto',
        route_duration_minutes: result.durationMinutes !== null ? String(result.durationMinutes) : current.route_duration_minutes,
        route_polyline: result.routePolyline,
      }))
      alert(`${result.sourceLabel}：${result.distanceKm} km${result.durationMinutes !== null ? `，约 ${formatDuration(result.durationMinutes)}` : ''}`)
    } catch (error: any) {
      alert(error.message || '高德地图计算失败')
    } finally {
      setMapCalculating(false)
    }
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

      {sortedEntries.length > 0 && (
        <DailyRouteMap entries={sortedEntries} activeDateLabel={formatDateLabel(activeDateLabel)} />
      )}

      {daysLoading || entriesLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-white/20" />
        </div>
      ) : sortedEntries.length > 0 ? (
        <div className="space-y-4">
          <div className="glass-card rounded-[24px] border border-white/10 p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black text-white">当天记录排序</h3>
                <p className="mt-1 text-xs font-bold text-white/45">拖动记录右侧手柄调整顺序，也可以按时间整理。</p>
              </div>
              <button
                type="button"
                onClick={handleAutoSortEntries}
                disabled={reordering || sortedEntries.length < 2}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-black text-white hover:bg-white/15 disabled:opacity-40"
              >
                {reordering ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpDown className="h-4 w-4" />}
                按时间整理
              </button>
            </div>
          </div>

          <div className="relative space-y-4">
            <div className="absolute left-6 top-4 bottom-4 w-px bg-white/10 hidden sm:block" />
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSortDragEnd}>
              <SortableContext items={sortableEntryIds} strategy={verticalListSortingStrategy}>
                <AnimatePresence mode="popLayout">
                  {sortedEntries.map((entry, index) => (
                    <TimelineCard
                      key={entry.id}
                      entry={entry}
                      index={index}
                      canMoveUp={index > 0}
                      canMoveDown={index < sortedEntries.length - 1}
                      moving={reordering}
                      onMoveUp={() => handleMoveEntry(entry.id, -1)}
                      onMoveDown={() => handleMoveEntry(entry.id, 1)}
                      onEdit={() => openEditForm(entry)}
                      onDelete={() => handleDelete(entry)}
                      canDelete={entry.created_by_member_id === currentMember?.id || currentMember?.role === 'owner'}
                    />
                  ))}
                </AnimatePresence>
              </SortableContext>
            </DndContext>
          </div>
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
              mapCalculating={mapCalculating}
              onClose={closeForm}
              onSave={handleSave}
              onChange={updateForm}
              onMapCalculate={handleMapCalculate}
              existingImages={editingEntry?.images || []}
              pendingImageFiles={pendingImageFiles}
              onSelectImages={handleSelectImages}
              onRemovePendingImage={handleRemovePendingImage}
              onDeleteImage={handleDeleteImage}
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

function DailyRouteMap({ entries, activeDateLabel }: { entries: TimelineEntry[]; activeDateLabel: string }) {
  const [containerId] = useState(() => `daily-route-map-${crypto.randomUUID()}`)
  const [mapError, setMapError] = useState('')
  const [mapStyle, setMapStyle] = useState(mapStyleOptions[0].value)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const mapPoints = useMemo(() => {
    const points: Array<{ name: string; address?: string | null; longitude: number; latitude: number; type: TimelineEntryType }> = []

    entries.forEach((entry) => {
      const segment = entry.travel_segments?.[0]
      if (entry.type === 'transport' && segment) {
        if (segment.origin_longitude !== null && segment.origin_latitude !== null) {
          points.push({
            name: segment.origin_name,
            address: segment.origin_address,
            longitude: segment.origin_longitude,
            latitude: segment.origin_latitude,
            type: entry.type,
          })
        }
        if (segment.destination_longitude !== null && segment.destination_latitude !== null) {
          points.push({
            name: segment.destination_name,
            address: segment.destination_address,
            longitude: segment.destination_longitude,
            latitude: segment.destination_latitude,
            type: entry.type,
          })
        }
        return
      }

      if (entry.longitude !== null && entry.latitude !== null && entry.place_name) {
        points.push({
          name: entry.place_name,
          address: entry.address,
          longitude: entry.longitude,
          latitude: entry.latitude,
          type: entry.type,
        })
      }
    })

    const seen = new Set<string>()
    return points.filter((point) => {
      const key = `${point.name}-${point.longitude}-${point.latitude}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
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
          mapStyle,
          showLabel: true,
          resizeEnable: true,
        })

        const markers = mapPoints.map((point, index) => new AMap.Marker({
          position: [point.longitude, point.latitude],
          anchor: 'bottom-center',
          title: point.name,
          offset: new AMap.Pixel(0, -2),
          content: `
            <svg width="34" height="43" viewBox="0 0 34 43" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 10px 14px rgba(15,23,42,.28));">
              <path d="M17 41C17 41 30 25.6 30 14.8C30 6.6 24.2 1 17 1C9.8 1 4 6.6 4 14.8C4 25.6 17 41 17 41Z" fill="#0EA5E9" stroke="white" stroke-width="2"/>
              <path d="M17 37C17 37 27 24.4 27 15C27 8.6 22.5 4 17 4C11.5 4 7 8.6 7 15C7 24.4 17 37 17 37Z" fill="#0284C7"/>
              <text x="17" y="20.2" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="900">${index + 1}</text>
            </svg>
          `,
        }))
        map.add(markers)

        const polylines = entries
          .map((entry) => entry.travel_segments?.[0])
          .filter((segment): segment is TravelSegment => Boolean(segment))
          .map((segment: TravelSegment) => {
            const routePoints = parsePolyline(segment.route_polyline)
            const path = routePoints.length > 1
              ? routePoints
              : segment.origin_longitude !== null && segment.origin_latitude !== null && segment.destination_longitude !== null && segment.destination_latitude !== null
                ? [
                    [segment.origin_longitude, segment.origin_latitude],
                    [segment.destination_longitude, segment.destination_latitude],
                  ] as Array<[number, number]>
                : []
            if (path.length < 2) return null
            return new AMap.Polyline({
              path,
              strokeColor: routePoints.length > 1 ? '#0ea5e9' : '#64748b',
              strokeWeight: routePoints.length > 1 ? 6 : 4,
              strokeOpacity: routePoints.length > 1 ? 0.82 : 0.55,
              strokeStyle: routePoints.length > 1 ? 'solid' : 'dashed',
              lineJoin: 'round',
              lineCap: 'round',
              showDir: routePoints.length > 1,
            })
          })
          .filter(Boolean)

        if (polylines.length > 0) map.add(polylines)
        map.setFitView([...markers, ...polylines], false, [42, 42, 42, 42])
        setMapError('')
      })
      .catch((error: any) => setMapError(error.message || '地图加载失败'))

    return () => {
      disposed = true
      if (map) map.destroy()
    }
  }, [containerId, entries, isFullscreen, mapPoints, mapStyle])

  if (mapPoints.length === 0) {
    return (
      <section className="mb-6 rounded-[28px] border border-white/10 bg-black/20 p-5">
        <div className="flex items-center gap-3 text-white/70">
          <MapPinned className="h-5 w-5" />
          <div>
            <h3 className="text-sm font-black text-white">今日地图</h3>
            <p className="mt-1 text-xs font-bold text-white/45">给记录选择高德地点后，这里会自动生成当天路线图。</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`overflow-hidden border border-white/10 bg-white/8 shadow-lg backdrop-blur-xl ${
      isFullscreen
        ? 'fixed inset-0 z-[120] m-0 rounded-none bg-zinc-950/95 p-3 sm:p-5'
        : 'mb-6 rounded-[30px]'
    }`}>
      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-black text-white">今日地图</h3>
          <p className="mt-1 text-xs font-bold text-white/45">{activeDateLabel} · {mapPoints.length} 个点位</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {mapStyleOptions.map((option) => {
              const isActive = option.value === mapStyle
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMapStyle(option.value)}
                  className={`shrink-0 rounded-full border px-3 py-2 text-xs font-black transition-all ${
                    isActive
                      ? 'border-white bg-white text-black'
                      : 'border-white/10 bg-black/15 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
          <button
            type="button"
            onClick={() => setIsFullscreen((value) => !value)}
            className="shrink-0 rounded-full border border-white/10 bg-black/15 p-2.5 text-white/65 hover:bg-white/10 hover:text-white"
            aria-label={isFullscreen ? '退出全屏地图' : '全屏查看地图'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="relative mx-3 mb-3 overflow-hidden rounded-[24px] border border-white/10 bg-white">
        <div id={containerId} className={`${isFullscreen ? 'h-[calc(100vh-156px)] sm:h-[calc(100vh-150px)]' : 'h-[280px] sm:h-[360px]'} w-full`} />
        <div className="pointer-events-none absolute left-3 right-3 bottom-3 flex gap-2 overflow-hidden">
          {mapPoints.slice(0, 5).map((point, index) => (
            <div key={`${point.name}-${point.longitude}-${point.latitude}-chip`} className="min-w-0 max-w-[160px] rounded-full border border-black/5 bg-white/90 px-3 py-2 text-xs font-black text-slate-900 shadow-lg backdrop-blur-md">
              <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] text-white">
                {index + 1}
              </span>
              <span className="align-middle">{point.name}</span>
            </div>
          ))}
        </div>
      </div>
      {mapError && (
        <div className="border-t border-white/10 px-5 py-3 text-xs font-bold text-rose-100/80">
          {mapError}
        </div>
      )}
    </section>
  )
}

function TimelineCard({
  entry,
  index,
  canMoveUp,
  canMoveDown,
  moving,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  canDelete,
}: {
  entry: TimelineEntry
  index: number
  canMoveUp: boolean
  canMoveDown: boolean
  moving: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onEdit: () => void
  onDelete: () => void
  canDelete: boolean
}) {
  const meta = getEntryMeta(entry.type)
  const Icon = meta.icon
  const segment = entry.travel_segments?.[0]
  const transportMeta = segment ? getTransportMeta(segment.transport_mode) : null
  const TransportIcon = transportMeta?.icon || Route
  const time = entry.start_time || segment?.departure_time
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id, disabled: moving })
  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
  }
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
      ref={setNodeRef}
      style={sortableStyle}
      layout
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: isDragging ? 0.55 : 1, y: 0, scale: isDragging ? 0.985 : 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.98 }}
      className="relative touch-manipulation rounded-[30px] sm:pl-16"
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
                <button
                  type="button"
                  disabled={moving}
                  {...attributes}
                  {...listeners}
                  className="cursor-grab touch-none rounded-xl p-2 text-white/35 hover:bg-white/10 hover:text-white active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-25"
                  aria-label="拖拽排序"
                  title="拖拽排序"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
                <div className="flex rounded-xl border border-white/10 bg-white/5">
                  <button
                    type="button"
                    onClick={onMoveUp}
                    disabled={!canMoveUp || moving}
                    className="p-2 text-white/45 hover:text-white disabled:opacity-25"
                    aria-label="上移记录"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onMoveDown}
                    disabled={!canMoveDown || moving}
                    className="p-2 text-white/45 hover:text-white disabled:opacity-25"
                    aria-label="下移记录"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>
                </div>
                <button type="button" onClick={onEdit} className="p-2 rounded-xl text-white/45 hover:text-white hover:bg-white/10">
                  <Edit2 className="w-4 h-4" />
                </button>
                {canDelete && (
                  <button type="button" onClick={onDelete} className="p-2 rounded-xl text-red-300/60 hover:text-red-200 hover:bg-red-400/10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {summary && <p className="mt-2 text-sm font-bold text-white/65">{summary}</p>}
            {(entry.content || segment?.note) && (
              <p className="mt-3 text-sm leading-6 text-white/75 break-words">{entry.content || segment?.note}</p>
            )}
            {entry.images && entry.images.length > 0 && (
              <TimelinePhotoStack images={entry.images} title={entry.title} />
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

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white/55 border border-white/10">
                {entry.created_by_member?.display_name ? `记录者：${entry.created_by_member.display_name}` : '记录者未知'}
              </span>
              <span className={`rounded-full px-3 py-1 text-[11px] font-black border ${
                entry.include_in_guide
                  ? 'bg-emerald-400/15 text-emerald-100 border-emerald-300/20'
                  : 'bg-white/5 text-white/45 border-white/10'
              }`}>
                {entry.include_in_guide ? '进入攻略素材' : '不进入攻略'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

function TimelinePhotoStack({ images, title }: { images: TimelineImage[]; title: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const featuredImages = images.slice(0, 3)

  const openGallery = (index: number) => {
    setActiveIndex(index)
    setIsOpen(true)
  }

  return (
    <>
      <div className="mt-4">
        <button
          type="button"
          onClick={() => openGallery(0)}
          className="group relative block w-full overflow-hidden rounded-[24px] border border-white/10 bg-black/20 text-left shadow-[0_18px_36px_rgba(0,0,0,0.22)]"
        >
          <div className="relative aspect-[16/10] sm:aspect-[21/9] overflow-hidden">
            <motion.img
              src={getTimelineImageUrl(images[0].storage_path)}
              alt={images[0].original_name || title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

            {featuredImages.slice(1).map((image, index) => (
              <motion.div
                key={image.id}
                className="absolute bottom-3 right-3 h-20 w-16 overflow-hidden rounded-2xl border border-white/30 bg-black/30 shadow-2xl sm:h-24 sm:w-20"
                initial={false}
                whileHover={{ y: -4, rotate: index === 0 ? 2 : -2 }}
                style={{
                  right: `${12 + index * 48}px`,
                  rotate: `${index === 0 ? -5 : 5}deg`,
                  zIndex: 3 - index,
                }}
              >
                <img
                  src={getTimelineImageUrl(image.storage_path)}
                  alt={image.original_name || `${title} 图片 ${index + 2}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </motion.div>
            ))}

            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className="rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur-md border border-white/10">
                {images.length} 张图片
              </span>
              <span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-black text-black flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5" />
                查看
              </span>
            </div>
          </div>
        </button>
      </div>

      <ModalPortal>
        <AnimatePresence>
          {isOpen && (
            <PhotoGalleryModal
              images={images}
              title={title}
              activeIndex={activeIndex}
              onActiveIndexChange={setActiveIndex}
              onClose={() => setIsOpen(false)}
            />
          )}
        </AnimatePresence>
      </ModalPortal>
    </>
  )
}

function PhotoGalleryModal({
  images,
  title,
  activeIndex,
  onActiveIndexChange,
  onClose,
}: {
  images: TimelineImage[]
  title: string
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  onClose: () => void
}) {
  const activeImage = images[activeIndex]
  const goToPrevious = () => onActiveIndexChange((activeIndex - 1 + images.length) % images.length)
  const goToNext = () => onActiveIndexChange((activeIndex + 1) % images.length)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') goToPrevious()
      if (event.key === 'ArrowRight') goToNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  if (!activeImage) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xl flex flex-col p-4 sm:p-6">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 pb-4">
        <div className="min-w-0">
          <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">PHOTO GALLERY</span>
          <h2 className="truncate text-lg sm:text-2xl font-black text-white mt-1">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-2xl border border-white/10 bg-white/10 p-3 text-white/75 hover:bg-white/15 hover:text-white"
          aria-label="关闭图片预览"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="relative mx-auto flex min-h-0 w-full max-w-6xl flex-1 items-center justify-center">
        {images.length > 1 && (
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-0 z-10 hidden rounded-full border border-white/10 bg-black/40 p-3 text-white/80 hover:bg-white hover:text-black sm:block"
            aria-label="上一张"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.img
            key={activeImage.id}
            src={getTimelineImageUrl(activeImage.storage_path)}
            alt={activeImage.original_name || title}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-h-full max-w-full rounded-[28px] object-contain shadow-[0_30px_90px_rgba(0,0,0,0.5)]"
          />
        </AnimatePresence>

        {images.length > 1 && (
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-0 z-10 hidden rounded-full border border-white/10 bg-black/40 p-3 text-white/80 hover:bg-white hover:text-black sm:block"
            aria-label="下一张"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="mx-auto mt-4 flex w-full max-w-6xl items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => onActiveIndexChange(index)}
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border transition-all sm:h-20 sm:w-20 ${
              index === activeIndex
                ? 'border-white opacity-100'
                : 'border-white/10 opacity-45 hover:opacity-85'
            }`}
          >
            <img
              src={getTimelineImageUrl(image.storage_path)}
              alt={image.original_name || `${title} 缩略图 ${index + 1}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

function EntryFormModal({
  form,
  saving,
  editing,
  mapCalculating,
  onClose,
  onSave,
  onChange,
  onMapCalculate,
  existingImages,
  pendingImageFiles,
  onSelectImages,
  onRemovePendingImage,
  onDeleteImage,
}: {
  form: EntryForm
  saving: boolean
  editing: boolean
  mapCalculating: boolean
  onClose: () => void
  onSave: (event: React.FormEvent) => void
  onChange: <K extends keyof EntryForm>(key: K, value: EntryForm[K]) => void
  onMapCalculate: () => void
  existingImages: TimelineImage[]
  pendingImageFiles: File[]
  onSelectImages: (files: FileList | null) => void
  onRemovePendingImage: (index: number) => void
  onDeleteImage: (image: TimelineImage) => void
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
                <LocationSearchInput
                  value={form.origin_name}
                  placeholder="例如：海口美兰机场"
                  selectedAddress={form.origin_address}
                  onInputChange={(value) => {
                    onChange('origin_name', value)
                    onChange('origin_address', '')
                    onChange('origin_latitude', '')
                    onChange('origin_longitude', '')
                    onChange('route_polyline', '')
                  }}
                  onSelect={(location) => {
                    onChange('origin_name', location.name)
                    onChange('origin_address', location.address)
                    onChange('origin_latitude', String(location.latitude))
                    onChange('origin_longitude', String(location.longitude))
                    onChange('route_polyline', '')
                  }}
                />
              </Field>
              <Field label="终点">
                <LocationSearchInput
                  value={form.destination_name}
                  placeholder="例如：文昌酒店"
                  selectedAddress={form.destination_address}
                  onInputChange={(value) => {
                    onChange('destination_name', value)
                    onChange('destination_address', '')
                    onChange('destination_latitude', '')
                    onChange('destination_longitude', '')
                    onChange('route_polyline', '')
                  }}
                  onSelect={(location) => {
                    onChange('destination_name', location.name)
                    onChange('destination_address', location.address)
                    onChange('destination_latitude', String(location.latitude))
                    onChange('destination_longitude', String(location.longitude))
                    onChange('route_polyline', '')
                  }}
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
                  onChange={(event) => {
                    onChange('distance_km', event.target.value)
                    onChange('distance_source', event.target.value ? 'manual' : 'unknown')
                    if (!event.target.value) onChange('route_duration_minutes', '')
                  }}
                  placeholder="手动填写，例如 92"
                  className="glass-input"
                />
              </Field>
              <button
                type="button"
                onClick={onMapCalculate}
                disabled={mapCalculating}
                className="h-[58px] rounded-2xl px-5 bg-white/10 hover:bg-white/15 disabled:bg-white/5 disabled:text-white/35 border border-white/15 text-white font-black flex items-center justify-center gap-2"
              >
                {mapCalculating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPinned className="w-4 h-4" />}
                {mapCalculating ? '计算中' : '计算距离与耗时'}
              </button>
            </div>

            {duration !== null && (
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/70">
                <Clock3 className="w-4 h-4" />
                已根据时间自动计算耗时：{formatDuration(duration)}
              </div>
            )}

            {duration === null && form.route_duration_minutes && (
              <div className="flex items-center gap-2 rounded-2xl border border-sky-300/15 bg-sky-400/10 px-4 py-3 text-sm font-bold text-sky-100/80">
                <MapPinned className="w-4 h-4" />
                高德路线预估耗时：{formatDuration(Number(form.route_duration_minutes))}
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

            <GuideToggle checked={form.include_in_guide} onChange={(checked) => onChange('include_in_guide', checked)} />
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
                <LocationSearchInput
                  value={form.place_name}
                  placeholder="地点/店名/酒店名"
                  selectedAddress={form.address}
                  onInputChange={(value) => {
                    onChange('place_name', value)
                    onChange('address', '')
                    onChange('latitude', '')
                    onChange('longitude', '')
                  }}
                  onSelect={(location) => {
                    onChange('place_name', location.name)
                    onChange('address', location.address)
                    onChange('latitude', String(location.latitude))
                    onChange('longitude', String(location.longitude))
                  }}
                />
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

            <GuideToggle checked={form.include_in_guide} onChange={(checked) => onChange('include_in_guide', checked)} />
          </div>
        )}

        <ImageUploadSection
          existingImages={existingImages}
          pendingImageFiles={pendingImageFiles}
          onSelectImages={onSelectImages}
          onRemovePendingImage={onRemovePendingImage}
          onDeleteImage={onDeleteImage}
        />

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

function LocationSearchInput({
  value,
  placeholder,
  selectedAddress,
  onInputChange,
  onSelect,
}: {
  value: string
  placeholder: string
  selectedAddress?: string
  onInputChange: (value: string) => void
  onSelect: (location: LocationPoint) => void
}) {
  const [suggestions, setSuggestions] = useState<LocationPoint[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const keyword = value.trim()
    if (keyword.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    let alive = true
    const timer = window.setTimeout(() => {
      setSearching(true)
      searchPoiSuggestions(keyword)
        .then((items) => {
          if (!alive) return
          setSuggestions(items)
          setOpen(items.length > 0)
        })
        .catch(() => {
          if (!alive) return
          setSuggestions([])
          setOpen(false)
        })
        .finally(() => {
          if (alive) setSearching(false)
        })
    }, 280)

    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [value])

  return (
    <div className="relative">
      <div className="relative">
        <input
          value={value}
          onChange={(event) => onInputChange(event.target.value)}
          onFocus={() => setOpen(suggestions.length > 0)}
          placeholder={placeholder}
          className="glass-input pr-11"
        />
        {searching ? (
          <Loader2 className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/35" />
        ) : (
          <MapPin className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        )}
      </div>

      {selectedAddress && (
        <div className="mt-2 flex items-start gap-2 rounded-2xl border border-emerald-300/15 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-50/75">
          <MapPinned className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-2">{selectedAddress}</span>
        </div>
      )}

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[95] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl">
          {suggestions.map((location) => (
            <button
              key={`${location.name}-${location.longitude}-${location.latitude}`}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onSelect(location)
                setOpen(false)
              }}
              className="block w-full px-4 py-3 text-left hover:bg-white/10"
            >
              <span className="block text-sm font-black text-white">{location.name}</span>
              <span className="mt-1 block truncate text-xs font-bold text-white/45">{location.address || '高德地点'}</span>
            </button>
          ))}
        </div>
      )}
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

function ImageUploadSection({
  existingImages,
  pendingImageFiles,
  onSelectImages,
  onRemovePendingImage,
  onDeleteImage,
}: {
  existingImages: TimelineImage[]
  pendingImageFiles: File[]
  onSelectImages: (files: FileList | null) => void
  onRemovePendingImage: (index: number) => void
  onDeleteImage: (image: TimelineImage) => void
}) {
  return (
    <section className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <ImagePlus className="w-4 h-4" />
            图片
          </h3>
          <p className="text-xs font-bold text-white/45 mt-1">上传前会压缩为 WebP，仅用于记录展示和生成攻略。</p>
        </div>
        <span className="text-[10px] font-black text-white/45 uppercase tracking-widest">
          {existingImages.length + pendingImageFiles.length}/12
        </span>
      </div>

      {existingImages.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {existingImages.map((image) => (
            <div key={image.id} className="relative aspect-square overflow-hidden rounded-2xl bg-black/20 border border-white/10">
              <img
                src={getTimelineImageUrl(image.storage_path)}
                alt={image.original_name || '行程图片'}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => onDeleteImage(image)}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1.5 text-white hover:bg-red-500"
                aria-label="删除图片"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {pendingImageFiles.length > 0 && (
        <div className="space-y-2">
          {pendingImageFiles.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-black/20 border border-white/10 px-3 py-2">
              <span className="min-w-0 truncate text-xs font-bold text-white/70">{file.name}</span>
              <button
                type="button"
                onClick={() => onRemovePendingImage(index)}
                className="shrink-0 rounded-xl p-1.5 text-white/45 hover:bg-white/10 hover:text-white"
                aria-label="移除待上传图片"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white/75 hover:bg-white/10 transition-all flex items-center justify-center gap-2 font-black">
          <Camera className="w-4 h-4" />
          拍照
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              onSelectImages(event.target.files)
              event.target.value = ''
            }}
          />
        </label>
        <label className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white/75 hover:bg-white/10 transition-all flex items-center justify-center gap-2 font-black">
          <ImagePlus className="w-4 h-4" />
          从相册选择
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              onSelectImages(event.target.files)
              event.target.value = ''
            }}
          />
        </label>
      </div>
    </section>
  )
}

function GuideToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full rounded-2xl border px-4 py-3.5 flex items-center justify-between gap-4 transition-all ${
        checked
          ? 'bg-emerald-400/15 border-emerald-300/20 text-emerald-50'
          : 'bg-white/5 border-white/10 text-white/55'
      }`}
    >
      <span className="flex items-center gap-3 min-w-0 text-left">
        <Newspaper className="w-5 h-5 shrink-0" />
        <span className="min-w-0">
          <span className="block text-sm font-black">{checked ? '进入攻略素材' : '不进入攻略'}</span>
          <span className="block text-xs font-bold opacity-70 mt-0.5">后续生成旅行攻略时会优先使用已勾选记录。</span>
        </span>
      </span>
      <span className={`shrink-0 w-11 h-6 rounded-full border p-0.5 transition-colors ${
        checked ? 'bg-white border-white' : 'bg-black/20 border-white/15'
      }`}>
        <span className={`block h-5 w-5 rounded-full transition-transform ${
          checked ? 'translate-x-5 bg-emerald-500' : 'translate-x-0 bg-white/50'
        }`} />
      </span>
    </button>
  )
}
