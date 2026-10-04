import React from 'react';
import './DetailTrailerBtn.css';

interface DetailTrailerBtnProps {
    onClick?: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
}

export const DetailTrailerBtn: React.FC<DetailTrailerBtnProps> = ({
    onClick,
    isLoading = false,
    disabled = false,
    className = '',
}) => {
    return (
        <button
            className={`detail-trailer-btn ${className}`}
            onClick={onClick}
            disabled={disabled || isLoading}
            title="Watch Trailer"
            aria-label="Watch Trailer"
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>{isLoading ? 'Loading...' : 'Trailer'}</span>
        </button>
    );
};
