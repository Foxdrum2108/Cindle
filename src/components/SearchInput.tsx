'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import type { SearchResult } from '@/lib/types'

const CHEAT_CODE = 'reponse'

interface Props {
  onSelect:    (movie: SearchResult) => void
  onCheatCode: () => void
  disabled:    boolean
  excludeIds:  number[]
  variant?:    'gold' | 'purple'
}

export default function SearchInput({ onSelect, onCheatCode, disabled, excludeIds, variant = 'gold' }: Props) {
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState<SearchResult[]>([])
  const [loading,   setLoading]   = useState(false)
  const [open,      setOpen]      = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const [shaking,   setShaking]   = useState(false)

  const inputRef    = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const excludeIdsRef = useRef(excludeIds)
  excludeIdsRef.current = excludeIds

  const search = useCallback(async (q: string) => {
    if (q.length < 1) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/movies/search?q=${encodeURIComponent(q)}&limit=8`)
      const data: SearchResult[] = await res.json()
      setResults(data.filter(m => !excludeIdsRef.current.includes(m.id)))
      setOpen(true); setHighlight(-1)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 180)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current   && !inputRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function select(movie: SearchResult) {
    onSelect(movie); setQuery(''); setResults([]); setOpen(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || !results.length) return
    if (e.key === 'ArrowDown')  { e.preventDefault(); setHighlight(h => Math.min(h + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp')  { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter' && highlight >= 0) { e.preventDefault(); select(results[highlight]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim().toLowerCase() === CHEAT_CODE) { setQuery(''); onCheatCode(); return }
    if (results.length) select(results[highlight >= 0 ? highlight : 0])
    else if (query.length) { setShaking(true); setTimeout(() => setShaking(false), 450) }
  }

  const isGold   = variant !== 'purple'
  const accentRGB = isGold ? '245,166,35' : '167,139,250'
  const btnBg     = isGold
    ? 'linear-gradient(135deg, #f5a623, #d97706)'
    : 'linear-gradient(135deg, #a78bfa, #7c3aed)'

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        {/* Gradient border wrapper */}
        <div
          className={shaking ? 'animate-shake' : ''}
          style={{
            borderRadius: 16,
            padding: 1.5,
            background: `linear-gradient(135deg, rgba(${accentRGB},0.35), rgba(${accentRGB},0.05) 60%, rgba(255,255,255,0.05))`,
            transition: 'all 0.3s',
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(4,4,13,0.9)', borderRadius: 14.5, padding: '4px 4px 4px 14px',
          }}>
            {/* Loupe */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={`rgba(${accentRGB},0.4)`} strokeWidth="2.5" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query.length > 0 && results.length > 0 && setOpen(true)}
              disabled={disabled}
              placeholder={disabled ? 'Film trouvé ! 🎉' : "Tape le nom d'un film…"}
              autoComplete="off"
              spellCheck={false}
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: 15, fontFamily: 'Outfit, sans-serif',
                fontWeight: 500, padding: '10px 0',
                opacity: disabled ? 0.4 : 1,
              }}
            />

            {loading && (
              <div style={{
                width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
                border: `2px solid rgba(${accentRGB},0.15)`,
                borderTop: `2px solid rgba(${accentRGB},0.8)`,
                animation: 'spin 0.65s linear infinite',
              }} />
            )}

            <button
              type="submit"
              disabled={disabled}
              style={{
                padding: '9px 20px', borderRadius: 12, fontWeight: 800,
                fontSize: 14, fontFamily: 'Outfit, sans-serif',
                cursor: disabled ? 'not-allowed' : 'pointer',
                border: 'none', whiteSpace: 'nowrap', transition: 'all 0.3s ease',
                background: disabled ? 'rgba(255,255,255,0.06)' : btnBg,
                color: disabled ? 'rgba(255,255,255,0.2)' : (isGold ? '#000' : '#fff'),
                boxShadow: disabled ? 'none' : `0 4px 14px rgba(${accentRGB},0.35)`,
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.transform = 'scale(1.08)'
                  e.currentTarget.style.boxShadow = `0 6px 24px rgba(${accentRGB},0.5)`
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = `0 4px 14px rgba(${accentRGB},0.35)`
              }}
            >
              Valider →
            </button>
          </div>
        </div>
      </form>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute', zIndex: 50, width: '100%', marginTop: 8,
            borderRadius: 16, overflow: 'hidden',
            background: 'rgba(6,6,18,0.98)', border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(${accentRGB},0.08)`,
            backdropFilter: 'blur(28px)',
            animation: 'fadeInUp 0.3s ease-out'
          }}
        >
          {results.map((movie, i) => (
            <button
              key={movie.id}
              onClick={() => select(movie)}
              onMouseEnter={() => setHighlight(i)}
              style={{
                animation: `fadeInUp 0.3s ease-out ${i * 0.05}s both`,
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px',
                background: i === highlight ? `rgba(${accentRGB},0.08)` : 'transparent',
                border: 'none',
                borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left',
              }}
            >
              <div style={{ width: 32, height: 46, flexShrink: 0, borderRadius: 7, overflow: 'hidden', background: 'rgba(255,255,255,0.07)' }}>
                {movie.posterUrl
                  ? <Image src={movie.posterUrl} alt={movie.title} width={32} height={46} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>?</div>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie.title}</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 1 }}>{movie.year} · {movie.director}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.length >= 2 && !results.length && !loading && (
        <div style={{
          position: 'absolute', zIndex: 50, width: '100%', marginTop: 8,
          borderRadius: 16, padding: '16px', textAlign: 'center',
          background: 'rgba(6,6,18,0.95)', border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.3)', fontSize: 13, backdropFilter: 'blur(20px)',
        }}>
          Aucun résultat pour « {query} »
        </div>
      )}
    </div>
  )
}
