import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTripStore } from '@/stores/useTripStore'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import LightPillar from '@/components/LightPillar'

type JoinState = 'loading' | 'joining' | 'success' | 'already_member' | 'error' | 'not_found' | 'need_login'

export default function JoinTripPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuthStore()
  const { setCurrentTrip } = useTripStore()
  const [state, setState] = useState<JoinState>('loading')
  const [tripTitle, setTripTitle] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return

    // If not logged in, save the invite link and redirect to login
    if (!user) {
      sessionStorage.setItem('pendingJoinTrip', tripId || '')
      setState('need_login')
      return
    }

    if (!tripId) {
      setState('not_found')
      return
    }

    joinTrip()
  }, [user, authLoading, tripId])

  const joinTrip = async () => {
    if (!tripId || !user) return

    setState('loading')

    // 1. Check if the trip exists
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single()

    if (tripError || !trip) {
      setState('not_found')
      return
    }

    setTripTitle(trip.title)

    // 2. Check if the user is already a member
    const { data: existing } = await supabase
      .from('trip_members')
      .select('id')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      setState('already_member')
      setCurrentTrip(trip)
      return
    }

    // 3. Join the trip
    setState('joining')
    const displayName = user.email?.split('@')[0] || '新成员'

    const { error: joinError } = await supabase
      .from('trip_members')
      .insert({
        trip_id: tripId,
        user_id: user.id,
        display_name: displayName,
        role: 'member',
      })

    if (joinError) {
      setErrorMsg(joinError.message)
      setState('error')
      return
    }

    setCurrentTrip(trip)
    setState('success')
  }

  const goToTrip = () => {
    navigate('/', { replace: true })
  }

  const goToLogin = () => {
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-bg-base">
      <div className="absolute inset-0 z-0">
        <LightPillar
          intensity={1.0}
          rotationSpeed={0.5}
          pillarWidth={2.2}
          pillarHeight={0.4}
          pillarRotation={25}
          noiseIntensity={0}
        />
      </div>

      <div className="relative z-10 w-full max-w-[440px] px-6">
        <div className="glass-card p-10 rounded-[40px] border-white/10 shadow-2xl text-center">

          {/* Loading */}
          {(state === 'loading' || state === 'joining') && (
            <div className="py-8 space-y-6">
              <Loader2 className="w-12 h-12 animate-spin text-white/30 mx-auto" />
              <div>
                <h2 className="text-2xl font-black text-white drop-shadow-md mb-2">
                  {state === 'joining' ? '正在加入旅程...' : '加载中...'}
                </h2>
                {tripTitle && (
                  <p className="text-white/70 font-medium drop-shadow-sm">{tripTitle}</p>
                )}
              </div>
            </div>
          )}

          {/* Success */}
          {state === 'success' && (
            <div className="py-8 space-y-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white drop-shadow-md mb-2">加入成功！</h2>
                <p className="text-white/70 font-medium drop-shadow-sm">
                  你已成功加入「{tripTitle}」
                </p>
              </div>
              <button
                onClick={goToTrip}
                className="btn-primary w-full h-14 mt-4"
              >
                <span className="tracking-[0.2em] font-black">进入旅程</span>
              </button>
            </div>
          )}

          {/* Already a member */}
          {state === 'already_member' && (
            <div className="py-8 space-y-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
                <CheckCircle2 className="w-8 h-8 text-blue-300" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white drop-shadow-md mb-2">你已在旅程中</h2>
                <p className="text-white/70 font-medium drop-shadow-sm">
                  你已经是「{tripTitle}」的成员了
                </p>
              </div>
              <button
                onClick={goToTrip}
                className="btn-primary w-full h-14 mt-4"
              >
                <span className="tracking-[0.2em] font-black">进入旅程</span>
              </button>
            </div>
          )}

          {/* Not found */}
          {state === 'not_found' && (
            <div className="py-8 space-y-6">
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto border border-rose-500/30">
                <AlertCircle className="w-8 h-8 text-rose-300" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white drop-shadow-md mb-2">旅程不存在</h2>
                <p className="text-white/70 font-medium drop-shadow-sm">
                  该邀请链接无效或旅程已被删除
                </p>
              </div>
              <button
                onClick={() => navigate('/trips', { replace: true })}
                className="btn-primary w-full h-14 mt-4"
              >
                <span className="tracking-[0.2em] font-black">返回我的旅程</span>
              </button>
            </div>
          )}

          {/* Need login */}
          {state === 'need_login' && (
            <div className="py-8 space-y-6">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto border border-amber-500/30">
                <AlertCircle className="w-8 h-8 text-amber-300" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white drop-shadow-md mb-2">请先登录</h2>
                <p className="text-white/70 font-medium drop-shadow-sm">
                  登录或注册后将自动加入该旅程
                </p>
              </div>
              <button
                onClick={goToLogin}
                className="btn-primary w-full h-14 mt-4"
              >
                <span className="tracking-[0.2em] font-black">前往登录</span>
              </button>
            </div>
          )}

          {/* Error */}
          {state === 'error' && (
            <div className="py-8 space-y-6">
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto border border-rose-500/30">
                <AlertCircle className="w-8 h-8 text-rose-300" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white drop-shadow-md mb-2">加入失败</h2>
                <p className="text-white/70 font-medium drop-shadow-sm">{errorMsg}</p>
              </div>
              <button
                onClick={() => navigate('/trips', { replace: true })}
                className="btn-primary w-full h-14 mt-4"
              >
                <span className="tracking-[0.2em] font-black">返回</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
