'use client'

/**
 * HelpModal — Fenêtre d'aide expliquant les règles du jeu Cindle.
 */

interface Props {
  onClose: () => void
}

function ColorBadge({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex-shrink-0 ${color}`} />
      <span className="text-gray-300 text-sm">{label}</span>
    </div>
  )
}

export default function HelpModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Comment jouer ?</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Principe */}
          <section>
            <h3 className="text-yellow-400 font-semibold mb-2">Le principe</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Trouvez le film secret du jour en moins de <strong className="text-white">8 essais</strong>.
              Chaque proposition révèle des indices sur les caractéristiques du film.
            </p>
          </section>

          {/* Système de couleurs */}
          <section>
            <h3 className="text-yellow-400 font-semibold mb-3">Le code couleur</h3>
            <div className="space-y-2.5">
              <ColorBadge
                color="bg-green-600"
                label="Vert — Correspondance exacte"
              />
              <ColorBadge
                color="bg-yellow-500"
                label="Jaune — Proche (±4 ans, ±15 min, genre ou acteur partiel)"
              />
              <ColorBadge
                color="bg-red-700"
                label="Rouge — Aucune correspondance"
              />
            </div>
          </section>

          {/* Flèches */}
          <section>
            <h3 className="text-yellow-400 font-semibold mb-2">Les flèches</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <span className="text-white font-semibold">↑</span> — Le film secret est <strong className="text-white">plus récent</strong> / <strong className="text-white">plus long</strong>
              </p>
              <p>
                <span className="text-white font-semibold">↓</span> — Le film secret est <strong className="text-white">plus ancien</strong> / <strong className="text-white">plus court</strong>
              </p>
            </div>
          </section>

          {/* Colonnes */}
          <section>
            <h3 className="text-yellow-400 font-semibold mb-2">Les colonnes</h3>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
              <li><strong className="text-white">Année</strong> — Année de sortie (tolérance : ±4 ans)</li>
              <li><strong className="text-white">Genre(s)</strong> — Genres du film</li>
              <li><strong className="text-white">Réal.</strong> — Réalisateur</li>
              <li><strong className="text-white">Acteurs</strong> — 3 acteurs principaux</li>
              <li><strong className="text-white">Pays</strong> — Pays d&apos;origine</li>
              <li><strong className="text-white">Durée</strong> — Durée en minutes (tolérance : ±15 min)</li>
              <li><strong className="text-white">Langue</strong> — Langue originale</li>
            </ul>
          </section>

          {/* Indices */}
          <section>
            <h3 className="text-yellow-400 font-semibold mb-2">Indices progressifs</h3>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
              <li>Après <strong className="text-white">4 échecs</strong> : l&apos;affiche du film (floutée)</li>
              <li>Après <strong className="text-white">6 échecs</strong> : un acteur supplémentaire</li>
            </ul>
          </section>

          {/* Un film par jour */}
          <section className="bg-gray-800 rounded-xl p-4">
            <p className="text-sm text-gray-300 text-center">
              Un nouveau film chaque jour, le même pour tous les joueurs.
              <br />
              <span className="text-yellow-400 font-semibold">Partagez vos résultats</span> sans spoiler !
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
