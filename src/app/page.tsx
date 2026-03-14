import CindleApp from '@/components/CindleApp'
import { prisma  } from '@/lib/db'
import { getDailyNumber, getTodayString } from '@/lib/game'

export default async function Home() {
  try {
    const total = await prisma.movie.count()
    if (total === 0) throw new Error('Base vide')

    const posters = await prisma.movie.findMany({
      where:   { posterUrl: { not: null } },
      select:  { posterUrl: true },
      orderBy: { rating: 'desc' },
      take:    40,
    })
    const backgrounds = posters.map(m => m.posterUrl!.replace('/w185/', '/w92/'))
    const dailyNumber = getDailyNumber(getTodayString())

    return <CindleApp dailyNumber={dailyNumber} backgrounds={backgrounds} />
  } catch {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">🎬</div>
          <h1 className="text-2xl font-bold text-white">Base de données vide</h1>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 text-left text-sm font-mono text-zinc-300 space-y-2">
            <p className="text-yellow-400 font-semibold mb-2">Pour démarrer :</p>
            <p>1. <code className="text-green-400">npm install</code></p>
            <p>2. <code className="text-green-400">npx prisma db push</code></p>
            <p>3. <code className="text-green-400">npm run db:seed</code></p>
            <p>4. <code className="text-green-400">npm run dev</code></p>
          </div>
        </div>
      </div>
    )
  }
}
