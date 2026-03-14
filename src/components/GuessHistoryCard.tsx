'use client'

import Image from 'next/image'
import type { GuessRecord } from '@/lib/types'

const RESULT_COLS = ['year','genres','director','actors','country','duration','language'] as const

const COL_ICONS: Record<string, string> = {
  year: '📅', genres: '🎭', director: '🎬', actors: '👥', country: '🌍', duration: '⏱', language: '🌐',
}
const COL_LABELS: Record<string, string> = {
  year: 'Année', genres: 'Genres', director: 'Réalisateur', actors: 'Acteurs', country: 'Pays', duration: 'Durée', language: 'Langue',
}

interface Props {
  guess:          GuessRecord
  isNew:          boolean
  isExpanded:     boolean
  onToggleExpand: () => void
}

export default function GuessHistoryCard({ guess, isNew, isExpanded, onToggleExpand }: Props) {
  const correctCount = RESULT_COLS.filter(c => guess.result[c].match === 'correct').length

  const borderColor = correctCount === 7
    ? 'rgba(52,211,153,0.4)'
    : correctCount >= 5
      ? 'rgba(52,211,153,0.2)'
      : correctCount >= 3
        ? 'rgba(251,191,36,0.2)'
        : 'rgba(255,255,255,0.07)'

  return (
    <div
      className={isNew ? 'animate-slide-up' : ''}
      style={{
        borderRadius: 14,
        background: isExpanded ? 'rgba(168,85,247,0.06)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${isExpanded ? 'rgba(168,85,247,0.35)' : borderColor}`,
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        boxShadow: isExpanded ? '0 8px 28px rgba(168,85,247,0.12)' : 'none',
      }}
    >
      {/* ── Header (toujours visible) ─────────────────────────────── */}
      <div
        onClick={(e) => { e.stopPropagation(); onToggleExpand() }}
        style={{
          padding: '10px 13px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Poster */}
        <div style={{ width: 38, height: 55, flexShrink: 0, borderRadius: 7, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
          {guess.movie.posterUrl
            ? <Image src={guess.movie.posterUrl} alt={guess.movie.title} width={38} height={55} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
            : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>?</div>
          }
        </div>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {guess.movie.title}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '2px 0 0 0', display: 'flex', gap: 6 }}>
            <span>{guess.movie.year}</span>
            <span>·</span>
            <span>{guess.movie.duration} min</span>
          </p>
        </div>

        {/* Résultat dots */}
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          {RESULT_COLS.map(col => {
            const m = guess.result[col].match
            return (
              <div
                key={col}
                title={`${COL_LABELS[col]} : ${m === 'correct' ? 'exact' : m === 'close' ? 'proche' : 'faux'}`}
                style={{
                  width: 9, height: 9, borderRadius: '50%',
                  background: m === 'correct' ? '#34d399' : m === 'close' ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                  boxShadow: m === 'correct' ? '0 0 5px rgba(52,211,153,0.7)' : m === 'close' ? '0 0 4px rgba(251,191,36,0.6)' : 'none',
                }}
              />
            )
          })}
        </div>

        {/* Tag réalisateur */}
        <div style={{
          padding: '3px 8px', borderRadius: 6,
          background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.18)',
          fontSize: 10, fontWeight: 700, color: 'rgba(168,85,247,0.75)',
          flexShrink: 0, whiteSpace: 'nowrap', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis',
        }} title={guess.movie.director}>
          {guess.movie.director.split(' ').slice(-1)[0]}
        </div>

        {/* Tag acteurs en commun */}
        {guess.matchingActors && guess.matchingActors.length > 0 && (
          <div style={{
            padding: '3px 8px', borderRadius: 6,
            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.22)',
            fontSize: 10, fontWeight: 700, color: '#34d399',
            flexShrink: 0, whiteSpace: 'nowrap',
          }} title={guess.matchingActors.map(a => a.name).join(', ')}>
            {guess.matchingActors.length} ✓
          </div>
        )}

        {/* Flèche expand */}
        <div style={{
          fontSize: 9, color: 'rgba(168,85,247,0.45)',
          transition: 'transform 0.3s ease',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          flexShrink: 0,
        }}>▼</div>
      </div>

      {/* ── Contenu déplié ────────────────────────────────────────── */}
      {isExpanded && (
        <div style={{
          borderTop: '1px solid rgba(168,85,247,0.12)',
          padding: '14px 13px 16px',
          animation: 'fadeInUp 0.3s ease-out',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {/* Grille de stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7 }}>
            {[
              { key: 'year',     label: 'Année',       value: String(guess.movie.year) },
              { key: 'duration', label: 'Durée',        value: `${guess.movie.duration} min` },
              { key: 'country',  label: 'Pays',         value: guess.movie.country },
              { key: 'genres',   label: 'Genres',       value: guess.movie.genres.join(', ') },
              { key: 'language', label: 'Langue',       value: guess.movie.language.toUpperCase() },
              { key: 'director', label: 'Réalisateur',  value: guess.movie.director },
            ].map(({ key, label, value }) => {
              const cell = guess.result[key as keyof typeof guess.result]
              const m    = cell.match
              const dir  = (cell as any).direction as string | undefined
              const bg   = m === 'correct' ? 'rgba(52,211,153,0.1)'  : m === 'close' ? 'rgba(251,191,36,0.1)'  : 'rgba(255,255,255,0.03)'
              const col  = m === 'correct' ? '#34d399'                : m === 'close' ? '#fbbf24'               : 'rgba(255,255,255,0.4)'
              const bord = m === 'correct' ? 'rgba(52,211,153,0.22)' : m === 'close' ? 'rgba(251,191,36,0.22)' : 'rgba(255,255,255,0.07)'
              return (
                <div key={key} style={{ background: bg, border: `1px solid ${bord}`, padding: '8px 10px', borderRadius: 10 }}>
                  <p style={{ margin: 0, fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {COL_ICONS[key]} {label}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 12, fontWeight: 700, color: col }}>
                    {dir === 'up' ? '↑ ' : dir === 'down' ? '↓ ' : ''}{value}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Acteurs en commun */}
          {guess.matchingActors && guess.matchingActors.length > 0 && (
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: 9, color: 'rgba(52,211,153,0.65)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                ✓ {guess.matchingActors.length} acteur{guess.matchingActors.length > 1 ? 's' : ''} en commun
              </p>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {guess.matchingActors.map(a => (
                  <span key={a.name} style={{ fontSize: 11, fontWeight: 600, color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(52,211,153,0.2)' }}>
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Distribution complète */}
          {guess.movie.actors.length > 0 && (
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: 9, color: 'rgba(255,255,255,0.25)', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Distribution ({guess.movie.actors.length})
              </p>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {guess.movie.actors.map(a => (
                  <span key={a.name} style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
