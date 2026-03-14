# Cindle — Le Wordle du cinéma

Trouvez le film secret du jour en 8 essais maximum.
Chaque proposition révèle des indices sur le film (année, genre, réalisateur, acteurs, pays, durée, langue).

---

## Stack technique

- **Frontend** : Next.js 14 (App Router) + React + Tailwind CSS
- **Backend**  : API Routes Next.js
- **Base de données** : SQLite (dev) / PostgreSQL (prod) via **Prisma**
- **API films** : TMDB (The Movie Database)

---

## Installation

### Prérequis

- Node.js >= 18
- npm >= 9
- Compte TMDB (gratuit) pour la clé API → https://www.themoviedb.org/settings/api

### 1. Cloner et installer

```bash
git clone <repo>
cd cindle
npm install
```

### 2. Configurer l'environnement

Copiez `.env.example` vers `.env.local` et remplissez les valeurs :

```bash
cp .env.example .env.local
```

```env
DATABASE_URL="file:./dev.db"
TMDB_API_TOKEN="votre_read_access_token_tmdb"
ADMIN_PASSWORD="votre-mot-de-passe-admin"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

> Le `TMDB_API_TOKEN` est le **Read Access Token (v4 Auth)** — un JWT commençant par `eyJ...`.
> À trouver sur : https://www.themoviedb.org/settings/api → section "API Read Access Token (v4 auth)"

### 3. Créer la base de données

```bash
npx prisma db push
```

### 4. Peupler la base de données (seed)

Le script récupère automatiquement ~200 films depuis l'API TMDB :

```bash
npm run db:seed
```

Durée estimée : 2-3 minutes (requêtes TMDB avec délais).

### 5. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir http://localhost:3000

---

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run db:seed` | Peuple la base avec les films TMDB |
| `npm run db:push` | Applique le schéma Prisma |
| `npm run db:studio` | Ouvre Prisma Studio (interface visuelle BD) |
| `npm run setup` | Installation complète en une commande |

---

## Ajouter un film manuellement

### Via l'interface admin

1. Ouvrir http://localhost:3000/admin
2. Saisir le mot de passe `ADMIN_PASSWORD`
3. Dans "Ajouter un film depuis TMDB", entrer l'ID TMDB du film
4. L'ID TMDB se trouve dans l'URL du film sur themoviedb.org
   Ex: `themoviedb.org/movie/27205-inception` → ID = `27205`

### Via l'API admin (curl)

```bash
# Ajouter Inception (ID TMDB : 27205)
curl -X POST http://localhost:3000/api/admin/movies \
  -H "Authorization: Bearer votre-mot-de-passe-admin" \
  -H "Content-Type: application/json" \
  -d '{"tmdbId": 27205}'
```

### Via Prisma Studio

```bash
npm run db:studio
```

---

## Définir le film du jour manuellement

Par défaut, le film est sélectionné de façon déterministe par hash de la date.
Pour forcer un film spécifique sur une date :

```bash
# Via l'interface admin → section "Définir le film du jour"
# Ou via l'API :
curl -X POST http://localhost:3000/api/admin/daily \
  -H "Authorization: Bearer votre-mot-de-passe-admin" \
  -H "Content-Type: application/json" \
  -d '{"date": "2024-12-25", "movieId": 42}'
```

---

## Variables d'environnement

| Variable | Obligatoire | Description |
|----------|------------|-------------|
| `DATABASE_URL` | Oui | URL de la base de données SQLite ou PostgreSQL |
| `TMDB_API_TOKEN` | Oui | JWT Bearer Token TMDB (Read Access Token v4) |
| `ADMIN_PASSWORD` | Oui | Mot de passe pour accéder à `/admin` |
| `NEXT_PUBLIC_BASE_URL` | Non | URL publique du site (pour le partage) |

---

## Règles du jeu

1. Tapez un titre de film dans la barre de recherche
2. L'autocomplete filtre les films de la base locale
3. Après validation, chaque colonne est colorée :
   - **Vert** : correspondance exacte
   - **Jaune** : proche (±4 ans, ±15 min, genre/acteur partiel)
   - **Rouge** : aucune correspondance
   - **↑ / ↓** : direction pour l'année et la durée
4. Maximum **8 essais** par jour
5. **Un seul film par jour**, le même pour tous les joueurs
6. L'état de la partie est sauvegardé localement (localStorage)

### Indices progressifs

- Après **4 échecs** : affiche du film (floutée)
- Après **6 échecs** : un acteur supplémentaire révélé

---

## Déploiement

### Vercel (recommandé)

```bash
npm install -g vercel
vercel
```

Configurez les variables d'environnement dans le dashboard Vercel.
Pour la production, utilisez PostgreSQL (Vercel Postgres, Supabase, Neon...).

#### Migration vers PostgreSQL

Dans `.env` de production :
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/cindle"
```

Dans `prisma/schema.prisma`, changer :
```prisma
datasource db {
  provider = "postgresql"  # au lieu de "sqlite"
  url      = env("DATABASE_URL")
}
```

### Railway

Railway détecte automatiquement Next.js.
Configurez les variables d'environnement et ajoutez un service PostgreSQL.

---

## Architecture

```
cindle/
├── prisma/
│   ├── schema.prisma      # Schéma BD (Movie, DailyPick)
│   └── seed.ts            # Script de peuplement TMDB
└── src/
    ├── app/
    │   ├── page.tsx        # Page principale (Server Component)
    │   ├── layout.tsx      # Layout global
    │   ├── globals.css     # Styles globaux + animations
    │   ├── admin/
    │   │   └── page.tsx    # Interface admin
    │   └── api/
    │       ├── daily/      # GET : infos du puzzle du jour
    │       ├── movies/search/  # GET : autocomplete
    │       ├── guess/      # POST : soumettre un essai
    │       └── admin/      # POST/GET/DELETE : gestion films
    ├── components/
    │   ├── GameBoard.tsx   # Composant principal du jeu
    │   ├── SearchInput.tsx # Barre de recherche + autocomplete
    │   ├── GuessRow.tsx    # Ligne d'un essai avec animations
    │   ├── Header.tsx      # En-tête avec compteur d'essais
    │   ├── HelpModal.tsx   # Modale des règles
    │   ├── ResultModal.tsx # Modale de fin de partie
    │   └── HintSystem.tsx  # Système d'indices progressifs
    └── lib/
        ├── types.ts        # Types TypeScript partagés
        ├── db.ts           # Singleton Prisma
        ├── tmdb.ts         # Client API TMDB
        ├── game.ts         # Logique du jeu (comparaisons, seed)
        └── storage.ts      # Persistance localStorage
```

---

## Licence

MIT — Données films fournies par TMDB (The Movie Database).
Ce projet n'est pas affilié à TMDB.
