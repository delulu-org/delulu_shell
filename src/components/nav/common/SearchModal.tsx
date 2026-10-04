import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { engineApi } from '../../../api/engine';
import type { MediaCard } from '../../../api/types';
import './SearchModal.css';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface RecentSearch {
    id: number;
    title: string;
    mediaType: 'movie' | 'tv';
    posterPath: string | null;
}

const RECENT_SEARCHES_KEY = 'delulu_recent_searches';
const MAX_RECENT_SEARCHES = 10;

function getRecentSearches(): RecentSearch[] {
    try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveRecentSearch(item: MediaCard) {
    try {
        const recent = getRecentSearches();
        const newItem: RecentSearch = {
            id: item.id,
            title: item.title,
            mediaType: item.media_type as 'movie' | 'tv',
            posterPath: item.poster_path,
        };
        const filtered = recent.filter(r => !(r.id === item.id && r.mediaType === newItem.mediaType));
        filtered.unshift(newItem);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT_SEARCHES)));
    } catch { /* ignore */ }
}

function clearRecentSearches() {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<MediaCard[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
    const [trendingItems, setTrendingItems] = useState<MediaCard[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setRecentSearches(getRecentSearches());
            inputRef.current?.focus();

            // Load trending from cached home feed if available
            engineApi.getHomeFeed().then(feed => {
                setTrendingItems(feed.trending.slice(0, 5));
            }).catch(() => {});

            return () => { document.body.style.overflow = ''; };
        } else {
            document.body.style.overflow = '';
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Debounced search via Rust engine
    useEffect(() => {
        const t = setTimeout(async () => {
            if (query.trim().length < 2) { setResults([]); return; }
            setIsLoading(true);
            try {
                const res = await engineApi.searchCatalog(query.trim());
                if (res.type === 'Catalog') {
                    setResults(res.payload.items.slice(0, 8));
                } else {
                    setResults([]);
                }
            } catch {
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [query]);

    const handleResultClick = (item: MediaCard) => {
        saveRecentSearch(item);
        navigate(`/details/${item.media_type}/${item.id}`);
        onClose();
        setQuery('');
        setResults([]);
    };

    const handleRecentClick = (item: RecentSearch) => {
        navigate(`/details/${item.mediaType}/${item.id}`);
        onClose();
        setQuery('');
    };

    const handleTrendingClick = (item: MediaCard) => {
        saveRecentSearch(item);
        navigate(`/details/${item.media_type}/${item.id}`);
        onClose();
        setQuery('');
    };

    const handleClearRecent = () => {
        clearRecentSearches();
        setRecentSearches([]);
    };

    const handleSubmitSearch = async (rawQuery: string) => {
        const trimmed = rawQuery.trim();
        if (!trimmed) return;
        if (results[0]) saveRecentSearch(results[0]);
        navigate(`/search?q=${encodeURIComponent(trimmed)}`);
        onClose();
        setQuery('');
        setResults([]);
    };

    if (!isOpen) return null;

    const showDefaultContent = query.trim().length < 2 && !isLoading;
    const showIdleState = showDefaultContent && recentSearches.length === 0 && trendingItems.length === 0;

    return (
        <div className="sm-overlay" onClick={onClose}>
            <div className="sm-modal" onClick={(e) => e.stopPropagation()}>

                {/* Search bar */}
                <div className="sm-bar">
                    <div className="sm-bar-left">
                        <svg className="sm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                            <circle cx="11" cy="11" r="7" />
                            <path d="M16.5 16.5L21 21" />
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            className="sm-input"
                            placeholder="What are you in the mood for?"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && query.trim()) {
                                    e.preventDefault();
                                    handleSubmitSearch(query);
                                }
                            }}
                        />
                    </div>
                    <div className="sm-bar-right">
                        <button className="sm-close" onClick={onClose}>
                            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M1 1l10 10M11 1L1 11" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="sm-scroll-container">
                    <div className="sm-scroll-content">

                        {isLoading && (
                            <div className="sm-loading">
                                <div className="sm-spinner" />
                            </div>
                        )}

                        {!isLoading && results.length > 0 && (
                            <div className="sm-results">
                                {results.map(item => (
                                    <div
                                        key={`${item.id}-${item.media_type}`}
                                        className="sm-result-item"
                                        onClick={() => handleResultClick(item)}
                                    >
                                        <img
                                            src={item.poster_path ?? ''}
                                            alt={item.title}
                                            className="sm-result-poster"
                                        />
                                        <div className="sm-result-info">
                                            <span className="sm-result-title">{item.title}</span>
                                            <span className="sm-result-type">
                                                {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
                                            </span>
                                        </div>
                                        <svg className="sm-result-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                            <path d="M9 18l6-6-6-6" />
                                        </svg>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!isLoading && query.length >= 2 && results.length === 0 && (
                            <div className="sm-no-results">
                                No results for <em>"{query}"</em>
                            </div>
                        )}

                        {showDefaultContent && (
                            <div className="sm-default">
                                <div className="sm-two-col">

                                    {trendingItems.length > 0 && (
                                        <div className="sm-col-left">
                                            <div className="sm-section-label">Trending Now</div>
                                            <div
                                                className="sm-featured"
                                                onClick={() => handleTrendingClick(trendingItems[0])}
                                            >
                                                <img
                                                    src={trendingItems[0].backdrop_path ?? trendingItems[0].poster_path ?? ''}
                                                    alt={trendingItems[0].title}
                                                    className="sm-featured-img"
                                                />
                                                <div className="sm-featured-overlay" />
                                                <div className="sm-featured-rank">1</div>
                                                <div className="sm-featured-info">
                                                    <span className="sm-featured-title">{trendingItems[0].title}</span>
                                                    <div className="sm-featured-meta">
                                                        <span className="sm-featured-star">★</span>
                                                        <span>{trendingItems[0].rating?.toFixed(1) ?? 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <div className="sm-featured-bar" />
                                            </div>

                                            <div className="sm-small-grid">
                                                {trendingItems.slice(1).map((item, i) => (
                                                    <div
                                                        key={item.id}
                                                        className="sm-small-card"
                                                        onClick={() => handleTrendingClick(item)}
                                                    >
                                                        <img
                                                            src={item.poster_path ?? ''}
                                                            alt={item.title}
                                                            className="sm-small-img"
                                                        />
                                                        <div className="sm-small-overlay" />
                                                        <span className="sm-small-rank">{i + 2}</span>
                                                        <span className="sm-small-title">{item.title}</span>
                                                        <div className="sm-card-line" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="sm-col-right">
                                        {recentSearches.length > 0 && (
                                            <div className="sm-right-section">
                                                <div className="sm-right-header">
                                                    <span className="sm-section-label">Recent</span>
                                                    <button className="sm-clear-btn" onClick={handleClearRecent}>Clear</button>
                                                </div>
                                                <div className="sm-recent-grid">
                                                    {recentSearches.slice(0, 8).map(item => (
                                                        <button
                                                            key={`recent-${item.id}-${item.mediaType}`}
                                                            className="sm-recent-poster-card"
                                                            onClick={() => handleRecentClick(item)}
                                                            type="button"
                                                            aria-label={item.title}
                                                            title={item.title}
                                                        >
                                                            <img
                                                                src={item.posterPath ?? ''}
                                                                alt={item.title}
                                                                className="sm-recent-poster"
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {showIdleState && (
                                            <div className="sm-right-section">
                                                <span className="sm-section-label">Try Searching</span>
                                                <div className="sm-suggestions">
                                                    {['Interstellar', 'Breaking Bad', 'The Dark Knight', 'Stranger Things', 'Inception'].map(s => (
                                                        <span key={s} className="sm-suggestion" onClick={() => setQuery(s)}>
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="sm-footer-credit-only">Powered by TMDB</div>
            </div>
        </div>
    );
}
