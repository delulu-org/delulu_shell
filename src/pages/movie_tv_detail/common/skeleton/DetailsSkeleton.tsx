import React from 'react';
import './DetailsSkeleton.css';

interface DetailsSkeletonProps {
    isTv?: boolean;
}

export const DetailsSkeleton: React.FC<DetailsSkeletonProps> = ({ isTv = false }) => {
    return (
        <div className="details-skeleton-page" aria-busy="true" aria-label="Loading title details">
            {/* Ambient Fixed Backdrop & Gradient Overlay (1:1 with HeroBackdrop) */}
            <div className="details-skel-backdrop" aria-hidden="true" />
            <div className="details-skel-gradient" aria-hidden="true" />

            {/* 2-Column Hero Grid (1:1 with DetailHero .details-content) */}
            <div className="details-skel-content">
                {/* Left Column: Floating Poster */}
                <div className="details-skel-poster-wrapper">
                    <div className="details-skel-item details-skel-poster" />
                </div>

                {/* Right Column: Hero Info */}
                <div className="details-skel-info">
                    {/* Title / Logo */}
                    <div className="details-skel-item details-skel-logo" />

                    {/* Metadata Row: TMDb, IMDb, Year, Runtime, Seasons */}
                    <div className="details-skel-meta">
                        <div className="details-skel-item details-skel-pill" style={{ width: '58px' }} />
                        <div className="details-skel-item details-skel-pill" style={{ width: '54px' }} />
                        <div className="details-skel-item details-skel-pill" style={{ width: '46px' }} />
                        <div className="details-skel-item details-skel-pill" style={{ width: '64px' }} />
                        {isTv && (
                            <div className="details-skel-item details-skel-pill" style={{ width: '78px' }} />
                        )}
                    </div>

                    {/* Genres Row */}
                    <div className="details-skel-genres">
                        <div className="details-skel-item details-skel-genre-tag" style={{ width: '74px' }} />
                        <div className="details-skel-item details-skel-genre-tag" style={{ width: '92px' }} />
                        <div className="details-skel-item details-skel-genre-tag" style={{ width: '66px' }} />
                    </div>

                    {/* Tagline */}
                    <div className="details-skel-item details-skel-tagline" />

                    {/* Overview Paragraph */}
                    <div className="details-skel-overview-wrap">
                        <div className="details-skel-item details-skel-line" style={{ width: '96%' }} />
                        <div className="details-skel-item details-skel-line" style={{ width: '90%' }} />
                        <div className="details-skel-item details-skel-line" style={{ width: '84%' }} />
                        <div className="details-skel-item details-skel-line" style={{ width: '48%' }} />
                    </div>

                    {/* Action Buttons: Play, Streams, Trailer, Watchlist, Favorites */}
                    <div className="details-skel-actions">
                        <div className="details-skel-item details-skel-btn" style={{ width: '124px' }} />
                        <div className="details-skel-item details-skel-btn" style={{ width: '132px' }} />
                        <div className="details-skel-item details-skel-btn" style={{ width: '118px' }} />
                        <div className="details-skel-item details-skel-btn-circle" />
                        <div className="details-skel-item details-skel-btn-circle" />
                    </div>

                    {/* Cast Row: Exact 7-Item Bounded Viewport (672px) with Edge Shadows */}
                    <div className="details-skel-cast">
                        <div className="details-skel-item details-skel-cast-heading" />
                        <div className="details-skel-cast-viewport">
                            <div className="details-skel-cast-edge details-skel-cast-edge-left" aria-hidden="true" />
                            <div className="details-skel-cast-list">
                                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="details-skel-cast-item">
                                        <div className="details-skel-item details-skel-cast-avatar" />
                                        <div className="details-skel-item details-skel-cast-name" />
                                    </div>
                                ))}
                            </div>
                            <div className="details-skel-cast-edge details-skel-cast-edge-right" aria-hidden="true" />
                        </div>
                    </div>

                    {/* TV Episodes Section (if TV show) */}
                    {isTv && (
                        <div className="details-skel-episodes">
                            <div className="details-skel-item details-skel-season-dropdown" />
                            <div className="details-skel-episodes-list">
                                {[0, 1].map((idx) => (
                                    <div key={idx} className="details-skel-episode-card">
                                        <div className="details-skel-item details-skel-episode-thumb" />
                                        <div className="details-skel-episode-info">
                                            <div className="details-skel-item details-skel-episode-title" />
                                            <div className="details-skel-item details-skel-episode-meta" />
                                            <div className="details-skel-item details-skel-episode-desc" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
