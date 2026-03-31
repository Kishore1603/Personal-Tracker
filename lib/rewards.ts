import { prisma } from '@/lib/prisma'
import { RewardSource } from '@prisma/client'
import { POINT_VALUES, checkLevelUp, getLevelInfo } from '@/lib/gamification'
import { createNotification } from '@/lib/notifications'

export async function awardPoints(
  userId: string,
  points: number,
  reason: string,
  sourceType: string,
  sourceId?: string
): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totalPoints: true, level: true },
  })
  if (!user) throw new Error('User not found')

  const oldPoints = user.totalPoints
  const newPoints = oldPoints + points

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { totalPoints: newPoints },
    }),
    prisma.pointEvent.create({
      data: { userId, points, reason, sourceType, sourceId },
    }),
  ])

  // Check for level up
  const levelUp = checkLevelUp(oldPoints, newPoints)
  if (levelUp) {
    await prisma.user.update({ where: { id: userId }, data: { level: levelUp.level } })
    await unlockReward(userId, RewardSource.LEVEL_UP, undefined, {
      title: `Level Up! ${levelUp.badge} ${levelUp.name}`,
      description: `You've reached Level ${levelUp.level}: ${levelUp.name}. ${levelUp.description}`,
      pointValue: 0,
      badge: levelUp.badge,
    })
    await createNotification(userId, 'LEVEL_UP', `Level Up! You're now ${levelUp.name} ${levelUp.badge}`, {
      levelName: levelUp.name,
      levelNumber: levelUp.level,
    })
  }

  return newPoints
}

export async function unlockReward(
  userId: string,
  sourceType: RewardSource,
  sourceId: string | undefined,
  rewardData: {
    title: string
    description: string
    pointValue: number
    badge?: string
  }
): Promise<void> {
  await prisma.reward.create({
    data: {
      userId,
      sourceType,
      sourceId,
      title: rewardData.title,
      description: rewardData.description,
      pointValue: rewardData.pointValue,
      badge: rewardData.badge,
    },
  })

  // Notify user
  await createNotification(
    userId,
    'REWARD_UNLOCKED',
    `Reward unlocked: ${rewardData.title}`,
    { badge: rewardData.badge }
  )
}

export async function checkStreakRewards(
  userId: string,
  goalId: string,
  currentStreak: number
): Promise<void> {
  if (currentStreak === 7) {
    // Check if already rewarded
    const existing = await prisma.reward.findFirst({
      where: { userId, sourceType: RewardSource.STREAK_7, sourceId: goalId },
    })
    if (!existing) {
      await awardPoints(userId, POINT_VALUES.STREAK_7, '7-day streak!', 'STREAK_7', goalId)
      await unlockReward(userId, RewardSource.STREAK_7, goalId, {
        title: '7-Day Streak! 🔥',
        description: 'Completed a goal 7 days in a row!',
        pointValue: POINT_VALUES.STREAK_7,
        badge: '🔥',
      })
    }
  }

  if (currentStreak === 30) {
    const existing = await prisma.reward.findFirst({
      where: { userId, sourceType: RewardSource.STREAK_30, sourceId: goalId },
    })
    if (!existing) {
      await awardPoints(userId, POINT_VALUES.STREAK_30, '30-day streak!', 'STREAK_30', goalId)
      await unlockReward(userId, RewardSource.STREAK_30, goalId, {
        title: '30-Day Streak! ⚡',
        description: 'Completed a goal 30 days in a row! Incredible!',
        pointValue: POINT_VALUES.STREAK_30,
        badge: '⚡',
      })
    }
  }

  if (currentStreak === 100) {
    const existing = await prisma.reward.findFirst({
      where: { userId, sourceType: RewardSource.STREAK_100, sourceId: goalId },
    })
    if (!existing) {
      await awardPoints(userId, POINT_VALUES.STREAK_100, '100-day streak!', 'STREAK_100', goalId)
      await unlockReward(userId, RewardSource.STREAK_100, goalId, {
        title: '100-Day Streak! 💎',
        description: 'Completed a goal 100 days in a row! You are unstoppable!',
        pointValue: POINT_VALUES.STREAK_100,
        badge: '💎',
      })
    }
  }
}

export async function checkMovieMilestones(
  userId: string,
  movieCount: number
): Promise<void> {
  if (movieCount === 50) {
    const existing = await prisma.reward.findFirst({
      where: { userId, sourceType: RewardSource.MOVIE_MILESTONE_50 },
    })
    if (!existing) {
      await awardPoints(userId, POINT_VALUES.MOVIE_MILESTONE_50, '50 movies watched!', 'MOVIE_MILESTONE')
      await unlockReward(userId, RewardSource.MOVIE_MILESTONE_50, undefined, {
        title: '50 Movies Watched! 🎬',
        description: "You've watched 50 movies this year!",
        pointValue: POINT_VALUES.MOVIE_MILESTONE_50,
        badge: '🎬',
      })
    }
  }

  if (movieCount === 100) {
    const existing = await prisma.reward.findFirst({
      where: { userId, sourceType: RewardSource.MOVIE_MILESTONE_100 },
    })
    if (!existing) {
      await awardPoints(userId, POINT_VALUES.MOVIE_MILESTONE_100, '100 movies watched!', 'MOVIE_MILESTONE')
      await unlockReward(userId, RewardSource.MOVIE_MILESTONE_100, undefined, {
        title: '100 Movies Watched! 🏆',
        description: "You've watched 100 movies this year! Movie marathon champion!",
        pointValue: POINT_VALUES.MOVIE_MILESTONE_100,
        badge: '🏆',
      })
    }
  }
}

export async function checkResolutionMilestones(
  userId: string,
  resolutionId: string,
  progressPercent: number
): Promise<void> {
  const milestones = [
    { at: 25, source: RewardSource.RESOLUTION_MILESTONE, points: POINT_VALUES.RESOLUTION_MILESTONE_25, badge: '🎯' },
    { at: 50, source: RewardSource.RESOLUTION_MILESTONE, points: POINT_VALUES.RESOLUTION_MILESTONE_50, badge: '💪' },
    { at: 75, source: RewardSource.RESOLUTION_MILESTONE, points: POINT_VALUES.RESOLUTION_MILESTONE_75, badge: '🌟' },
  ]

  for (const milestone of milestones) {
    if (progressPercent >= milestone.at) {
      const key = `${resolutionId}_${milestone.at}`
      const existing = await prisma.reward.findFirst({
        where: { userId, sourceType: milestone.source, sourceId: key },
      })
      if (!existing) {
        await awardPoints(userId, milestone.points, `${milestone.at}% resolution progress`, 'RESOLUTION_MILESTONE', key)
        await unlockReward(userId, milestone.source, key, {
          title: `${milestone.at}% Progress Milestone ${milestone.badge}`,
          description: `Reached ${milestone.at}% of your resolution!`,
          pointValue: milestone.points,
          badge: milestone.badge,
        })
      }
    }
  }
}
