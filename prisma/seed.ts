/**
 * Script de seed Cindle — Top films américains + français
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

async function discoverPage(lang: string, page: number, minVotes: number): Promise<number[]> {
  const d = await tmdb(
    `/discover/movie?with_original_language=${lang}&sort_by=vote_count.desc` +
    `&vote_count.gte=${minVotes}&page=${page}&language=fr-FR`
  )
  return (d.results as any[]).map((m: any) => m.id)
}

async function fetchDetails(tmdbId: number): Promise<any | null> {
  try {
    const d = await tmdb(`/movie/${tmdbId}?language=fr-FR&append_to_response=credits`)

    const directorRaw         = (d.credits?.crew ?? []).find((p: any) => p.job === 'Director')
    const director            = directorRaw?.name ?? 'Inconnu'
    const directorProfilePath = directorRaw?.profile_path ? `${IMG_BASE}${directorRaw.profile_path}` : null

    // 8 acteurs principaux avec photos et noms complets
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
      isCurated:           true,
    }
  } catch (err) {
    console.warn(`  ⚠ Film ${tmdbId} ignoré: ${(err as Error).message}`)
    return null
  }
}

async function main() {
  console.log('🎬 Cindle Seed — Top films US + FR\n')
  if (!TOKEN) { console.error('❌ TMDB_API_TOKEN manquant'); process.exit(1) }

  const allIds = new Set<number>()

  // Top 1500 films US (75 pages × 20)
  console.log('🇺🇸 Top 1500 films US...')
  for (let page = 1; page <= 75; page++) {
    const ids = await discoverPage('en', page, 1)
    if (ids.length === 0) break
    ids.forEach(id => allIds.add(id))
    await delay(200)
  }

  // Top 200 films français (10 pages × 20)
  console.log('🇫🇷 Top 200 films français...')
  for (let page = 1; page <= 10; page++) {
    const ids = await discoverPage('fr', page, 1)
    if (ids.length === 0) break
    ids.forEach(id => allIds.add(id))
    await delay(200)
  }

  // Classiques supplémentaires garantis (films cultes qui pourraient manquer)
  const extras = [
    278, 238, 240, 769, 680, 13, 424, 274, 807, 550, 197, 510, 389,
    598, 194, 637, 496243, 4922, 129, 4935, 12477, 508442, 354912, 150540,
    862, 9806, 10681, 8587, 155, 27205, 603, 157336, 78, 329865, 290250,
    438631, 19995, 299534, 284054, 11, 1891, 1892, 120, 121, 122,
    105, 218, 87101, 76341, 324857, 634649, 68718, 858, 744,
    475303, 372058, 315162, 545611, 760161, 346698, 361743,
    20526, 4348, 2771, 77338, 14160, 87, 89, 671, 672, 674, 675,
    264660, 258489, 140607, 562, 68726, 16869, 44214, 453,
    // Films français cultes supplémentaires
    397522, 194, 545611, 9397, 45243, 28538, 110, 13183, 24943, 3075,
    15095, 546554, 85350, 18148, 62215, 11324, 7220, 16869,
    // Séries de films
    1726, 1724, 10138, 10195, 24428, 99861, 271110, 299537, 299536,
    // Films d'auteur célèbres
    637, 496243, 598, 4922, 372058, 315162, 290250, 264660,
  ]
  extras.forEach(id => allIds.add(id))

  const ids = Array.from(allIds).filter(id => id > 0)
  console.log(`\n📦 ${ids.length} films uniques à importer\n`)

  // Vider la base pour repartir propre
  await prisma.dailyPick.deleteMany()
  await prisma.movie.deleteMany()
  console.log('🗑  Base vidée\n')

  let inserted = 0, skipped = 0, errored = 0

  for (let i = 0; i < ids.length; i++) {
    process.stdout.write(`\r  [${i + 1}/${ids.length}] ${inserted} insérés...`)
    const details = await fetchDetails(ids[i])
    if (!details || !details.year || details.duration < 30) { skipped++; continue }
    try {
      await prisma.movie.create({ data: details })
      inserted++
    } catch (e: any) {
      if (e.code === 'P2002') skipped++; else errored++
    }
    await delay(130)
  }

  const total = await prisma.movie.count()
  console.log(`\n\n✅ Seed terminé ! ${inserted} insérés, ${skipped} ignorés, ${errored} erreurs`)
  console.log(`   ${total} films en base\n`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
