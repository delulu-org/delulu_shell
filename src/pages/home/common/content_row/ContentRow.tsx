import { useRef, useState, useLayoutEffect, useCallback } from 'react';
import type { MediaCard } from '../../../../api/types';
import { ContentCard } from '../../../../common_comps/cards';
import { getHorizontalScroll, setHorizontalScroll } from '../../../../utils/scrollRegistry';
import './ContentRow.css';

export interface ContentRowProps {
    title: string;
    label?: string;
    items: MediaCard[];
    icon?: string;
    isLoading?: boolean;
}

export function ContentRow({
    title,
    label,
    items,
    icon,
    isLoading = false,
}: ContentRowProps) {
    const rowKey = `content_row:${label || ''}:${title}`;
    const scrollRef = useRef<HTMLDivElement>(null);
    const isRestoringRef = useRef(false);
    const [canScroll, setCanScroll] = useState(false);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const updateArrows = useCallback((scrollLeft: number, scrollWidth: number, clientWidth: number) => {
        const hasOverflow = scrollWidth - clientWidth > 15;
        setCanScroll(hasOverflow);
        setShowLeftArrow(hasOverflow && scrollLeft > 15);
        setShowRightArrow(hasOverflow && scrollLeft < scrollWidth - clientWidth - 15);
    }, []);

    const handleScroll = () => {
        if (!scrollRef.current || isRestoringRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setHorizontalScroll(rowKey, scrollLeft);
        updateArrows(scrollLeft, scrollWidth, clientWidth);
    };

    useLayoutEffect(() => {
        const container = scrollRef.current;
        if (!container || isLoading || items.length === 0) return;

        const savedLeft = getHorizontalScroll(rowKey);
        if (savedLeft > 0) {
            isRestoringRef.current = true;
            container.scrollLeft = savedLeft;

            // In case container layout/scrollWidth needs a frame to compute
            if (container.scrollLeft < savedLeft) {
                requestAnimationFrame(() => {
                    if (scrollRef.current) {
                        scrollRef.current.scrollLeft = savedLeft;
                        updateArrows(
                            scrollRef.current.scrollLeft,
                            scrollRef.current.scrollWidth,
                            scrollRef.current.clientWidth
                        );
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
        updateArrows(container.scrollLeft, container.scrollWidth, container.clientWidth);

        const ro = new ResizeObserver(() => {
            if (scrollRef.current) {
                updateArrows(
                    scrollRef.current.scrollLeft,
                    scrollRef.current.scrollWidth,
                    scrollRef.current.clientWidth
                );
            }
        });
        ro.observe(container);

        return () => ro.disconnect();
    }, [rowKey, isLoading, items, updateArrows]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const container = scrollRef.current;
        const scrollAmount = container.clientWidth * 0.8;
        const rawTarget = direction === 'left'
            ? container.scrollLeft - scrollAmount
            : container.scrollLeft + scrollAmount;
        const maxScrollLeft = Math.max(container.scrollWidth - container.clientWidth, 0);
        const target = Math.max(0, Math.min(rawTarget, maxScrollLeft));

        container.scrollTo({
            left: target,
            behavior: 'smooth',
        });
    };

    if (isLoading) {
        return (
            <section className="home-section">
                <div className="home-section-header">
                    {label && <div className="home-section-label">{label}</div>}
                    <h2 className="home-section-title">
                        {icon && <span className="content-row-icon">{icon}</span>}
                        {title}
                    </h2>
                    <div className="home-section-rule" />
                </div>
                <div className="content-row">
                    <div className="content-row-items">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="skeleton skeleton-card content-card-medium" />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (!isLoading && items.length === 0) return null;

    return (
        <section className="home-section">
            {/* Section editorial header */}
            <div className="home-section-header">
                {label && <div className="home-section-label">{label}</div>}
                <h2 className="home-section-title">
                    {icon && <span className="content-row-icon">{icon}</span>}
                    {title}
                </h2>
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

                {/* Content items */}
                <div
                    ref={scrollRef}
                    className="content-row-items"
                    onScroll={handleScroll}
                >
                    {items.map((item) => (
                        <ContentCard key={`${item.media_type}-${item.id}`} item={item} />
                    ))}
                </div>
            </div>
        </section>
    );
}
