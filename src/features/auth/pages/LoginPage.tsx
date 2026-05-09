import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import BlurText from '@/components/BlurText'
import FadeContent from '@/components/FadeContent'
import Waves from '@/components/Waves'
import { Mail, Lock, Loader2, Eye, EyeOff, Ship } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        })
        if (error) throw error
        
        if (data.user && !data.session) {
          setMessage({ type: 'success', text: '账号已创建！请检查邮箱激活。' })
        } else if (data.session) {
          setMessage({ type: 'success', text: '注册成功并已自动登录！' })
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (error: any) {
      let errorText = error.message
      if (error.message === 'Invalid login credentials') {
        errorText = '邮箱或密码错误。如果您之前使用魔术链接登录，请先通过魔术链接进入后在设置中设置密码。'
      } else if (error.message === 'Email not confirmed') {
        errorText = '邮箱尚未激活，请检查邮件。'
      } else if (error.message === 'User already registered') {
        errorText = '该邮箱已注册。请直接尝试登录，或使用魔术链接找回访问权限。'
      }
      setMessage({ type: 'error', text: errorText })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#F0F9FF]">
      {/* 沉浸式海浪背景 */}
      <div className="absolute inset-0 z-0 opacity-40">
        <Waves
          lineColor="#0EA5E9"
          backgroundColor="transparent"
          waveSpeedX={0.01}
          waveSpeedY={0.01}
          waveAmpX={40}
          waveAmpY={20}
          friction={0.9}
          tension={0.01}
          maxCursorMove={1}
          xGap={10}
          yGap={30}
        />
      </div>

      <div className="relative z-10 w-full max-w-[440px] px-6">
        <FadeContent blur={true} duration={1000}>
          <div className="flex flex-col items-center text-center mb-10">
            <div className="bg-white p-4 rounded-2xl shadow-coastal mb-6">
              <Ship className="h-10 w-10 text-accent-primary" />
            </div>
            <BlurText
              text="航海日志"
              delay={150}
              animateBy="words"
              direction="top"
              className="text-6xl font-black text-slate-900 tracking-tighter"
            />
            <p className="mt-3 text-slate-500 tracking-[0.2em] font-bold text-xs uppercase opacity-80">
              VoyageBoard · Expedition HUD
            </p>
          </div>

          <div className="glass-strong p-10 rounded-[40px] border-none shadow-2xl relative overflow-hidden">
            {/* 装饰色块 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <h2 className="text-3xl font-black mb-8 text-slate-800 text-center tracking-tight">
              {isSignUp ? '加入启航' : '欢迎回来'}
            </h2>
            
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">
                  电子邮箱
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-accent-primary transition-colors" />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="glass-input w-full pl-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">
                  访问口令
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-accent-primary transition-colors" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="glass-input w-full pl-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-accent-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-3 mt-4"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span className="tracking-widest">{isSignUp ? '立即加入' : '全速进入'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setMessage(null)
                }}
                className="text-slate-500 text-sm font-bold hover:text-accent-primary transition-all flex items-center justify-center gap-2 w-full"
              >
                {isSignUp ? '已有航海执照？点击登录' : '新手上路？创建专属账号'}
              </button>
            </div>

            {message && (
              <div className={`mt-6 p-4 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300 ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {message.text}
              </div>
            )}
          </div>

          <p className="mt-10 text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
            VoyageBoard Encrypted Expedition HUD · 2026
          </p>
        </FadeContent>
      </div>
    </div>
  )
}
