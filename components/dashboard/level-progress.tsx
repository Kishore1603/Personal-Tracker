'use client'

import { motion } from 'framer-motion'
import { LEVELS, getLevelProgress, LevelInfo } from '@/lib/gamification'
import { ProgressBar } from '@/components/ui/badge'
import { Zap } from 'lucide-react'

interface LevelProgressProps {
  totalPoints: number
  className?: string
}

export function LevelProgressCard({ totalPoints, className }: LevelProgressProps) {
  const { level, progressPercent, pointsToNextLevel } = getLevelProgress(totalPoints)
  const isMaxLevel = level.level === LEVELS[LEVELS.length - 1].level

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={className}
    >
      {/* Level display */}
      <div className="flex items-center gap-4 mb-4">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shadow-lg"
          style={{ backgroundColor: `${level.color}20`, border: `1px solid ${level.color}40` }}
        >
          {level.badge}
        </motion.div>
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">Current Level</p>
          <p className="text-2xl font-bold text-gray-900">
            Level {level.level}{' '}
            <span style={{ color: level.color }}>{level.name}</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{level.description}</p>
        </div>
      </div>

      {/* Points */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-semibold text-gray-900">{totalPoints.toLocaleString()} pts</span>
        </div>
        {!isMaxLevel && (
          <span className="text-xs text-gray-500">{pointsToNextLevel} to next level</span>
        )}
      </div>

      {/* Progress bar */}
      <ProgressBar value={progressPercent} max={100} color={level.color} size="md" />

      {/* Level ladder */}
      <div className="mt-4 flex items-center justify-between">
        {LEVELS.map((lvl) => (
          <div
            key={lvl.level}
            className="flex flex-col items-center gap-1"
          >
            <span
              className="text-sm transition-all duration-300"
              style={{
                opacity: lvl.level <= level.level ? 1 : 0.3,
                filter: lvl.level <= level.level ? 'none' : 'grayscale(1)',
              }}
            >
              {lvl.badge}
            </span>
            <div
              className="h-1 w-8 rounded-full transition-all duration-500"
              style={{
                backgroundColor: lvl.level <= level.level ? lvl.color : 'rgba(255,255,255,0.1)',
              }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  )
}
