// Gamification engine: levels, points, thresholds

export interface LevelInfo {
  level: number
  name: string
  minPoints: number
  maxPoints: number
  badge: string
  color: string
  description: string
}

export const LEVELS: LevelInfo[] = [
  {
    level: 1,
    name: 'Initiate',
    minPoints: 0,
    maxPoints: 99,
    badge: '🌱',
    color: '#6b7280',
    description: 'Just starting the journey',
  },
  {
    level: 2,
    name: 'Consistent',
    minPoints: 100,
    maxPoints: 299,
    badge: '⚡',
    color: '#3b82f6',
    description: 'Building good habits',
  },
  {
    level: 3,
    name: 'Disciplined',
    minPoints: 300,
    maxPoints: 699,
    badge: '🔥',
    color: '#f59e0b',
    description: 'Discipline becoming natural',
  },
  {
    level: 4,
    name: 'Elite',
    minPoints: 700,
    maxPoints: 1499,
    badge: '💎',
    color: '#8b5cf6',
    description: 'Operating at elite levels',
  },
  {
    level: 5,
    name: 'Unstoppable',
    minPoints: 1500,
    maxPoints: Infinity,
    badge: '🚀',
    color: '#059669',
    description: 'Nothing can stop you now',
  },
]

export const POINT_VALUES = {
  DAILY_GOAL_COMPLETE: 10,
  STREAK_7: 25,
  STREAK_30: 100,
  STREAK_100: 500,
  RESOLUTION_MILESTONE_25: 30,
  RESOLUTION_MILESTONE_50: 60,
  RESOLUTION_MILESTONE_75: 90,
  RESOLUTION_COMPLETE: 200,
  MOVIE_MILESTONE_50: 75,
  MOVIE_MILESTONE_100: 150,
  FINANCE_UNDER_BUDGET_WEEK: 20,
  FINANCE_UNDER_BUDGET_MONTH: 80,
}

export function getLevelInfo(totalPoints: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVELS[i].minPoints) {
      return LEVELS[i]
    }
  }
  return LEVELS[0]
}

export function getLevelProgress(totalPoints: number): {
  level: LevelInfo
  progressPercent: number
  pointsInLevel: number
  pointsToNextLevel: number
} {
  const level = getLevelInfo(totalPoints)
  const isMaxLevel = level.level === LEVELS[LEVELS.length - 1].level
  const pointsInLevel = totalPoints - level.minPoints
  const levelRange = isMaxLevel ? 1000 : level.maxPoints - level.minPoints + 1
  const progressPercent = isMaxLevel ? 100 : Math.min(Math.round((pointsInLevel / levelRange) * 100), 100)
  const pointsToNextLevel = isMaxLevel ? 0 : level.maxPoints + 1 - totalPoints

  return { level, progressPercent, pointsInLevel, pointsToNextLevel }
}

export function checkLevelUp(
  oldPoints: number,
  newPoints: number
): LevelInfo | null {
  const oldLevel = getLevelInfo(oldPoints)
  const newLevel = getLevelInfo(newPoints)
  if (newLevel.level > oldLevel.level) {
    return newLevel
  }
  return null
}
