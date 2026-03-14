/**
 * POST /api/daily/hint
 * Retourne un indice aléatoire sur le film du jour, sans révéler le film.
 * Body: { usedHints: string[] }
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getDailyIndex, getTodayString, deserializeMovie } from '@/lib/game'

export async function POST(req: NextRequest) {
  try {
    const { usedHints = [] }: { usedHints: string[] } = await req.json()

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

    const m = deserializeMovie(secretRaw)
    const hints: string[] = []

    if (m.year > 0)
      hints.push(`📅 L'année est ${m.year}`)

    if (m.genres.length > 0) {
      const g = m.genres[Math.floor(Math.random() * m.genres.length)]
      hints.push(`🎭 Le genre est ${g}`)
    }

    if (m.actors.length > 0) {
      const top = m.actors.slice(0, 3)
      const a   = top[Math.floor(Math.random() * top.length)]
      hints.push(`🎬 Un acteur : ${a.name}`)
    }

    if (m.budget && m.budget > 0) {
      if (m.budget > 100_000_000)      hints.push(`💰 Budget > 100M$`)
      else if (m.budget > 50_000_000)  hints.push(`💰 Budget 50-100M$`)
      else                             hints.push(`💰 Budget < 50M$`)
    }

    if (m.awards)     hints.push(`🏆 Le film a reçu des récompenses`)
    if (m.country)    hints.push(`🌍 Produit en ${m.country}`)
    if (m.franchise)  hints.push(`🔗 Fait partie de : ${m.franchise}`)
    if (m.duration > 0) hints.push(`⏱️ Durée : ${m.duration} minutes`)

    const available = hints.filter(h => !usedHints.includes(h))
    if (available.length === 0)
      return NextResponse.json({ hint: null, noMore: true })

    const hint = available[Math.floor(Math.random() * available.length)]
    return NextResponse.json({ hint })
  } catch (err) {
    console.error('[/api/daily/hint]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
