import type { MediaCard } from '../../../api/types';
import { Top3Card } from './Top3Card';
import './WhatsBurning.css';

interface WhatsBurningProps {
    items: MediaCard[];
    onNavigate: (type: 'movie' | 'tv', id: number) => void;
    isLoading?: boolean;
}

export function WhatsBurning({ items, onNavigate, isLoading = false }: WhatsBurningProps) {
    if (isLoading) {
        return (
            <section className="home-section top3-section">
                <div className="home-section-header">
                    <div className="home-section-label">Right Now</div>
                    <h2 className="home-section-title">What's Burning</h2>
                    <div className="home-section-rule" />
                </div>
                <div className="top3-grid">
                    {[1, 2, 3].map((num) => (
                        <div key={num} className="top3-card top3-skeleton-card">
                            <span className="top3-rank-bg">{num}</span>
                            <div className="top3-media skeleton" />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    const topThree = items.slice(0, 3);
    if (topThree.length === 0) return null;

    return (
        <section className="home-section top3-section">
            <div className="home-section-header">
                <div className="home-section-label">Right Now</div>
                <h2 className="home-section-title">What's Burning</h2>
                <div className="home-section-rule" />
            </div>
            <div className="top3-grid">
                {topThree.map((item, index) => (
                    <Top3Card
                        key={`${item.media_type}-${item.id}`}
                        item={item}
                        index={index}
                        onNavigate={onNavigate}
                    />
                ))}
            </div>
        </section>
    );
}
