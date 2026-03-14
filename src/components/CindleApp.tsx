'use client'

import { useState } from 'react'
import Image         from 'next/image'
import GameBoard     from './GameBoard'
import FreePlayBoard from './FreePlayBoard'

type Tab = 'daily' | 'free'

interface Props {
  dailyNumber: number
  backgrounds: string[]
}

export default function CindleApp({ dailyNumber, backgrounds }: Props) {
  const [tab, setTab] = useState<Tab>('daily')

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--dark)' }}>

      {/* ── Fond : mosaïque d'affiches ──────────────────────────────────── */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gridAutoRows: '120px', gap: '2px' }}
        >
          {backgrounds.map((url, i) => (
            <div key={i} className="overflow-hidden" style={{ filter: 'blur(1px)' }}>
              <Image src={url} alt="" width={80} height={120} className="object-cover w-full h-full" />
            </div>
          ))}
        </div>
        {/* Multi-layer overlay for cinematic depth */}
        <div className="absolute inset-0" style={{ background: 'rgba(4,4,13,0.88)' }} />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,166,35,0.06) 0%, transparent 60%)'
        }} />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 100%, rgba(4,4,13,0.9) 0%, transparent 70%)'
        }} />
      </div>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="relative z-20 sticky top-0">
        {/* Film perforations top */}
        <div className="film-perfs bg-black/70" />

        {/* Main header bar */}
        <div style={{ background: 'rgba(4,4,13,0.8)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(245,166,35,0.05))', border: '1px solid rgba(245,166,35,0.25)' }}>
                  🎬
                </div>
              </div>
              <div className="flex flex-col">
                <span className="logo-text font-black text-xl leading-none tracking-[0.12em]">CINDLE</span>
                <span className="text-white/25 text-[10px] leading-none mt-0.5 tracking-widest">#{dailyNumber}</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => setTab('daily')}
                className={`tab-btn tab-btn-daily ${tab === 'daily' ? 'active' : ''}`}
              >
                🎯 Quotidien
              </button>
              <button
                onClick={() => setTab('free')}
                className={`tab-btn tab-btn-free ${tab === 'free' ? 'active' : ''}`}
              >
                🎲 Infini
              </button>
            </div>
          </div>
        </div>

        {/* Film perforations bottom */}
        <div className="film-perfs bg-black/40" />
      </header>

      {/* ── Contenu ──────────────────────────────────────────────────────── */}
      <main className="relative z-10 pt-4 pb-16">
        {tab === 'daily'
          ? <GameBoard dailyNumber={dailyNumber} backgrounds={[]} />
          : <FreePlayBoard />
        }
      </main>

      <footer className="relative z-10 text-center py-3" style={{ color: 'rgba(255,255,255,0.1)', fontSize: 11 }}>
        Données · <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>TMDB</a>
      </footer>
    </div>
  )
}
