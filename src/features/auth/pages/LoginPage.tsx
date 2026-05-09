import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import BlurText from '@/components/BlurText'
import FadeContent from '@/components/FadeContent'
import Particles from '@/components/Particles'
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        })
        if (error) throw error
        setMessage({ type: 'success', text: '注册成功！请检查邮箱确认。' })
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message === 'Invalid login credentials' ? '邮箱或密码错误' : error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      setMessage({ type: 'error', text: '请输入邮箱地址' })
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: '魔术链接已发送！请检查您的邮箱。' })
    }
    setLoading(false)
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-bg-primary">
      {/* Background Particles */}
      <div className="absolute inset-0 z-0">
        <Particles
          particleCount={80}
          particleColors={['#0EA5E9', '#F59E0B', '#10B981', '#FFFFFF']}
          particleBaseSize={1.5}
          speed={0.3}
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <FadeContent blur={true} duration={800}>
          <div className="flex flex-col items-center text-center mb-8">
            <BlurText
              text="航海日志"
              delay={150}
              animateBy="words"
              direction="top"
              className="text-5xl font-bold text-accent-primary"
            />
            <p className="mt-2 text-text-secondary tracking-widest uppercase text-sm">VoyageBoard · 协作旅行 HUD</p>
          </div>

          <div className="glass p-8 rounded-3xl shadow-2xl">
            <h2 className="text-2xl font-semibold mb-6 text-text-primary text-center">
              {isSignUp ? '创建账号' : '登录'}
            </h2>
            
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                  邮箱地址
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="glass-input w-full pl-11"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="glass-input w-full pl-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent-primary hover:bg-accent-primary/90 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  isSignUp ? '立即注册' : '登录'
                )}
              </button>

              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleMagicLink}
                  disabled={loading}
                  className="w-full text-accent-primary text-sm font-semibold hover:underline mt-2"
                >
                  使用魔术链接登录
                </button>
              )}
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setMessage(null)
                }}
                className="text-text-secondary text-sm hover:text-accent-primary transition-colors"
              >
                {isSignUp ? '已有账号？点击登录' : '还没有账号？立即注册'}
              </button>
            </div>

            {message && (
              <div className={`mt-6 p-4 rounded-xl text-sm ${
                message.type === 'success' ? 'bg-accent-success/10 text-accent-success border border-accent-success/20' : 'bg-accent-danger/10 text-accent-danger border border-accent-danger/20'
              }`}>
                {message.text}
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-sm text-text-muted">
            VoyageBoard 采用安全加密存储，保障您的旅程数据隐私。
          </p>
        </FadeContent>
      </div>
    </div>
  )
}
