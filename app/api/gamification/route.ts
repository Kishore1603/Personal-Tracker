import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getLevelProgress } from '@/lib/gamification'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totalPoints: true, level: true, name: true, image: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const levelData = getLevelProgress(user.totalPoints)

  const pointEvents = await prisma.pointEvent.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({
    data: {
      totalPoints: user.totalPoints,
      level: levelData.level,
      progressPercent: levelData.progressPercent,
      pointsToNextLevel: levelData.pointsToNextLevel,
      pointEvents,
    },
  })
}
