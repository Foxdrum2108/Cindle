'use client'

/**
 * Header — Barre de navigation de Cindle.
 * Affiche : logo, numéro du puzzle, compteur d'essais, boutons règles et partage.
 */

import { useState } from 'react'
import HelpModal from './HelpModal'
import type { GameState } from '@/lib/types'
import { generateShareText, MAX_ATTEMPTS } from '@/lib/game'

interface Props {
  dailyNumber: number
  gameState:   GameState | null
}

export default function Header({ dailyNumber, gameState }: Props) {
  const [showHelp, setShowHelp] = useState(false)

  const attempts = gameState?.guesses.length ?? 0
  const isOver   = gameState?.status !== 'playing'

  async function handleShare() {
    if (!gameState || gameState.status === 'playing') return
    const text = generateShareText(
      gameState.guesses,
      gameState.status === 'won',
      dailyNumber
    )
    try {
      if (navigator.share) {
        await navigator.share({ text })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        alert('Résultats copiés !')
      }
    } catch { /* ignore */ }
  }

  return (
    <>
      <header className="w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <div>
              <span className="text-white font-extrabold text-xl tracking-tight">Cindle</span>
              <span className="text-gray-500 text-xs ml-2">#{dailyNumber}</span>
            </div>
          </div>

          {/* Centre : compteur d'essais */}
          <div className="flex items-center gap-1">
            {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
              <div
                key={i}
                className={[
                  'w-3 h-3 rounded-full transition-colors',
                  i < attempts
                    ? gameState?.status === 'won' && i === attempts - 1
                      ? 'bg-green-500'
                      : 'bg-gray-500'
                    : 'bg-gray-700',
                ].join(' ')}
              />
            ))}
            <span className="text-gray-400 text-xs ml-2">{attempts}/{MAX_ATTEMPTS}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isOver && (
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400 text-black text-xs font-bold hover:bg-yellow-300 transition-colors"
                title="Partager mes résultats"
              >
                <span>Partager</span>
                <span>🔗</span>
              </button>
            )}
            <button
              onClick={() => setShowHelp(true)}
              className="w-8 h-8 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-colors flex items-center justify-center text-sm font-bold"
              title="Règles du jeu"
              aria-label="Aide"
            >
              ?
            </button>
          </div>
        </div>
      </header>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </>
  )
}
