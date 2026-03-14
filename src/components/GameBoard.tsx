'use client'

import { useState, useEffect, useCallback } from 'react'
import Image       from 'next/image'
import SearchInput from './SearchInput'
import HintBadges  from './HintBadges'
import ActorGrid   from './ActorGrid'
import HelpModal   from './HelpModal'
import ResultModal from './ResultModal'
import HintButton       from './HintButton'
import GuessHistoryCard from './GuessHistoryCard'

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
  const [receivedHints, setReceivedHints] = useState<string[]>([])
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<{ movie: any; actors: Actor[] } | null>(null)

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
    <div className="cindle-game-grid" style={{ 
      maxWidth: 1600, 
      margin: '0 auto', 
      padding: '0 20px', 
      display: 'grid',
      gridTemplateColumns: guesses.length > 0 ? '260px 320px minmax(0, 1fr)' : 'minmax(0, 1fr)',
      gap: 28,
      paddingBottom: 60,
      alignItems: 'start'
    }}>
      {/* ── COLONNE GAUCHE (Sticky: Indices) ────────────────────────────────── */}
      {guesses.length > 0 && (
        <div style={{
          position: 'sticky',
          top: 80,
          height: 'fit-content',
          willChange: 'transform'
        }}>
          <div id="hint-display" className="glass-gold" style={{ borderRadius: 16, padding: '16px 18px' }}>
            <p style={{ fontSize: 9, color: 'rgba(245,166,35,0.7)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10, margin: 0 }}>
              Indices
            </p>
            {/* Indices obtenus via le bouton */}
            {receivedHints.length > 0 && (
              <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {receivedHints.map((hint, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(168,85,247,0.1)',
                    border: '1px solid rgba(168,85,247,0.25)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: 13,
                    color: '#a855f7',
                    fontWeight: 600,
                    animation: `fadeInUp 0.5s ease-out ${idx * 0.15}s both`
                  }}>
                    💡 {hint}
                  </div>
                ))}
              </div>
            )}
            {/* HintBadges */}
            <HintBadges 
              hints={hints} 
              attempts={guesses.length} 
              productionCompany={productionCompany ?? null}
              budget={gameState.secretMovie?.budget ?? null}
            />
          </div>
        </div>
      )}

      {/* ── COLONNE MILIEU (Sticky: Acteurs & Réalisateur) ───────────────────── */}
      {guesses.length > 0 && (
        <div style={{
          position: 'sticky',
          top: 80,
          height: 'fit-content',
          willChange: 'transform'
        }}>
          <div className="glass" style={{ borderRadius: 16, padding: '18px' }}>
            <ActorGrid foundActors={displayActors} director={displayDir} directorPath={displayDirPath} />
          </div>
        </div>
      )}

      {/* ── COLONNE DROITE (Main game: Hero + Search + Historique) ──────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 8 }}>
        <div className="animate-slide-in-left">
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 28, lineHeight: 1.1, margin: 0 }}>
            Quel est le<br/>
            <span className="text-gold-gradient animate-shimmer-text">film du jour ?</span>
          </h1>
          {guesses.length > 0 && (
            <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 13, fontWeight: 600 }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                {guesses.length} essai{guesses.length > 1 ? 's' : ''}
              </p>
              <p style={{ color: 'rgba(168,85,247,0.6)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="animate-bounce-soft">💡</span> {gameState.hintsUsed}
              </p>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
          {isWon && (
            <button onClick={handleShare} className="animate-slide-in-right" style={{
              padding: '8px 16px', borderRadius: 12, fontWeight: 800, fontSize: 13,
              background: 'linear-gradient(135deg, #f5a623, #d97706)',
              color: '#000', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(245,166,35,0.4)',
              fontFamily: 'Outfit, sans-serif',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,166,35,0.6)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,166,35,0.4)'; }}
            >
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
        <div>
          <SearchInput onSelect={handleGuess} onCheatCode={handleCheatCode} disabled={loading} excludeIds={excludedIds} variant="gold" />
          {errorMsg && <p style={{ color: '#f87171', fontSize: 12, textAlign: 'center', marginTop: 8 }}>{errorMsg}</p>}
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => setShowResult(true)} className="animate-pulse-glow" style={{
            padding: '12px 28px', borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(245,166,35,0.08))',
            border: '1px solid rgba(245,166,35,0.3)', color: '#f5a623',
            fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
            transition: 'all 0.3s ease',
            animation: 'scale-pulse 1s ease-in-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)'
            e.currentTarget.style.boxShadow = '0 0 0 12px rgba(245,166,35,0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          >
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

      {/* Hint Button - Always visible when guesses exist */}
      {guesses.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
          <HintButton
            secretMovie={gameState.secretMovie}
            guesses={guesses.length}
            hintsUsed={gameState.hintsUsed}
            usedHints={receivedHints}
            onHintUsed={(hint) => {
              setGameState(s => s ? { ...s, hintsUsed: s.hintsUsed + 1 } : s)
              setReceivedHints(h => [...h, hint])
              setTimeout(() => {
                const el = document.getElementById('hint-display')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
              }, 100)
            }}
            disabled={loading}
          />
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
                <div
                  key={`${g.movie.id}-${i}`}
                  onClick={() => setSelectedMovie({ movie: g.movie, actors: g.movie.actors })}
                  style={{ cursor: 'pointer' }}
                >
                  <GuessHistoryCard
                    guess={g}
                    isNew={i === newGuessIdx}
                    isExpanded={expandedCardId === i}
                    onToggleExpand={() => setExpandedCardId(expandedCardId === i ? null : i)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Légende */}
      {guesses.length > 0 && <Legend />}

      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showResult && gameState.secretMovie && (
        <ResultModal status="won" secretMovie={gameState.secretMovie} guesses={guesses} dailyNumber={dailyNumber} hintsUsed={gameState.hintsUsed} onClose={() => setShowResult(false)} />
      )}

      {/* ── Modal Acteurs ── */}
      {selectedMovie && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }} onClick={() => setSelectedMovie(null)}>
          <div style={{ background: 'rgba(4,4,13,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, maxWidth: 500, maxHeight: '90vh', overflow: 'auto', backdropFilter: 'blur(24px)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 8px 0', color: '#fff' }}>{selectedMovie.movie.title}</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: 14 }}>{selectedMovie.movie.year} • {selectedMovie.movie.director}</p>
              </div>
              <button onClick={() => setSelectedMovie(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 24, cursor: 'pointer', padding: 0, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Acteurs</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 16 }}>
                {selectedMovie.actors.map(actor => (
                  <div key={actor.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', border: '2px solid rgba(52,211,153,0.3)' }}>
                      {actor.profilePath ? (
                        <Image src={actor.profilePath} alt={actor.name} width={80} height={80} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
                          {actor.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 600, textAlign: 'center', color: '#fff', margin: 0 }}>{actor.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setSelectedMovie(null)} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(5,150,105,0.15))', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 12, color: '#34d399', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 14 }}>
              Fermer
            </button>
          </div>
        </div>
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
