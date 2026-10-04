import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { engineApi } from '../../api/engine';
import type { HomeFeed, MediaCard, HeroItem } from '../../api/types';
import { Hero } from './hero';
import { ContinueWatching } from './continue_watching';
import { WhatsBurning } from './whats_burning';
import { HowRUFeeling } from './how_r_u_feeling';
import { ContentRow } from './common';
import './Home.css';

// Module-level cache so re-renders don't re-fetch
let cachedFeed: HomeFeed | null = null;

export function Home() {
    const navigate = useNavigate();
    const [feed, setFeed] = useState<HomeFeed | null>(cachedFeed);
    const [isLoading, setIsLoading] = useState(cachedFeed === null);

    const fetchFeed = useCallback(async () => {
        try {
            const data = await engineApi.getHomeFeed();
            cachedFeed = data;
            setFeed(data);
        } catch (err) {
            console.error('[Home] Failed to load home feed:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!cachedFeed) fetchFeed();
    }, [fetchFeed]);

    const handleNavigate = (type: 'movie' | 'tv', id: number) => {
        navigate(`/details/${type}/${id}`);
    };

    const handleResume = (item: MediaCard) => {
        handleNavigate(item.media_type as 'movie' | 'tv', item.id);
    };

    const handleDeleteContinueWatching = (e: React.MouseEvent, _item: MediaCard) => {
        e.preventDefault();
        e.stopPropagation();
        // TODO: invoke('remove_continue_watching', { id }) when delulu_core is bound
    };

    const heroItems: HeroItem[] = feed?.hero_items ?? [];
    const whatsBurning: MediaCard[] = feed?.whats_burning ?? [];
    const trending: MediaCard[] = feed?.trending ?? [];
    const popularMovies: MediaCard[] = feed?.popular_movies ?? [];
    const popularTv: MediaCard[] = feed?.popular_tv ?? [];
    const topRated: MediaCard[] = feed?.top_rated ?? [];
    const continueWatching: MediaCard[] = feed?.continue_watching ?? [];

    return (
        <div className="home-page">
            <Hero items={heroItems} isLoading={isLoading} />

            <div className="home-content">
                {!isLoading && continueWatching.length > 0 && (
                    <ContinueWatching
                        items={continueWatching}
                        onResume={handleResume}
                        onDelete={handleDeleteContinueWatching}
                    />
                )}

                <WhatsBurning items={whatsBurning} onNavigate={handleNavigate} isLoading={isLoading} />
                <ContentRow label="Trending" title="Trending Now" items={trending} isLoading={isLoading} />
                {!isLoading && <HowRUFeeling items={trending} onNavigate={handleNavigate} />}
                <ContentRow label="Cinema" title="Popular Movies" items={popularMovies} isLoading={isLoading} />
                <ContentRow label="Television" title="Popular TV Shows" items={popularTv} isLoading={isLoading} />
                <ContentRow label="Acclaimed" title="Top Rated Movies" items={topRated} isLoading={isLoading} />
            </div>
        </div>
    );
}
