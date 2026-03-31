import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, startOfDay, subDays } from 'date-fns'
import { calculateGoalStreak } from '@/lib/streaks'
import { getLevelProgress } from '@/lib/gamification'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const today = startOfDay(new Date())
  const todayDay = format(today, 'EEE')

  // Today's goals
  const goals = await prisma.goal.findMany({
    where: { userId, isArchived: false },
    include: { logs: { where: { date: today }, take: 1 } },
  })

  const scheduledGoals = goals.filter((g) => {
    if (!g.isScheduled) return true
    return g.scheduleDays.includes(todayDay)
  })

  const todayGoals = await Promise.all(
    scheduledGoals.map(async (goal) => {
      const streak = await calculateGoalStreak(goal.id)
      return {
        id: goal.id,
        goalId: goal.id,
        title: goal.title,
        description: goal.description,
        color: goal.color,
        icon: goal.icon,
        status: goal.logs[0]?.status ?? 'PENDING',
        streak: streak.currentStreak,
        reward: goal.reward,
      }
    })
  )

  const completionRate =
    todayGoals.length > 0
      ? Math.round((todayGoals.filter((g) => g.status === 'COMPLETED').length / todayGoals.length) * 100)
      : 0

  // Active streaks (goals with streak > 0)
  const activeStreaks = todayGoals
    .filter((g) => g.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5)
    .map((g) => ({
      goalId: g.id,
      title: g.title,
      streak: g.streak,
      color: g.color || '#059669',
    }))

  // Level progress
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalPoints: true, level: true },
  })
  const levelData = getLevelProgress(user?.totalPoints ?? 0)

  // Unread notifications
  const unreadNotifications = await prisma.notification.count({
    where: { userId, readStatus: false },
  })

  // Recent rewards
  const recentRewards = await prisma.reward.findMany({
    where: { userId },
    orderBy: { unlockedAt: 'desc' },
    take: 5,
  })

  // Weekly stats (last 7 days)
  const weeklyStats = await Promise.all(
    Array.from({ length: 7 }, async (_, i) => {
      const day = subDays(today, 6 - i)
      const dayLogs = await prisma.goalLog.findMany({
        where: { userId, date: day },
        select: { status: true },
      })
      return {
        day: format(day, 'EEE'),
        completed: dayLogs.filter((l) => l.status === 'COMPLETED').length,
        total: dayLogs.length,
      }
    })
  )

  return NextResponse.json({
    data: {
      todayGoals,
      completionRate,
      activeStreaks,
      levelProgress: {
        level: levelData.level.level,
        name: levelData.level.name,
        badge: levelData.level.badge,
        progressPercent: levelData.progressPercent,
        totalPoints: user?.totalPoints ?? 0,
        pointsToNextLevel: levelData.pointsToNextLevel,
        color: levelData.level.color,
      },
      unreadNotifications,
      recentRewards,
      weeklyStats,
    },
  })
}
