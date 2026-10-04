import { useRef, useEffect, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { DiscoverCard } from '../cards/DiscoverCard';
import { HoverPreview } from '../cards/HoverPreview';
import type { MediaCard } from '../../../../api/types';
import './DiscoverGrid.css';

interface HoverPos {
    x: number;
    y: number;
    placement: 'above' | 'below';
}

interface DiscoverGridProps {
    items: MediaCard[];
    mediaType: 'movie' | 'tv';
    hasMore: boolean;
    isLoadingMore: boolean;
    loadError: string;
    endcapLabel: string;
    onLoadMore: () => void;
}

export function DiscoverGrid({
    items,
    mediaType,
    hasMore,
    isLoadingMore,
    loadError,
    endcapLabel,
    onLoadMore,
}: DiscoverGridProps) {
    const navigate = useNavigate();
    const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [hoverItem, setHoverItem] = useState<MediaCard | null>(null);
    const [hoverPos, setHoverPos] = useState<HoverPos>({ x: 0, y: 0, placement: 'above' });

    // Intersection observer for infinite scroll
    useEffect(() => {
        const trigger = loadMoreTriggerRef.current;
        if (!trigger || isLoadingMore || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    observer.disconnect();
                    onLoadMore();
                }
            },
            { root: null, rootMargin: '0px 0px 80px 0px', threshold: 0.15 }
        );

        observer.observe(trigger);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, onLoadMore]);

    // Hide preview on scroll
    useEffect(() => {
        const hide = () => setHoverItem(null);
        window.addEventListener('scroll', hide, { passive: true });
        return () => {
            window.removeEventListener('scroll', hide);
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        };
    }, []);

    const clearHoverTimer = () => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
    };

    const handleMouseEnter = (item: MediaCard, event: MouseEvent<HTMLButtonElement>) => {
        clearHoverTimer();
        const rect = event.currentTarget.getBoundingClientRect();
        const vpW = window.innerWidth;
        const vpH = window.innerHeight;
        const popupW = Math.min(380, vpW - 32);
        const centeredX = rect.left + rect.width / 2;
        const x = Math.min(Math.max(centeredX, 16 + popupW / 2), vpW - 16 - popupW / 2);
        const estimatedH = 200;
        const canAbove = rect.top - estimatedH - 24 > 0;
        const placement: 'above' | 'below' = canAbove ? 'above' : 'below';
        const y = placement === 'above'
            ? Math.max(rect.top - 10, estimatedH + 20)
            : Math.min(rect.bottom + 10, vpH - estimatedH - 24);

        hoverTimerRef.current = setTimeout(() => {
            setHoverPos({ x, y, placement });
            setHoverItem(item);
        }, 1000);
    };

    const handleMouseLeave = () => {
        clearHoverTimer();
        setHoverItem(null);
    };

    const openDetails = (id: number) => {
        navigate(`/details/${mediaType}/${id}`);
    };

    return (
        <section className="discover-grid-section">
            <h2>Discover More</h2>
            <div className="discover-grid">
                {items.map((item) => (
                    <DiscoverCard
                        key={item.id}
                        item={item}
                        onClick={openDetails}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    />
                ))}
            </div>

            <div ref={loadMoreTriggerRef} className="discover-grid__scroll-trigger" />

            <div className="discover-grid__loading-slot">
                {isLoadingMore && (
                    <div className="discover-grid__loading-more" role="status" aria-live="polite">
                        <span>Loading more...</span>
                    </div>
                )}
            </div>

            {loadError && !isLoadingMore && hasMore && (
                <div className="discover-grid__error">
                    <span>{loadError}</span>
                    <button type="button" onClick={onLoadMore}>Retry</button>
                </div>
            )}

            {!hasMore && items.length > 0 && (
                <p className="discover-grid__endcap">{endcapLabel}</p>
            )}

            {hoverItem && (
                <HoverPreview
                    item={hoverItem}
                    x={hoverPos.x}
                    y={hoverPos.y}
                    placement={hoverPos.placement}
                />
            )}
        </section>
    );
}
