import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, startOfDay } from 'date-fns'
import { calculateGoalStreak } from '@/lib/streaks'

// GET /api/goals/today - returns today's goals with status for the logged-in user
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = startOfDay(new Date())
  const todayDay = format(today, 'EEE') // Mon, Tue, etc.

  // All non-archived goals belonging to user
  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id, isArchived: false },
    include: {
      logs: {
        where: { date: today },
        take: 1,
      },
    },
  })

  // Filter by schedule
  const scheduledGoals = goals.filter((g) => {
    if (!g.isScheduled) return true
    return g.scheduleDays.includes(todayDay)
  })

  const result = await Promise.all(
    scheduledGoals.map(async (goal) => {
      const streak = await calculateGoalStreak(goal.id)
      const todayLog = goal.logs[0]
      return {
        id: goal.id,
        goalId: goal.id,
        title: goal.title,
        description: goal.description,
        color: goal.color,
        icon: goal.icon,
        status: todayLog?.status ?? 'PENDING',
        streak: streak.currentStreak,
        logId: todayLog?.id,
        reward: goal.reward,
      }
    })
  )

  const completionRate =
    result.length > 0
      ? Math.round((result.filter((g) => g.status === 'COMPLETED').length / result.length) * 100)
      : 0

  return NextResponse.json({ data: result, completionRate })
}
