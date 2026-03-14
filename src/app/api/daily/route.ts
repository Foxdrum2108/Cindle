/**
 * GET /api/daily
 * Retourne le numéro du puzzle du jour et le total de films disponibles.
 * Ne révèle PAS le film secret (comparaisons faites côté serveur via /api/guess).
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getDailyNumber, getTodayString } from '@/lib/game'

export async function GET() {
  try {
    const today       = getTodayString()
    const totalMovies = await prisma.movie.count({ where: { isCurated: true } })

    if (totalMovies === 0) {
      return NextResponse.json(
        { error: 'La base de données est vide. Lancez `npm run db:seed`.' },
        { status: 503 }
      )
    }

    const dailyNumber = getDailyNumber(today)

    return NextResponse.json({
      dailyNumber,
      totalMovies,
      date: today,
    })
  } catch (err) {
    console.error('[/api/daily]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
