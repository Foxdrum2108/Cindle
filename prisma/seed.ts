/**
 * Script de seed Cindle
 *
 * Pool 1 — Films curés (isCurated = true) : secrets possibles
 *   • Top ~500 films US  : langue=en, pays=US,  vote_count ≥ 3000 (25 pages)
 *   • Top ~100 films FR  : langue=fr,           vote_count ≥ 300  ( 5 pages)
 *   • + extras manuels
 *
 * Pool 2 — Films de recherche (isCurated = false) : suggestions pour deviner
 *   • Films EN populaires : popularity.desc,    vote_count ≥ 300  (80 pages)
 *   • Films FR populaires : popularity.desc,    vote_count ≥ 100  (15 pages)
 *
 * Usage : npm run db:seed
 */

import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path   from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const prisma   = new PrismaClient()
const TOKEN    = process.env.TMDB_API_TOKEN
const BASE     = 'https://api.themoviedb.org/3'
const IMG_BASE = 'https://image.tmdb.org/t/p/w500'
const delay    = (ms: number) => new Promise(r => setTimeout(r, ms))

async function tmdb(path: string): Promise<any> {
  if (!TOKEN) throw new Error('TMDB_API_TOKEN manquant')
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${TOKEN}` } })
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`)
  return res.json()
}

/** Récupère les IDs d'une page discover */
async function discoverPage(params: string, page: number): Promise<number[]> {
  const d = await tmdb(`/discover/movie?${params}&page=${page}&language=fr-FR`)
  return (d.results as any[]).map((m: any) => m.id)
}

/** Récupère plusieurs pages et retourne un Set d'IDs */
async function collectIds(params: string, pages: number, label: string): Promise<Set<number>> {
  const ids = new Set<number>()
  process.stdout.write(`  ${label}`)
  for (let p = 1; p <= pages; p++) {
    const batch = await discoverPage(params, p)
    if (batch.length === 0) break
    batch.forEach(id => ids.add(id))
    process.stdout.write(` ${p}`)
    await delay(200)
  }
  console.log(` → ${ids.size} IDs`)
  return ids
}

async function fetchDetails(tmdbId: number, isCurated: boolean): Promise<any | null> {
  try {
    const d = await tmdb(`/movie/${tmdbId}?language=fr-FR&append_to_response=credits`)

    const directorRaw         = (d.credits?.crew ?? []).find((p: any) => p.job === 'Director')
    const director            = directorRaw?.name ?? 'Inconnu'
    const directorProfilePath = directorRaw?.profile_path ? `${IMG_BASE}${directorRaw.profile_path}` : null

    // 8 acteurs principaux (ordre de générique = ordre de notoriété TMDB)
    const actors = (d.credits?.cast ?? []).slice(0, 8).map((a: any) => ({
      name:        a.name,
      profilePath: a.profile_path ? `${IMG_BASE}${a.profile_path}` : null,
    }))

    const productionCompany = d.production_companies?.[0]?.name ?? null

    return {
      tmdbId:              d.id,
      title:               d.title ?? d.original_title,
      year:                d.release_date ? parseInt(d.release_date.slice(0, 4)) : 0,
      genres:              JSON.stringify((d.genres ?? []).map((g: any) => g.name)),
      director,
      directorProfilePath,
      actors:              JSON.stringify(actors),
      country:             d.production_countries?.[0]?.name ?? 'Inconnu',
      productionCompany,
      language:            d.original_language ?? 'en',
      duration:            d.runtime ?? 0,
      rating:              Math.round((d.vote_average ?? 0) * 10) / 10,
      posterUrl:           d.poster_path ? `${IMG_BASE}${d.poster_path}` : null,
      synopsis:            d.overview ?? null,
      budget:              d.budget > 0 ? d.budget : null,
      awards:              false,
      franchise:           d.belongs_to_collection?.name ?? null,
      isCurated,
    }
  } catch (err) {
    return null
  }
}

