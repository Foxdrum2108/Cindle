'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import type { Movie, GuessRecord } from '@/lib/types'
import { generateShareText } from '@/lib/game'

interface Props {
  status:       'won'
  secretMovie:  Movie
  guesses:      GuessRecord[]
  dailyNumber:  number
  hintsUsed:    number
  onClose:      () => void
  onNextRound?: () => void
}

const COLS = ['year','genres','director','actors','country','duration','language'] as const
const COL_ICONS: Record<string, string> = {
  year: '📅', genres: '🎭', director: '🎬', actors: '👥', country: '🌍', duration: '⏱', language: '🌐',
}

function getGrade(attempts: number, hints: number) {
  if (attempts === 1 && hints === 0) return { grade: 'S', color: '#f5a623', label: 'Légendaire 🌟' }
  if (attempts === 1)                return { grade: 'S', color: '#f5a623', label: 'Incroyable !' }
  if (attempts <= 2 && hints === 0)  return { grade: 'A+', color: '#34d399', label: 'Expert !' }
  if (attempts <= 3)                 return { grade: 'A',  color: '#34d399', label: 'Excellent !' }
  if (attempts <= 5)                 return { grade: 'B',  color: '#60a5fa', label: 'Bien joué !' }
  if (attempts <= 7)                 return { grade: 'C',  color: '#fbbf24', label: 'Pas mal !' }
  return                               { grade: 'D',  color: '#f87171', label: 'Juste à temps !' }
}

