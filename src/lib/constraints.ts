/**
 * Calcule les indices progressifs (badges) à partir de l'historique des essais.
 * Plus le joueur propose de films, plus les contraintes se précisent.
 */
import type { GuessRecord } from './types'

export interface Hints {
  yearMin:       number
  yearMax:       number
  durationMin:   number
  durationMax:   number
  language:      string | null   // connu si un guess avait la bonne langue
  country:       string | null   // connu si un guess avait le bon pays
  director:      string | null   // connu si un guess avait le bon réalisateur
  directorPath:  string | null
  genres:        string[]        // genres confirmés (apparus dans close/correct)
}

const YEAR_TOL     = 4
const DURATION_TOL = 15

export function computeHints(guesses: GuessRecord[]): Hints {
  let yearMin     = 1900, yearMax     = new Date().getFullYear() + 1
  let durationMin = 30,   durationMax = 400
  let language: string | null = null
  let country:  string | null = null
  let director: string | null = null
  let directorPath: string | null = null
  const genreSet = new Set<string>()

  for (const { movie: m, result: r } of guesses) {
    // ── Année ──────────────────────────────────────────────────────────────────
    if (r.year.match === 'correct') {
      yearMin = yearMax = m.year
    } else if (r.year.match === 'close') {
      if (r.year.direction === 'down') {
        // secret < movie.year, et |diff| ≤ 4 → secret ∈ [movie.year-4, movie.year-1]
        yearMax = Math.min(yearMax, m.year - 1)
        yearMin = Math.max(yearMin, m.year - YEAR_TOL)
      } else {
        // secret > movie.year
        yearMin = Math.max(yearMin, m.year + 1)
        yearMax = Math.min(yearMax, m.year + YEAR_TOL)
      }
    } else {
      // wrong
      if (r.year.direction === 'down')  yearMax = Math.min(yearMax, m.year - YEAR_TOL - 1)
      else                              yearMin = Math.max(yearMin, m.year + YEAR_TOL + 1)
    }

    // ── Durée ──────────────────────────────────────────────────────────────────
    if (r.duration.match === 'correct') {
      durationMin = durationMax = m.duration
    } else if (r.duration.match === 'close') {
      if (r.duration.direction === 'down') {
        durationMax = Math.min(durationMax, m.duration - 1)
        durationMin = Math.max(durationMin, m.duration - DURATION_TOL)
      } else {
        durationMin = Math.max(durationMin, m.duration + 1)
        durationMax = Math.min(durationMax, m.duration + DURATION_TOL)
      }
    } else {
      if (r.duration.direction === 'down') durationMax = Math.min(durationMax, m.duration - DURATION_TOL - 1)
      else                                 durationMin = Math.max(durationMin, m.duration + DURATION_TOL + 1)
    }

    // ── Langue ─────────────────────────────────────────────────────────────────
    if (r.language.match === 'correct') language = m.language.toUpperCase()

    // ── Pays ───────────────────────────────────────────────────────────────────
    if (r.country.match === 'correct') country = m.country

    // ── Réalisateur ────────────────────────────────────────────────────────────
    if (r.director.match === 'correct') {
      director     = m.director
      directorPath = m.directorProfilePath
    }

    // ── Genres ─────────────────────────────────────────────────────────────────
    // On révèle les genres en commun quand il y a un match partiel ou total
    if (r.genres.match === 'correct' || r.genres.match === 'close') {
      m.genres.forEach(g => genreSet.add(g))
    }
  }

  return {
    yearMin,
    yearMax,
    durationMin,
    durationMax,
    language,
    country,
    director,
    directorPath,
    genres: Array.from(genreSet),
  }
}

/** Formate une durée en minutes → "1h32" */
export function formatDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}` : `${m}min`
}

/** Renvoie true si les hints ont au moins un indice utile à afficher */
export function hasAnyHint(h: Hints, total: number): boolean {
  return (
    h.yearMin > 1900 || h.yearMax < new Date().getFullYear() + 1 ||
    h.durationMin > 30 || h.durationMax < 400 ||
    !!h.language || !!h.country || !!h.director || h.genres.length > 0
  )
}
