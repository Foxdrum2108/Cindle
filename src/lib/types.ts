export type MatchResult = 'correct' | 'close' | 'wrong'
export type Direction   = 'up' | 'down' | null

export interface CellResult {
  match: MatchResult
  direction?: Direction
}

export interface Actor {
  name:        string
  profilePath: string | null
}

export interface GuessComparison {
  year:     CellResult
  genres:   CellResult
  director: CellResult
  actors:   CellResult
  country:  CellResult
  duration: CellResult
  language: CellResult
}

export interface Movie {
  id:                  number
  tmdbId:              number | null
  title:               string
  year:                number
  genres:              string[]
  director:            string
  directorProfilePath: string | null
  actors:              Actor[]
  country:             string
  productionCompany:   string | null
  language:            string
  duration:            number
  rating:              number
  posterUrl:           string | null
  synopsis:            string | null
  budget:              number | null
  awards:              boolean
  franchise:           string | null
}

export interface GuessRecord {
  movie:          Movie
  result:         GuessComparison
  matchingActors: Actor[]
}

export interface GameState {
  date:        string
  guesses:     GuessRecord[]
  status:      'playing' | 'won'
  secretMovie: Movie | null
  hintsUsed:   number
}

export interface SearchResult {
  id:        number
  title:     string
  year:      number
  director:  string
  posterUrl: string | null
}

export interface GuessResponse {
  guessedMovie:   Movie
  result:         GuessComparison
  matchingActors: Actor[]
  won:            boolean
  secretMovie:    Movie | null
}
