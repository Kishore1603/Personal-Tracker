'use client'

import { useEffect, useState, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { RewardCard, LevelBadge } from '@/components/gamification/level-badge'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Trophy, Zap, Star, Target, Film, TrendingUp, Filter } from 'lucide-react'
import { getLevelInfo, getLevelProgress, LEVELS } from '@/lib/gamification'
import { formatDate } from '@/lib/utils'

interface Reward {
  id: string; points: number; source: string; description: string; createdAt: string
}
interface PointEvent {
  id: string; points: number; reason: string; source: string; createdAt: string
}

const SOURCE_ICONS: Record<string, any> = {
  DAILY_GOAL: Target, STREAK_7: Zap, STREAK_30: Zap, STREAK_100: Zap,
  RESOLUTION_MILESTONE: Star, RESOLUTION_COMPLETE: Trophy,
  MOVIE_MILESTONE_50: Film, MOVIE_MILESTONE_100: Film,
  LEVEL_UP: TrendingUp, MANUAL: Trophy, FINANCE_DISCIPLINE: TrendingUp,
}
const SOURCE_COLORS: Record<string, string> = {
  DAILY_GOAL: '#059669', STREAK_7: '#f59e0b', STREAK_30: '#f97316', STREAK_100: '#ef4444',
  RESOLUTION_MILESTONE: '#8b5cf6', RESOLUTION_COMPLETE: '#ec4899',
  MOVIE_MILESTONE_50: '#10b981', MOVIE_MILESTONE_100: '#10b981',
  LEVEL_UP: '#fbbf24', MANUAL: '#6b7280', FINANCE_DISCIPLINE: '#059669',
}

const SOURCE_GROUPS = [
  { key: 'ALL', label: 'All' },
  { key: 'GOALS', label: 'Goals', sources: ['DAILY_GOAL', 'STREAK_7', 'STREAK_30', 'STREAK_100'] },
  { key: 'RESOLUTIONS', label: 'Resolutions', sources: ['RESOLUTION_MILESTONE', 'RESOLUTION_COMPLETE'] },
  { key: 'MOVIES', label: 'Movies', sources: ['MOVIE_MILESTONE_50', 'MOVIE_MILESTONE_100'] },
  { key: 'LEVEL', label: 'Level Up', sources: ['LEVEL_UP'] },
]

export default function RewardsPage() {
  const { data: session } = useSession()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [pointEvents, setPointEvents] = useState<PointEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [rRes, gRes] = await Promise.all([fetch('/api/rewards'), fetch('/api/gamification')])
      if (rRes.ok) { const { data } = await rRes.json(); setRewards(data) }
      if (gRes.ok) { const { data } = await gRes.json(); setPointEvents(data.pointEvents || []) }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const totalPoints = (session?.user as any)?.totalPoints ?? 0
  const currentLevel = (session?.user as any)?.level ?? 1
  const levelInfo = getLevelInfo(totalPoints)
  const levelProgress = getLevelProgress(totalPoints)

  const filteredEvents = pointEvents.filter(e => {
    if (filter === 'ALL') return true
    const group = SOURCE_GROUPS.find(g => g.key === filter)
    return group?.sources?.includes(e.source) ?? true
  })

  return (
    <div className="flex flex-col h-full">
      <Header title="Rewards & Points" subtitle="Your achievements and point history" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Level card */}
        <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Current Level</p>
              <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <span>{levelInfo?.badge}</span>
                <span>Level {currentLevel}</span>
              </h2>
              <p className="text-yellow-400 font-medium">{levelInfo?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-yellow-400">{totalPoints}</p>
              <p className="text-sm text-gray-500">total points</p>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{levelProgress.pointsInLevel} pts in level</span>
              <span>{levelProgress.pointsToNextLevel > 0 ? `${levelProgress.pointsToNextLevel} to next` : 'Max level!'}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-500"
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress.progressPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* Level ladder */}
        <Card glass>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-500 mb-4">Level Progression</p>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {LEVELS.map((lvl, i) => (
                <div key={lvl.level} className="flex items-center gap-2 flex-shrink-0">
                  <div className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-2 text-center transition-all
                    ${currentLevel === lvl.level ? 'border-yellow-500/50 bg-yellow-500/10' :
                      currentLevel > lvl.level ? 'border-green-500/30 bg-green-500/5' : 'border-gray-200 bg-gray-50 opacity-50'}`}>
                    <span className="text-xl">{lvl.badge}</span>
                    <span className="text-xs font-medium text-gray-900">{lvl.name}</span>
                    <span className="text-xs text-gray-500">{lvl.minPoints}+ pts</span>
                  </div>
                  {i < LEVELS.length - 1 && <div className="h-px w-4 bg-gray-100 flex-shrink-0" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rewards unlocked */}
        {rewards.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Unlocked Rewards ({rewards.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rewards.map((r, i) => {
                const Icon = SOURCE_ICONS[r.source] || Trophy
                const color = SOURCE_COLORS[r.source] || '#6b7280'
                return (
                  <motion.div key={r.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                      style={{ backgroundColor: `${color}20` }}>
                      <Icon className="h-5 w-5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(r.createdAt)}</p>
                    </div>
                    <span className="text-sm font-bold text-yellow-400 flex-shrink-0">+{r.points}pts</span>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Point history */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">Point History</h3>
            <div className="flex gap-1">
              {SOURCE_GROUPS.map(g => (
                <button key={g.key} onClick={() => setFilter(g.key)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all
                    ${filter === g.key ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-500 hover:text-gray-700'}`}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No point events yet</div>
          ) : (
            <div className="space-y-2">
              {filteredEvents.map((e, i) => {
                const Icon = SOURCE_ICONS[e.source] || Zap
                const color = SOURCE_COLORS[e.source] || '#6b7280'
                return (
                  <motion.div key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
                      style={{ backgroundColor: `${color}20` }}>
                      <Icon className="h-4 w-4" style={{ color }} />
                    </div>
                    <p className="flex-1 text-sm text-gray-700">{e.reason}</p>
                    <span className="text-xs text-gray-400">{formatDate(e.createdAt)}</span>
                    <span className="text-sm font-bold text-yellow-400">+{e.points}</span>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
