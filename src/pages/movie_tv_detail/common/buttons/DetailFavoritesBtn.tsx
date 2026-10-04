import React, { useState } from 'react';
import './DetailFavoritesBtn.css';

interface DetailFavoritesBtnProps {
    initialActive?: boolean;
    onToggle?: (active: boolean) => void;
    className?: string;
}

export const DetailFavoritesBtn: React.FC<DetailFavoritesBtnProps> = ({
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
            className={`detail-favorites-btn ${isActive ? 'is-active' : ''} ${className}`}
            onClick={handleClick}
            aria-label={isActive ? 'Remove from Favorites' : 'Add to Favorites'}
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={isActive ? '#e50914' : 'none'}
                stroke={isActive ? '#e50914' : 'currentColor'}
                strokeWidth="2"
            >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
        </button>
    );
};
