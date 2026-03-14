'use client'

import Image from 'next/image'
import type { Actor } from '@/lib/types'

interface Props {
  foundActors:   Actor[]
  director:      string | null
  directorPath:  string | null
}

function PersonCard({ actor, isDirector = false }: { actor: Actor; isDirector?: boolean }) {
  const size  = isDirector ? 52 : 48
  const [first, ...rest] = actor.name.split(' ')
  const last  = rest.join(' ')

  return (
    <div className="flex flex-col items-center gap-1.5" style={{ width: isDirector ? 72 : 64 }}>
      {/* Avatar */}
      <div
        className="relative flex-shrink-0 overflow-hidden"
        style={{
          width:        size,
          height:       size,
          borderRadius: '50%',
          background:   'rgba(255,255,255,0.08)',
          boxShadow:    isDirector
            ? '0 0 0 2px rgba(245,166,35,0.5), 0 4px 16px rgba(245,166,35,0.2)'
            : '0 0 0 2px rgba(52,211,153,0.4), 0 4px 12px rgba(52,211,153,0.15)',
        }}
      >
        {actor.profilePath ? (
          <Image
            src={actor.profilePath}
            alt={actor.name}
            width={size}
            height={size}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-bold text-white/60" style={{ fontSize: 18 }}>
            {first.charAt(0)}{last ? last.charAt(0) : ''}
          </div>
        )}
        {isDirector && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[10px] shadow-lg">
            🎬
          </div>
        )}
      </div>

      {/* Nom */}
      <div className="text-center leading-tight">
        {last ? (
          <>
            <p className="text-white/50 font-medium" style={{ fontSize: 10 }}>{first}</p>
            <p className="text-white font-bold" style={{ fontSize: 11 }}>{last}</p>
          </>
        ) : (
          <p className="text-white font-bold" style={{ fontSize: 11 }}>{first}</p>
        )}
      </div>
    </div>
  )
}

function EmptySlot({ isDirector = false }: { isDirector?: boolean }) {
  const size = isDirector ? 52 : 48
  return (
    <div className="flex flex-col items-center gap-1.5" style={{ width: isDirector ? 72 : 64 }}>
      <div
        style={{
          width:        size,
          height:       size,
          borderRadius: '50%',
          border:       '1.5px dashed rgba(255,255,255,0.1)',
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'rgba(255,255,255,0.12)' }}>
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      </div>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)', fontWeight: 600 }}>
        {isDirector ? 'Réal.' : '?'}
      </p>
    </div>
  )
}

export default function ActorGrid({ foundActors, director, directorPath }: Props) {
  const uniqueActors = foundActors.filter(
    (a, i, arr) => arr.findIndex(b => b.name === a.name) === i
  )

  const directorActor: Actor | null = director
    ? { name: director, profilePath: directorPath }
    : null

  return (
    <div className="space-y-5">
      {/* Réalisateur */}
      <div>
        <p className="text-center mb-3" style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Réalisateur
        </p>
        <div className="flex justify-center">
          {directorActor
            ? <PersonCard actor={directorActor} isDirector />
            : <EmptySlot isDirector />
          }
        </div>
      </div>

      {/* Séparateur */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* Acteurs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Acteurs
          </p>
          {uniqueActors.length > 0 && (
            <span style={{ fontSize: 11, color: 'rgba(52,211,153,0.8)', fontWeight: 700 }}>
              {uniqueActors.length} trouvé{uniqueActors.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 justify-center min-h-[72px]">
          {uniqueActors.length > 0
            ? uniqueActors.map(a => <PersonCard key={a.name} actor={a} />)
            : Array.from({ length: 4 }).map((_, i) => <EmptySlot key={i} />)
          }
        </div>
      </div>
    </div>
  )
}
