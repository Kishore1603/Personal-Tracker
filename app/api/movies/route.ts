import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { checkMovieMilestones } from '@/lib/rewards'
import { startOfYear, endOfYear } from 'date-fns'

const MovieSchema = z.object({
  movieName: z.string().min(1).max(200),
  genre: z.string().optional(),
  rating: z.number().min(0).max(10).optional(),
  watchedDate: z.string(), // ISO date
  notes: z.string().optional(),
  posterUrl: z.string().url().optional(),
  tmdbId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')
  const genre = searchParams.get('genre')
  const limit = parseInt(searchParams.get('limit') || '100')

  const where: any = { userId: session.user.id }
  if (year) {
    const y = parseInt(year)
    where.watchedDate = {
      gte: startOfYear(new Date(y, 0, 1)),
      lte: endOfYear(new Date(y, 0, 1)),
    }
  }
  if (genre) where.genre = genre

  const movies = await prisma.movie.findMany({
    where,
    orderBy: { watchedDate: 'desc' },
    take: limit,
  })

  return NextResponse.json({ data: movies })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = MovieSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const movie = await prisma.movie.create({
    data: {
      ...parsed.data,
      watchedDate: new Date(parsed.data.watchedDate),
      userId: session.user.id,
    },
  })

  // Check yearly movie milestones
  const year = new Date(parsed.data.watchedDate).getFullYear()
  const yearCount = await prisma.movie.count({
    where: {
      userId: session.user.id,
      watchedDate: {
        gte: startOfYear(new Date(year, 0, 1)),
        lte: endOfYear(new Date(year, 0, 1)),
      },
    },
  })

  await checkMovieMilestones(session.user.id, yearCount)

  return NextResponse.json({ data: movie }, { status: 201 })
}
