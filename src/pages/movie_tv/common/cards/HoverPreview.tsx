import type { MediaCard } from '../../../../api/types';
import './HoverPreview.css';

interface HoverPreviewProps {
    item: MediaCard;
    x: number;
    y: number;
    placement: 'above' | 'below';
}

function getOverviewSnippet(overview: string | null): string {
    const text = overview?.trim();
    if (!text) return 'No synopsis available.';
    if (text.length <= 180) return text;
    return `${text.slice(0, 177)}...`;
}

export function HoverPreview({ item, x, y, placement }: HoverPreviewProps) {
    const year = item.release_year || 'N/A';
    const rating = item.rating != null ? `${item.rating.toFixed(1)} rating` : 'N/A';
    const typeLabel = item.media_type === 'tv' ? 'Series' : 'Movie';

    return (
        <div
            className={`hover-preview${placement === 'below' ? ' hover-preview--below' : ''}`}
            style={{ left: x, top: y }}
            role="tooltip"
        >
            <h3 className="hover-preview__title">{item.title}</h3>
            <div className="hover-preview__meta">
                <span>{year}</span>
                <span>{rating}</span>
                <span>{typeLabel}</span>
            </div>
            <p className="hover-preview__overview">{getOverviewSnippet(item.overview ?? null)}</p>
        </div>
    );
}
