import type { GameState, GuessRecord, Movie } from './types'
import { getTodayString } from './game'

const STORAGE_KEY = 'cindle-game-state-v3'

export function loadGameState(): GameState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const state: GameState = JSON.parse(raw)
    if (state.date !== getTodayString()) return null
    // Compatibilité : ajouter matchingActors si absent
    state.guesses = state.guesses.map(g => ({ ...g, matchingActors: g.matchingActors ?? [] }))
    return state
  } catch {
    return null
  }
}

export function saveGameState(state: GameState): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

export function createInitialState(): GameState {
  return { date: getTodayString(), guesses: [], status: 'playing', secretMovie: null, hintsUsed: 0 }
}

export function addGuessToState(
  state: GameState, guess: GuessRecord, won: boolean, secretMovie: Movie | null
): GameState {
  return {
    ...state,
    guesses:     [...state.guesses, guess],
    status:      won ? 'won' : 'playing',
    secretMovie: secretMovie ?? state.secretMovie,
  }
}
