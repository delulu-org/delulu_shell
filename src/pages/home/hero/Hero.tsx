import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import { engineApi } from '../../../api/engine';
import { TMDbRating, ImdbRating, SkeletonHero, MediaLogo } from '../../../common_comps';
import type { HeroItem, HeroMeta } from '../../../api/types';
import './Hero.css';

interface HeroCarouselProps {
    items: HeroItem[];
    autoPlayInterval?: number;
    isLoading?: boolean;
}

const TRAILER_PLAY_DURATION = 20000;

// Simple in-memory cache for logo/trailer per item id
const metaCache = new Map<number, HeroMeta & { logoUrl?: string }>();
let savedHeroIndex = 0;
let hasSettledInitialHero = false;

export function Hero({ items, autoPlayInterval = 8000, isLoading = false }: HeroCarouselProps) {
    const navigate = useNavigate();

    const [currentIndex, setCurrentIndex] = useState(() => (items.length > 0 && savedHeroIndex < items.length ? savedHeroIndex : 0));
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionFromIndex, setTransitionFromIndex] = useState<number | null>(null);
    const [transitionToIndex, setTransitionToIndex] = useState<number | null>(null);

    const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [showTrailer, setShowTrailer] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    const initialItem = items[currentIndex];
    const [typedTitle, setTypedTitle] = useState(() => (hasSettledInitialHero && initialItem ? initialItem.title : ''));
    const [typedOverview, setTypedOverview] = useState(() => (hasSettledInitialHero && initialItem ? (initialItem.overview.length > 200 ? `${initialItem.overview.substring(0, 200)}...` : initialItem.overview) : ''));
    const [showMeta, setShowMeta] = useState(() => hasSettledInitialHero);

    const [dragStart, setDragStart] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const trailerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const trailerRevealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const titleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const overviewIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingCompleteRef = useRef(true);
    const typingUnlockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingDeadlineRef = useRef(0);
    const resourceRequestRef = useRef(0);

    const TRANSITION_MS = 1000;
    const TITLE_TYPE_MS = 42;
    const OVERVIEW_TYPE_MS = 18;

    const activeIndex = isTransitioning && transitionToIndex !== null ? transitionToIndex : currentIndex;
    const activeItem = items[activeIndex];

    // ── Visibility Observer ────────────────────────────────────────────────────
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting || entry.intersectionRatio >= 0.1),
            { threshold: [0, 0.1, 0.5, 1.0] }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const clearTrailerReveal = () => {
        if (trailerRevealTimeoutRef.current) {
            clearTimeout(trailerRevealTimeoutRef.current);
            trailerRevealTimeoutRef.current = null;
        }
    };

    const tryPlayTrailer = () => {
        const video = videoRef.current;
        if (!video || !showTrailer || !isVisible || isTransitioning) return;
        video.play().catch(e => console.warn('[Hero] Autoplay blocked:', e));
    };

    useEffect(() => {
        if (isVisible && showTrailer) tryPlayTrailer();
        else if (!isVisible && videoRef.current) videoRef.current.pause();
    }, [isVisible, showTrailer, trailerUrl, isTransitioning]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    // ── Fetch logo + trailer when active item changes ──────────────────────────
    useEffect(() => {
        if (!activeItem || items.length === 0) return;

        setShowTrailer(false);
        setTrailerUrl(null);
        clearTrailerReveal();
        const requestId = ++resourceRequestRef.current;

        // Check in-memory cache first
        const cached = metaCache.get(activeItem.id);
        const initialLogo = activeItem.logo_url ?? cached?.logo_url ?? null;
        setLogoUrl(initialLogo);

        // Trailer
        (async () => {
            const cachedTrailer = cached?.trailer_url;
            if (cachedTrailer) {
                setTrailerUrl(cachedTrailer);
                clearTrailerReveal();
                trailerRevealTimeoutRef.current = setTimeout(() => {
                    if (resourceRequestRef.current !== requestId) return;
                    setShowTrailer(true);
                }, 1200);
                return;
            }
            try {
                const res = await engineApi.getHeroMeta(activeItem.id, activeItem.media_type);
                if (resourceRequestRef.current !== requestId) return;
                const entry = metaCache.get(activeItem.id) ?? { logo_url: null, imdb_rating: null, trailer_url: null };
                if (res?.trailer_url) {
                    entry.trailer_url = res.trailer_url;
                    metaCache.set(activeItem.id, entry);
                    setTrailerUrl(res.trailer_url);
                    clearTrailerReveal();
                    trailerRevealTimeoutRef.current = setTimeout(() => {
                        if (resourceRequestRef.current !== requestId) return;
                        setShowTrailer(true);
                    }, 1200);
                }
            } catch { /* hero meta not available yet */ }
        })();

        // Logo
        (async () => {
            if (initialLogo) return;
            try {
                const res = await engineApi.getHeroMeta(activeItem.id, activeItem.media_type);
                if (resourceRequestRef.current !== requestId) return;
                const entry = metaCache.get(activeItem.id) ?? { logo_url: null, imdb_rating: null, trailer_url: null };
                if (res?.logo_url) {
                    entry.logo_url = res.logo_url;
                    metaCache.set(activeItem.id, entry);
                    setLogoUrl(res.logo_url);
                }
            } catch { /* logo not available */ }
        })();

        return () => { clearTrailerReveal(); };
    }, [activeIndex, activeItem]);

    // ── Trailer auto-advance timer ─────────────────────────────────────────────
    useEffect(() => {
        if (trailerTimerRef.current) clearTimeout(trailerTimerRef.current);
        if (showTrailer && isVisible) {
            trailerTimerRef.current = setTimeout(() => handleNext(), TRAILER_PLAY_DURATION);
        }
        return () => { if (trailerTimerRef.current) clearTimeout(trailerTimerRef.current); };
    }, [showTrailer, isVisible]);

    // ── Auto-advance ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (items.length <= 1 || !isVisible) return;
        if (trailerUrl) return;

        intervalRef.current = setInterval(() => {
            if (isTransitioning) return;
            if (!typingCompleteRef.current && Date.now() < typingDeadlineRef.current) return;
            handleNext();
        }, autoPlayInterval);

        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [currentIndex, items.length, autoPlayInterval, isTransitioning, trailerUrl, isVisible]);

    // ── Typewriter ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!activeItem) return;
        const fullTitle = activeItem.title;
        const fullOverview = activeItem.overview.length > 200
            ? `${activeItem.overview.substring(0, 200)}...`
            : activeItem.overview;

        if (hasSettledInitialHero && !isTransitioning) {
            setTypedTitle(fullTitle);
            setTypedOverview(fullOverview);
            setShowMeta(true);
            typingCompleteRef.current = true;
            return;
        }

        [titleIntervalRef, overviewIntervalRef].forEach(r => { if (r.current) clearInterval(r.current); });
        [revealTimeoutRef, typingUnlockTimeoutRef].forEach(r => { if (r.current) clearTimeout(r.current); });

        setTypedTitle(''); setTypedOverview(''); setShowMeta(false);
        typingCompleteRef.current = false;

        const maxBlockMs = 4000;
        typingDeadlineRef.current = Date.now() + maxBlockMs;
        typingUnlockTimeoutRef.current = setTimeout(() => { typingCompleteRef.current = true; }, maxBlockMs);

        let titleCursor = 0;
        titleIntervalRef.current = setInterval(() => {
            titleCursor += 1;
            setTypedTitle(fullTitle.slice(0, titleCursor));
            if (titleCursor >= fullTitle.length) {
                clearInterval(titleIntervalRef.current!); titleIntervalRef.current = null;
                setShowMeta(true);
                revealTimeoutRef.current = setTimeout(() => {
                    let oCursor = 0;
                    overviewIntervalRef.current = setInterval(() => {
                        oCursor += 2;
                        setTypedOverview(fullOverview.slice(0, oCursor));
                        if (oCursor >= fullOverview.length) {
                            clearInterval(overviewIntervalRef.current!);
                            overviewIntervalRef.current = null;
                            typingCompleteRef.current = true;
                            hasSettledInitialHero = true;
                            savedHeroIndex = activeIndex;
                        }
                    }, OVERVIEW_TYPE_MS);
                }, 120);
            }
        }, TITLE_TYPE_MS);

        return () => {
            if (titleIntervalRef.current) clearInterval(titleIntervalRef.current);
            if (overviewIntervalRef.current) clearInterval(overviewIntervalRef.current);
            if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
        };
    }, [activeIndex, activeItem]);

    // ── Slide transition ──────────────────────────────────────────────────────
    const startSlideTransition = (target: 'next' | 'prev' | number) => {
        if (isTransitioning || items.length <= 1) return;
        const toIndex = typeof target === 'number'
            ? target
            : target === 'next'
                ? (currentIndex + 1) % items.length
                : (currentIndex - 1 + items.length) % items.length;
        if (toIndex === currentIndex) return;

        setTransitionFromIndex(currentIndex);
        setTransitionToIndex(toIndex);
        setIsTransitioning(true);
        clearTrailerReveal();
        setShowTrailer(false);
        transitionTimeoutRef.current = setTimeout(() => {
            setCurrentIndex(toIndex);
            savedHeroIndex = toIndex;
            hasSettledInitialHero = true;
            setTransitionFromIndex(null);
            setTransitionToIndex(null);
            setIsTransitioning(false);
        }, TRANSITION_MS);
    };

    const handleNext = () => startSlideTransition('next');
    const handlePrev = () => startSlideTransition('prev');

    const handleDragStart = (clientX: number) => {
        setDragStart(clientX);
        setIsDragging(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (trailerTimerRef.current) clearTimeout(trailerTimerRef.current);
    };

    const handleDragEnd = (clientX: number) => {
        if (dragStart === null) return;
        const diff = dragStart - clientX;
        if (Math.abs(diff) > 50) { if (diff > 0) handleNext(); else handlePrev(); }
        setDragStart(null);
        setIsDragging(false);
    };

    if (isLoading || !activeItem) {
        return <SkeletonHero />;
    }

    const bgImage = activeItem.backdrop_path ?? activeItem.poster_path ?? '';

    return (
        <div
            ref={containerRef}
            className={`hero-carousel ${isDragging ? 'hero-carousel-dragging' : ''}`}
            onMouseDown={(e) => handleDragStart(e.clientX)}
            onMouseUp={(e) => handleDragEnd(e.clientX)}
            onMouseLeave={() => { if (isDragging) { setDragStart(null); setIsDragging(false); } }}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
            onTouchEnd={(e) => { if (e.changedTouches.length > 0) handleDragEnd(e.changedTouches[0].clientX); }}
        >
            {/* Permanent backdrop stage: unbroken Ken Burns zoom that never resets */}
            <div className="hero-backdrop-stage">
                {!isTransitioning && (
                    <div className="hero-backdrop hero-backdrop-static" style={{ backgroundImage: `url(${bgImage})` }} />
                )}

                {isTransitioning && transitionFromIndex !== null && transitionToIndex !== null && (
                    <>
                        <div
                            className="hero-backdrop hero-backdrop-from"
                            style={{
                                backgroundImage: `url(${items[transitionFromIndex]?.backdrop_path ?? items[transitionFromIndex]?.poster_path ?? ''})`
                            }}
                        />
                        <div
                            className="hero-backdrop hero-backdrop-to"
                            style={{
                                backgroundImage: `url(${items[transitionToIndex]?.backdrop_path ?? items[transitionToIndex]?.poster_path ?? ''})`
                            }}
                        />
                    </>
                )}
            </div>

            {trailerUrl && !isTransitioning && (
                <div className={`hero-trailer-container ${showTrailer ? 'is-visible' : ''}`}>
                    <video
                        ref={videoRef}
                        key={trailerUrl}
                        className="hero-trailer-video"
                        src={trailerUrl}
                        autoPlay={isVisible}
                        muted={isMuted}
                        loop
                        playsInline
                        onCanPlay={tryPlayTrailer}
                    />
                </div>
            )}

            <div className="hero-gradient" /><div className="hero-gradient-bottom" />

            <div className="hero-content">
                <div className="hero-eyebrow">
                    <span className="hero-eyebrow-text">Featured {activeItem.media_type === 'movie' ? 'Movie' : 'Series'}</span>
                    <span className="hero-eyebrow-line" />
                </div>

                <MediaLogo
                    src={activeItem?.logo_url ?? metaCache.get(activeItem?.id)?.logo_url ?? logoUrl}
                    title={typedTitle || activeItem.title}
                    size="hero"
                    isVisible={true}
                />

                <div className={`hero-meta hero-text-reveal ${showMeta ? 'is-visible' : ''}`}>
                    {activeItem.rating != null && activeItem.rating > 0 && (
                        <>
                            <TMDbRating rating={activeItem.rating} className="hero-tmdb-rating" />
                            <span className="hero-meta-dot" />
                        </>
                    )}
                    {activeItem.imdb_rating != null && activeItem.imdb_rating > 0 && (
                        <>
                            <ImdbRating rating={activeItem.imdb_rating} className="hero-imdb-rating" />
                            <span className="hero-meta-dot" />
                        </>
                    )}
                    {activeItem.release_year && (
                        <>
                            <span className="hero-year">{activeItem.release_year}</span>
                            <span className="hero-meta-dot" />
                        </>
                    )}
                    <span className="hero-type">{activeItem.media_type.toUpperCase()}</span>
                </div>

                <p className="hero-overview">{typedOverview}</p>

                <div className="hero-buttons">
                    <button className="hero-btn-ghost" onClick={() => navigate(`/details/${activeItem.media_type}/${activeItem.id}`)}>
                        More Info
                    </button>
                    {trailerUrl && showTrailer && (
                        <button className="hero-btn-mute" onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}>
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                    )}
                </div>
            </div>

            {items.length > 1 && (
                <div className="hero-dots">
                    {items.map((_, i) => (
                        <button
                            key={i}
                            className={`hero-dot ${i === activeIndex ? 'hero-dot-active' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (i !== currentIndex && !isTransitioning) startSlideTransition(i);
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
