import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { awardPoints, checkResolutionMilestones, unlockReward } from '@/lib/rewards'
import { POINT_VALUES } from '@/lib/gamification'
import { RewardSource } from '@prisma/client'

const ResolutionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  targetValue: z.number().positive(),
  currentValue: z.number().min(0).default(0),
  unit: z.string().optional(),
  deadline: z.string(), // ISO date
  milestones: z.array(
    z.object({
      percentage: z.number().min(1).max(100),
      description: z.string(),
      reward: z.string().optional(),
      unlocked: z.boolean().default(false),
    })
  ).optional(),
  reward: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resolutions = await prisma.resolution.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: resolutions })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = ResolutionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const resolution = await prisma.resolution.create({
    data: {
      ...parsed.data,
      deadline: new Date(parsed.data.deadline),
      milestones: parsed.data.milestones ? (parsed.data.milestones as any) : undefined,
      userId: session.user.id,
    },
  })

  return NextResponse.json({ data: resolution }, { status: 201 })
}
