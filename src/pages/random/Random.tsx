import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shuffle, Loader2, X, Info } from 'lucide-react';
import { DomeGallery, type ImageItem } from './components/DomeGallery';
import { engineApi } from '../../api/engine';
import { CardBookmarkBtn, CardFavoriteBtn, TMDbRating, MediaLogo, ImdbRating } from '../../common_comps';
import './Random.css';

interface SelectedMedia {
    id: number;
    type: 'movie' | 'tv';
    title: string;
    overview?: string | null;
    rating?: number | null;
    imdbRating?: number | null;
    release_year?: string | null;
    posterSrc: string;
    backdropSrc?: string;
    logoSrc?: string | null;
    isLoading: boolean;
}

const getWatchlist = (): number[] => {
    try {
        return JSON.parse(localStorage.getItem('delulu_watchlist') || '[]');
    } catch {
        return [];
    }
};

const getFavorites = (): number[] => {
    try {
        return JSON.parse(localStorage.getItem('delulu_favorites') || '[]');
    } catch {
        return [];
    }
};

export function Random() {
    const navigate = useNavigate();
    const [images, setImages] = useState<ImageItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [shuffleKey, setShuffleKey] = useState(0);
    const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
    const [isWatchlist, setIsWatchlist] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (!selectedMedia) return;
        const wl = getWatchlist();
        const fav = getFavorites();
        setIsWatchlist(wl.includes(selectedMedia.id));
        setIsFavorite(fav.includes(selectedMedia.id));
    }, [selectedMedia?.id]);

    const handleToggleWatchlist = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedMedia) return;
        const wl = getWatchlist();
        const next = wl.includes(selectedMedia.id)
            ? wl.filter(id => id !== selectedMedia.id)
            : [...wl, selectedMedia.id];
        localStorage.setItem('delulu_watchlist', JSON.stringify(next));
        setIsWatchlist(next.includes(selectedMedia.id));
    };

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedMedia) return;
        const fav = getFavorites();
        const next = fav.includes(selectedMedia.id)
            ? fav.filter(id => id !== selectedMedia.id)
            : [...fav, selectedMedia.id];
        localStorage.setItem('delulu_favorites', JSON.stringify(next));
        setIsFavorite(next.includes(selectedMedia.id));
    };

    const loadMedia = async () => {
        setIsLoading(true);
        try {
            const cards = await engineApi.getRandomFeed();
            const galleryPool: ImageItem[] = cards
                .filter(c => c.poster_path)
                .map(c => ({
                    src: c.poster_path!,
                    alt: c.title,
                    id: c.id,
                    type: (c.media_type === 'tv' ? 'tv' : 'movie') as 'movie' | 'tv',
                    title: c.title,
                    overview: c.overview,
                    rating: c.rating,
                    imdb_rating: c.imdb_rating,
                    logo_url: c.logo_url,
                    release_year: c.release_year,
                    backdrop: c.backdrop_path
                        ? c.backdrop_path.replace('/w1280/', '/w780/').replace('/original/', '/w780/')
                        : undefined,
                }));
            setImages(galleryPool);
        } catch (error) {
            console.error('[Random] Failed to fetch random feed from engine:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadMedia();
    }, []);

    // Close modal on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedMedia) {
                setSelectedMedia(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedMedia]);

    const handleReshuffle = () => {
        setShuffleKey(prev => prev + 1);
        setSelectedMedia(null);
        loadMedia();
    };

    const handleImageClick = useCallback(async (image: ImageItem) => {
        if (!image.id || !image.type) return;

        const initialBackdrop = image.backdrop;
        const wl = getWatchlist();
        const fav = getFavorites();
        setIsWatchlist(wl.includes(image.id));
        setIsFavorite(fav.includes(image.id));

        setSelectedMedia({
            id: image.id,
            type: image.type,
            title: image.title || image.alt,
            overview: image.overview,
            rating: image.rating,
            imdbRating: image.imdb_rating,
            release_year: image.release_year,
            posterSrc: image.src,
            backdropSrc: initialBackdrop,
            logoSrc: image.logo_url,
            isLoading: false,
        });

        // Background update: If backdrop, overview, logo, or imdb rating is missing, fetch full details seamlessly
        if (!initialBackdrop || !image.overview || !image.logo_url || image.imdb_rating === undefined) {
            try {
                const payload = await engineApi.getDetailsFeed(image.type, image.id);
                const fetchedBackdrop = payload.backdrop_path
                    ? payload.backdrop_path.replace('/w1280/', '/w780/').replace('/original/', '/w780/')
                    : undefined;

                const applyUpdate = (backdrop?: string) => {
                    setSelectedMedia(prev => prev && prev.id === image.id ? {
                        ...prev,
                        title: payload.title || prev.title,
                        overview: payload.overview ?? prev.overview,
                        rating: payload.rating ?? prev.rating,
                        imdbRating: payload.imdb_rating ?? prev.imdbRating,
                        release_year: payload.release_year ?? prev.release_year,
                        backdropSrc: backdrop || prev.backdropSrc,
                        logoSrc: payload.logo_url ?? prev.logoSrc,
                    } : prev);
                };

                if (fetchedBackdrop && fetchedBackdrop !== initialBackdrop) {
                    const img = new Image();
                    img.src = fetchedBackdrop;
                    img.onload = () => applyUpdate(fetchedBackdrop);
                    img.onerror = () => applyUpdate();
                } else {
                    applyUpdate();
                }
            } catch (error) {
                console.error('[Random] Failed to fetch details:', error);
            }
        }
    }, []);

    const handleCloseDetails = () => {
        setSelectedMedia(null);
    };

    return (
        <div className="random-page">
            {/* Liquid Glass Navigation Island */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="random-header"
            >
                <div className="random-header-island">
                    <button className="random-btn random-btn-ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} />
                        <span>Back</span>
                    </button>

                    <h1 className="random-title">Random Discovery</h1>

                    <button
                        className="random-btn random-btn-ghost"
                        onClick={handleReshuffle}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 size={18} className="spin" /> : <Shuffle size={18} />}
                        <span>Shuffle</span>
                    </button>
                </div>
            </motion.div>

            {/* Loading overlay */}
            {isLoading && images.length === 0 && (
                <div className="random-loading">
                    <Loader2 size={48} className="spin" />
                    <p>Loading random movies & shows...</p>
                </div>
            )}

            {/* 3D Dome Gallery */}
            {images.length > 0 && (
                <DomeGallery
                    key={shuffleKey}
                    images={images}
                    dragDampening={5}
                    grayscale={false}
                    maxVerticalRotationDeg={0}
                    overlayBlurColor="#000000"
                    imageBorderRadius="16px"
                    fit={0.65}
                    onImageClick={handleImageClick}
                />
            )}

            {/* 16:9 Backdrop Viewer Modal */}
            <AnimatePresence>
                {selectedMedia && (
                    <motion.div
                        key="random-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        onClick={handleCloseDetails}
                        className="random-modal-backdrop"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="random-modal-backdrop-card"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={handleCloseDetails}
                                className="random-modal-close"
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>

                            <img
                                src={selectedMedia.backdropSrc || selectedMedia.posterSrc}
                                alt={selectedMedia.title}
                                className="random-backdrop-image"
                                decoding="async"
                            />
                            <div className="random-modal-overlay" />
                            <div className="random-modal-info">
                                <MediaLogo
                                    src={selectedMedia.logoSrc}
                                    title={selectedMedia.title}
                                    size="detail"
                                    as="h2"
                                    className="random-modal-logo"
                                />

                                {selectedMedia.overview && (
                                    <p className="random-modal-overview">
                                        {selectedMedia.overview}
                                    </p>
                                )}

                                <div className="random-modal-meta">
                                    {selectedMedia.imdbRating != null && selectedMedia.imdbRating > 0 ? (
                                        <ImdbRating rating={selectedMedia.imdbRating} />
                                    ) : null}
                                    {selectedMedia.rating != null && selectedMedia.rating > 0 ? (
                                        <TMDbRating rating={selectedMedia.rating} />
                                    ) : null}
                                    {selectedMedia.release_year && (
                                        <>
                                            <span className="random-modal-dot" />
                                            <span className="random-modal-year">{selectedMedia.release_year}</span>
                                        </>
                                    )}
                                    <span className="random-modal-dot" />
                                    <span className="random-modal-badge">
                                        {selectedMedia.type === 'tv' ? 'SERIES' : 'MOVIE'}
                                    </span>
                                </div>

                                <div className="random-modal-actions">
                                    <button
                                        className="random-modal-info-btn"
                                        onClick={() => navigate(`/details/${selectedMedia.type}/${selectedMedia.id}`)}
                                    >
                                        <Info size={15} />
                                        <span>More Info</span>
                                    </button>

                                    <CardBookmarkBtn
                                        isActive={isWatchlist}
                                        onClick={handleToggleWatchlist}
                                    />

                                    <CardFavoriteBtn
                                        isActive={isFavorite}
                                        onClick={handleToggleFavorite}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
