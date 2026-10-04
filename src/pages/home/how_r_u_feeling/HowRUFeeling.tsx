import { useState, useMemo } from 'react';
import type { MediaCard } from '../../../api/types';
import './HowRUFeeling.css';

interface HowRUFeelingProps {
    items: MediaCard[];
    onNavigate: (type: 'movie' | 'tv', id: number) => void;
}

const moodChips = ['Midnight Tension', 'Slow Burn', 'Cerebral', 'Pulse-Heavy', 'Lonely Nights', 'Cathartic'];

const moodWords: Record<string, string[]> = {
    'Midnight Tension': ['night', 'dark', 'danger', 'chase', 'crime', 'killer'],
    'Slow Burn': ['journey', 'quiet', 'family', 'memory', 'drama', 'life'],
    'Cerebral': ['mind', 'future', 'space', 'science', 'mystery', 'theory'],
    'Pulse-Heavy': ['battle', 'war', 'survival', 'mission', 'fight', 'revenge'],
    'Lonely Nights': ['lonely', 'lost', 'alone', 'heart', 'friendship', 'city'],
    'Cathartic': ['healing', 'hope', 'redemption', 'dream', 'spirit', 'home'],
};

let savedSelectedMood = moodChips[0];

export function HowRUFeeling({ items, onNavigate }: HowRUFeelingProps) {
    const [selectedMood, setSelectedMood] = useState(() => savedSelectedMood);

    const handleSelectMood = (chip: string) => {
        savedSelectedMood = chip;
        setSelectedMood(chip);
    };

    const moodGrid = useMemo(() => {
        const words = moodWords[selectedMood] ?? [];
        const scored = items
            .filter(item => item.poster_path)
            .map(item => {
                const text = `${item.title} ${item.overview ?? ''}`.toLowerCase();
                const wordScore = words.reduce((s, w) => s + (text.includes(w) ? 1 : 0), 0);
                const ratingBoost = Math.min(2, Math.max(0, (item.rating ?? 0) / 5));
                return { item, score: wordScore + ratingBoost };
            })
            .sort((a, b) => b.score - a.score)
            .map(e => e.item);
        return scored.slice(0, 4);
    }, [items, selectedMood]);

    if (moodGrid.length === 0) return null;

    return (
        <section className="home-section mood-section">
            <div className="home-section-header">
                <div className="home-section-label">Browse by Mood</div>
                <h2 className="home-section-title">How Are You Feeling?</h2>
                <div className="home-section-rule" />
            </div>

            <div className="mood-chip-row">
                {moodChips.map(chip => (
                    <button
                        key={chip}
                        type="button"
                        className={`mood-chip ${chip === selectedMood ? 'active' : ''}`}
                        onClick={() => handleSelectMood(chip)}
                        aria-pressed={chip === selectedMood}
                    >
                        {chip}
                    </button>
                ))}
            </div>

            <div className="mood-editorial-grid">
                {moodGrid.map((item, index) => (
                    <button
                        key={`mood-${item.media_type}-${item.id}`}
                        type="button"
                        className="mood-editorial-item"
                        onClick={() => onNavigate(item.media_type as 'movie' | 'tv', item.id)}
                    >
                        <span className="mood-item-rank">{index + 1}</span>
                        <img
                            className="mood-item-poster"
                            src={item.poster_path ?? ''}
                            alt={item.title}
                            loading="lazy"
                        />
                        <span className="mood-item-info">
                            <span className="mood-item-title">{item.title}</span>
                            <span className="mood-item-meta">
                                {item.media_type.toUpperCase()} · {item.release_year ?? ''} · ★ {item.rating?.toFixed(1) ?? 'N/A'}
                            </span>
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}
