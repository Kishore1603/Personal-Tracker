'use client'

import { motion } from 'framer-motion'
import { signIn } from 'next-auth/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Zap, Target, Wallet, Film, Map, Trophy, Star, Shield } from 'lucide-react'

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

  useEffect(() => {
    if (session) router.push('/')
  }, [session, router])

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4">
      {/* Background orbs */}
      <FloatingOrb size={300} x="10%" y="10%" delay={0} color="#059669" />
      <FloatingOrb size={200} x="70%" y="60%" delay={2} color="#8b5cf6" />
      <FloatingOrb size={250} x="60%" y="5%" delay={4} color="#10b981" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-4xl">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          {/* Left: Features */}
          <div className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                  <Zap className="h-5 w-5 text-gray-900" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-xl">Life Tracker Pro</p>
                  <p className="text-xs text-emerald-400/70 uppercase tracking-widest">Your Personal Command Center</p>
                </div>
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Track Everything.
                <br />
                <span className="text-gradient">Level Up</span> Your Life.
              </h1>
              <p className="text-gray-500 mb-8 text-lg">
                A gamified personal tracker that turns your daily habits into an epic journey.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {features.map(({ icon: Icon, label, desc, color }) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${color}20` }}
                    >
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

          {/* Right: Sign in card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="rounded-2xl border border-gray-200 bg-gray-50 backdrop-blur-xl p-8 shadow-2xl"
          >
            {/* Mobile logo */}
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                <Zap className="h-5 w-5 text-gray-900" />
              </div>
              <p className="font-bold text-gray-900 text-xl">Life Tracker Pro</p>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
              <p className="text-gray-500 mt-2 text-sm">Sign in to continue your journey</p>
            </div>

            {/* Level preview */}
            <div className="flex items-center justify-center gap-4 mb-8 p-4 rounded-xl border border-gray-200 bg-gray-50">
              {['🌱', '⚡', '🔥', '💎', '🚀'].map((badge, i) => (
                <motion.span
                  key={badge}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="text-2xl"
                >
                  {badge}
                </motion.span>
              ))}
            </div>
            <p className="text-center text-xs text-gray-500 mb-6">Progress through 5 levels as you build habits</p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white text-gray-900 py-3 px-4 font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </motion.button>

            <div className="mt-6 flex items-center gap-2 text-center justify-center text-xs text-gray-500">
              <Shield className="h-3 w-3" />
              <span>Secure sign-in. We never share your data.</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
