import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { awardPoints, checkResolutionMilestones, unlockReward } from '@/lib/rewards'
import { POINT_VALUES } from '@/lib/gamification'
import { RewardSource } from '@prisma/client'

const UpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  currentValue: z.number().min(0).optional(),
  targetValue: z.number().positive().optional(),
  unit: z.string().optional(),
  deadline: z.string().optional(),
  reward: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resolution = await prisma.resolution.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!resolution) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: resolution })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resolution = await prisma.resolution.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!resolution) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const updateData: any = { ...parsed.data }
  if (parsed.data.deadline) updateData.deadline = new Date(parsed.data.deadline)

  // Calculate new progress and check milestones
  const newCurrentValue = parsed.data.currentValue ?? resolution.currentValue
  const progressPercent = Math.round((newCurrentValue / resolution.targetValue) * 100)

  if (progressPercent >= 100 && !resolution.isCompleted) {
    updateData.isCompleted = true
    await awardPoints(
      session.user.id,
      POINT_VALUES.RESOLUTION_COMPLETE,
      `Completed resolution: ${resolution.title}`,
      'RESOLUTION_COMPLETE',
      params.id
    )
    await unlockReward(session.user.id, RewardSource.RESOLUTION_COMPLETE, params.id, {
      title: `Resolution Complete! 🎉`,
      description: `You completed your resolution: "${resolution.title}"!`,
      pointValue: POINT_VALUES.RESOLUTION_COMPLETE,
      badge: '🎉',
    })
  }

  await checkResolutionMilestones(session.user.id, params.id, progressPercent)

  const updated = await prisma.resolution.update({
    where: { id: params.id },
    data: updateData,
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resolution = await prisma.resolution.findFirst({ where: { id: params.id, userId: session.user.id } })
  if (!resolution) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.resolution.delete({ where: { id: params.id } })
  return NextResponse.json({ message: 'Deleted' })
}
