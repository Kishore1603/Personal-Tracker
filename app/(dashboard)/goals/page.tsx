'use client'

import { useEffect, useState, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GoalCard } from '@/components/goals/goal-card'
import { GoalForm } from '@/components/goals/goal-form'
import { TodayGoals } from '@/components/dashboard/today-goals'
import { Badge } from '@/components/ui/badge'
import { Plus, Target, Archive, Activity } from 'lucide-react'
import { calculateGoalStreak } from '@/lib/streaks'
import { motion } from 'framer-motion'

interface Goal {
  id: string
  title: string
  description?: string | null
  color?: string | null
  isScheduled: boolean
  scheduleDays: string[]
  reward?: string | null
  pointValue: number
  isArchived: boolean
}

interface GoalWithStreak extends Goal {
  streak: { currentStreak: number; longestStreak: number; totalCompleted: number }
}

type TabType = 'active' | 'today' | 'archived'

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalWithStreak[]>([])
  const [todayGoals, setTodayGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabType>('today')
  const [formOpen, setFormOpen] = useState(false)
  const [editGoal, setEditGoal] = useState<any>(null)

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    try {
      const [goalsRes, todayRes] = await Promise.all([
        fetch('/api/goals'),
        fetch('/api/goals/today'),
      ])
      if (goalsRes.ok) {
        const { data } = await goalsRes.json()
        // Fetch streaks in parallel
        const withStreaks = await Promise.all(
          data.map(async (goal: Goal) => {
            const logsRes = await fetch(`/api/goals/${goal.id}/logs?limit=100`)
            const { streak } = logsRes.ok ? await logsRes.json() : { streak: { currentStreak: 0, longestStreak: 0, totalCompleted: 0 } }
            return { ...goal, streak: streak || { currentStreak: 0, longestStreak: 0, totalCompleted: 0 } }
          })
        )
        setGoals(withStreaks)
      }
      if (todayRes.ok) {
        const { data } = await todayRes.json()
        setTodayGoals(data)
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  const activeGoals = goals.filter(g => !g.isArchived)
  const archivedGoals = goals.filter(g => g.isArchived)

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'today', label: "Today", count: todayGoals.length },
    { key: 'active', label: "All Goals", count: activeGoals.length },
    { key: 'archived', label: "Archived", count: archivedGoals.length },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Daily Goals"
        subtitle="Build habits with streaks and rewards"
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          {/* Tabs */}
          <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                  tab === t.key
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                    tab === t.key ? 'bg-emerald-500/30 text-emerald-300' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => { setEditGoal(null); setFormOpen(true) }}
          >
            New Goal
          </Button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-500" />
          </div>
        ) : (
          <>
            {tab === 'today' && (
              <Card glass>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-400" />
                    Today's Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TodayGoals goals={todayGoals} onUpdate={fetchGoals} />
                </CardContent>
              </Card>
            )}

            {tab === 'active' && (
              <>
                {activeGoals.length === 0 ? (
                  <div className="flex flex-col items-center py-20 text-gray-500">
                    <Target className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No goals yet</p>
                    <p className="text-sm mt-1 opacity-70">Create your first goal to start tracking</p>
                    <Button className="mt-4" onClick={() => setFormOpen(true)} icon={<Plus className="h-4 w-4" />}>
                      Create Goal
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {activeGoals.map((goal, i) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        streak={goal.streak}
                        onEdit={() => { setEditGoal(goal); setFormOpen(true) }}
                        onRefresh={fetchGoals}
                        index={i}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === 'archived' && (
              <>
                {archivedGoals.length === 0 ? (
                  <div className="flex flex-col items-center py-20 text-gray-500">
                    <Archive className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-sm">No archived goals</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {archivedGoals.map((goal, i) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        streak={goal.streak}
                        onRefresh={fetchGoals}
                        index={i}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <GoalForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditGoal(null) }}
        onSuccess={fetchGoals}
        editData={editGoal}
      />
    </div>
  )
}
