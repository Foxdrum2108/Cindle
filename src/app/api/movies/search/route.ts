/**
 * GET /api/movies/search?q=query&limit=10
 * Recherche des films dans la base locale pour l'autocomplete.
 * Retourne titre, année, réalisateur et poster pour chaque résultat.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const q     = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '8'), 20)

  if (q.length < 1) {
    return NextResponse.json([])
  }

  try {
    // Recherche case-insensitive sur le titre
    // SQLite LIKE est case-insensitive pour l'ASCII (OK pour les titres de films)
    const movies = await prisma.movie.findMany({
      where: {
        title: { contains: q, mode: 'insensitive' },
      },
      select: {
        id:        true,
        title:     true,
        year:      true,
        director:  true,
        posterUrl: true,
      },
      orderBy: [
        { rating: 'desc' },
        { year:   'desc' },
      ],
      take: limit,
    })

    return NextResponse.json(movies)
  } catch (err) {
    console.error('[/api/movies/search]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
