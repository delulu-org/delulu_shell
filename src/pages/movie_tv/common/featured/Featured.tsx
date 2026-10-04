import { useState, useEffect, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { engineApi } from '../../../../api/engine';
import { MediaLogo } from '../../../../common_comps/media_logo/MediaLogo';
import type { HeroItem } from '../../../../api/types';
import './Featured.css';

// In-memory cache for hero logo URLs so rotating slides don't re-fetch
const logoCache = new Map<number, string | null>();

interface FeaturedProps {
    baseHero: HeroItem;
    infoHero: HeroItem;
    onNext: () => void;
    onPrev?: () => void;
    textAnimKey: number;
    overlayBackdrop: string | null;
    isCanvasSliding: boolean;
    onCanvasDown: (clientX: number) => void;
    onCanvasUp: (clientX: number) => void;
    swipeDidSwipe: React.MutableRefObject<boolean>;
}

function getOverviewSnippet(overview: string): string {
    const text = overview?.trim();
    if (!text) return "A carefully selected title from tonight's curated lineup.";
    const maxLength = 180;
    if (text.length <= maxLength) return text;
    const lastSpace = text.lastIndexOf(' ', maxLength);
    return `${text.slice(0, lastSpace > 100 ? lastSpace : maxLength).trim()}...`;
}

export function Featured({
    baseHero,
    infoHero,
    onNext,
    onPrev: _onPrev,
    textAnimKey,
    overlayBackdrop,
    isCanvasSliding,
    onCanvasDown,
    onCanvasUp,
    swipeDidSwipe,
}: FeaturedProps) {
    const navigate = useNavigate();
    const [logoUrl, setLogoUrl] = useState<string | null>(() => infoHero.logo_url ?? logoCache.get(infoHero.id) ?? null);

    useEffect(() => {
        let isMounted = true;
        if (infoHero.logo_url) {
            logoCache.set(infoHero.id, infoHero.logo_url);
            setLogoUrl(infoHero.logo_url);
            return;
        }
        if (logoCache.has(infoHero.id)) {
            setLogoUrl(logoCache.get(infoHero.id) ?? null);
            return;
        }

        setLogoUrl(null);

        (async () => {
            try {
                const res = await engineApi.getHeroMeta(infoHero.id, infoHero.media_type);
                if (!isMounted) return;
                const fetched = res?.logo_url ?? null;
                logoCache.set(infoHero.id, fetched);
                setLogoUrl(fetched);
            } catch {
                if (isMounted) {
                    logoCache.set(infoHero.id, null);
                    setLogoUrl(null);
                }
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [infoHero.id, infoHero.media_type, infoHero.logo_url]);

    const baseBackdrop = baseHero.backdrop_path ?? baseHero.poster_path ?? '';
    const year = infoHero.release_year ?? '';
    const rating = infoHero.rating != null && infoHero.rating > 0 ? `${infoHero.rating.toFixed(1)} rating` : '';
    const imdbRatingText = infoHero.imdb_rating != null && infoHero.imdb_rating > 0 ? `IMDb ${infoHero.imdb_rating.toFixed(1)}` : '';
    const mediaLabel = infoHero.media_type === 'tv' ? 'Series' : 'Film';

    const openDetails = () => {
        navigate(`/details/${infoHero.media_type}/${infoHero.id}`);
    };

    const onCanvasClick = (e: MouseEvent<HTMLButtonElement>) => {
        void e;
        if (swipeDidSwipe.current) {
            swipeDidSwipe.current = false;
            return;
        }
        openDetails();
    };

    return (
        <section className="movies-cinema-featured">
            {/* Info panel — bound strictly to infoHero so title and text never glitch */}
            <div
                className="movies-cinema-featured-info movies-cinema-featured-info-typing"
                key={`featured-info-${infoHero.id}-${textAnimKey}`}
            >
                <MediaLogo
                    src={infoHero.logo_url ?? logoCache.get(infoHero.id) ?? logoUrl}
                    title={infoHero.title}
                    size="hero"
                    as="h1"
                    isVisible={true}
                />

                <p className="movies-cinema-overview">{getOverviewSnippet(infoHero.overview)}</p>

                <div className="movies-cinema-featured-meta">
                    {year && <span>{year}</span>}
                    {rating && <span>{rating}</span>}
                    {imdbRatingText && <span>{imdbRatingText}</span>}
                    <span>{mediaLabel}</span>
                </div>

                <div className="movies-cinema-featured-actions">
                    <button className="movies-cinema-btn movies-cinema-btn-primary" onClick={openDetails}>
                        Open Details
                    </button>
                    <button className="movies-cinema-btn movies-cinema-btn-ghost" onClick={onNext}>
                        Next Feature
                    </button>
                </div>
            </div>

            {/* Canvas — base image shows baseHero while overlay image slides in */}
            <button
                className="movies-cinema-featured-canvas"
                onClick={onCanvasClick}
                onMouseDown={(e) => onCanvasDown(e.clientX)}
                onTouchStart={(e) => onCanvasDown(e.touches[0].clientX)}
                onTouchEnd={(e) => {
                    if (e.changedTouches.length > 0) {
                        onCanvasUp(e.changedTouches[0].clientX);
                    }
                }}
                aria-label={`Open ${infoHero.title}`}
            >
                <img
                    className="movies-cinema-featured-image-base"
                    src={baseBackdrop}
                    alt={baseHero.title}
                />
                {overlayBackdrop && (
                    <img
                        className={`movies-cinema-featured-image-overlay ${isCanvasSliding ? 'is-sliding' : ''}`}
                        src={overlayBackdrop}
                        alt=""
                        aria-hidden="true"
                    />
                )}
            </button>
        </section>
    );
}
