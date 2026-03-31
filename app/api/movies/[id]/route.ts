import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const UpdateSchema = z.object({
  movieName: z.string().min(1).max(200).optional(),
  genre: z.string().optional(),
  rating: z.number().min(0).max(10).optional(),
  watchedDate: z.string().optional(),
  notes: z.string().optional(),
  posterUrl: z.string().url().optional(),
})

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const movie = await prisma.movie.findFirst({ where: { id: params.id, userId: session.user.id } })
  if (!movie) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.movie.delete({ where: { id: params.id } })
  return NextResponse.json({ message: 'Deleted' })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const movie = await prisma.movie.findFirst({ where: { id: params.id, userId: session.user.id } })
  if (!movie) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const updateData: any = { ...parsed.data }
  if (parsed.data.watchedDate) updateData.watchedDate = new Date(parsed.data.watchedDate)

  const updated = await prisma.movie.update({ where: { id: params.id }, data: updateData })
  return NextResponse.json({ data: updated })
}
