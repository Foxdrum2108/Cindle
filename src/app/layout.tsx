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
      </body>
    </html>
  )
}
