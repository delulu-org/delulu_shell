import React from 'react';

interface ProfileButtonProps {
    onClick?: () => void;
    className?: string;
}

export const ProfileButton: React.FC<ProfileButtonProps> = ({ onClick, className = '' }) => {
    return (
        <button
            className={`navbar-icon-btn profile-nav-btn ${className}`}
            data-profile-btn="true"
            onClick={onClick}
            aria-label="User menu"
            type="button"
        >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
        </button>
    );
};
