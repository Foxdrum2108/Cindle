/**
 * GET /api/random — Retourne un film aléatoire pour le mode "Guess the Movie"
 * Optionnel : ?exclude=id1,id2,... pour éviter les films déjà joués
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { deserializeMovie } from '@/lib/game'

export async function GET(req: NextRequest) {
  try {
    const excludeParam = req.nextUrl.searchParams.get('exclude') ?? ''
    const excludeIds   = excludeParam ? excludeParam.split(',').map(Number).filter(Boolean) : []

    const baseWhere = { isCurated: true, ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}) }

    const total = await prisma.movie.count({ where: baseWhere })

    if (total === 0) return NextResponse.json({ error: 'Plus de films disponibles' }, { status: 404 })

    const skip    = Math.floor(Math.random() * total)
    const movieRaw = await prisma.movie.findFirst({
      where: baseWhere,
      skip,
      take:  1,
    })

    if (!movieRaw) return NextResponse.json({ error: 'Film introuvable' }, { status: 404 })

    // On retourne uniquement l'ID (le film complet est résolu côté serveur lors des guesses)
    return NextResponse.json({ movieId: movieRaw.id })
  } catch (err) {
    console.error('[/api/random]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
