import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notification = await prisma.notification.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.notification.update({
    where: { id: params.id },
    data: { readStatus: true },
  })

  return NextResponse.json({ message: 'Marked as read' })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notification = await prisma.notification.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.notification.delete({ where: { id: params.id } })
  return NextResponse.json({ message: 'Deleted' })
}
