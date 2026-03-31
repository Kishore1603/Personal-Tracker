import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { TransactionType } from '@prisma/client'

const TransactionSchema = z.object({
  accountId: z.string().min(1),
  amount: z.number().positive(),
  category: z.string().min(1),
  type: z.enum(['INCOME', 'EXPENSE']),
  date: z.string(), // ISO date
  note: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('accountId')
  const type = searchParams.get('type') as TransactionType | null
  const month = searchParams.get('month') // format: YYYY-MM
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: any = { userId: session.user.id }
  if (accountId) where.accountId = accountId
  if (type) where.type = type
  if (month) {
    const [year, m] = month.split('-').map(Number)
    where.date = {
      gte: new Date(year, m - 1, 1),
      lt: new Date(year, m, 1),
    }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { account: { select: { accountName: true, color: true } } },
    orderBy: { date: 'desc' },
    take: limit,
  })

  return NextResponse.json({ data: transactions })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = TransactionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  // Verify account ownership
  const account = await prisma.financeAccount.findFirst({
    where: { id: parsed.data.accountId, userId: session.user.id },
  })
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const transaction = await prisma.transaction.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
      userId: session.user.id,
    },
  })

  // Update account balance
  const delta = parsed.data.type === 'INCOME' ? parsed.data.amount : -parsed.data.amount
  await prisma.financeAccount.update({
    where: { id: parsed.data.accountId },
    data: { balance: { increment: delta } },
  })

  return NextResponse.json({ data: transaction }, { status: 201 })
}
