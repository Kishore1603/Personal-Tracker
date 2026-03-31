import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format, startOfDay, subDays } from 'date-fns'
import { GoalStatus } from '@prisma/client'
import { createNotification } from '@/lib/notifications'

// This endpoint is called by a cron job daily
// Protected by a secret token
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = startOfDay(new Date())
  const todayDay = format(today, 'EEE')
  const results = { processed: 0, notificationsSent: 0, errors: 0 }

  try {
    // Get all active users with goals
    const users = await prisma.user.findMany({
      select: { id: true },
      where: {
        goals: {
          some: { isArchived: false },
        },
      },
    })

    for (const user of users) {
      try {
        // Get all goals for this user scheduled for today
        const goals = await prisma.goal.findMany({
          where: { userId: user.id, isArchived: false },
          include: {
            logs: { where: { date: today }, take: 1 },
          },
        })

        const todayGoals = goals.filter((g) => {
          if (!g.isScheduled) return true
          return g.scheduleDays.includes(todayDay)
        })

        for (const goal of todayGoals) {
          const existingLog = goal.logs[0]

          // If no log yet, mark as MISSED
          if (!existingLog) {
            await prisma.goalLog.create({
              data: {
                goalId: goal.id,
                userId: user.id,
                date: today,
                status: GoalStatus.MISSED,
              },
            })

            // Send missed notification
            await createNotification(
              user.id,
              'MISSED_GOAL',
              `Goal missed: "${goal.title}". Don't break the streak tomorrow!`,
              { goalId: goal.id }
            )
            results.notificationsSent++
          }
        }

        // Check resolution deadlines (within 7 days)
        const upcomingDeadlines = await prisma.resolution.findMany({
          where: {
            userId: user.id,
            isCompleted: false,
            deadline: {
              gte: today,
              lte: subDays(today, -7),
            },
          },
        })

        for (const resolution of upcomingDeadlines) {
          const daysLeft = Math.ceil(
            (resolution.deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )
          const existing = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              type: 'RESOLUTION_DEADLINE',
              createdAt: { gte: today },
              message: { contains: resolution.title },
            },
          })
          if (!existing) {
            await createNotification(
              user.id,
              'RESOLUTION_DEADLINE',
              `Resolution deadline approaching: "${resolution.title}" — ${daysLeft} days left!`,
              { resolutionId: resolution.id, daysLeft }
            )
            results.notificationsSent++
          }
        }

        // Check monthly overspending
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthlyTransactions = await prisma.transaction.groupBy({
          by: ['type'],
          where: {
            userId: user.id,
            date: { gte: monthStart },
          },
          _sum: { amount: true },
        })

        const income = monthlyTransactions.find((t) => t.type === 'INCOME')?._sum.amount ?? 0
        const expense = monthlyTransactions.find((t) => t.type === 'EXPENSE')?._sum.amount ?? 0

        if (expense > income && income > 0) {
          const existing = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              type: 'OVERSPENDING',
              createdAt: { gte: monthStart },
            },
          })
          if (!existing) {
            await createNotification(
              user.id,
              'OVERSPENDING',
              `Overspending alert! Your expenses (₹${expense.toFixed(0)}) exceed this month's income (₹${income.toFixed(0)}).`,
              { income, expense }
            )
            results.notificationsSent++
          }
        }

        results.processed++
      } catch {
        results.errors++
      }
    }

    return NextResponse.json({
      message: 'Daily cron completed',
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Cron job failed', results }, { status: 500 })
  }
}
