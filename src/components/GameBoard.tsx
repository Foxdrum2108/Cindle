'use client'

import { useState, useEffect, useCallback } from 'react'
import Image       from 'next/image'
import SearchInput from './SearchInput'
import HintBadges  from './HintBadges'
import ActorGrid   from './ActorGrid'
import HelpModal   from './HelpModal'
import ResultModal from './ResultModal'

import type { GameState, SearchResult, GuessRecord, Movie, Actor } from '@/lib/types'
import type { GuessResponse } from '@/lib/types'
import { loadGameState, saveGameState, createInitialState, addGuessToState } from '@/lib/storage'
import { generateShareText } from '@/lib/game'
import { computeHints } from '@/lib/constraints'

interface Props { dailyNumber: number; backgrounds: string[] }

export default function GameBoard({ dailyNumber }: Props) {
  const [gameState,   setGameState]   = useState<GameState | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [showHelp,    setShowHelp]    = useState(false)
  const [showResult,  setShowResult]  = useState(false)
  const [newGuessIdx, setNewGuessIdx] = useState(-1)
  const [errorMsg,    setErrorMsg]    = useState('')
  const [shareCopied, setShareCopied] = useState(false)
  const [usedHints,   setUsedHints]   = useState<string[]>([])
  const [hintLoading, setHintLoading] = useState(false)

  useEffect(() => {
    const saved = loadGameState()
    if (saved) {
      setGameState(saved)
      if (saved.status === 'won') setTimeout(() => setShowResult(true), 600)
    } else setGameState(createInitialState())
  }, [])

  useEffect(() => { if (gameState) saveGameState(gameState) }, [gameState])

  const handleGuess = useCallback(async (movie: SearchResult) => {
    if (!gameState || gameState.status === 'won' || loading) return
    setLoading(true); setErrorMsg('')
    try {
      const res = await fetch('/api/guess', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId: movie.id }),
      })
      if (!res.ok) { const d = await res.json(); setErrorMsg(d.error ?? 'Erreur'); return }
      const data: GuessResponse = await res.json()
      const record: GuessRecord = { movie: data.guessedMovie, result: data.result, matchingActors: data.matchingActors }
      const newState = addGuessToState(gameState, record, data.won, data.secretMovie)
      setNewGuessIdx(newState.guesses.length - 1); setGameState(newState)
      if (data.won) setTimeout(() => setShowResult(true), 7 * 120 + 500)
    } catch { setErrorMsg('Erreur réseau') }
    finally  { setLoading(false) }
  }, [gameState, loading])

  const handleGetHint = useCallback(async () => {
    if (hintLoading) return
    setHintLoading(true)
    try {
      const res = await fetch('/api/daily/hint', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usedHints }),
      })
      const data = await res.json()
      if (data.hint) setUsedHints(prev => [...prev, data.hint])
    } catch { /* ignore */ }
    finally { setHintLoading(false) }
  }, [hintLoading, usedHints])

  const handleCheatCode = useCallback(async () => {
    if (!gameState) return
    try {
      const res = await fetch('/api/daily/reveal')
      const { movie }: { movie: Movie } = await res.json()
      setGameState(s => s ? { ...s, status: 'won', secretMovie: movie } : s)
      setTimeout(() => setShowResult(true), 200)
    } catch { /* ignore */ }
  }, [gameState])

  async function handleShare() {
    if (!gameState) return
    const text = generateShareText(gameState.guesses, gameState.status === 'won', dailyNumber)
    try {
      if (navigator.share) await navigator.share({ text })
      else { await navigator.clipboard.writeText(text); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000) }
    } catch { /* ignore */ }
  }

  if (!gameState) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2.5px solid rgba(245,166,35,0.15)', borderTop: '2.5px solid rgba(245,166,35,0.8)', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  const { guesses, status } = gameState
  const isWon       = status === 'won'
  const excludedIds = guesses.map(g => g.movie.id)
  const hints       = computeHints(guesses)

  const matchingActors: Actor[] = guesses.flatMap(g => g.matchingActors ?? [])
    .filter((a, i, arr) => arr.findIndex(b => b.name === a.name) === i)
  const displayActors  = isWon && gameState.secretMovie ? gameState.secretMovie.actors : matchingActors
  const displayDir     = isWon && gameState.secretMovie ? gameState.secretMovie.director            : hints.director
  const displayDirPath = isWon && gameState.secretMovie ? gameState.secretMovie.directorProfilePath : hints.directorPath

  // Société de production : révélée quand le pays correspond (même studio = même pays souvent)
  const productionCompany = isWon && gameState.secretMovie
    ? gameState.secretMovie.productionCompany
    : (hints.country ? guesses.find(g => g.result.country.match === 'correct')?.movie.productionCompany ?? null : null)

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 8 }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 28, lineHeight: 1.1, margin: 0 }}>
            Quel est le<br/>
            <span className="text-gold-gradient">film du jour ?</span>
          </h1>
          {guesses.length > 0 && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 6, fontWeight: 500 }}>
              {guesses.length} essai{guesses.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
          {isWon && (
            <button onClick={handleShare} style={{
              padding: '8px 16px', borderRadius: 12, fontWeight: 800, fontSize: 13,
              background: 'linear-gradient(135deg, #f5a623, #d97706)',
              color: '#000', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(245,166,35,0.4)',
              fontFamily: 'Outfit, sans-serif',
            }}>
              {shareCopied ? '✓ Copié' : '🔗 Partager'}
            </button>
          )}
          <button onClick={() => setShowHelp(true)} style={{
            width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)',
            cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex',
            alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            fontFamily: 'Outfit, sans-serif',
          }}>?</button>
        </div>
      </div>

      {/* Ligne déco or */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(245,166,35,0.3) 40%, rgba(245,166,35,0.3) 60%, transparent)' }} />

      {/* ── Search ────────────────────────────────────────────────────────── */}
      {!isWon ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SearchInput onSelect={handleGuess} onCheatCode={handleCheatCode} disabled={loading} excludeIds={excludedIds} variant="gold" />
          {errorMsg && <p style={{ color: '#f87171', fontSize: 12, textAlign: 'center', marginTop: 8 }}>{errorMsg}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={handleGetHint}
              disabled={hintLoading}
              style={{
                padding: '8px 14px', borderRadius: 12, fontWeight: 700, fontSize: 12,
                background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.08))',
                border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7',
                cursor: hintLoading ? 'not-allowed' : 'pointer',
                opacity: hintLoading ? 0.5 : 1, fontFamily: 'Outfit, sans-serif',
              }}
            >
              {hintLoading ? '⏳' : '💡'} Indice ({usedHints.length})
            </button>
            {usedHints.map((h, i) => (
              <span key={i} style={{
                fontSize: 12, color: 'rgba(255,255,255,0.6)',
                background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)',
                borderRadius: 8, padding: '4px 10px',
              }}>{h}</span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => setShowResult(true)} className="animate-pulse-glow" style={{
            padding: '12px 28px', borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(245,166,35,0.08))',
            border: '1px solid rgba(245,166,35,0.3)', color: '#f5a623',
            fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
          }}>
            🏆 Voir le résultat
          </button>
        </div>
      )}

      {/* Barre de progression */}
      {!isWon && (
        <div style={{ display: 'flex', gap: 3, marginTop: -8 }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const remaining = 8 - guesses.length
            return (
              <div key={i} style={{
                height: 3, flex: 1, borderRadius: 2,
                background: i < guesses.length
                  ? remaining <= 2 ? 'rgba(248,113,113,0.8)' : remaining <= 4 ? 'rgba(251,191,36,0.7)' : 'rgba(52,211,153,0.6)'
                  : 'rgba(255,255,255,0.07)',
                transition: 'background 0.5s ease',
              }} />
            )
          })}
        </div>
      )}

      {/* ── Indices ───────────────────────────────────────────────────────── */}
      {guesses.length > 0 && (
        <div className="glass-gold" style={{ borderRadius: 20, padding: '16px 18px' }}>
          <SectionTitle color="#f5a623" label="Indices" />
          <HintBadges hints={hints} attempts={guesses.length} productionCompany={productionCompany ?? null} />
        </div>
      )}

      {/* ── Cast découvert ────────────────────────────────────────────────── */}
      {guesses.length > 0 && (
        <div className="glass" style={{ borderRadius: 20, padding: '16px 18px' }}>
          <ActorGrid foundActors={displayActors} director={displayDir} directorPath={displayDirPath} />
        </div>
      )}

      {/* ── Historique ────────────────────────────────────────────────────── */}
      {guesses.length > 0 && (
        <div>
          <SectionDivider label="Historique" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {[...guesses].reverse().map((g, revIdx) => {
              const i = guesses.length - 1 - revIdx
              return (
                <GuessHistoryCard
                  key={`${g.movie.id}-${i}`}
                  guess={g}
                  isNew={i === newGuessIdx}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Légende */}
      {guesses.length > 0 && <Legend />}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showResult && gameState.secretMovie && (
        <ResultModal status="won" secretMovie={gameState.secretMovie} guesses={guesses} dailyNumber={dailyNumber} onClose={() => setShowResult(false)} />
      )}
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function SectionTitle({ color, label }: { color: string; label: string }) {
  return (
    <p style={{ fontSize: 10, color: `${color}99`, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>
      {label}
    </p>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
    </div>
  )
}

const RESULT_COLS = ['year','genres','director','actors','country','duration','language'] as const

function GuessHistoryCard({ guess, isNew }: { guess: GuessRecord; isNew: boolean }) {
  const correctCount = RESULT_COLS.filter(c => guess.result[c].match === 'correct').length
  const colorBorder = correctCount >= 6
    ? 'rgba(52,211,153,0.25)'
    : correctCount >= 3
      ? 'rgba(251,191,36,0.2)'
      : 'rgba(255,255,255,0.07)'

  return (
    <div
      className={isNew ? 'animate-fade-in' : ''}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px', borderRadius: 14,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${colorBorder}`,
        transition: 'border-color 0.3s',
      }}
    >
      {/* Poster */}
      {guess.movie.posterUrl && (
        <div style={{ width: 32, height: 46, flexShrink: 0, borderRadius: 7, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
          <Image src={guess.movie.posterUrl} alt={guess.movie.title} width={32} height={46} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
        </div>
      )}
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{guess.movie.title}</p>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 2 }}>{guess.movie.year} · {guess.movie.director}</p>
      </div>
      {/* Dots */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {RESULT_COLS.map(col => {
          const m = guess.result[col].match
          return (
            <div key={col} title={col} style={{
              width: 9, height: 9, borderRadius: '50%',
              background: m === 'correct' ? '#34d399' : m === 'close' ? '#fbbf24' : 'rgba(255,255,255,0.12)',
              boxShadow: m === 'correct' ? '0 0 5px rgba(52,211,153,0.5)' : m === 'close' ? '0 0 5px rgba(251,191,36,0.4)' : 'none',
            }} />
          )
        })}
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
      {[
        { color: '#34d399', shadow: 'rgba(52,211,153,0.5)', label: 'Exact' },
        { color: '#fbbf24', shadow: 'rgba(251,191,36,0.4)', label: 'Proche' },
        { color: 'rgba(255,255,255,0.15)', shadow: 'none', label: 'Faux' },
      ].map(({ color, shadow, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, boxShadow: shadow !== 'none' ? `0 0 5px ${shadow}` : 'none' }} />
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 600 }}>{label}</span>
        </div>
      ))}
    </div>
  )
}
