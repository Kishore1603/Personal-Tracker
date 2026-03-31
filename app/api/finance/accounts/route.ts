import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const AccountSchema = z.object({
  accountName: z.string().min(1).max(100),
  accountType: z.string().optional(),
  balance: z.number().default(0),
  color: z.string().optional(),
  icon: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accounts = await prisma.financeAccount.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { transactions: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ data: accounts })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = AccountSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const account = await prisma.financeAccount.create({
    data: { ...parsed.data, userId: session.user.id },
  })

  return NextResponse.json({ data: account }, { status: 201 })
}
