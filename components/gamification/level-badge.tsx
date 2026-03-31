'use client'

import { motion } from 'framer-motion'
import { LEVELS, getLevelProgress } from '@/lib/gamification'
import { cn } from '@/lib/utils'
import { Zap, TrendingUp } from 'lucide-react'
import { ProgressBar } from '@/components/ui/badge'

interface LevelBadgeProps {
  totalPoints: number
  size?: 'sm' | 'md' | 'lg'
  showProgress?: boolean
}

export function LevelBadge({ totalPoints, size = 'md', showProgress = false }: LevelBadgeProps) {
  const { level, progressPercent, pointsToNextLevel } = getLevelProgress(totalPoints)

  const sizeMap = {
    sm: { container: 'h-8 w-8 text-base', text: 'text-xs' },
    md: { container: 'h-12 w-12 text-2xl', text: 'text-sm' },
    lg: { container: 'h-16 w-16 text-3xl', text: 'text-base' },
  }

  return (
    <div className={cn('flex items-center gap-3', showProgress && 'flex-col')}>
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'flex items-center justify-center rounded-2xl border shadow-lg cursor-default',
          sizeMap[size].container
        )}
        style={{
          backgroundColor: `${level.color}20`,
          borderColor: `${level.color}40`,
          boxShadow: `0 0 20px ${level.color}20`,
        }}
      >
        {level.badge}
      </motion.div>
      <div>
        <p className={cn('font-bold text-gray-900', sizeMap[size].text)}>
          <span style={{ color: level.color }}>Lv.{level.level}</span> {level.name}
        </p>
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-yellow-400" />
          <span className="text-xs text-gray-500">{totalPoints.toLocaleString()} pts</span>
        </div>
        {showProgress && (
          <>
            <ProgressBar value={progressPercent} max={100} color={level.color} size="sm" className="mt-1.5 w-32" />
            {pointsToNextLevel > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">{pointsToNextLevel} to next level</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface RewardCardProps {
  reward: {
    id: string
    title: string
    description: string
    badge?: string | null
    pointValue: number
    unlockedAt: Date | string
    sourceType: string
  }
  index?: number
}

export function RewardCard({ reward, index = 0 }: RewardCardProps) {
  const sourceColors: Record<string, string> = {
    DAILY_GOAL: '#059669',
    STREAK_7: '#f59e0b',
    STREAK_30: '#f59e0b',
    STREAK_100: '#f59e0b',
    RESOLUTION_MILESTONE: '#8b5cf6',
    RESOLUTION_COMPLETE: '#8b5cf6',
    MOVIE_MILESTONE_50: '#ec4899',
    MOVIE_MILESTONE_100: '#ec4899',
    LEVEL_UP: '#059669',
    FINANCE_DISCIPLINE: '#10b981',
    MANUAL: '#6b7280',
  }

  const color = sourceColors[reward.sourceType] || '#059669'
  const date = new Date(reward.unlockedAt)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 relative overflow-hidden group"
    >
      <div
        className="absolute left-0 top-0 h-full w-0.5 rounded-l-xl"
        style={{ backgroundColor: color }}
      />
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
      >
        {reward.badge || '🏆'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{reward.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{reward.description}</p>
        <div className="flex items-center gap-2 mt-2">
          {reward.pointValue > 0 && (
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              <Zap className="h-3 w-3" />
              +{reward.pointValue} pts
            </span>
          )}
          <span className="text-xs text-gray-500">
            {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