export default function ResultModal({ secretMovie, guesses, dailyNumber, hintsUsed, onClose, onNextRound }: Props) {
  const [shareCopied, setShareCopied] = useState(false)
  const { grade, color, label } = getGrade(guesses.length, hintsUsed)
  const score = Math.max(0, 1000 - (guesses.length - 1) * 100 - hintsUsed * 50)

  useEffect(() => {
    import('canvas-confetti').then(({ default: confetti }) => {
      const gold   = ['#f5a623', '#fbbf24', '#fde68a', '#ffffff', '#fffbeb']
      const purple = ['#a78bfa', '#c4b5fd', '#7c3aed', '#f5a623']
      confetti({ particleCount: 220, spread: 110, origin: { y: 0.55 }, colors: gold, shapes: ['circle', 'square'] })
      setTimeout(() => confetti({ particleCount: 120, spread: 85, origin: { y: 0.5, x: 0.08 }, colors: purple }), 380)
      setTimeout(() => confetti({ particleCount: 120, spread: 85, origin: { y: 0.5, x: 0.92 }, colors: gold  }), 650)
      setTimeout(() => confetti({ particleCount: 80,  spread: 60, origin: { y: 0.35           }, colors: [...gold, ...purple] }), 950)
    })
  }, [])

  async function handleShare() {
    const text = generateShareText(guesses, true, dailyNumber)
    try {
      if (navigator.share) await navigator.share({ text })
      else {
        await navigator.clipboard.writeText(text)
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 2500)
      }
    } catch { /* ignore */ }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-lg overflow-y-auto modal-card animate-modal-enter"
        style={{
          maxHeight: '94vh',
          background: 'linear-gradient(180deg, rgba(10,10,26,0.99) 0%, rgba(4,4,13,1) 100%)',
          border: '1px solid rgba(245,166,35,0.18)',
          boxShadow: '0 -8px 80px rgba(245,166,35,0.12), 0 0 0 1px rgba(245,166,35,0.06)',
        }}
      >
        {/* Poster header */}
        <div className="relative overflow-hidden modal-header" style={{ height: 210 }}>
          {secretMovie.posterUrl ? (
            <Image src={secretMovie.posterUrl} alt={secretMovie.title} fill className="object-cover"
              style={{ filter: 'brightness(0.4) saturate(1.5)' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(245,166,35,0.18), rgba(167,139,250,0.18))' }} />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(4,4,13,0.5) 55%, rgba(4,4,13,0.99) 100%)' }} />
          <div className="absolute top-0 left-0 right-0 film-perfs" style={{ height: 12, background: 'rgba(0,0,0,0.6)' }} />

          <button onClick={onClose} className="absolute top-4 right-4" style={{
            background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '50%', width: 34, height: 34, color: 'rgba(255,255,255,0.65)',
            cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)', lineHeight: 1,
          }}>×</button>

          <div className="absolute bottom-0 left-0 right-0 p-5 pb-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#f5a623' }}>✨ TROUVÉ !</span>
              {dailyNumber > 0 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: 600 }}>#{dailyNumber}</span>}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.2, textShadow: '0 2px 16px rgba(0,0,0,0.9)' }}>
              {secretMovie.title}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
              {secretMovie.year} · {secretMovie.director} · {secretMovie.duration} min
            </p>
          </div>
        </div>

        {/* Corps */}
        <div style={{ padding: '18px 18px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stats 3 colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 9 }}>
            {[
              { icon: '🎯', val: guesses.length, sub: guesses.length === 1 ? 'essai' : 'essais' },
              { icon: '💡', val: hintsUsed,       sub: hintsUsed === 1 ? 'indice' : 'indices'   },
              { icon: '⭐', val: score,            sub: 'points'                                  },
            ].map(({ icon, val, sub }) => (
              <div key={sub} style={{
                background: 'rgba(245,166,35,0.05)', border: '1px solid rgba(245,166,35,0.12)',
                borderRadius: 14, padding: '13px 8px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, marginBottom: 3 }}>{icon}</div>
                <div style={{ fontSize: 25, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{val}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', fontWeight: 600, marginTop: 3 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Grade */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
            background: `${color}07`, border: `1.5px solid ${color}20`, borderRadius: 16,
          }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: `${color}15`, border: `2.5px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 900, color, flexShrink: 0,
              boxShadow: `0 0 24px ${color}22`,
            }}>
              {grade}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>{label}</p>
              <p style={{ margin: '3px 0 0 0', fontSize: 12, color: 'rgba(255,255,255,0.32)' }}>
                {guesses.length} essai{guesses.length > 1 ? 's' : ''} · {hintsUsed} indice{hintsUsed !== 1 ? 's' : ''} · {score} pts
              </p>
            </div>
          </div>

          {/* Achievements */}
          <AchievementRow attempts={guesses.length} hintsUsed={hintsUsed} />

          {/* Grille de progression */}
          {guesses.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '14px 16px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>
                Progression · {guesses.length} / 8
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 6, paddingLeft: 20 }}>
                {COLS.map(col => (
                  <div key={col} style={{ width: 30, textAlign: 'center', fontSize: 12 }}>{COL_ICONS[col]}</div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                {guesses.map((g, i) => (
                  <div key={i} style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', width: 16, textAlign: 'right', fontWeight: 600 }}>{i + 1}</span>
                    {COLS.map(col => {
                      const m = g.result[col].match
                      return (
                        <div key={col} style={{
                          width: 30, height: 28, borderRadius: 7,
                          background: m === 'correct' ? 'rgba(52,211,153,0.22)' : m === 'close' ? 'rgba(251,191,36,0.22)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${m === 'correct' ? 'rgba(52,211,153,0.45)' : m === 'close' ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700,
                          color: m === 'correct' ? '#34d399' : m === 'close' ? '#fbbf24' : 'rgba(255,255,255,0.13)',
                        }}>
                          {m === 'correct' ? '✓' : m === 'close' ? '~' : '·'}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 10 }}>
                {[
                  { bg: 'rgba(52,211,153,0.22)',  bord: 'rgba(52,211,153,0.45)',  col: '#34d399',                s: '✓', lab: 'Exact'  },
                  { bg: 'rgba(251,191,36,0.22)',   bord: 'rgba(251,191,36,0.4)',   col: '#fbbf24',                s: '~', lab: 'Proche' },
                  { bg: 'rgba(255,255,255,0.04)',  bord: 'rgba(255,255,255,0.08)', col: 'rgba(255,255,255,0.13)', s: '·', lab: 'Faux'   },
                ].map(({ bg, bord, col, s, lab }) => (
                  <div key={lab} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 15, height: 15, borderRadius: 4, background: bg, border: `1px solid ${bord}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: col, fontWeight: 700 }}>{s}</div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: 600 }}>{lab}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Genres + Pays */}
          {(secretMovie.genres.length > 0 || secretMovie.country) && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {secretMovie.genres.map(g => (
                <span key={g} style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#c4b5fd' }}>
                  {g}
                </span>
              ))}
              {secretMovie.country && (
                <span style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)', borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#2dd4bf' }}>
                  🌍 {secretMovie.country}
                </span>
              )}
            </div>
          )}

          {/* Synopsis */}
          {secretMovie.synopsis && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.65, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {secretMovie.synopsis}
            </p>
          )}

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 9, marginTop: 2 }}>
            <button onClick={handleShare} style={{
              flex: 2, padding: '14px 16px', borderRadius: 14,
              background: shareCopied ? 'rgba(52,211,153,0.18)' : 'linear-gradient(135deg, #f5a623 0%, #d97706 100%)',
              border: shareCopied ? '1px solid rgba(52,211,153,0.35)' : 'none',
              color: shareCopied ? '#34d399' : '#000',
              fontWeight: 800, fontSize: 15, cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
              boxShadow: shareCopied ? 'none' : '0 4px 22px rgba(245,166,35,0.35)',
              transition: 'all 0.3s ease',
            }}>
              {shareCopied ? '✓ Copié !' : '📋 Partager'}
            </button>
            {secretMovie.tmdbId && (
              <a href={`https://www.themoviedb.org/movie/${secretMovie.tmdbId}`} target="_blank" rel="noopener noreferrer" style={{
                flex: 1, padding: '14px 10px', borderRadius: 14, textDecoration: 'none',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                color: 'rgba(255,255,255,0.55)', fontWeight: 700, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s ease',
              }}>
                🎬 TMDB
              </a>
            )}
          </div>

          {onNextRound && (
            <button onClick={onNextRound} style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
              border: 'none', color: '#fff', fontWeight: 800, fontSize: 15,
              cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
              boxShadow: '0 4px 22px rgba(167,139,250,0.3)',
              transition: 'all 0.3s ease',
            }}>
              🎲 Film suivant
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AchievementRow({ attempts, hintsUsed }: { attempts: number; hintsUsed: number }) {
  const badges = [
    { icon: '⚡', label: 'Coup de génie',     color: '#f5a623', show: attempts === 1 && hintsUsed === 0 },
    { icon: '🌟', label: '1er essai !',        color: '#f5a623', show: attempts === 1 && hintsUsed > 0  },
    { icon: '🚀', label: 'Éclair',             color: '#60a5fa', show: attempts >= 2 && attempts <= 3   },
    { icon: '🧠', label: 'Sans indices',       color: '#a78bfa', show: hintsUsed === 0 && attempts > 1  },
    { icon: '💪', label: 'Persévérant',        color: '#34d399', show: attempts >= 5 && attempts <= 7   },
    { icon: '🏁', label: 'In extremis',        color: '#f87171', show: attempts >= 7                    },
    { icon: '💡', label: 'Maître des indices', color: '#f472b6', show: hintsUsed >= 3                   },
  ].filter(b => b.show)

  if (!badges.length) return null

  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center' }}>
      {badges.map((b, i) => (
        <div key={b.label} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 13px', borderRadius: 999,
          background: `${b.color}12`, border: `1px solid ${b.color}30`,
          animation: `popIn 0.5s cubic-bezier(0.68,-0.55,0.265,1.55) ${i * 0.08}s both`,
        }}>
          <span style={{ fontSize: 15 }}>{b.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: b.color }}>{b.label}</span>
        </div>
      ))}
    </div>
  )
}
