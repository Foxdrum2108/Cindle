/**
 * POST /api/admin/daily
 * Définit manuellement le film secret pour une date donnée.
 * Corps : { date: "YYYY-MM-DD", movieId: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function isAuthorized(req: NextRequest): boolean {
  const password   = process.env.ADMIN_PASSWORD ?? 'cindle-admin'
  const authHeader = req.headers.get('Authorization') ?? ''
  return authHeader === `Bearer ${password}`
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body    = await req.json()
  const date    = body.date as string
  const movieId = Number(body.movieId)

  if (!date || !movieId) {
    return NextResponse.json({ error: 'date et movieId requis' }, { status: 400 })
  }

  const pick = await prisma.dailyPick.upsert({
    where:  { date },
    update: { movieId },
    create: { date, movieId },
  })

  return NextResponse.json({ success: true, pick })
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const picks = await prisma.dailyPick.findMany({
    orderBy: { date: 'desc' },
    take:    30,
    include: { movie: { select: { id: true, title: true, year: true } } },
  })

  return NextResponse.json({ picks })
}
