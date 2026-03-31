import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const TripSchema = z.object({
  destination: z.string().min(1).max(200),
  startDate: z.string(),
  endDate: z.string(),
  notes: z.string().optional(),
  coverImage: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id },
    include: {
      expenses: true,
      _count: { select: { expenses: true } },
    },
    orderBy: { startDate: 'desc' },
  })

  const tripsWithTotal = trips.map((trip) => ({
    ...trip,
    totalCost: trip.expenses.reduce((sum, e) => sum + e.amount, 0),
  }))

  return NextResponse.json({ data: tripsWithTotal })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = TripSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const trip = await prisma.trip.create({
    data: {
      ...parsed.data,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      userId: session.user.id,
    },
  })

  return NextResponse.json({ data: trip }, { status: 201 })
}
