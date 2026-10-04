import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { engineApi } from '../../api/engine';
import { BackButton } from './common/buttons';
import { DetailHero } from './common/hero';
import { BackToTopBtn } from './common/navigation';
import { DetailsSkeleton } from './common/skeleton';
import type { DetailsPayload } from '../../api/types';
import './DetailsPage.css';

// Module-level in-memory cache to guarantee 0ms instant display on repeat visits
const detailsMemoryCache = new Map<string, DetailsPayload>();

export const DetailsPage: React.FC = () => {
    const { mediaType, id } = useParams<{ mediaType: 'movie' | 'tv'; id: string }>();
    const navigate = useNavigate();

    const cacheKey = `${mediaType}:${id}`;
    const cached = mediaType && id ? detailsMemoryCache.get(cacheKey) : null;

    const [details, setDetails] = useState<DetailsPayload | null>(cached || null);
    const [isLoading, setIsLoading] = useState<boolean>(!cached);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        if (!mediaType || !id) return;

        const numId = parseInt(id, 10);
        if (isNaN(numId)) {
            setError('Invalid title identifier');
            setIsLoading(false);
            return;
        }

        // Only show skeleton on first visit when not already in memory
        if (!detailsMemoryCache.has(cacheKey)) {
            setIsLoading(true);
        }
        setError(null);

        (async () => {
            try {
                const res = await engineApi.getDetailsFeed(mediaType, numId);
                if (!isMounted) return;
                detailsMemoryCache.set(cacheKey, res);
                setDetails(res);
            } catch (err) {
                if (!isMounted) return;
                if (!detailsMemoryCache.has(cacheKey)) {
                    setError(typeof err === 'string' ? err : 'Failed to load details.');
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [mediaType, id]);

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }
        navigate('/');
    };

    const handlePlay = () => {
        console.log('[DetailsPage] Play clicked for', details?.title);
    };

    const handleTrailer = () => {
        console.log('[DetailsPage] Trailer clicked for', details?.title);
    };

    const handleEpisodeSelect = (
        seasonNum: number,
        episodeNum: number,
        episodeName?: string
    ) => {
        console.log(
            `[DetailsPage] Episode clicked: S${seasonNum}E${episodeNum} - ${episodeName || 'Episode'}`
        );
    };

    const handleToggleWatched = (active: boolean) => {
        console.log('[DetailsPage] Watched toggled:', active, details?.title);
    };

    return (
        <div className="details-page">
            <BackButton onClick={handleBack} />

            {isLoading && (
                <DetailsSkeleton isTv={mediaType === 'tv'} />
            )}

            {error && !isLoading && (
                <div className="details-error-screen">
                    <span>{error}</span>
                    <button onClick={() => window.location.reload()}>Retry</button>
                </div>
            )}

            {details && !isLoading && (
                <>
                    <DetailHero
                        details={details}
                        onPlay={handlePlay}
                        onTrailer={handleTrailer}
                        onToggleWatched={handleToggleWatched}
                        onEpisodeSelect={handleEpisodeSelect}
                    />
                    {details.media_type === 'tv' && <BackToTopBtn />}
                </>
            )}
        </div>
    );
};
