import React from 'react';
import './CardFavoriteBtn.css';

interface CardFavoriteBtnProps {
    isActive?: boolean;
    onClick: (e: React.MouseEvent) => void;
    className?: string;
}

export const CardFavoriteBtn: React.FC<CardFavoriteBtnProps> = ({
    isActive = false,
    onClick,
    className = '',
}) => {
    return (
        <button
            className={`card-action-btn ${isActive ? 'active-favorites' : ''} ${className}`}
            onClick={onClick}
            title={isActive ? 'Remove from Favorites' : 'Add to Favorites'}
            aria-label={isActive ? 'Remove from Favorites' : 'Add to Favorites'}
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
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
        </button>
    );
};
