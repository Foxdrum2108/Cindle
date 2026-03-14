/**
 * Client TMDB - Utilitaires pour récupérer les données de films
 * Utilise le token Bearer v4 (JWT Read Access Token)
 */

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMG  = 'https://image.tmdb.org/t/p/w500'

function getToken(): string {
  const token = process.env.TMDB_API_TOKEN
  if (!token) throw new Error('TMDB_API_TOKEN manquant dans les variables d\'environnement')
  return token
}

async function tmdbFetch(path: string): Promise<any> {
  const res = await fetch(`${TMDB_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    // Pas de cache en dev pour le seed, cache 1h en prod
    next: { revalidate: 3600 },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`TMDB API ${res.status} pour ${path}: ${text}`)
  }
  return res.json()
}

/** Données parsées d'un film TMDB prêtes pour Prisma */
export interface TmdbMovieData {
  tmdbId:   number
  title:    string
  year:     number
  genres:   string  // JSON stringifié
  director: string
  actors:   string  // JSON stringifié
  country:  string
  language: string
  duration: number
  rating:   number
  posterUrl: string | null
  synopsis: string | null
  budget:   number | null
  awards:   boolean
  franchise: string | null
}

/** Récupère les données complètes d'un film depuis TMDB par son ID */
export async function fetchMovieFromTmdb(tmdbId: number): Promise<TmdbMovieData> {
  const data = await tmdbFetch(
    `/movie/${tmdbId}?language=fr-FR&append_to_response=credits`
  )

  const director = (data.credits?.crew ?? []).find(
    (p: any) => p.job === 'Director'
  )?.name ?? 'Inconnu'

  const actors = (data.credits?.cast ?? [])
    .slice(0, 3)
    .map((a: any) => a.name)

  const country = data.production_countries?.[0]?.name ?? 'Inconnu'
  const genres  = (data.genres ?? []).map((g: any) => g.name)

  return {
    tmdbId:    data.id,
    title:     data.title ?? data.original_title,
    year:      data.release_date ? parseInt(data.release_date.substring(0, 4)) : 0,
    genres:    JSON.stringify(genres),
    director,
    actors:    JSON.stringify(actors),
    country,
    language:  data.original_language ?? 'en',
    duration:  data.runtime ?? 0,
    rating:    Math.round((data.vote_average ?? 0) * 10) / 10,
    posterUrl: data.poster_path ? `${TMDB_IMG}${data.poster_path}` : null,
    synopsis:  data.overview ?? null,
    budget:    data.budget > 0 ? data.budget : null,
    awards:    false,
    franchise: data.belongs_to_collection?.name ?? null,
  }
}

/** Recherche des films sur TMDB par titre */
export async function searchTmdb(query: string): Promise<Array<{ id: number; title: string; year: string }>> {
  const data = await tmdbFetch(
    `/search/movie?query=${encodeURIComponent(query)}&language=fr-FR&page=1`
  )
  return (data.results ?? []).slice(0, 5).map((m: any) => ({
    id:    m.id,
    title: m.title ?? m.original_title,
    year:  m.release_date?.substring(0, 4) ?? '?',
  }))
}
