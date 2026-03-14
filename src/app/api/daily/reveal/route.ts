/**
 * GET /api/daily/reveal — Cheat code : révèle le film secret du jour
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getDailyIndex, getTodayString, deserializeMovie } from '@/lib/game'

export async function GET() {
  try {
    const today       = getTodayString()
    const totalMovies = await prisma.movie.count({ where: { isCurated: true } })
    if (totalMovies === 0) return NextResponse.json({ error: 'Base vide' }, { status: 503 })

    let secretRaw = await prisma.dailyPick
      .findUnique({ where: { date: today }, include: { movie: true } })
      .then(dp => dp?.movie ?? null)

    if (!secretRaw) {
      const idx = getDailyIndex(today, totalMovies)
      secretRaw = await prisma.movie.findFirst({ where: { isCurated: true }, skip: idx, take: 1 })
    }

    if (!secretRaw) return NextResponse.json({ error: 'Film introuvable' }, { status: 503 })
    return NextResponse.json({ movie: deserializeMovie(secretRaw) })
  } catch (err) {
    console.error('[/api/daily/reveal]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
