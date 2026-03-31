import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const GoalSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  isScheduled: z.boolean().default(false),
  scheduleDays: z.array(z.string()).default([]),
  reward: z.string().optional(),
  pointValue: z.number().int().min(1).max(100).default(10),
  color: z.string().optional(),
  icon: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const archived = searchParams.get('archived') === 'true'

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id, isArchived: archived },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data: goals })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = GoalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const goal = await prisma.goal.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
    },
  })

  return NextResponse.json({ data: goal }, { status: 201 })
}
