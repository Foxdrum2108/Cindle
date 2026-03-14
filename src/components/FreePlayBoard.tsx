'use client'

import { useState, useEffect, useCallback } from 'react'
import Image       from 'next/image'
import SearchInput from './SearchInput'
import HintBadges  from './HintBadges'
import ActorGrid   from './ActorGrid'
import ResultModal from './ResultModal'
import HintButton       from './HintButton'
import GuessHistoryCard from './GuessHistoryCard'

import type { SearchResult, GuessRecord, Movie, Actor } from '@/lib/types'
import type { GuessResponse } from '@/lib/types'
import { computeHints } from '@/lib/constraints'

interface RoundState {
  targetMovieId: number | null
  guesses:       GuessRecord[]
  status:        'loading' | 'playing' | 'won'
  secretMovie:   Movie | null
  roundNumber:   number
  hintsUsed:     number
}

const RESULT_COLS = ['year','genres','director','actors','country','duration','language'] as const

export default function FreePlayBoard() {
  const [round,       setRound]       = useState<RoundState>({ targetMovieId: null, guesses: [], status: 'loading', secretMovie: null, roundNumber: 1, hintsUsed: 0 })
  const [loading,     setLoading]     = useState(false)
  const [showResult,  setShowResult]  = useState(false)
  const [newGuessIdx,     setNewGuessIdx]     = useState(-1)
  const [expandedCardId,  setExpandedCardId]  = useState<number | null>(null)
  const [errorMsg,    setErrorMsg]    = useState('')
  const [prevIds,     setPrevIds]     = useState<number[]>([])
  const [receivedHints, setReceivedHints] = useState<string[]>([])
  const [selectedMovie, setSelectedMovie] = useState<{ movie: any; actors: Actor[] } | null>(null)

  const loadRandom = useCallback(async () => {
    setRound(r => ({ ...r, status: 'loading' }))
    try {
      const exclude  = prevIds.join(',')
      const res      = await fetch(`/api/random${exclude ? `?exclude=${exclude}` : ''}`)
      const { movieId } = await res.json()
      setRound(r => ({ ...r, targetMovieId: movieId, status: 'playing', guesses: [], secretMovie: null }))
      setNewGuessIdx(-1)
    } catch {
      setRound(r => ({ ...r, status: 'playing' }))
    }
  }, [prevIds])

  useEffect(() => { loadRandom() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGuess = useCallback(async (movie: SearchResult) => {
    if (!round.targetMovieId || round.status !== 'playing' || loading) return
    setLoading(true); setErrorMsg('')
    try {
      const res = await fetch('/api/guess', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId: movie.id, targetMovieId: round.targetMovieId }),
      })
      if (!res.ok) { const d = await res.json(); setErrorMsg(d.error ?? 'Erreur'); return }
      const data: GuessResponse = await res.json()
      const record: GuessRecord = { movie: data.guessedMovie, result: data.result, matchingActors: data.matchingActors }
      const newGuesses = [...round.guesses, record]
      setNewGuessIdx(newGuesses.length - 1)
      setRound(r => ({ ...r, guesses: newGuesses, status: data.won ? 'won' : 'playing', secretMovie: data.secretMovie ?? r.secretMovie }))
      if (data.won) setTimeout(() => setShowResult(true), 7 * 120 + 500)
    } catch { setErrorMsg('Erreur réseau') }
    finally { setLoading(false) }
  }, [round, loading])

  const handleCheatCode = useCallback(async () => {
    if (!round.targetMovieId) return
    try {
      const res  = await fetch('/api/guess', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId: round.targetMovieId, targetMovieId: round.targetMovieId }),
      })
      const data: GuessResponse = await res.json()
      setRound(r => ({ ...r, status: 'won', secretMovie: data.secretMovie ?? data.guessedMovie }))
      setTimeout(() => setShowResult(true), 200)
    } catch { /* ignore */ }
  }, [round.targetMovieId])

  function nextRound() {
    setPrevIds(p => round.targetMovieId ? [...p, round.targetMovieId] : p)
    setShowResult(false)
    setReceivedHints([])
    setExpandedCardId(null)
    setRound(r => ({ ...r, roundNumber: r.roundNumber + 1, status: 'loading', guesses: [], secretMovie: null, targetMovieId: null, hintsUsed: 0 }))
    setTimeout(loadRandom, 60)
  }

  const { guesses, status } = round
  const isWon    = status === 'won'
  const hints    = computeHints(guesses)
  const excluded = guesses.map(g => g.movie.id)

  const matchingActors: Actor[] = guesses.flatMap(g => g.matchingActors ?? [])
    .filter((a, i, arr) => arr.findIndex(b => b.name === a.name) === i)
  const displayActors  = isWon && round.secretMovie ? round.secretMovie.actors : matchingActors
  const displayDir     = isWon && round.secretMovie ? round.secretMovie.director            : hints.director
  const displayDirPath = isWon && round.secretMovie ? round.secretMovie.directorProfilePath : hints.directorPath
  const productionCompany = isWon && round.secretMovie
    ? round.secretMovie.productionCompany
    : (hints.country ? guesses.find(g => g.result.country.match === 'correct')?.movie.productionCompany ?? null : null)

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2.5px solid rgba(167,139,250,0.15)', borderTop: '2.5px solid rgba(167,139,250,0.8)', animation: 'spin 0.65s linear infinite' }} />
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontWeight: 500 }}>Sélection d&apos;un film…</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 20px', display: 'grid', gridTemplateColumns: guesses.length > 0 ? '260px 320px minmax(0, 1fr)' : 'minmax(0, 1fr)', gap: 28, paddingBottom: 60, alignItems: 'start' }}>
      
      {/* ── COLONNE GAUCHE (Sticky: Indices) ────────────────────────────────── */}
      {guesses.length > 0 && (
        <div style={{ position: 'sticky', top: 80, height: 'fit-content', willChange: 'transform' }}>
          <div id="hint-display-free" className="glass-purple" style={{ borderRadius: 16, padding: '16px 18px' }}>
            <p style={{ fontSize: 9, color: 'rgba(167,139,250,0.7)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10, margin: 0 }}>Indices</p>
            {receivedHints.length > 0 && (
              <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {receivedHints.map((hint, idx) => (
                  <div key={idx} style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#a855f7', fontWeight: 600, animation: `fadeInUp 0.5s ease-out ${idx * 0.15}s both` }}>
                    💡 {hint}
                  </div>
                ))}
              </div>
            )}
            <HintBadges 
              hints={hints} 
              attempts={guesses.length} 
              productionCompany={productionCompany ?? null}
              budget={round.secretMovie?.budget ?? null}
            />
          </div>
        </div>
      )}

      {/* ── COLONNE MILIEU (Sticky: Acteurs & Réalisateur) ───────────────────── */}
      {guesses.length > 0 && (
        <div style={{ position: 'sticky', top: 80, height: 'fit-content', willChange: 'transform' }}>
          <div className="glass" style={{ borderRadius: 16, padding: '18px' }}>
            <ActorGrid foundActors={displayActors} director={displayDir} directorPath={displayDirPath} />
          </div>
        </div>
      )}

      {/* ── COLONNE DROITE (Main game: Hero + Search + Historique) ──────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* ── Hero ── */}
        <div style={{ paddingTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.25))' }} />
            <span style={{ fontSize: 11, color: 'rgba(167,139,250,0.6)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Round #{round.roundNumber}
            </span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(167,139,250,0.25), transparent)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 28, lineHeight: 1.1, margin: 0 }}>
                Trouve le film<br/>
                <span className="text-purple-gradient">mystère</span>
              </h1>
              {guesses.length > 0 && (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 6, fontWeight: 500 }}>
                  {guesses.length} essai{guesses.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
            {isWon && (
              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <button onClick={() => setShowResult(true)} style={{
                  padding: '8px 14px', borderRadius: 12, fontWeight: 800, fontSize: 13,
                  background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(124,58,237,0.15))',
                  border: '1px solid rgba(167,139,250,0.35)', color: '#a78bfa',
                  cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                }}>
                  Résultat →
                </button>
                <button onClick={nextRound} style={{
                  padding: '8px 14px', borderRadius: 12, fontWeight: 800, fontSize: 13,
                  background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                  border: 'none', color: '#fff', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(167,139,250,0.35)',
                  fontFamily: 'Outfit, sans-serif',
                }}>
                  Film suivant 🎲
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.25) 40%, rgba(167,139,250,0.25) 60%, transparent)' }} />

        {/* ── Search ── */}
        {!isWon && (
          <div>
            <SearchInput onSelect={handleGuess} onCheatCode={handleCheatCode} disabled={loading} excludeIds={excluded} variant="purple" />
            {errorMsg && <p style={{ color: '#f87171', fontSize: 12, textAlign: 'center', marginTop: 8 }}>{errorMsg}</p>}
          </div>
        )}

        {/* Hint Button - Always visible when guesses exist */}
        {guesses.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
            <HintButton
              targetMovieId={round.targetMovieId ?? undefined}
              guesses={guesses.length}
              hintsUsed={round.hintsUsed}
              usedHints={receivedHints}
              onHintUsed={(hint) => {
                setRound(r => ({ ...r, hintsUsed: r.hintsUsed + 1 }))
                setReceivedHints(h => [...h, hint])
                setTimeout(() => {
                  const el = document.getElementById('legend-free')
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                }, 100)
              }}
              disabled={loading}
            />
          </div>
        )}

        {/* ── Barre de progression ── */}
        {!isWon && (
          <div style={{ display: 'flex', gap: 3, marginTop: -8 }}>
            {Array.from({ length: 8 }).map((_, i) => {
              const remaining = 8 - guesses.length
              return (
                <div key={i} style={{
                  height: 3, flex: 1, borderRadius: 2,
                  background: i < guesses.length
                    ? remaining <= 2 ? 'rgba(248,113,113,0.8)' : remaining <= 4 ? 'rgba(251,191,36,0.7)' : 'rgba(167,139,250,0.6)'
                    : 'rgba(255,255,255,0.07)',
                  transition: 'background 0.5s ease',
                }} />
              )
            })}
          </div>
        )}

        {/* ── Historique ── */}
        {guesses.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Historique</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...guesses].reverse().map((g, revIdx) => {
                const i = guesses.length - 1 - revIdx
                return (
                  <GuessHistoryCard
                    key={`${g.movie.id}-${i}`}
                    guess={g}
                    isNew={i === newGuessIdx}
                    isExpanded={expandedCardId === i}
                    onToggleExpand={() => setExpandedCardId(expandedCardId === i ? null : i)}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* ── Légende ── */}
        {guesses.length > 0 && (
          <div id="legend-free" style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
            {[['#34d399','rgba(52,211,153,0.5)','Exact'],['#fbbf24','rgba(251,191,36,0.4)','Proche'],['rgba(255,255,255,0.15)','none','Faux']].map(([color,shadow,label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, boxShadow: shadow !== 'none' ? `0 0 5px ${shadow}` : 'none' }} />
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showResult && round.secretMovie && (
        <ResultModal status="won" secretMovie={round.secretMovie} guesses={guesses} dailyNumber={0} hintsUsed={round.hintsUsed} onClose={() => setShowResult(false)} onNextRound={() => { setShowResult(false); nextRound() }} />
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
