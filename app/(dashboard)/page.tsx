'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/header'
import { TodayGoals } from '@/components/dashboard/today-goals'
import { StatsCard } from '@/components/dashboard/stats-card'
import { LevelProgressCard } from '@/components/dashboard/level-progress'
import { RewardCard } from '@/components/gamification/level-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Target, Flame, Zap, CheckCircle2, Plus, TrendingUp, Gift,
  Bell, BarChart2
} from 'lucide-react'
import { GoalForm } from '@/components/goals/goal-form'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

interface DashboardData {
  todayGoals: any[]
  completionRate: number
  activeStreaks: { goalId: string; title: string; streak: number; color: string }[]
  levelProgress: {
    level: number; name: string; badge: string; progressPercent: number
    totalPoints: number; pointsToNextLevel: number; color: string
  }
  unreadNotifications: number
  recentRewards: any[]
  weeklyStats: { day: string; completed: number; total: number }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [goalFormOpen, setGoalFormOpen] = useState(false)

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const completedToday = data?.todayGoals.filter(g => g.status === 'COMPLETED').length ?? 0
  const totalToday = data?.todayGoals.length ?? 0

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Dashboard"
        subtitle={`Today, ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`}
        unreadCount={data?.unreadNotifications}
        levelData={data?.levelProgress}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Today's Progress"
            value={`${data?.completionRate ?? 0}%`}
            subtitle={`${completedToday}/${totalToday} goals`}
            icon={CheckCircle2}
            color="#10b981"
            delay={0}
          />
          <StatsCard
            title="Active Streaks"
            value={data?.activeStreaks.length ?? 0}
            subtitle="Goals on fire 🔥"
            icon={Flame}
            color="#f59e0b"
            delay={0.05}
          />
          <StatsCard
            title="Total Points"
            value={(data?.levelProgress.totalPoints ?? 0).toLocaleString()}
            subtitle={`Level ${data?.levelProgress.level ?? 1} — ${data?.levelProgress.name ?? 'Initiate'}`}
            icon={Zap}
            color="#8b5cf6"
            delay={0.1}
          />
          <StatsCard
            title="Notifications"
            value={data?.unreadNotifications ?? 0}
            subtitle="Unread alerts"
            icon={Bell}
            color="#059669"
            delay={0.15}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today's goals */}
          <Card className="lg:col-span-2" glass>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-400" />
                  Today's Goals
                </CardTitle>
                <Button
                  size="sm"
                  variant="glass"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setGoalFormOpen(true)}
                >
                  Add Goal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TodayGoals goals={data?.todayGoals ?? []} onUpdate={fetchDashboard} />
            </CardContent>
          </Card>

          {/* Level progress */}
          <div className="space-y-4">
            <Card glass>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.levelProgress && (
                  <LevelProgressCard totalPoints={data.levelProgress.totalPoints} />
                )}
              </CardContent>
            </Card>

            {/* Quick links */}
            <Card glass>
              <CardContent className="py-4">
                <div className="grid grid-cols-2 gap-2">
                  {['Goals', 'Finance', 'Movies', 'Trips'].map((item) => (
                    <Link key={item} href={`/${item.toLowerCase()}`}>
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer"
                      >
                        <p className="text-xs font-medium text-gray-700">{item}</p>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weekly activity chart */}
          <Card glass>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-emerald-400" />
                Weekly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data?.weeklyStats && data.weeklyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.weeklyStats} barSize={24}>
                    <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                      labelStyle={{ color: '#fff' }}
                      itemStyle={{ color: '#059669' }}
                    />
                    <Bar dataKey="completed" name="Completed" radius={[6, 6, 0, 0]}>
                      {data.weeklyStats.map((entry, i) => (
                        <Cell key={i} fill={entry.completed === entry.total && entry.total > 0 ? '#10b981' : '#059669'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-44 items-center justify-center text-gray-500 text-sm">
                  No data yet — complete some goals!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active streaks */}
          <Card glass>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-400" />
                  Active Streaks
                </CardTitle>
                <Link href="/goals">
                  <Button size="sm" variant="ghost">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data?.activeStreaks.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-gray-500">
                  <Flame className="h-10 w-10 mb-2 opacity-20" />
                  <p className="text-sm">No active streaks yet</p>
                  <p className="text-xs opacity-70 mt-1">Complete goals to build streaks!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.activeStreaks.map((streak, i) => (
                    <motion.div
                      key={streak.goalId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3"
                    >
                      <div
                        className="h-8 w-1 rounded-full"
                        style={{ backgroundColor: streak.color }}
                      />
                      <p className="flex-1 text-sm font-medium text-gray-900 truncate">{streak.title}</p>
                      <div className="flex items-center gap-1">
                        <Flame className="h-4 w-4 text-orange-400" />
                        <span className="text-sm font-bold text-orange-400">{streak.streak}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent rewards */}
          {data?.recentRewards && data.recentRewards.length > 0 && (
            <Card glass className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-purple-400" />
                    Recent Rewards
                  </CardTitle>
                  <Link href="/rewards">
                    <Button size="sm" variant="ghost">See All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.recentRewards.slice(0, 4).map((reward: any, i: number) => (
                    <RewardCard key={reward.id} reward={reward} index={i} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <GoalForm open={goalFormOpen} onClose={() => setGoalFormOpen(false)} onSuccess={fetchDashboard} />
    </div>
  )
}
