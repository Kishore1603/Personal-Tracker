import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UpdateSchema = z.object({
  amount: z.number().positive().optional(),
  category: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  date: z.string().optional(),
  note: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const transaction = await prisma.transaction.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!transaction) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Reverse the balance change
  const delta = transaction.type === 'INCOME' ? -transaction.amount : transaction.amount
  await prisma.$transaction([
    prisma.transaction.delete({ where: { id: params.id } }),
    prisma.financeAccount.update({
      where: { id: transaction.accountId },
      data: { balance: { increment: delta } },
    }),
  ])

  return NextResponse.json({ message: 'Deleted' })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const transaction = await prisma.transaction.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!transaction) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const updateData: any = { ...parsed.data }
  if (parsed.data.date) updateData.date = new Date(parsed.data.date)

  const updated = await prisma.transaction.update({ where: { id: params.id }, data: updateData })
  return NextResponse.json({ data: updated })
}
