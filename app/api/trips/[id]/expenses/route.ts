import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ExpenseSchema = z.object({
  category: z.enum(['TRAVEL', 'STAY', 'FOOD', 'ACTIVITIES', 'SHOPPING', 'OTHER']),
  amount: z.number().positive(),
  note: z.string().optional(),
  date: z.string(),
})

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const trip = await prisma.trip.findFirst({ where: { id: params.id, userId: session.user.id } })
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const expenses = await prisma.tripExpense.findMany({
    where: { tripId: params.id },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json({ data: expenses })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const trip = await prisma.trip.findFirst({ where: { id: params.id, userId: session.user.id } })
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = ExpenseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const expense = await prisma.tripExpense.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
      tripId: params.id,
    },
  })

  // Recalculate trip total
  const allExpenses = await prisma.tripExpense.findMany({ where: { tripId: params.id } })
  const totalCost = allExpenses.reduce((sum, e) => sum + e.amount, 0)
  await prisma.trip.update({ where: { id: params.id }, data: { totalCost } })

  return NextResponse.json({ data: expense }, { status: 201 })
}
