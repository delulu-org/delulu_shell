import React, { useState, useEffect, useCallback, useRef } from 'react';
import { engineApi } from '../../../../api/engine';
import type { SeasonItem, EpisodeItem } from '../../../../api/types';
import { SeasonDropdown } from './SeasonDropdown';
import { EpisodeCard } from './EpisodeCard';
import './EpisodeSection.css';

export interface EpisodeSectionProps {
    tvId: number;
    seasons: SeasonItem[];
    onEpisodeSelect?: (seasonNumber: number, episodeNumber: number, episodeName?: string) => void;
    onSeasonChange?: (seasonNumber: number) => void;
    initialSeason?: number;
    initialEpisode?: number;
}

// Global in-memory cache for fetched season episodes to make switching and re-visiting instant
const globalEpisodeCache = new Map<string, EpisodeItem[]>();

export const EpisodeSection: React.FC<EpisodeSectionProps> = ({
    tvId,
    seasons,
    onEpisodeSelect,
    onSeasonChange,
    initialSeason,
    initialEpisode,
}) => {
    // Filter out seasons with 0 episodes and sort by season number
    const validSeasons = seasons
        .filter((s) => s.episode_count > 0)
        .sort((a, b) => a.season_number - b.season_number);

    // Default to first non-special season, or first available season
    const defaultSeason = validSeasons.find((s) => s.season_number > 0) || validSeasons[0];

    const getPersistedSeason = (): number => {
        if (initialSeason !== undefined) return initialSeason;
        try {
            const saved = sessionStorage.getItem(`delulu-season-${tvId}`);
            if (saved) return parseInt(saved, 10);
        } catch {
            // Ignore storage errors
        }
        return defaultSeason?.season_number ?? 1;
    };

    const getPersistedEpisode = (): number | null => {
        if (initialEpisode !== undefined) return initialEpisode;
        try {
            const saved = sessionStorage.getItem(`delulu-episode-${tvId}`);
            if (saved) return parseInt(saved, 10);
        } catch {
            // Ignore storage errors
        }
        return null;
    };

    const [selectedSeason, setSelectedSeason] = useState<number>(getPersistedSeason);
    const [selectedEpisode, setSelectedEpisode] = useState<number | null>(getPersistedEpisode);

    const initialCacheKey = `${tvId}:s${selectedSeason}`;
    const [episodes, setEpisodes] = useState<EpisodeItem[]>(() => globalEpisodeCache.get(initialCacheKey) || []);
    const [isLoading, setIsLoading] = useState(() => !globalEpisodeCache.has(initialCacheKey));
    const [error, setError] = useState<string | null>(null);

    const fetchIdRef = useRef(0);
    const onSeasonChangeRef = useRef(onSeasonChange);
    onSeasonChangeRef.current = onSeasonChange;

    const prefetchSeason = useCallback(
        async (seasonNumber: number) => {
            if (!validSeasons.some((s) => s.season_number === seasonNumber)) return;
            const cacheKey = `${tvId}:s${seasonNumber}`;
            if (globalEpisodeCache.has(cacheKey)) return;

            try {
                const fetched = await engineApi.getTvSeasonEpisodes(tvId, seasonNumber);
                const sorted = [...fetched].sort(
                    (a, b) => a.episode_number - b.episode_number
                );
                globalEpisodeCache.set(cacheKey, sorted);
            } catch {
                // Background prefetch failure does not affect active UI
            }
        },
        [tvId, validSeasons]
    );

    const fetchEpisodes = useCallback(
        async (seasonNumber: number) => {
            const currentFetchId = ++fetchIdRef.current;
            const cacheKey = `${tvId}:s${seasonNumber}`;

            // Check in-memory cache first
            if (globalEpisodeCache.has(cacheKey)) {
                setEpisodes(globalEpisodeCache.get(cacheKey)!);
                setIsLoading(false);
                setError(null);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const fetched = await engineApi.getTvSeasonEpisodes(tvId, seasonNumber);
                if (currentFetchId !== fetchIdRef.current) return;

                const sorted = [...fetched].sort(
                    (a, b) => a.episode_number - b.episode_number
                );
                globalEpisodeCache.set(cacheKey, sorted);
                setEpisodes(sorted);

                // Prefetch adjacent seasons
                void prefetchSeason(seasonNumber - 1);
                void prefetchSeason(seasonNumber + 1);
            } catch (err) {
                if (currentFetchId === fetchIdRef.current) {
                    setError(
                        typeof err === 'string'
                            ? err
                            : 'Failed to load episodes. Please try again.'
                    );
                }
            } finally {
                if (currentFetchId === fetchIdRef.current) {
                    setIsLoading(false);
                }
            }
        },
        [tvId, prefetchSeason]
    );

    // Load episodes when selected season changes
    useEffect(() => {
        if (selectedSeason !== undefined) {
            fetchEpisodes(selectedSeason);
        }
    }, [selectedSeason, fetchEpisodes]);

    // Handle season selection from dropdown
    const handleSeasonSelect = (seasonNumber: number) => {
        setSelectedSeason(seasonNumber);
        onSeasonChangeRef.current?.(seasonNumber);
        try {
            sessionStorage.setItem(`delulu-season-${tvId}`, String(seasonNumber));
            sessionStorage.removeItem(`delulu-episode-${tvId}`);
        } catch {
            // Ignore storage errors
        }
    };

    // Handle episode selection click
    const handleEpisodeClick = (episode: EpisodeItem) => {
        setSelectedEpisode(episode.episode_number);
        try {
            sessionStorage.setItem(`delulu-season-${tvId}`, String(selectedSeason));
            sessionStorage.setItem(
                `delulu-episode-${tvId}`,
                String(episode.episode_number)
            );
        } catch {
            // Ignore storage errors
        }

        onEpisodeSelect?.(selectedSeason, episode.episode_number, episode.name);
    };

    if (validSeasons.length === 0) {
        return null;
    }

    return (
        <div className="season-episode-selector">
            <SeasonDropdown
                seasons={validSeasons}
                selectedSeason={selectedSeason}
                onSeasonSelect={handleSeasonSelect}
            />

            <div className="episodes-list">
                {isLoading && (
                    <div className="episodes-loading">
                        <div className="episodes-spinner" />
                        <span>Fetching episodes...</span>
                    </div>
                )}

                {error && !isLoading && (
                    <div className="episodes-error">
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={() => fetchEpisodes(selectedSeason)}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!isLoading && !error && episodes.length === 0 && (
                    <div className="episodes-empty">No episodes available</div>
                )}

                {!isLoading &&
                    !error &&
                    episodes.map((episode) => (
                        <EpisodeCard
                            key={episode.id || episode.episode_number}
                            episode={episode}
                            isSelected={selectedEpisode === episode.episode_number}
                            onClick={handleEpisodeClick}
                        />
                    ))}
            </div>
        </div>
    );
};
