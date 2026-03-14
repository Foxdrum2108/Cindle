/**
 * POST /api/guess
 * Corps : { movieId: number, targetMovieId?: number }
 * - Sans targetMovieId → compare avec le film du jour (mode daily)
 * - Avec targetMovieId  → compare avec ce film (mode free play)
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getDailyIndex, getTodayString, compareMovies, isWon, deserializeMovie, getMatchingActors } from '@/lib/game'
import type { GuessResponse } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body          = await req.json()
    const movieId       = Number(body.movieId)
    const targetMovieId = body.targetMovieId ? Number(body.targetMovieId) : null

    if (!movieId || isNaN(movieId)) {
      return NextResponse.json({ error: 'movieId invalide' }, { status: 400 })
    }

    // ── Film secret ───────────────────────────────────────────────────────────
    let secretRaw = null

    if (targetMovieId) {
      // Mode free play : film cible fourni par le client
      secretRaw = await prisma.movie.findUnique({ where: { id: targetMovieId } })
    } else {
      // Mode daily : film du jour (tirage ou hash de la date)
      const today = getTodayString()
      secretRaw = await prisma.dailyPick
        .findUnique({ where: { date: today }, include: { movie: true } })
        .then(dp => dp?.movie ?? null)
      if (!secretRaw) {
        const totalMovies = await prisma.movie.count({ where: { isCurated: true } })
        if (totalMovies === 0) return NextResponse.json({ error: 'Base vide' }, { status: 503 })
        secretRaw = await prisma.movie.findFirst({ where: { isCurated: true }, skip: getDailyIndex(today, totalMovies), take: 1 })
      }
    }

    if (!secretRaw) return NextResponse.json({ error: 'Film cible introuvable' }, { status: 503 })

    // ── Film proposé ──────────────────────────────────────────────────────────
    const guessRaw = await prisma.movie.findUnique({ where: { id: movieId } })
    if (!guessRaw) return NextResponse.json({ error: 'Film non trouvé' }, { status: 404 })

    const secret = deserializeMovie(secretRaw)
    const guess  = deserializeMovie(guessRaw)
    const result = compareMovies(guess, secret)
    const won    = isWon(result)

    const matchingActors = getMatchingActors(guess.actors, secret.actors)

    const response: GuessResponse = {
      guessedMovie:   guess,
      result,
      matchingActors,
      won,
      secretMovie:    won ? secret : null,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[/api/guess]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
