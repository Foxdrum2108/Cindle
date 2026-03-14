'use client'

/**
 * Page Admin — /admin
 * Interface protégée par mot de passe pour gérer les films Cindle.
 * Fonctionnalités :
 * - Ajouter un film depuis TMDB par son ID
 * - Rechercher et lister les films en base
 * - Définir le film du jour manuellement
 * - Supprimer un film
 */

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Movie {
  id:       number
  tmdbId:   number | null
  title:    string
  year:     number
  director: string
  genres:   string
  duration: number
  posterUrl: string | null
  createdAt: string
}

export default function AdminPage() {
  const [password,   setPassword]   = useState('')
  const [authed,     setAuthed]     = useState(false)
  const [authError,  setAuthError]  = useState('')

  const [movies,     setMovies]     = useState<Movie[]>([])
  const [total,      setTotal]      = useState(0)
  const [page,       setPage]       = useState(1)
  const [pages,      setPages]      = useState(1)
  const [query,      setQuery]      = useState('')
  const [loadingList,setLoadingList]= useState(false)

  const [tmdbId,     setTmdbId]     = useState('')
  const [adding,     setAdding]     = useState(false)
  const [addMsg,     setAddMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [dailyDate,  setDailyDate]  = useState('')
  const [dailyMovieId, setDailyMovieId] = useState('')
  const [settingDaily, setSettingDaily] = useState(false)

  const headers = { 'Authorization': `Bearer ${password}` }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/movies', { headers: { 'Authorization': `Bearer ${password}` } })
    if (res.ok) {
      setAuthed(true)
      setAuthError('')
    } else {
      setAuthError('Mot de passe incorrect')
    }
  }

  const fetchMovies = useCallback(async () => {
    if (!authed) return
    setLoadingList(true)
    try {
      const res  = await fetch(`/api/admin/movies?q=${encodeURIComponent(query)}&page=${page}`, { headers })
      const data = await res.json()
      setMovies(data.movies)
      setTotal(data.total)
      setPages(data.pages)
    } finally {
      setLoadingList(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, query, page])

  useEffect(() => { fetchMovies() }, [fetchMovies])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    setAddMsg(null)
    try {
      const res  = await fetch('/api/admin/movies', {
        method:  'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tmdbId: parseInt(tmdbId) }),
      })
      const data = await res.json()
      if (res.ok) {
        setAddMsg({ type: 'ok', text: `✅ "${data.movie.title}" ajouté (id: ${data.movie.id})` })
        setTmdbId('')
        fetchMovies()
      } else {
        setAddMsg({ type: 'err', text: `❌ ${data.error}` })
      }
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Supprimer "${title}" ?`)) return
    await fetch(`/api/admin/movies?id=${id}`, { method: 'DELETE', headers })
    fetchMovies()
  }

  async function handleSetDaily(e: React.FormEvent) {
    e.preventDefault()
    setSettingDaily(true)
    try {
      const res  = await fetch('/api/admin/daily', {
        method:  'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ date: dailyDate, movieId: parseInt(dailyMovieId) }),
      })
      const data = await res.json()
      if (res.ok) {
        alert(`Film du ${dailyDate} défini avec succès.`)
      } else {
        alert(`Erreur : ${data.error}`)
      }
    } finally {
      setSettingDaily(false)
    }
  }

  // ── Auth screen ──────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🎬</div>
            <h1 className="text-2xl font-bold text-white">Admin Cindle</h1>
            <p className="text-gray-400 text-sm mt-1">Accès restreint</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mot de passe admin"
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-yellow-400 outline-none"
            />
            {authError && <p className="text-red-400 text-sm">{authError}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors"
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Admin dashboard ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900/80 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <span className="font-bold">Cindle Admin</span>
            <span className="text-gray-500 text-sm">— {total} films</span>
          </div>
          <a href="/" className="text-sm text-gray-400 hover:text-white underline">
            Retour au jeu
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ── Ajouter un film ── */}
        <section className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">Ajouter un film depuis TMDB</h2>
          <form onSubmit={handleAdd} className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-gray-400 mb-1 block">
                TMDB Movie ID
                <span className="ml-2 text-gray-600">(ex: 27205 pour Inception)</span>
              </label>
              <input
                type="number"
                value={tmdbId}
                onChange={e => setTmdbId(e.target.value)}
                placeholder="27205"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-600 focus:border-yellow-400 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={adding || !tmdbId}
              className="px-6 py-2.5 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {adding ? 'Ajout...' : 'Ajouter'}
            </button>
          </form>
          {addMsg && (
            <p className={`mt-3 text-sm ${addMsg.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
              {addMsg.text}
            </p>
          )}
          <p className="text-gray-600 text-xs mt-3">
            Trouvez l&apos;ID sur tmdb.org : l&apos;ID est dans l&apos;URL de la page du film.
            Ex : themoviedb.org/movie/<strong>27205</strong>-inception
          </p>
        </section>

        {/* ── Définir le film du jour ── */}
        <section className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">Définir le film du jour</h2>
          <form onSubmit={handleSetDaily} className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Date</label>
              <input
                type="date"
                value={dailyDate}
                onChange={e => setDailyDate(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-yellow-400 outline-none"
                required
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm text-gray-400 mb-1 block">ID du film (base locale)</label>
              <input
                type="number"
                value={dailyMovieId}
                onChange={e => setDailyMovieId(e.target.value)}
                placeholder="ID Cindle"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-600 focus:border-yellow-400 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={settingDaily}
              className="px-6 py-2.5 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-400 disabled:opacity-50 transition-colors"
            >
              {settingDaily ? 'Enregistrement...' : 'Définir'}
            </button>
          </form>
        </section>

        {/* ── Liste des films ── */}
        <section className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <h2 className="text-lg font-bold">Films en base ({total})</h2>
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1) }}
              placeholder="Rechercher..."
              className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:border-yellow-400 outline-none"
            />
          </div>

          {loadingList ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-left border-b border-gray-800">
                    <th className="pb-2 pr-4 w-12">Poster</th>
                    <th className="pb-2 pr-4">Titre</th>
                    <th className="pb-2 pr-4">Année</th>
                    <th className="pb-2 pr-4">Réalisateur</th>
                    <th className="pb-2 pr-4">Durée</th>
                    <th className="pb-2 pr-4">ID</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {movies.map(movie => (
                    <tr key={movie.id} className="hover:bg-gray-800/50">
                      <td className="py-2 pr-4">
                        {movie.posterUrl ? (
                          <Image
                            src={movie.posterUrl}
                            alt={movie.title}
                            width={32}
                            height={44}
                            className="rounded object-cover"
                          />
                        ) : (
                          <div className="w-8 h-11 bg-gray-800 rounded" />
                        )}
                      </td>
                      <td className="py-2 pr-4 font-medium max-w-[180px] truncate">{movie.title}</td>
                      <td className="py-2 pr-4 text-gray-400">{movie.year}</td>
                      <td className="py-2 pr-4 text-gray-400 max-w-[120px] truncate">{movie.director}</td>
                      <td className="py-2 pr-4 text-gray-400">{movie.duration}min</td>
                      <td className="py-2 pr-4 text-gray-600 font-mono text-xs">{movie.id}</td>
                      <td className="py-2">
                        <button
                          onClick={() => handleDelete(movie.id, movie.title)}
                          className="text-red-500 hover:text-red-400 text-xs"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-gray-800 text-sm disabled:opacity-40 hover:bg-gray-700"
              >
                ← Préc.
              </button>
              <span className="text-gray-400 text-sm">Page {page} / {pages}</span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="px-3 py-1.5 rounded-lg bg-gray-800 text-sm disabled:opacity-40 hover:bg-gray-700"
              >
                Suiv. →
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
