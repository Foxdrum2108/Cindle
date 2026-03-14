'use client'

import { useState } from 'react'
import type { Movie } from '@/lib/types'

interface Props {
  secretMovie?: Movie | null
  targetMovieId?: number
  guesses: number
  hintsUsed: number
  usedHints?: string[]
  onHintUsed: (hint: string) => void
  disabled?: boolean
}

export default function HintButton({ secretMovie, targetMovieId, guesses, hintsUsed, usedHints = [], onHintUsed, disabled }: Props) {
  const [loading, setLoading] = useState(false)
  const [movie, setMovie] = useState<Movie | null>(secretMovie ?? null)

  if (!secretMovie && !targetMovieId) return null

  const handleGetHint = async () => {
    setLoading(true)
    let targetMovie = movie

    // Si on doit fetch le film
    if (!targetMovie && targetMovieId) {
      try {
        const res = await fetch(`/api/movies/${targetMovieId}`)
        if (res.ok) {
          targetMovie = await res.json()
          setMovie(targetMovie)
        } else {
          console.error('Failed to fetch movie')
          setLoading(false)
          return
        }
      } catch (err) {
        console.error('Fetch error:', err)
        setLoading(false)
        return
      }
    }

    if (!targetMovie) {
      console.error('No target movie found')
      setLoading(false)
      return
    }

    const hints: string[] = []

    // Année
    if (targetMovie.year > 0) {
      hints.push(`📅 L'année est ${targetMovie.year}`)
    }

    // Genre
    if (targetMovie.genres && targetMovie.genres.length > 0) {
      const randomGenre = targetMovie.genres[Math.floor(Math.random() * targetMovie.genres.length)]
      hints.push(`🎭 Le genre est ${randomGenre}`)
    }

    // Acteur (parmi les 3 plus connus = les 3 premiers au générique)
    if (targetMovie.actors && targetMovie.actors.length > 0) {
      const topActors  = targetMovie.actors.slice(0, 3)
      const randomActor = topActors[Math.floor(Math.random() * topActors.length)]
      hints.push(`🎬 Un acteur : ${randomActor.name}`)
    }

    // Budget
    if (targetMovie.budget && targetMovie.budget > 0) {
      const budget = targetMovie.budget
      if (budget > 100000000) {
        hints.push(`💰 Budget > 100M$`)
      } else if (budget > 50000000) {
        hints.push(`💰 Budget 50-100M$`)
      } else {
        hints.push(`💰 Budget < 50M$`)
      }
    }

    // Récompenses
    if (targetMovie.awards) {
      hints.push(`🏆 Le film a reçu des récompenses`)
    }

    // Pays
    if (targetMovie.country) {
      hints.push(`🌍 Produit en ${targetMovie.country}`)
    }

    // Franchise
    if (targetMovie.franchise) {
      hints.push(`🔗 Fait partie de : ${targetMovie.franchise}`)
    }

    // Durée
    if (targetMovie.duration > 0) {
      hints.push(`⏱️  Durée : ${targetMovie.duration} minutes`)
    }

    if (hints.length === 0) {
      hints.push(`💡 Indice : C'est un excellent film !`)
    }

    // Filtrer les indices déjà utilisés
    const available = hints.filter(h => !usedHints.includes(h))
    
    if (available.length === 0) {
      console.log('No more hints available')
      setLoading(false)
      return
    }

    const hint = available[Math.floor(Math.random() * available.length)]
    onHintUsed(hint)
    setLoading(false)
  }

  return (
    <button
      onClick={handleGetHint}
      disabled={disabled || loading}
      title={loading ? "Chargement..." : ""}
      style={{
        padding: '10px 16px',
        borderRadius: 12,
        fontWeight: 700,
        fontSize: 13,
        background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.08))',
        border: '1px solid rgba(168,85,247,0.3)',
        color: '#a855f7',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        transition: 'all 0.3s ease',
        fontFamily: 'Outfit, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 0 0 0 rgba(168,85,247,0)'
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.25)'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(168,85,247,0.6)'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 8px rgba(168,85,247,0.15)'
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.08))'
        ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(168,85,247,0.3)'
        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 0 rgba(168,85,247,0)'
        ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
      }}
    >
      {loading ? <span className="animate-rotate-360">⏳</span> : '💡'} Indice ({hintsUsed})
    </button>
  )
}
