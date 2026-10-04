import { useState, useEffect } from 'react';
import { engineApi } from '../../../api/engine';
import type { MediaCard } from '../../../api/types';
import { MediaLogo } from '../../../common_comps';
import './Top3Card.css';

// In-memory logo cache
const logoCache = new Map<number, string>();

interface Top3CardProps {
    item: MediaCard;
    index: number;
    onNavigate: (type: 'movie' | 'tv', id: number) => void;
}

export function Top3Card({ item, index, onNavigate }: Top3CardProps) {
    const [logo, setLogo] = useState<string | null>(item.logo_url ?? logoCache.get(item.id) ?? null);

    useEffect(() => {
        if (item.logo_url) {
            setLogo(item.logo_url);
            logoCache.set(item.id, item.logo_url);
            return;
        }
        if (logo) return;
        let active = true;
        (async () => {
            try {
                const res = await engineApi.getHeroMeta(item.id, item.media_type as 'movie' | 'tv');
                if (!active) return;
                if (res?.logo_url) {
                    logoCache.set(item.id, res.logo_url);
                    setLogo(res.logo_url);
                }
            } catch { /* not available */ }
        })();
        return () => { active = false; };
    }, [item.id, item.media_type, item.logo_url]);

    const backdrop = item.backdrop_path ?? item.poster_path ?? '';
    const ratingText = item.rating != null && Number.isFinite(item.rating) && item.rating > 0
        ? ` · ★ ${item.rating.toFixed(1)}` : '';

    return (
        <button
            className="top3-card"
            onClick={() => onNavigate(item.media_type as 'movie' | 'tv', item.id)}
            aria-label={`Open ${item.title}`}
        >
            <span className="top3-rank-bg" aria-hidden="true">{index + 1}</span>
            <div className="top3-media">
                <img className="top3-poster" src={backdrop} alt={item.title} loading="lazy" />
                <div className="top3-overlay" />
                <div className="top3-meta">
                    <MediaLogo
                        src={item.logo_url ?? logoCache.get(item.id) ?? logo}
                        title={item.title}
                        size="card"
                    />
                    <span className="top3-subtitle">
                        {item.media_type.toUpperCase()}{item.release_year ? ` · ${item.release_year}` : ''}{ratingText}
                    </span>
                </div>
                <span className="top3-chip">Top Pick</span>
            </div>
        </button>
    );
}
