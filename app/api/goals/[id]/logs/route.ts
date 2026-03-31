import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GoalStatus } from '@prisma/client'
import { z } from 'zod'
import { awardPoints, checkStreakRewards } from '@/lib/rewards'
import { calculateGoalStreak } from '@/lib/streaks'
import { POINT_VALUES } from '@/lib/gamification'
import { format, startOfDay } from 'date-fns'

const LogSchema = z.object({
  date: z.string(), // ISO date string
  status: z.enum(['COMPLETED', 'MISSED', 'PENDING']),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '30')

  const logs = await prisma.goalLog.findMany({
    where: { goalId: params.id, userId: session.user.id },
    orderBy: { date: 'desc' },
    take: limit,
  })

  const streak = await calculateGoalStreak(params.id)
  return NextResponse.json({ data: logs, streak })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify goal ownership
  const goal = await prisma.goal.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!goal) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = LogSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const logDate = startOfDay(new Date(parsed.data.date))

  const log = await prisma.goalLog.upsert({
    where: { goalId_date: { goalId: params.id, date: logDate } },
    update: { status: parsed.data.status as GoalStatus },
    create: {
      goalId: params.id,
      userId: session.user.id,
      date: logDate,
      status: parsed.data.status as GoalStatus,
    },
  })

  // Award points and check rewards if completed
  if (parsed.data.status === 'COMPLETED') {
    await awardPoints(
      session.user.id,
      goal.pointValue,
      `Completed goal: ${goal.title}`,
      'DAILY_GOAL',
      params.id
    )

    const streak = await calculateGoalStreak(params.id)
    await checkStreakRewards(session.user.id, params.id, streak.currentStreak)
  }

  return NextResponse.json({ data: log }, { status: 201 })
}
