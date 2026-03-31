import { prisma } from '@/lib/prisma'
import { GoalStatus } from '@prisma/client'
import { startOfDay, subDays, format } from 'date-fns'

export interface StreakData {
  currentStreak: number
  longestStreak: number
  totalCompleted: number
  last7Days: { date: string; status: GoalStatus | null }[]
}

export async function calculateGoalStreak(goalId: string): Promise<StreakData> {
  const logs = await prisma.goalLog.findMany({
    where: { goalId },
    orderBy: { date: 'desc' },
    select: { date: true, status: true },
  })

  if (!logs.length) {
    return { currentStreak: 0, longestStreak: 0, totalCompleted: 0, last7Days: [] }
  }

  // Build a map of date => status
  const logMap = new Map<string, GoalStatus>()
  for (const log of logs) {
    logMap.set(format(log.date, 'yyyy-MM-dd'), log.status)
  }

  // Current streak: consecutive completed days ending today or yesterday
  let currentStreak = 0
  let checkDate = startOfDay(new Date())
  const todayKey = format(checkDate, 'yyyy-MM-dd')
  const todayStatus = logMap.get(todayKey)

  // If today isn't marked yet, start from yesterday
  let start = todayStatus === GoalStatus.COMPLETED ? checkDate : subDays(checkDate, 1)

  while (true) {
    const key = format(start, 'yyyy-MM-dd')
    const status = logMap.get(key)
    if (status === GoalStatus.COMPLETED) {
      currentStreak++
      start = subDays(start, 1)
    } else {
      break
    }
  }

  // Longest streak
  let longestStreak = 0
  let tempStreak = 0
  const sortedLogs = [...logs].sort((a, b) => a.date.getTime() - b.date.getTime())

  for (let i = 0; i < sortedLogs.length; i++) {
    if (sortedLogs[i].status === GoalStatus.COMPLETED) {
      tempStreak++
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      tempStreak = 0
    }
  }

  // Total completed
  const totalCompleted = logs.filter((l) => l.status === GoalStatus.COMPLETED).length

  // Last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    const key = format(date, 'yyyy-MM-dd')
    return { date: key, status: logMap.get(key) ?? null }
  })

  return { currentStreak, longestStreak, totalCompleted, last7Days }
}

export async function getWeeklyCompletionRate(
  userId: string,
  weeks = 8
): Promise<{ week: string; rate: number }[]> {
  const result = []
  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = subDays(new Date(), i * 7)
    const weekStart = subDays(weekEnd, 6)

    const logs = await prisma.goalLog.findMany({
      where: {
        userId,
        date: { gte: weekStart, lte: weekEnd },
      },
      select: { status: true },
    })

    const total = logs.length
    const completed = logs.filter((l) => l.status === GoalStatus.COMPLETED).length
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0

    result.push({
      week: format(weekStart, 'MMM d'),
      rate,
    })
  }
  return result
}

export async function getMonthlyCompletionRate(
  userId: string,
  months = 6
): Promise<{ month: string; rate: number }[]> {
  const result = []
  for (let i = months - 1; i >= 0; i--) {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

    const logs = await prisma.goalLog.findMany({
      where: {
        userId,
        date: { gte: monthStart, lte: monthEnd },
      },
      select: { status: true },
    })

    const total = logs.length
    const completed = logs.filter((l) => l.status === GoalStatus.COMPLETED).length
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0

    result.push({
      month: format(monthStart, 'MMM yyyy'),
      rate,
    })
  }
  return result
}
