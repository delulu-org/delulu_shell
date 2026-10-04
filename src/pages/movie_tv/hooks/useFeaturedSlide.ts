import { useState, useEffect, useCallback, useRef } from 'react';
import type { HeroItem } from '../../../api/types';

export interface UseFeaturedSlideResult {
    baseHero: HeroItem | null;
    infoHero: HeroItem | null;
    targetHero: HeroItem | null;
    overlayBackdrop: string | null;
    isCanvasSliding: boolean;
    textAnimKey: number;
    swipeDidSwipe: React.MutableRefObject<boolean>;
    goNext: () => void;
    goPrev: () => void;
    onCanvasDown: (clientX: number) => void;
    onCanvasUp: (clientX: number) => void;
}

/**
 * Manages the featured hero carousel with synchronized double-buffering:
 * - Prewarms all backdrop images in memory to prevent network lag on slide
 * - baseHero: stays on current slide until the overlay has completely settled
 * - infoHero: immediately updates to the incoming slide so text types in smoothly
 * - overlayBackdrop: off-screen paint guarantee + 2-phase swap to eliminate any flicker
 */
const slideMemoryCache = new Map<string, number>();

export function useFeaturedSlide(heroes: HeroItem[], sessionKey?: string): UseFeaturedSlideResult {
    const initialIndex = () => {
        if (!sessionKey || heroes.length === 0) return 0;
        const saved = slideMemoryCache.get(sessionKey);
        return saved !== undefined && saved < heroes.length ? saved : 0;
    };

    const [featuredIndex, setFeaturedIndex] = useState(initialIndex);
    const [displayedIndex, setDisplayedIndex] = useState(initialIndex);
    const [displayedInfoIndex, setDisplayedInfoIndex] = useState(initialIndex);
    const [overlayBackdrop, setOverlayBackdrop] = useState<string | null>(null);
    const [isCanvasSliding, setIsCanvasSliding] = useState(false);
    const [textAnimKey, setTextAnimKey] = useState(0);

    const swipeDragX = useRef<number | null>(null);
    const swipeDidSwipe = useRef(false);
    const slideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTransitioningRef = useRef(false);

    const count = heroes.length;

    // Prewarm all hero candidate backdrops so they are cached and decoded
    useEffect(() => {
        if (!heroes || heroes.length === 0) return;
        heroes.forEach((h) => {
            const src = h.backdrop_path ?? h.poster_path;
            if (src) {
                const img = new Image();
                img.src = src;
            }
        });
    }, [heroes]);

    const getHeroAt = useCallback(
        (idx: number): HeroItem | null => {
            if (!count) return null;
            const normalized = ((idx % count) + count) % count;
            return heroes[normalized] ?? null;
        },
        [count, heroes]
    );

    const baseHero = getHeroAt(displayedIndex) ?? getHeroAt(0);
    const infoHero = getHeroAt(displayedInfoIndex) ?? baseHero;
    const targetHero = getHeroAt(featuredIndex) ?? baseHero;

    const clearSlideTimeout = () => {
        if (slideTimeoutRef.current) {
            clearTimeout(slideTimeoutRef.current);
            slideTimeoutRef.current = null;
        }
    };

    // Auto-rotate every 6 seconds; resets whenever featuredIndex changes
    useEffect(() => {
        if (count <= 1) return;
        const timer = setInterval(() => {
            setFeaturedIndex((prev) => (prev + 1) % count);
        }, 6000);
        return () => clearInterval(timer);
    }, [count, featuredIndex]);

    useEffect(() => {
        if (sessionKey) {
            slideMemoryCache.set(sessionKey, featuredIndex);
        }
    }, [sessionKey, featuredIndex]);

    // Handle slide transition when featuredIndex changes
    useEffect(() => {
        if (displayedIndex === featuredIndex || count <= 1) return;
        const nextHero = getHeroAt(featuredIndex);
        if (!nextHero) return;

        let cancelled = false;
        clearSlideTimeout();
        setIsCanvasSliding(false);
        isTransitioningRef.current = true;

        const nextBackdrop = nextHero.backdrop_path ?? nextHero.poster_path ?? '';
        const preload = new Image();
        preload.src = nextBackdrop;

        const commit = () => {
            if (cancelled) return;

            // 1. Instantly update text and trigger typing animation for the incoming hero
            setDisplayedInfoIndex(featuredIndex);
            setTextAnimKey((prev) => prev + 1);

            // 2. Mount overlay at off-canvas position (translateX(100%))
            setOverlayBackdrop(nextBackdrop);

            // 3. Double rAF ensures browser paints off-canvas state before triggering transition
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (!cancelled) {
                        setIsCanvasSliding(true);
                    }
                });
            });

            // 4. Wait for full transition (760ms + 40ms buffer to reach 0% cleanly)
            slideTimeoutRef.current = setTimeout(() => {
                if (cancelled) return;

                // Step 4a: Update the base image underneath while the overlay is STILL at 0%
                setDisplayedIndex(featuredIndex);

                // Step 4b: Next frame, dismiss overlay — base image is already painted, ZERO flicker
                requestAnimationFrame(() => {
                    if (!cancelled) {
                        setOverlayBackdrop(null);
                        setIsCanvasSliding(false);
                        isTransitioningRef.current = false;
                    }
                });
            }, 800);
        };

        if (preload.complete) {
            commit();
        } else {
            preload.onload = commit;
            preload.onerror = commit;
        }

        return () => {
            cancelled = true;
            clearSlideTimeout();
        };
    }, [featuredIndex, displayedIndex, count, getHeroAt]);

    const goNext = useCallback(() => {
        if (!count) return;
        setFeaturedIndex((prev) => (prev + 1) % count);
    }, [count]);

    const goPrev = useCallback(() => {
        if (!count) return;
        setFeaturedIndex((prev) => (prev - 1 + count) % count);
    }, [count]);

    const onCanvasDown = useCallback((clientX: number) => {
        swipeDragX.current = clientX;
        swipeDidSwipe.current = false;
    }, []);

    const onCanvasUp = useCallback(
        (clientX: number) => {
            if (swipeDragX.current === null) return;
            const diff = swipeDragX.current - clientX;
            if (Math.abs(diff) > 48) {
                swipeDidSwipe.current = true;
                if (diff > 0) goNext();
                else goPrev();
            }
            swipeDragX.current = null;
        },
        [goNext, goPrev]
    );

    // Global mouseup so dragging outside the canvas still triggers swipe
    useEffect(() => {
        const handler = (e: globalThis.MouseEvent) => onCanvasUp(e.clientX);
        window.addEventListener('mouseup', handler);
        return () => window.removeEventListener('mouseup', handler);
    }, [onCanvasUp]);

    return {
        baseHero,
        infoHero,
        targetHero,
        overlayBackdrop,
        isCanvasSliding,
        textAnimKey,
        swipeDidSwipe,
        goNext,
        goPrev,
        onCanvasDown,
        onCanvasUp,
    };
}
