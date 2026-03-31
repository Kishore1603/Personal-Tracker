import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

export async function createNotification(
  userId: string,
  type: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const titles: Record<string, string> = {
    MISSED_GOAL: 'Goal Missed',
    STREAK_MILESTONE: 'Streak Milestone!',
    OVERSPENDING: 'Overspending Alert',
    RESOLUTION_DEADLINE: 'Resolution Deadline',
    REWARD_UNLOCKED: '🎉 Reward Unlocked!',
    LEVEL_UP: '🚀 Level Up!',
    GENERAL: 'Notification',
  }

  await prisma.notification.create({
    data: {
      userId,
      type: type as NotificationType,
      title: titles[type] || 'Notification',
      message,
      metadata: metadata ? (metadata as any) : undefined,
    },
  })
}

export async function markAllRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readStatus: false },
    data: { readStatus: true },
  })
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, readStatus: false },
  })
}

export async function createMissedGoalNotifications(userId: string): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const missedLogs = await prisma.goalLog.findMany({
    where: {
      userId,
      date: today,
      status: 'MISSED',
    },
    include: { goal: { select: { title: true } } },
  })

  for (const log of missedLogs) {
    // Check if notification already sent today
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: 'MISSED_GOAL',
        createdAt: { gte: today },
        message: { contains: log.goal.title },
      },
    })
    if (!existing) {
      await createNotification(
        userId,
        'MISSED_GOAL',
        `You missed your goal: "${log.goal.title}" today. Get back on track tomorrow!`,
        { goalId: log.goalId }
      )
    }
  }
}
