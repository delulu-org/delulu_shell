import React from 'react';
import './CardBookmarkBtn.css';

interface CardBookmarkBtnProps {
    isActive?: boolean;
    onClick: (e: React.MouseEvent) => void;
    className?: string;
}

export const CardBookmarkBtn: React.FC<CardBookmarkBtnProps> = ({
    isActive = false,
    onClick,
    className = '',
}) => {
    return (
        <button
            className={`card-action-btn ${isActive ? 'active-watchlist' : ''} ${className}`}
            onClick={onClick}
            title={isActive ? 'Remove from Watchlist' : 'Add to Watchlist'}
            aria-label={isActive ? 'Remove from Watchlist' : 'Add to Watchlist'}
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
        </button>
    );
};
