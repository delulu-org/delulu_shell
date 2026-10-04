import { useState, useEffect, useCallback, useRef } from 'react';
import type { BrowseFeed, HeroItem, MediaCard, SectionRow } from '../../../api/types';

interface BrowseFeedState {
    heroes: HeroItem[];
    moodRows: SectionRow[];
    discoverItems: MediaCard[];
    page: number;
    totalPages: number;
    isLoading: boolean;
    isLoadingMore: boolean;
    loadError: string;
    hasMore: boolean;
    loadMore: () => void;
}

interface BrowseFeedOptions {
    sessionKey: string;
    fetchFn: (page: number) => Promise<BrowseFeed>;
    errorMessage: string;
}

interface CacheShape {
    heroes: HeroItem[];
    moodRows: SectionRow[];
    discoverItems: MediaCard[];
    page: number;
    totalPages: number;
}

function readCache(key: string): CacheShape | null {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as CacheShape;
        if (parsed.heroes?.length > 0 && parsed.heroes[0].logo_url === undefined) {
            sessionStorage.removeItem(key);
            return null;
        }
        return parsed;
    } catch { return null; }
}

function writeCache(key: string, c: CacheShape) {
    try { sessionStorage.setItem(key, JSON.stringify(c)); } catch { /* ignore */ }
}

/**
 * Handles data fetching, caching, pagination, and deduplication for browse pages.
 * Page 1: fetches full feed (heroes[] + mood rows + discover items).
 * Page > 1 (Load More): fetches only the next discover page and appends items.
 */
export function useBrowseFeed({
    sessionKey,
    fetchFn,
    errorMessage,
}: BrowseFeedOptions): BrowseFeedState {
    const restored = readCache(sessionKey);

    const [heroes, setHeroes] = useState<HeroItem[]>(restored?.heroes ?? []);
    const [moodRows, setMoodRows] = useState<SectionRow[]>(restored?.moodRows ?? []);
    const [discoverItems, setDiscoverItems] = useState<MediaCard[]>(restored?.discoverItems ?? []);
    const [page, setPage] = useState(restored?.page ?? 0);
    const [totalPages, setTotalPages] = useState(restored?.totalPages ?? 0);
    const [isLoading, setIsLoading] = useState(!restored || restored.heroes.length === 0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [loadError, setLoadError] = useState('');
    const isFetchingRef = useRef(false);

    const hasMore = totalPages > 0 && page < totalPages;

    // Persist to sessionStorage whenever state changes
    useEffect(() => {
        if (heroes.length === 0 && moodRows.length === 0 && discoverItems.length === 0) return;
        writeCache(sessionKey, { heroes, moodRows, discoverItems, page, totalPages });
    }, [heroes, moodRows, discoverItems, page, totalPages, sessionKey]);

    const fetchPage = useCallback(async (pg: number) => {
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;
        setLoadError('');
        if (pg === 1) setIsLoading(true); else setIsLoadingMore(true);

        try {
            const feed = await fetchFn(pg);
            if (pg === 1) {
                setHeroes(feed.featured_heroes || []);
                setMoodRows(feed.mood_rows);
                setDiscoverItems(feed.items);
            } else {
                setDiscoverItems((prev) => {
                    const ids = new Set(prev.map((m) => m.id));
                    return [...prev, ...feed.items.filter((m) => !ids.has(m.id))];
                });
            }
            setPage(feed.page);
            setTotalPages(feed.total_pages);
        } catch {
            setLoadError(errorMessage);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
            isFetchingRef.current = false;
        }
    }, [fetchFn, errorMessage]);

    // Initial fetch only if no cached data
    useEffect(() => {
        if (!restored || restored.heroes.length === 0) fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadMore = useCallback(() => {
        if (isLoading || isLoadingMore || !hasMore) return;
        fetchPage(page + 1);
    }, [fetchPage, hasMore, isLoading, isLoadingMore, page]);

    return {
        heroes, moodRows, discoverItems,
        page, totalPages,
        isLoading, isLoadingMore, loadError,
        hasMore, loadMore,
    };
}
