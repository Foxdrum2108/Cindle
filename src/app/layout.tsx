import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title:       'Cindle — Le Wordle du cinéma',
  description: 'Trouvez le film secret du jour en moins de 8 essais ! Cindle est un jeu de devinette cinématographique inspiré de Wordle.',
  keywords:    ['cindle', 'wordle', 'film', 'cinéma', 'jeu', 'quotidien'],
  openGraph: {
    title:       'Cindle — Le Wordle du cinéma',
    description: 'Trouvez le film secret du jour en moins de 8 essais !',
    type:        'website',
  },
}

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  themeColor:   '#030712',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <footer className="text-center text-xs text-gray-500 py-4 mt-8">
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
              alt="TMDB Logo"
              width={100}
              height={14}
            />
            <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
