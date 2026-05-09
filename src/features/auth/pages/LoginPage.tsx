import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import BlurText from '@/components/BlurText'
import FadeContent from '@/components/FadeContent'
import LightPillar from '@/components/LightPillar'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 如果已经登录，自动跳转到主页
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
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        
        // 如果 Supabase 返回了 session (说明不需要邮件确认)，则直接提示并等待状态更新跳转
        if (data.session) {
          setMessage({ type: 'success', text: '注册成功！正在为您登录...' })
        } else {
          setMessage({ type: 'success', text: '注册成功！请检查您的邮箱进行激活。' })
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        // 登录成功后，App.tsx 的监听器会更新 user 状态，上面的 useEffect 会处理跳转
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      let errorText = error.error_description || error.message
      
      if (error.status === 422) {
        if (error.message.includes('password')) {
          errorText = '密码太短，请至少输入 6 位字符。'
        } else if (error.message.includes('email')) {
          errorText = '请输入有效的电子邮箱地址。'
        }
      } else if (error.message === 'Invalid login credentials') {
        errorText = '邮箱或密码错误，请重试。'
      } else if (error.message === 'Email not confirmed') {
        errorText = '邮箱尚未激活，请检查邮件。'
      } else if (error.message === 'User already registered') {
        errorText = '该邮箱已注册，请直接登录。'
      }
      
      setMessage({ type: 'error', text: errorText })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-bg-base">
      {/* 极简高级背景 */}
      <div className="absolute inset-0 z-0">
        <LightPillar 
          intensity={1.2}
          rotationSpeed={0.5}
          pillarWidth={2.2}
          pillarHeight={0.4}
          pillarRotation={25}
          noiseIntensity={0}
        />
      </div>

      <div className="relative z-10 w-full max-w-[440px] px-6">
        <FadeContent blur={true} duration={1000}>
          <div className="flex flex-col items-center text-center mb-10">
            <BlurText
              text="旅行账本"
              delay={150}
              animateBy="words"
              direction="top"
              className="text-7xl font-black text-white tracking-tighter drop-shadow-[0_10px_50px_rgba(0,0,0,1)]"
            />
            <p className="mt-4 text-white tracking-[0.3em] font-black text-xs uppercase opacity-90 drop-shadow-[0_5px_15px_rgba(0,0,0,1)]">
              VoyageBoard · Collaborative Budgeting
            </p>
          </div>

          <div className="glass-card p-10 rounded-[40px] border-white/10 shadow-2xl relative overflow-hidden">
            {/* 装饰色块 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/10 rounded-full -mr-16 -mt-16 blur-3xl" />

            <h2 className="text-3xl font-black mb-10 text-white text-center tracking-tight">
              {isSignUp ? '立即注册' : '欢迎回来'}
            </h2>

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="email" className="block text-sm font-bold text-slate-200 ml-1 drop-shadow-sm">
                  电子邮箱
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-accent-blue transition-colors" />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="glass-input w-full pl-12 bg-white/5 border-white/10 focus:bg-white/10"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label htmlFor="password" className="block text-sm font-bold text-slate-200 ml-1 drop-shadow-sm">
                  登录密码
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-accent-blue transition-colors" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="glass-input w-full pl-12 pr-12 bg-white/5 border-white/10 focus:bg-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-accent-blue transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-3 mt-6"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="tracking-widest font-black">{isSignUp ? '注册' : '登录'}</span>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-white/5 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setMessage(null)
                }}
                className="text-slate-200 text-sm font-bold hover:text-white transition-all flex items-center justify-center gap-2 w-full"
              >
                {isSignUp ? '已有账号？点击登录' : '没有账号？立即创建！'}
              </button>
            </div>

            {message && (
              <div className={`mt-6 p-4 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                {message.text}
              </div>
            )}
          </div>
        </FadeContent>
      </div>
    </div>
  )
}
