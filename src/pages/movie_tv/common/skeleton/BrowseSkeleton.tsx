import '../featured/Featured.css';
import '../curated_rows/CuratedRows.css';
import '../cards/CuratedCard.css';
import '../discover_grid/DiscoverGrid.css';
import '../cards/DiscoverCard.css';
import './BrowseSkeleton.css';

interface BrowseSkeletonProps {
    isTv?: boolean;
}

export function BrowseSkeleton({ isTv: _isTv = false }: BrowseSkeletonProps) {
    return (
        <div
            className="browse-page page browse-skeleton-page"
            aria-busy="true"
            aria-label="Loading catalog"
        >
            {/* 1. Featured Section — Clean 1:1 match to Featured component (No Kicker, Image Backdrop, No Video/Play icon, No colors) */}
            <section className="movies-cinema-featured movies-cinema-featured-skeleton" aria-hidden="true">
                <div className="movies-cinema-featured-info">
                    {/* Title Skeleton */}
                    <div className="skeleton cinema-skel-title" />

                    {/* 4-line overview paragraph snippet */}
                    <div className="cinema-skel-overview">
                        <div className="skeleton cinema-skel-line" style={{ width: '96%' }} />
                        <div className="skeleton cinema-skel-line" style={{ width: '88%' }} />
                        <div className="skeleton cinema-skel-line" style={{ width: '92%' }} />
                        <div className="skeleton cinema-skel-line" style={{ width: '58%' }} />
                    </div>

                    {/* Meta tag pills */}
                    <div className="movies-cinema-featured-meta">
                        <span className="skeleton cinema-skel-meta-pill" style={{ width: '56px' }} />
                        <span className="skeleton cinema-skel-meta-pill" style={{ width: '84px' }} />
                        <span className="skeleton cinema-skel-meta-pill" style={{ width: '60px' }} />
                    </div>

                    {/* Normal Skeleton Action buttons */}
                    <div className="movies-cinema-featured-actions">
                        <div className="skeleton cinema-skel-btn" style={{ width: '136px' }} />
                        <div className="skeleton cinema-skel-btn" style={{ width: '124px' }} />
                    </div>
                </div>

                {/* Canvas — 16:9 Image Backdrop Silhouette (NO play icon, pure backdrop image canvas) */}
                <div className="movies-cinema-featured-canvas movies-cinema-featured-canvas-skeleton">
                    <div className="skeleton cinema-skel-canvas-image" />
                </div>
            </section>

            {/* 2. Normal Skeleton Curated Mood Rows */}
            <section className="curated-rows" aria-hidden="true">
                {[0, 1].map((rIdx) => (
                    <article
                        className={`curated-row ${rIdx === 0 ? 'curated-row--first' : ''}`}
                        key={rIdx}
                    >
                        <div className="cinema-skel-row-title-wrap">
                            <div className="skeleton cinema-skel-row-heading" />
                            <div className="skeleton cinema-skel-row-sub" />
                        </div>
                        <div className="curated-strip">
                            {[0, 1, 2, 3, 4, 5].map((cIdx) => (
                                <div
                                    key={cIdx}
                                    className="curated-card skeleton cinema-skel-card"
                                />
                            ))}
                        </div>
                    </article>
                ))}
            </section>

            {/* 3. Normal Skeleton Discover More Grid */}
            <section className="discover-grid-section" aria-hidden="true">
                <div className="cinema-skel-grid-title-wrap">
                    <div className="skeleton cinema-skel-grid-heading" />
                </div>
                <div className="discover-grid">
                    {[...Array(12)].map((_, idx) => (
                        <div key={idx} className="discover-card skeleton cinema-skel-discover-card" />
                    ))}
                </div>
            </section>
        </div>
    );
}
