'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Zap, Target, Wallet, Film, Map, Trophy, Star, Eye, EyeOff, Mail, Lock, User } from 'lucide-react'

const features = [
  { icon: Target, label: 'Daily Goals', desc: 'Track habits with streaks', color: '#059669' },
  { icon: Trophy, label: 'Resolutions', desc: 'Yearly milestone tracking', color: '#8b5cf6' },
  { icon: Wallet, label: 'Finance', desc: 'Multi-account management', color: '#10b981' },
  { icon: Film, label: 'Movies', desc: 'Build your watchlist', color: '#ec4899' },
  { icon: Map, label: 'Trips', desc: 'Travel expense tracking', color: '#f59e0b' },
  { icon: Star, label: 'Rewards', desc: 'Gamified achievements', color: '#ef4444' },
]

const FloatingOrb = ({ size, x, y, delay, color }: any) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: [0.1, 0.3, 0.1] }}
    transition={{ duration: 6, repeat: Infinity, delay }}
    className="absolute rounded-full blur-3xl"
    style={{ width: size, height: size, left: x, top: y, backgroundColor: color }}
  />
)

export default function SignInPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  useEffect(() => {
    if (session) router.push('/')
  }, [session, router])

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'signup') {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed')
        setLoading(false)
        return
      }
      setSuccess('Account created! Signing you in...')
    }

    const result = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    setLoading(false)
    if (result?.error) {
      setError(mode === 'signin' ? 'Invalid email or password.' : 'Sign-in failed after registration.')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="relative min-h-screen bg-gray-50 overflow-hidden flex items-center justify-center px-4">
      {/* Background orbs */}
      <FloatingOrb size={300} x="10%" y="10%" delay={0} color="#059669" />
      <FloatingOrb size={200} x="70%" y="60%" delay={2} color="#8b5cf6" />
      <FloatingOrb size={250} x="60%" y="5%" delay={4} color="#10b981" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-4xl">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          {/* Left: Features */}
          <div className="hidden lg:block">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-xl">Life Tracker Pro</p>
                  <p className="text-xs text-emerald-600 uppercase tracking-widest">Personal Command Center</p>
                </div>
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Track Everything.<br />
                <span className="text-emerald-600">Level Up</span> Your Life.
              </h1>
              <p className="text-gray-500 mb-8 text-lg">A gamified personal tracker that turns daily habits into an epic journey.</p>

              <div className="grid grid-cols-2 gap-3">
                {features.map(({ icon: Icon, label, desc, color }, i) => (
                  <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}20` }}>
                      <Icon className="h-4 w-4" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: Auth form */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <div className="rounded-2xl border border-gray-200 bg-white backdrop-blur-xl p-8 shadow-2xl">
              {/* Mobile logo */}
              <div className="flex items-center gap-3 mb-6 lg:hidden">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <p className="font-bold text-gray-900 text-lg">Life Tracker Pro</p>
              </div>

              {/* Tab toggle */}
              <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-1 mb-6">
                {(['signin', 'signup'] as const).map(m => (
                  <button key={m} type="button"
                    onClick={() => { setMode(m); setError(''); setSuccess('') }}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${mode === m ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                    {m === 'signin' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.form key={mode} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                  onSubmit={handleSubmit} className="space-y-4">

                  {mode === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="text" required value={form.name} placeholder="John Doe"
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="email" required value={form.email} placeholder="you@example.com"
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type={showPassword ? 'text' : 'password'} required value={form.password}
                        placeholder={mode === 'signup' ? 'Min 8 characters' : '••••••••'}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                      <button type="button" onClick={() => setShowPassword(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-700">
                      {success}
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60 transition-all">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                      </span>
                    ) : mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </button>

                  <p className="text-center text-xs text-gray-500">
                    {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                    <button type="button"
                      onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess('') }}
                      className="text-emerald-600 font-medium hover:underline">
                      {mode === 'signin' ? 'Create one' : 'Sign in'}
                    </button>
                  </p>
                </motion.form>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
