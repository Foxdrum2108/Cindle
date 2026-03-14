/**
 * Routes admin pour la gestion des films
 *
 * GET  /api/admin/movies?q=search   — Liste / recherche de films en base
 * POST /api/admin/movies            — Ajoute un film depuis TMDB par son ID
 *
 * Protection : header Authorization: Bearer <ADMIN_PASSWORD>
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fetchMovieFromTmdb } from '@/lib/tmdb'

function isAuthorized(req: NextRequest): boolean {
  const password   = process.env.ADMIN_PASSWORD ?? 'cindle-admin'
  const authHeader = req.headers.get('Authorization') ?? ''
  return authHeader === `Bearer ${password}`
}

// ── GET : liste des films ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const q    = req.nextUrl.searchParams.get('q') ?? ''
  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1')
  const take = 20
  const skip = (page - 1) * take

  const [movies, total] = await Promise.all([
    prisma.movie.findMany({
      where: q ? { title: { contains: q } } : {},
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.movie.count({
      where: q ? { title: { contains: q } } : {},
    }),
  ])

  return NextResponse.json({ movies, total, page, pages: Math.ceil(total / take) })
}

// ── POST : ajouter un film depuis TMDB ───────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const body   = await req.json()
    const tmdbId = Number(body.tmdbId)

    if (!tmdbId || isNaN(tmdbId)) {
      return NextResponse.json({ error: 'tmdbId manquant ou invalide' }, { status: 400 })
    }

    // Vérifier si le film existe déjà
    const existing = await prisma.movie.findUnique({ where: { tmdbId } })
    if (existing) {
      return NextResponse.json(
        { error: `Film déjà présent en base (id: ${existing.id})`, movie: existing },
        { status: 409 }
      )
    }

    // Récupérer depuis TMDB
    const data = await fetchMovieFromTmdb(tmdbId)

    // Valider les données minimales
    if (!data.year || !data.duration || data.duration < 30) {
      return NextResponse.json(
        { error: 'Données TMDB insuffisantes (année ou durée manquante)' },
        { status: 422 }
      )
    }

    const movie = await prisma.movie.create({ data })
    return NextResponse.json({ success: true, movie }, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/admin/movies]', err)
    return NextResponse.json({ error: err.message ?? 'Erreur serveur' }, { status: 500 })
  }
}

// ── DELETE : supprimer un film ────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const id = parseInt(req.nextUrl.searchParams.get('id') ?? '')
  if (!id) return NextResponse.json({ error: 'id manquant' }, { status: 400 })

  await prisma.movie.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
