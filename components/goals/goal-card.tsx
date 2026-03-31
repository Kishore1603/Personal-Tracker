'use client'

import { motion } from 'framer-motion'
import { Flame, Trophy, Calendar, Edit2, Archive, MoreVertical, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { addToast } from '@/hooks/use-toast'

interface GoalCardProps {
  goal: {
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
  streak?: { currentStreak: number; longestStreak: number; totalCompleted: number }
  onEdit?: () => void
  onRefresh?: () => void
  index?: number
}

export function GoalCard({ goal, streak, onEdit, onRefresh, index = 0 }: GoalCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const color = goal.color || '#059669'

  const handleArchive = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !goal.isArchived }),
      })
      if (res.ok) {
        addToast({ type: 'success', title: goal.isArchived ? 'Goal restored!' : 'Goal archived' })
        onRefresh?.()
      }
    } catch {
      addToast({ type: 'error', title: 'Failed to update goal' })
    } finally {
      setLoading(false)
      setMenuOpen(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className="group relative rounded-2xl border border-gray-200 bg-gray-50 p-5 backdrop-blur-xl overflow-hidden"
    >
      {/* Color accent */}
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
        style={{ backgroundColor: color }}
      />
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{ background: `radial-gradient(ellipse at 0% 50%, ${color}10, transparent 60%)` }}
      />

      <div className="relative pl-2">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 mr-3">
            <h3 className="font-semibold text-gray-900 truncate">{goal.title}</h3>
            {goal.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{goal.description}</p>
            )}
          </div>

          {/* Menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-xl border border-gray-200 bg-gray-50 shadow-xl overflow-hidden">
                  <button
                    onClick={() => { onEdit?.(); setMenuOpen(false) }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={handleArchive}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    {goal.isArchived ? 'Restore' : 'Archive'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 flex-wrap">
          {streak && streak.currentStreak > 0 && (
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-bold text-orange-400">{streak.currentStreak}</span>
              <span className="text-xs text-gray-500">streak</span>
            </div>
          )}

          {streak && streak.longestStreak > 0 && (
            <div className="flex items-center gap-1">
              <Trophy className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-xs text-gray-500">Best: {streak.longestStreak}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs text-gray-500">{streak?.totalCompleted ?? 0} total</span>
          </div>

          <Badge variant="default" size="sm">
            +{goal.pointValue} pts
          </Badge>

          {goal.isScheduled && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-500" />
              <span className="text-xs text-gray-500">{goal.scheduleDays.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Reward */}
        {goal.reward && (
          <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-2.5 py-1.5 w-fit">
            <Star className="h-3 w-3 text-yellow-400" />
            <span className="text-xs text-yellow-400 truncate max-w-[200px]">{goal.reward}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
