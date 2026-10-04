import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { CastMember } from '../../../../api/types';
import './CastRow.css';

interface CastRowProps {
    cast: CastMember[];
    title?: string;
    onMemberClick?: (member: CastMember) => void;
}

export const CastRow: React.FC<CastRowProps> = ({
    cast,
    title = 'Cast',
    onMemberClick,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const listRef = useRef<HTMLDivElement | null>(null);
    const viewportRef = useRef<HTMLDivElement | null>(null);

    // Pointer gesture & click detection state
    const pointerState = useRef({
        isDown: false,
        startX: 0,
        startY: 0,
        startScrollLeft: 0,
        hasMoved: false,
        pointerId: -1,
        startTime: 0,
        lastX: 0,
        velocity: 0,
    });

    const justDraggedRef = useRef(false);

    // Check scroll boundaries for left/right soften edge shadows
    const updateScrollState = useCallback(() => {
        const list = listRef.current;
        if (!list) return;

        const { scrollLeft, scrollWidth, clientWidth } = list;
        const maxScroll = Math.max(0, scrollWidth - clientWidth);

        setCanScrollLeft(scrollLeft > 6);
        setCanScrollRight(scrollLeft < maxScroll - 6);
    }, []);

    useEffect(() => {
        updateScrollState();
        const list = listRef.current;
        if (!list) return;

        const ro = new ResizeObserver(() => {
            updateScrollState();
        });
        ro.observe(list);

        return () => ro.disconnect();
    }, [cast, updateScrollState]);

    // Pointer down handler
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        // Only accept primary button (left mouse) or touch
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        const list = listRef.current;
        if (!list) return;

        pointerState.current = {
            isDown: true,
            startX: e.clientX,
            startY: e.clientY,
            startScrollLeft: list.scrollLeft,
            hasMoved: false,
            pointerId: e.pointerId,
            startTime: Date.now(),
            lastX: e.clientX,
            velocity: 0,
        };
    };

    // Pointer move handler (drag/swipe)
    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const state = pointerState.current;
        if (!state.isDown) return;

        const list = listRef.current;
        if (!list) return;

        const deltaX = e.clientX - state.startX;
        const deltaY = e.clientY - state.startY;

        // Threshold check: distinguish subtle tap jitter from swipe
        if (!state.hasMoved) {
            if (Math.abs(deltaX) > 6) {
                state.hasMoved = true;
                setIsDragging(true);
                try {
                    (e.target as HTMLElement).setPointerCapture(state.pointerId);
                } catch {}
            } else if (Math.abs(deltaY) > 10) {
                // User is scrolling vertically, cancel horizontal swipe
                state.isDown = false;
                return;
            }
        }

        if (state.hasMoved) {
            e.preventDefault();
            list.scrollLeft = state.startScrollLeft - deltaX;
            state.velocity = e.clientX - state.lastX;
            state.lastX = e.clientX;
        }
    };

    // Pointer end handler
    const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
        const state = pointerState.current;
        if (!state.isDown) return;

        state.isDown = false;
        setIsDragging(false);

        try {
            (e.target as HTMLElement).releasePointerCapture(state.pointerId);
        } catch {}

        if (state.hasMoved) {
            justDraggedRef.current = true;
            window.setTimeout(() => {
                justDraggedRef.current = false;
            }, 100);

            // Momentum flick if released with velocity
            if (Math.abs(state.velocity) > 3 && listRef.current) {
                listRef.current.scrollBy({
                    left: -state.velocity * 8,
                    behavior: 'smooth',
                });
            }
        }
    };

    // Wheel horizontal scrolling
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        const list = listRef.current;
        if (!list) return;

        if (e.deltaX !== 0) {
            list.scrollLeft += e.deltaX;
        } else if (e.deltaY !== 0) {
            list.scrollLeft += e.deltaY;
        }
    };

    // Safe click handler: ignores clicks triggered after dragging
    const handleMemberClick = (member: CastMember) => {
        if (justDraggedRef.current || pointerState.current.hasMoved) {
            return;
        }
        onMemberClick?.(member);
    };

    const getProfileUrl = useCallback((path: string | null) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        return `https://image.tmdb.org/t/p/w185${path}`;
    }, []);

    if (!cast || cast.length === 0) return null;

    return (
        <div className="details-cast">
            <h2 className="details-cast-title">{title}</h2>

            {/* Preconfigured 7-item bounded viewport container */}
            <div className="details-cast-viewport" ref={viewportRef}>
                {/* Left soften edge shadow */}
                <div
                    className={`details-cast-edge-shadow details-cast-edge-left ${canScrollLeft ? 'visible' : ''}`}
                    aria-hidden="true"
                />

                {/* Horizontally swipeable/draggable cast list */}
                <div
                    ref={listRef}
                    className={`details-cast-list ${isDragging ? 'dragging' : ''}`}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerEnd}
                    onPointerCancel={handlePointerEnd}
                    onWheel={handleWheel}
                    onScroll={updateScrollState}
                >
                    {cast.map((member) => (
                        <div
                            key={member.id}
                            className="details-cast-member"
                            title={member.name}
                            onClick={() => handleMemberClick(member)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleMemberClick(member);
                                }
                            }}
                        >
                            {member.profile_path ? (
                                <img
                                    src={getProfileUrl(member.profile_path)}
                                    alt={member.name}
                                    className="details-cast-photo"
                                    draggable={false}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const placeholder = target.nextElementSibling;
                                        if (placeholder) placeholder.classList.remove('hidden');
                                    }}
                                />
                            ) : null}
                            <div className={`details-cast-placeholder ${member.profile_path ? 'hidden' : ''}`}>
                                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="12" cy="8" r="4" />
                                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                                </svg>
                            </div>
                            <span className="details-cast-name">{member.name}</span>
                        </div>
                    ))}
                </div>

                {/* Right soften edge shadow */}
                <div
                    className={`details-cast-edge-shadow details-cast-edge-right ${canScrollRight ? 'visible' : ''}`}
                    aria-hidden="true"
                />
            </div>
        </div>
    );
};
