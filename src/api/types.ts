// 100% Type-safe TypeScript interfaces matching Rust Engine models

export interface MediaCard {
    id: number;
    title: string;
    poster_path: string | null;
    backdrop_path: string | null;
    media_type: 'movie' | 'tv';
    release_year: string | null;
    rating: number | null;
    overview: string | null;
    genres: string[];
    logo_url?: string | null;
    imdb_rating?: number | null;
}

export interface HeroItem {
    id: number;
    title: string;
    overview: string;
    backdrop_path: string | null;
    poster_path: string | null;
    media_type: 'movie' | 'tv';
    release_year: string | null;
    rating: number | null;
    genres: string[];
    logo_url?: string | null;
    imdb_rating?: number | null;
}

export interface HeroMeta {
    logo_url: string | null;
    imdb_rating: number | string | null;
    trailer_url: string | null;
}

export interface SectionRow {
    id: string;
    title: string;
    reason: string | null;
    items: MediaCard[];
}

export interface HomeFeed {
    hero_items: HeroItem[];
    whats_burning: MediaCard[];
    trending: MediaCard[];
    mood_rows: SectionRow[];
    popular_movies: MediaCard[];
    popular_tv: MediaCard[];
    top_rated: MediaCard[];
    continue_watching: MediaCard[];
}

export interface BrowseFeed {
    featured_heroes: HeroItem[];
    items: MediaCard[];
    page: number;
    total_pages: number;
    mood_rows: SectionRow[];
}

export interface CastMember {
    id: number;
    name: string;
    character: string | null;
    profile_path: string | null;
}

export interface EpisodeItem {
    id: number;
    episode_number: number;
    season_number: number;
    name: string;
    overview: string | null;
    still_path: string | null;
    runtime: number | null;
    air_date: string | null;
}

export interface SeasonItem {
    id: number;
    season_number: number;
    name: string;
    episode_count: number;
    poster_path: string | null;
    episodes: EpisodeItem[];
}

export interface DetailsPayload {
    id: number;
    title: string;
    media_type: 'movie' | 'tv';
    overview: string | null;
    backdrop_path: string | null;
    poster_path: string | null;
    release_year: string | null;
    rating: number | null;
    genres: string[];
    runtime: number | null;
    cast: CastMember[];
    seasons: SeasonItem[] | null;
    similar: MediaCard[];
    logo_url?: string | null;
    tagline?: string | null;
    imdb_rating?: number | null;
    imdb_id?: string | null;
}

export type SearchResult =
    | { type: 'DirectTarget'; payload: { target_type: string; uri: string } }
    | { type: 'Catalog'; payload: { items: MediaCard[] } };
