import React from 'react';

interface SearchButtonProps {
    onClick?: () => void;
    className?: string;
}

export const SearchButton: React.FC<SearchButtonProps> = ({ onClick, className = '' }) => {
    return (
        <button
            className={`navbar-icon-btn ${className}`}
            onClick={onClick}
            aria-label="Search"
            type="button"
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
            </svg>
        </button>
    );
};
