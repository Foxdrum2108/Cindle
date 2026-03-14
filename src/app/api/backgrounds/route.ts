/**
 * GET /api/backgrounds — Retourne ~80 URLs d'affiches pour la mosaïque de fond.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const movies = await prisma.movie.findMany({
      where:   { posterUrl: { not: null } },
      select:  { posterUrl: true },
      orderBy: { rating: 'desc' },
      take:    200,
    })
    // Mélange déterministe (on prend ~80 affiches réparties)
    const posters = movies
      .map(m => m.posterUrl!)
      .filter((_, i) => i % 2 === 0) // prendre 1 sur 2 → ~100 affiches
      .slice(0, 80)
    return NextResponse.json(posters, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
