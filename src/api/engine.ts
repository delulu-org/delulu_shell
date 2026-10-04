import { invoke } from '@tauri-apps/api/core';
import type {
    HomeFeed,
    BrowseFeed,
    DetailsPayload,
    HeroMeta,
    SearchResult,
    MediaCard,
    EpisodeItem,
} from './types';

export const engineApi = {
    getHomeFeed: (): Promise<HomeFeed> => invoke<HomeFeed>('get_home_feed'),

    getMoviesFeed: (page = 1, mood?: string): Promise<BrowseFeed> =>
        invoke<BrowseFeed>('get_movies_feed', { page, mood }),

    getTvFeed: (page = 1, mood?: string): Promise<BrowseFeed> =>
        invoke<BrowseFeed>('get_tv_feed', { page, mood }),

    getDetailsFeed: (mediaType: 'movie' | 'tv', id: number): Promise<DetailsPayload> =>
        invoke<DetailsPayload>('get_details_feed', { mediaType, id }),

    getTvSeasonEpisodes: (tvId: number, seasonNumber: number): Promise<EpisodeItem[]> =>
        invoke<EpisodeItem[]>('get_tv_season_episodes', { tvId, seasonNumber }),

    getRandomFeed: (): Promise<MediaCard[]> => invoke<MediaCard[]>('get_random_feed'),

    getHeroMeta: (tmdbId: number, mediaType: 'movie' | 'tv'): Promise<HeroMeta> =>
        invoke<HeroMeta>('get_hero_meta', { tmdbId, mediaType }),

    searchCatalog: (query: string): Promise<SearchResult> =>
        invoke<SearchResult>('search_catalog', { query }),

    clearDiskCache: (): Promise<void> => invoke('clear_disk_cache'),
};
