/**
 * Logique du jeu Cindle
 */

import type { Movie, Actor, GuessComparison, CellResult, MatchResult, Direction, GuessRecord } from './types'

export const TMDB_IMG    = 'https://image.tmdb.org/t/p/w185'
export const MAX_ATTEMPTS = 8

const YEAR_TOLERANCE     = 4
const DURATION_TOLERANCE = 15

// ─── Sélection du film du jour ────────────────────────────────────────────────

export function getDailyIndex(date: string, total: number): number {
  let hash = 5381
  for (let i = 0; i < date.length; i++) {
    hash = ((hash << 5) + hash) + date.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash) % total
}

export function getDailyNumber(date: string): number {
  const origin  = new Date('2024-01-01')
  const current = new Date(date)
  return Math.max(1, Math.floor((current.getTime() - origin.getTime()) / 86400000) + 1)
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Comparaison ──────────────────────────────────────────────────────────────

export function compareMovies(guess: Movie, secret: Movie): GuessComparison {
  return {
    year:     compareYear(guess.year, secret.year),
    genres:   compareArrays(guess.genres, secret.genres),
    director: compareExact(guess.director, secret.director),
    actors:   compareActors(guess.actors, secret.actors),
    country:  compareExact(guess.country, secret.country),
    duration: compareDuration(guess.duration, secret.duration),
    language: compareExact(guess.language, secret.language),
  }
}

function cell(match: MatchResult, direction?: Direction): CellResult {
  return direction !== undefined ? { match, direction } : { match }
}

function compareExact(guess: string, secret: string): CellResult {
  return cell(guess.toLowerCase().trim() === secret.toLowerCase().trim() ? 'correct' : 'wrong')
}

function compareYear(guess: number, secret: number): CellResult {
  const diff = guess - secret
  if (diff === 0) return cell('correct')
  if (Math.abs(diff) <= YEAR_TOLERANCE) return cell('close', diff > 0 ? 'down' : 'up')
  return cell('wrong', diff > 0 ? 'down' : 'up')
}

function compareDuration(guess: number, secret: number): CellResult {
  const diff = guess - secret
  if (diff === 0) return cell('correct')
  if (Math.abs(diff) <= DURATION_TOLERANCE) return cell('close', diff > 0 ? 'down' : 'up')
  return cell('wrong', diff > 0 ? 'down' : 'up')
}

function compareArrays(guess: string[], secret: string[]): CellResult {
  const g = new Set(guess.map(s => s.toLowerCase()))
  const s = new Set(secret.map(s => s.toLowerCase()))
  const intersection = [...g].filter(x => s.has(x))
  if (intersection.length === 0) return cell('wrong')
  if (g.size === s.size && intersection.length === g.size) return cell('correct')
  return cell('close')
}

function compareActors(guess: Actor[], secret: Actor[]): CellResult {
  const g = new Set(guess.map(a => a.name.toLowerCase()))
  const s = new Set(secret.map(a => a.name.toLowerCase()))
  const matches = [...g].filter(x => s.has(x)).length
  if (matches >= 2) return cell('correct')
  if (matches === 1) return cell('close')
  return cell('wrong')
}

/** Retourne les acteurs du guess qui sont aussi dans le secret */
export function getMatchingActors(guess: Actor[], secret: Actor[]): Actor[] {
  const secretNames = new Set(secret.map(a => a.name.toLowerCase()))
  return guess.filter(a => secretNames.has(a.name.toLowerCase()))
}

export function isWon(result: GuessComparison): boolean {
  return (
    result.year.match     === 'correct' &&
    result.genres.match   === 'correct' &&
    result.director.match === 'correct' &&
    result.actors.match   === 'correct' &&
    result.country.match  === 'correct' &&
    result.duration.match === 'correct' &&
    result.language.match === 'correct'
  )
}

// ─── Partage ──────────────────────────────────────────────────────────────────

const EMOJI: Record<MatchResult, string> = { correct: '🟢', close: '🟡', wrong: '🔴' }
const COLUMNS: Array<keyof GuessComparison> = ['year', 'genres', 'director', 'actors', 'country', 'duration', 'language']

export function generateShareText(guesses: GuessRecord[], won: boolean, dailyNumber: number): string {
  const score = won ? `${guesses.length} essai${guesses.length > 1 ? 's' : ''}` : `non trouvé`
  const grid  = guesses.map(g => COLUMNS.map(col => EMOJI[g.result[col].match]).join('')).join('\n')
  return `Cindle #${dailyNumber} — ${score}\n${grid}\n\ncindle.app`
}

// ─── Désérialisation Prisma ───────────────────────────────────────────────────

export function deserializeMovie(raw: {
  id: number; tmdbId: number | null; title: string; year: number
  genres: string; director: string; directorProfilePath: string | null
  actors: string; country: string; productionCompany?: string | null
  language: string; duration: number
  rating: number; posterUrl: string | null; synopsis: string | null
  budget: number | null; awards: boolean; franchise: string | null
}): Movie {
  return {
    ...raw,
    genres:            JSON.parse(raw.genres || '[]'),
    actors:            JSON.parse(raw.actors || '[]'),
    productionCompany: raw.productionCompany ?? null,
  }
}