async function main() {
  console.log('🎬 Cindle Seed — Pool curé + pool de recherche\n')
  if (!TOKEN) { console.error('❌ TMDB_API_TOKEN manquant'); process.exit(1) }

  // ── Pool 1 : Films curés (secrets) ─────────────────────────────────────────
  console.log('📌 Pool 1 — Films curés (secrets possibles)\n')

  const curatedParams = [
    // Top ~500 films US : vote_count desc, vote_count ≥ 3000
    'with_original_language=en&with_origin_country=US&sort_by=vote_count.desc&vote_count.gte=3000',
    // Top ~100 films FR : vote_count desc, vote_count ≥ 300
    'with_original_language=fr&sort_by=vote_count.desc&vote_count.gte=300',
  ]
  const curatedPages = [25, 5]
  const curatedLabels = ['🇺🇸 EN/US (25p)', '🇫🇷 FR (5p)']

  const curatedIds = new Set<number>()
  for (let i = 0; i < curatedParams.length; i++) {
    const batch = await collectIds(curatedParams[i], curatedPages[i], curatedLabels[i])
    batch.forEach(id => curatedIds.add(id))
  }

  // Extras manuels (classiques qui pourraient manquer)
  const extras = [
    278, 238, 240, 769, 680, 13, 424, 274, 807, 550, 197, 510, 389,
    598, 194, 637, 496243, 4922, 129, 4935, 12477, 508442, 354912, 150540,
    862, 9806, 10681, 8587, 155, 27205, 603, 157336, 78, 329865, 290250,
    438631, 19995, 299534, 284054, 11, 1891, 1892, 120, 121, 122,
    105, 218, 87101, 76341, 324857, 634649, 68718, 858, 744,
    475303, 372058, 315162, 545611, 760161, 346698, 361743,
    20526, 4348, 2771, 77338, 14160, 87, 89, 671, 672, 674, 675,
    264660, 258489, 140607, 562, 68726, 16869, 44214, 453,
    397522, 9397, 45243, 28538, 110, 13183, 24943, 3075,
    15095, 546554, 85350, 18148, 62215, 11324, 7220,
    1726, 1724, 10138, 10195, 24428, 99861, 271110, 299537, 299536,
  ]
  extras.forEach(id => curatedIds.add(id))
  console.log(`\n📌 ${curatedIds.size} IDs curés au total\n`)

  // ── Pool 2 : Films de recherche (isCurated = false) ────────────────────────
  console.log('🔍 Pool 2 — Films de recherche (suggestions)\n')

  const searchParams = [
    // Films EN populaires
    'with_original_language=en&sort_by=popularity.desc&vote_count.gte=300',
    // Films FR populaires
    'with_original_language=fr&sort_by=popularity.desc&vote_count.gte=100',
  ]
  const searchPages  = [80, 15]
  const searchLabels = ['🇺🇸 EN popularité (80p)', '🇫🇷 FR popularité (15p)']

  const searchOnlyIds = new Set<number>()
  for (let i = 0; i < searchParams.length; i++) {
    const batch = await collectIds(searchParams[i], searchPages[i], searchLabels[i])
    batch.forEach(id => searchOnlyIds.add(id))
  }
  // Retirer les IDs déjà dans le pool curé (ils seront insérés isCurated=true)
  curatedIds.forEach(id => searchOnlyIds.delete(id))
  console.log(`\n🔍 ${searchOnlyIds.size} IDs de recherche uniquement\n`)

  // ── Import en base ─────────────────────────────────────────────────────────
  await prisma.dailyPick.deleteMany()
  await prisma.movie.deleteMany()
  console.log('🗑  Base vidée\n')

  const allBatches: Array<{ ids: Set<number>; isCurated: boolean; label: string }> = [
    { ids: curatedIds,    isCurated: true,  label: 'curés' },
    { ids: searchOnlyIds, isCurated: false, label: 'recherche' },
  ]

  let inserted = 0, skipped = 0

  for (const { ids, isCurated, label } of allBatches) {
    const arr = Array.from(ids).filter(id => id > 0)
    console.log(`\n⬇  Import ${arr.length} films ${label}...`)
    for (let i = 0; i < arr.length; i++) {
      process.stdout.write(`\r  [${i + 1}/${arr.length}] ${inserted} insérés, ${skipped} ignorés...`)
      const details = await fetchDetails(arr[i], isCurated)
      if (!details || !details.year || details.duration < 30) { skipped++; continue }
      try {
        await prisma.movie.upsert({
          where:  { tmdbId: details.tmdbId },
          update: details,
          create: details,
        })
        inserted++
      } catch {
        skipped++
      }
      await delay(130)
    }
    console.log()
  }

  const totalCurated = await prisma.movie.count({ where: { isCurated: true } })
  const totalSearch  = await prisma.movie.count({ where: { isCurated: false } })
  const total        = await prisma.movie.count()
  console.log(`\n✅ Seed terminé !`)
  console.log(`   ${inserted} insérés, ${skipped} ignorés`)
  console.log(`   📌 ${totalCurated} films curés (secrets)`)
  console.log(`   🔍 ${totalSearch} films de recherche`)
  console.log(`   📦 ${total} films en base\n`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
