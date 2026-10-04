import type { MediaCard } from '../../../../api/types';
import type { MouseEvent } from 'react';
import './DiscoverCard.css';

interface DiscoverCardProps {
    item: MediaCard;
    onClick: (id: number) => void;
    onMouseEnter: (item: MediaCard, event: MouseEvent<HTMLButtonElement>) => void;
    onMouseLeave: () => void;
}

export function DiscoverCard({ item, onClick, onMouseEnter, onMouseLeave }: DiscoverCardProps) {
    return (
        <button
            className="discover-card"
            onClick={() => onClick(item.id)}
            onMouseEnter={(e) => onMouseEnter(item, e)}
            onMouseLeave={onMouseLeave}
            aria-label={`Open ${item.title}`}
        >
            {item.poster_path && (
                <img
                    className="discover-card__img"
                    src={item.poster_path}
                    alt={item.title}
                    loading="lazy"
                />
            )}
        </button>
    );
}
