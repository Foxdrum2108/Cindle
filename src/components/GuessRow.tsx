'use client'

import Image from 'next/image'
import type { GuessRecord, CellResult, MatchResult, Actor } from '@/lib/types'
import { getMatchingActors } from '@/lib/game'

interface Props {
  guess:   GuessRecord
  isNew:   boolean
  // Le film secret partiel (acteurs + réalisateur) pour afficher les photos des matches
  secret?: { actors: Actor[]; director: string; directorProfilePath: string | null }
}

const COLUMNS = [
  { key: 'year',     label: 'Année'  },
  { key: 'genres',   label: 'Genres' },
  { key: 'director', label: 'Réal.'  },
  { key: 'actors',   label: 'Acteurs'},
  { key: 'country',  label: 'Pays'   },
  { key: 'duration', label: 'Durée'  },
  { key: 'language', label: 'Langue' },
] as const

const BG: Record<MatchResult, string> = {
  correct: 'bg-emerald-600 border-emerald-500',
  close:   'bg-amber-500   border-amber-400',
  wrong:   'bg-zinc-800    border-zinc-700',
}

function Arrow({ d }: { d?: 'up' | 'down' | null }) {
  if (!d) return null
  return <span className="opacity-70 ml-0.5 text-[10px]">{d === 'up' ? '↑' : '↓'}</span>
}

function Avatar({ src, name, size = 26 }: { src: string | null; name: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white/40 bg-white/20"
    >
      {src ? (
        <Image src={src} alt={name} width={size} height={size} className="object-cover w-full h-full" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white">
          {name.charAt(0)}
        </div>
      )}
    </div>
  )
}

function CellContent({ col, guess, secret }: {
  col:    typeof COLUMNS[number]['key']
  guess:  GuessRecord
  secret?: Props['secret']
}) {
  const m = guess.movie
  const r = guess.result

  if (col === 'year')     return <>{m.year}<Arrow d={r.year.direction} /></>
  if (col === 'genres')   return <>{m.genres.slice(0, 2).join(', ')}</>
  if (col === 'country')  return <>{m.country}</>
  if (col === 'duration') return <>{m.duration}min<Arrow d={r.duration.direction} /></>
  if (col === 'language') return <>{m.language.toUpperCase()}</>

  if (col === 'director') {
    const isMatch = r.director.match === 'correct'
    return (
      <div className="flex items-center gap-1 justify-center">
        {isMatch && (
          <Avatar
            src={secret?.directorProfilePath ?? m.directorProfilePath}
            name={m.director}
            size={24}
          />
        )}
        <span className="truncate max-w-[72px]">{m.director}</span>
      </div>
    )
  }

  if (col === 'actors') {
    // Si on a le film secret, montrer les photos des acteurs en commun
    if (secret && r.actors.match !== 'wrong') {
      const matching = getMatchingActors(m.actors, secret.actors)
      if (matching.length > 0) {
        return (
          <div className="flex items-center gap-0.5 justify-center flex-wrap">
            {matching.map(a => <Avatar key={a.name} src={a.profilePath} name={a.name} size={24} />)}
          </div>
        )
      }
    }
    return <span className="truncate max-w-[80px]">{m.actors.slice(0, 2).map(a => a.name).join(', ')}</span>
  }

  return null
}

export default function GuessRow({ guess, isNew, secret }: Props) {
  return (
    <div className="flex gap-1.5 items-stretch">
      {/* Titre du film */}
      <div className="w-36 lg:w-44 flex-shrink-0 px-3 py-2 rounded-xl border border-white/10 bg-white/5 flex flex-col justify-center">
        <span className="text-white font-semibold text-xs truncate" title={guess.movie.title}>
          {guess.movie.title}
        </span>
        <span className="text-white/30 text-[10px] mt-0.5">{guess.movie.year}</span>
      </div>

      {/* Cellules */}
      {COLUMNS.map((col, i) => {
        const result: CellResult = guess.result[col.key]
        return (
          <div
            key={col.key}
            className={[
              'flex-1 min-w-0 px-1 py-1.5 rounded-xl border',
              'flex flex-col items-center justify-center text-center text-white',
              isNew ? 'animate-flip' : '',
              BG[result.match],
            ].join(' ')}
            style={{ animationDelay: isNew ? `${i * 120}ms` : '0ms', animationFillMode: 'both' }}
          >
            <span className="text-white/40 text-[9px] mb-0.5">{col.label}</span>
            <span className="text-[11px] sm:text-xs font-medium leading-tight flex items-center justify-center gap-0.5">
              <CellContent col={col.key} guess={guess} secret={secret} />
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function EmptyRow() {
  return (
    <div className="flex gap-1.5 opacity-[0.07]">
      <div className="w-36 lg:w-44 flex-shrink-0 h-[52px] rounded-xl border border-white/20 bg-white/5" />
      {COLUMNS.map(c => (
        <div key={c.key} className="flex-1 h-[52px] rounded-xl border border-white/20 bg-white/5" />
      ))}
    </div>
  )
}
