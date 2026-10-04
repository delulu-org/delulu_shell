import React from 'react';
import { Play } from 'lucide-react';
import './DetailPlayBtn.css';

interface DetailPlayBtnProps {
    onClick?: () => void;
    label?: string;
    disabled?: boolean;
    title?: string;
    className?: string;
}

export const DetailPlayBtn: React.FC<DetailPlayBtnProps> = ({
    onClick,
    label = 'Play',
    disabled = false,
    title,
    className = '',
}) => {
    return (
        <button
            className={`detail-play-btn ${className}`}
            onClick={onClick}
            disabled={disabled}
            title={title}
            aria-label={label}
        >
            <Play size={18} fill="currentColor" stroke="none" />
            <span>{label}</span>
        </button>
    );
};
