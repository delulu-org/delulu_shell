import React from 'react';
import './BackButton.css';

interface BackButtonProps {
    onClick: () => void;
    className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ onClick, className = '' }) => {
    return (
        <button
            className={`details-back-btn ${className}`}
            onClick={onClick}
            aria-label="Go back"
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M15 18l-6-6 6-6" />
            </svg>
        </button>
    );
};
