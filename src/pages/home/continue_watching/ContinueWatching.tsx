import { useRef, useState, useCallback, useLayoutEffect } from 'react';
import { X } from 'lucide-react';
import type { MediaCard } from '../../../api/types';
import { getHorizontalScroll, setHorizontalScroll } from '../../../utils/scrollRegistry';
import '../common/content_row/ContentRow.css';
import './ContinueWatching.css';

interface ContinueWatchingProps {
    items: MediaCard[];
    onResume: (item: MediaCard) => void;
    onDelete: (e: React.MouseEvent, item: MediaCard) => void;
}

export function ContinueWatching({ items, onResume, onDelete }: ContinueWatchingProps) {
    const rowKey = 'row:ContinueWatching';
    const scrollRef = useRef<HTMLDivElement>(null);
    const isRestoringRef = useRef(false);
    const [canScroll, setCanScroll] = useState(false);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const updateNavState = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (!isRestoringRef.current) {
            setHorizontalScroll(rowKey, scrollLeft);
        }
        const hasOverflow = scrollWidth - clientWidth > 15;
        setCanScroll(hasOverflow);
        setShowLeftArrow(hasOverflow && scrollLeft > 15);
        setShowRightArrow(hasOverflow && scrollLeft < scrollWidth - clientWidth - 15);
    }, []);

    useLayoutEffect(() => {
        const container = scrollRef.current;
        if (!container || !items || items.length === 0) return;
        const savedLeft = getHorizontalScroll(rowKey);
        if (savedLeft > 0) {
            isRestoringRef.current = true;
            container.scrollLeft = savedLeft;

            if (container.scrollLeft < savedLeft) {
                requestAnimationFrame(() => {
                    if (scrollRef.current) {
                        scrollRef.current.scrollLeft = savedLeft;
                        updateNavState();
                    }
                    requestAnimationFrame(() => {
                        isRestoringRef.current = false;
                    });
                });
            } else {
                requestAnimationFrame(() => {
                    isRestoringRef.current = false;
                });
            }
        }
        updateNavState();

        const ro = new ResizeObserver(() => {
            updateNavState();
        });
        ro.observe(container);

        return () => ro.disconnect();
    }, [items, updateNavState]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const container = scrollRef.current;
        const scrollAmount = container.clientWidth * 0.8;
        const target = direction === 'left'
            ? container.scrollLeft - scrollAmount
            : container.scrollLeft + scrollAmount;
        container.scrollTo({ left: target, behavior: 'smooth' });
    };

    if (!items || items.length === 0) return null;

    return (
        <section className="home-section continue-watching-section">
            <div className="home-section-header">
                <div className="home-section-label">Resume</div>
                <h2 className="home-section-title">Continue Watching</h2>
                <div className="home-section-rule" />
            </div>

            <div className="content-row">
                {/* Navigation buttons: only shown when items overflow container */}
                {canScroll && (
                    <div className="content-row-header content-row-header-nav-only">
                        <div className="content-row-nav">
                            <button
                                className={`content-row-nav-btn ${!showLeftArrow ? 'disabled' : ''}`}
                                onClick={() => scroll('left')}
                                disabled={!showLeftArrow}
                                aria-label="Scroll left"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 18l-6-6 6-6" />
                                </svg>
                            </button>
                            <button
                                className={`content-row-nav-btn ${!showRightArrow ? 'disabled' : ''}`}
                                onClick={() => scroll('right')}
                                disabled={!showRightArrow}
                                aria-label="Scroll right"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                <div ref={scrollRef} className="content-row-items continue-watching-row" onScroll={updateNavState}>
                {items.map(item => (
                    <div
                        key={`${item.media_type}-${item.id}`}
                        className="continue-watching-item"
                        onClick={() => onResume(item)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && onResume(item)}
                    >
                        <img src={item.poster_path ?? ''} alt={item.title} loading="lazy" />
                        <button
                            className="continue-watching-item-remove"
                            onClick={e => onDelete(e, item)}
                            aria-label="Remove from continue watching"
                        >
                            <X size={14} strokeWidth={2.5} />
                        </button>
                        <div className="continue-watching-overlay">
                            <span className="continue-watching-title">{item.title}</span>
                            <span className="continue-watching-meta">
                                {item.media_type === 'tv' ? 'Continue Watching' : item.release_year ?? ''}
                            </span>
                        </div>
                        {/* Progress bar populated by delulu_core later */}
                        <div className="continue-watching-progress">
                            <div className="continue-watching-progress-fill" style={{ width: '0%' }} />
                        </div>
                    </div>
                ))}
            </div>
            </div>
        </section>
    );
}
