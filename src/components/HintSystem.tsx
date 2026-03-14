'use client'

/**
 * HintSystem — Système d'indices progressifs après plusieurs échecs.
 * - Après 4 échecs : affiche l'affiche floutée du film secret
 * - Après 6 échecs : révèle un acteur supplémentaire
 *
 * Note : ce composant reçoit le TMDB ID du film secret, PAS le film complet,
 * pour ne pas spoiler le titre. On affiche uniquement l'affiche floue.
 */

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { MAX_ATTEMPTS } from '@/lib/game'

interface Props {
  attempts:     number
  secretPoster: string | null   // URL affiche (révélée seulement via API après seuil)
  secretActor:  string | null   // Acteur hint (révélé après 6 échecs)
}

export default function HintSystem({ attempts, secretPoster, secretActor }: Props) {
  const [showPoster, setShowPoster] = useState(false)
  const [showActor,  setShowActor]  = useState(false)

  const POSTER_THRESHOLD = 4
  const ACTOR_THRESHOLD  = 6

  useEffect(() => {
    if (attempts >= POSTER_THRESHOLD && secretPoster) {
      setShowPoster(true)
    }
  }, [attempts, secretPoster])

  useEffect(() => {
    if (attempts >= ACTOR_THRESHOLD && secretActor) {
      setShowActor(true)
    }
  }, [attempts, secretActor])

  if (attempts < POSTER_THRESHOLD) return null

  return (
    <div className="flex flex-col items-center gap-3 mt-4 animate-fade-in">
      <p className="text-yellow-400 text-sm font-semibold">
        Indice {attempts >= ACTOR_THRESHOLD ? '2/2' : '1/2'}
      </p>

      {/* Affiche floutée */}
      {showPoster && secretPoster && (
        <div className="relative">
          <p className="text-gray-400 text-xs mb-2 text-center">
            L&apos;affiche du film (floue)
          </p>
          <div className="relative w-32 h-44 rounded-xl overflow-hidden border border-gray-700 shadow-lg">
            <Image
              src={secretPoster}
              alt="Indice : affiche du film"
              fill
              className={`object-cover transition-all duration-1000 ${
                attempts >= ACTOR_THRESHOLD ? 'blur-[4px]' : 'blur-[12px]'
              }`}
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        </div>
      )}

      {/* Indice acteur */}
      {showActor && secretActor && (
        <div className="bg-gray-800 border border-yellow-500/40 rounded-xl px-6 py-3 text-center">
          <p className="text-gray-400 text-xs mb-1">Un acteur du film :</p>
          <p className="text-white font-semibold">{secretActor}</p>
        </div>
      )}

      {/* Prochain indice */}
      {!showActor && attempts < ACTOR_THRESHOLD && (
        <p className="text-gray-500 text-xs">
          Prochain indice dans {ACTOR_THRESHOLD - attempts} essai(s)
        </p>
      )}

      {/* Tentatives restantes */}
      <p className="text-gray-500 text-xs">
        {MAX_ATTEMPTS - attempts} essai(s) restant(s)
      </p>
    </div>
  )
}
