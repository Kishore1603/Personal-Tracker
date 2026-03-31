'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Flame, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { addToast } from '@/hooks/use-toast'

interface TodayGoal {
  id: string
  goalId: string
  title: string
  description?: string | null
  color?: string | null
  icon?: string | null
  status: 'COMPLETED' | 'MISSED' | 'PENDING'
  streak: number
  reward?: string | null
}

interface TodayGoalsProps {
  goals: TodayGoal[]
  onUpdate?: () => void
}

function GoalItem({ goal, onToggle }: { goal: TodayGoal; onToggle: (id: string, completed: boolean) => void }) {
  const isCompleted = goal.status === 'COMPLETED'
  const isMissed = goal.status === 'MISSED'
  const color = goal.color || '#059669'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 3 }}
      className={cn(
        'flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 cursor-pointer',
        isCompleted
          ? 'border-green-500/30 bg-green-500/5'
          : isMissed
          ? 'border-red-500/20 bg-red-500/5 opacity-60'
          : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white/8'
      )}
      onClick={() => !isMissed && onToggle(goal.goalId, !isCompleted)}
    >
      {/* Checkbox */}
      <motion.div
        whileTap={{ scale: 0.85 }}
        className="flex-shrink-0"
        style={{ color: isCompleted ? '#10b981' : color }}
      >
        {isCompleted ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            <CheckCircle2 className="h-6 w-6" />
          </motion.div>
        ) : (
          <Circle className="h-6 w-6 opacity-60" />
        )}
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('font-medium truncate', isCompleted ? 'text-gray-500 line-through' : 'text-gray-900')}>
          {goal.title}
        </p>
        {goal.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{goal.description}</p>
        )}
      </div>

      {/* Streak */}
      {goal.streak > 0 && (
        <div className="flex items-center gap-1 shrink-0">
          <Flame className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-bold text-orange-400">{goal.streak}</span>
        </div>
      )}

      {/* Reward indicator */}
      {goal.reward && isCompleted && (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <Star className="h-4 w-4 text-yellow-400" />
        </motion.div>
      )}
    </motion.div>
  )
}

export function TodayGoals({ goals, onUpdate }: TodayGoalsProps) {
  const [updating, setUpdating] = useState<string | null>(null)

  const handleToggle = async (goalId: string, complete: boolean) => {
    setUpdating(goalId)
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await fetch(`/api/goals/${goalId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          status: complete ? 'COMPLETED' : 'PENDING',
        }),
      })

      if (res.ok) {
        if (complete) {
          addToast({ type: 'success', title: 'Goal completed! 🎉', message: 'Points added to your account' })
        }
        onUpdate?.()
      }
    } catch {
      addToast({ type: 'error', title: 'Failed to update goal' })
    } finally {
      setUpdating(null)
    }
  }

  const completed = goals.filter((g) => g.status === 'COMPLETED').length
  const total = goals.length
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="space-y-3">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">
          {completed} / {total} completed
        </span>
        <span
          className={cn(
            'text-lg font-bold',
            rate === 100 ? 'text-green-400' : rate >= 50 ? 'text-emerald-400' : 'text-gray-500'
          )}
        >
          {rate}%
        </span>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-gray-500">
          <CheckCircle2 className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">No goals scheduled for today</p>
          <p className="text-xs mt-1 opacity-70">Add goals to track your daily progress</p>
        </div>
      ) : (
        <motion.div className="space-y-2">
          {goals.map((goal) => (
            <GoalItem
              key={goal.id}
              goal={goal}
              onToggle={handleToggle}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}
