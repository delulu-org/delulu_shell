import React, { useState } from 'react';
import './DetailWatchlistBtn.css';

interface DetailWatchlistBtnProps {
    initialActive?: boolean;
    onToggle?: (active: boolean) => void;
    className?: string;
}

export const DetailWatchlistBtn: React.FC<DetailWatchlistBtnProps> = ({
    initialActive = false,
    onToggle,
    className = '',
}) => {
    const [isActive, setIsActive] = useState(initialActive);

    const handleClick = () => {
        const next = !isActive;
        setIsActive(next);
        onToggle?.(next);
    };

    return (
        <button
            className={`detail-watchlist-btn ${isActive ? 'is-active' : ''} ${className}`}
            onClick={handleClick}
            aria-label={isActive ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
            {isActive ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                </svg>
            )}
            <span>{isActive ? 'In Watchlist' : 'Watch List'}</span>
        </button>
    );
};
