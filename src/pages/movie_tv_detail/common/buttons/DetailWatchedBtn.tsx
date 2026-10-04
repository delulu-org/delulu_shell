import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './DetailWatchedBtn.css';

interface DetailWatchedBtnProps {
    initialActive?: boolean;
    onToggle?: (active: boolean) => void;
    className?: string;
    title?: string;
}

export const DetailWatchedBtn: React.FC<DetailWatchedBtnProps> = ({
    initialActive = false,
    onToggle,
    className = '',
    title,
}) => {
    const [isActive, setIsActive] = useState(initialActive);

    const handleClick = () => {
        const next = !isActive;
        setIsActive(next);
        onToggle?.(next);
    };

    const tooltip = title || (isActive ? 'Mark as unwatched' : 'Mark as watched');

    return (
        <button
            type="button"
            className={`detail-watched-btn ${isActive ? 'is-active' : ''} ${className}`}
            onClick={handleClick}
            title={tooltip}
            aria-label={tooltip}
            aria-pressed={isActive}
        >
            {isActive ? (
                <EyeOff size={20} strokeWidth={2} />
            ) : (
                <Eye size={20} strokeWidth={2} />
            )}
        </button>
    );
};
