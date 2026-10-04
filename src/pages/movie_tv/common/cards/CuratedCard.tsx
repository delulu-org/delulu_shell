import type { MediaCard } from '../../../../api/types';
import './CuratedCard.css';

interface CuratedCardProps {
    item: MediaCard;
    rowLabel: string;
    rowReason: string;
    onClick: (id: number) => void;
}

export function CuratedCard({ item, rowLabel, rowReason, onClick }: CuratedCardProps) {
    return (
        <button
            className="curated-card"
            onClick={() => onClick(item.id)}
            aria-label={`Open ${item.title}`}
        >
            {item.poster_path && (
                <img
                    className="curated-card__img"
                    src={item.poster_path}
                    alt={item.title}
                    loading="lazy"
                />
            )}
            <div className="curated-card__meta">
                <strong>{item.title}</strong>
                {item.rating != null && <span>{item.rating.toFixed(1)} rating</span>}
                <span>{rowLabel}</span>
                <span>{rowReason}</span>
            </div>
        </button>
    );
}
