'use client'

import type { Hints } from '@/lib/constraints'
import { formatDuration } from '@/lib/constraints'

interface Props {
  hints:             Hints
  attempts:          number
  productionCompany: string | null
  budget?:           number | null
}

const LANG_MAP: Record<string, { flag: string; label: string }> = {
  EN: { flag: '🇺🇸', label: 'Anglais' },
  FR: { flag: '🇫🇷', label: 'Français' },
  ES: { flag: '🇪🇸', label: 'Espagnol' },
  IT: { flag: '🇮🇹', label: 'Italien' },
  DE: { flag: '🇩🇪', label: 'Allemand' },
  JA: { flag: '🇯🇵', label: 'Japonais' },
  KO: { flag: '🇰🇷', label: 'Coréen' },
  PT: { flag: '🇧🇷', label: 'Portugais' },
  ZH: { flag: '🇨🇳', label: 'Chinois' },
  RU: { flag: '🇷🇺', label: 'Russe' },
}

interface BadgeProps {
  icon:    string
  label:   string
  color:   string  // tailwind gradient class
  glow:    string
}

function Badge({ icon, label, color, glow }: BadgeProps) {
  return (
    <span
      className="badge animate-pop-in"
      style={{
        background: color,
        boxShadow:  `0 2px 12px ${glow}`,
        border:     `1px solid ${glow.replace('0.4', '0.25')}`,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        padding: '10px 16px',
        fontSize: 15,
        gap: 8
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)'
        e.currentTarget.style.boxShadow = `0 6px 20px ${glow}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = `0 2px 12px ${glow}`
      }}
    >
      <span className="animate-bounce-soft" style={{ fontSize: 18 }}>{icon}</span>
      <span className="text-white font-bold">{label}</span>
    </span>
  )
}

function GhostBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="badge" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.2)', padding: '10px 16px', fontSize: 15, gap: 8 }}>
      <span style={{ opacity: 0.5, fontSize: 18 }}>{icon}</span>
      <span>{label}</span>
    </span>
  )
}

export default function HintBadges({ hints, attempts, productionCompany, budget }: Props) {
  if (attempts === 0) return null

  const now = new Date().getFullYear()
  const yearKnown     = hints.yearMin > 1900 || hints.yearMax < now + 1
  const durationKnown = hints.durationMin > 30 || hints.durationMax < 400

  // Format genres: show first genre + count if multiple
  const genresLabel = hints.genres.length > 0 ? hints.genres.join(" · ") : null

  const budgetLabel = budget && attempts >= 2
    ? `${(budget / 1_000_000).toFixed(1)}M$`
    : null

  const yearText = (() => {
    if (hints.yearMin === hints.yearMax) return `${hints.yearMin}`
    if (hints.yearMin > 1900 && hints.yearMax < now + 1) return `${hints.yearMin} – ${hints.yearMax}`
    if (hints.yearMax < now + 1) return `Avant ${hints.yearMax + 1}`
    if (hints.yearMin > 1900) return `Après ${hints.yearMin - 1}`
    return null
  })()

  const durationText = (() => {
    if (hints.durationMin === hints.durationMax) return formatDuration(hints.durationMin)
    const lo = hints.durationMin > 30  ? formatDuration(hints.durationMin) : null
    const hi = hints.durationMax < 400 ? formatDuration(hints.durationMax) : null
    if (lo && hi) return `${lo} – ${hi}`
    if (lo)       return `> ${lo}`
    if (hi)       return `< ${hi}`
    return null
  })()

  const langInfo = hints.language ? LANG_MAP[hints.language] ?? { flag: '🌐', label: hints.language } : null

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: 10,
      animation: 'fadeInUp 0.5s ease-out'
    }}>
      {/* Genres (simplified) */}
      {genresLabel
        ? <Badge icon="🎭" label={genresLabel}
            color="linear-gradient(135deg, rgba(139,92,246,0.25), rgba(109,40,217,0.15))"
            glow="rgba(139,92,246,0.4)"
          />
        : <GhostBadge icon="🎭" label="Genre ?" />
      }

      {/* Année */}
      {yearText
        ? <Badge icon="📅" label={yearText}
            color="linear-gradient(135deg, rgba(59,130,246,0.25), rgba(29,78,216,0.15))"
            glow="rgba(59,130,246,0.4)"
          />
        : <GhostBadge icon="📅" label="Année ?" />
      }

      {/* Durée */}
      {durationText
        ? <Badge icon="⏱" label={durationText}
            color="linear-gradient(135deg, rgba(6,182,212,0.25), rgba(8,145,178,0.15))"
            glow="rgba(6,182,212,0.4)"
          />
        : <GhostBadge icon="⏱" label="Durée ?" />
      }

      {/* Langue */}
      {langInfo
        ? <Badge icon={langInfo.flag} label={langInfo.label}
            color="linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.15))"
            glow="rgba(16,185,129,0.4)"
          />
        : <GhostBadge icon="🌐" label="Langue ?" />
      }

      {/* Pays */}
      {hints.country && (
        <Badge icon="🌍" label={hints.country}
          color="linear-gradient(135deg, rgba(20,184,166,0.25), rgba(13,148,136,0.15))"
          glow="rgba(20,184,166,0.4)"
        />
      )}

      {/* Société de production */}
      {productionCompany && (
        <Badge icon="🏛" label={productionCompany}
          color="linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.12))"
          glow="rgba(245,158,11,0.35)"
        />
      )}

      {/* Budget */}
      {budgetLabel
        ? <Badge icon="💰" label={budgetLabel}
            color="linear-gradient(135deg, rgba(244,63,94,0.25), rgba(225,29,72,0.15))"
            glow="rgba(244,63,94,0.4)"
          />
        : attempts >= 2 ? <GhostBadge icon="💰" label="Budget ?" /> : null
      }
    </div>
  )
}
