import './Skeleton.css';

interface SkeletonProps {
    variant?: 'card' | 'text' | 'circle' | 'hero' | 'detail';
    width?: string;
    height?: string;
    className?: string;
    style?: React.CSSProperties;
}

export function Skeleton({ variant = 'text', width, height, className = '', style }: SkeletonProps) {
    const classes = `skeleton skeleton-${variant} ${className}`;
    return <div className={classes} style={{ width, height, ...style }} />;
}

export function SkeletonCard({ count = 1 }: { count?: number }) {
    return (
        <>
            {[...Array(count)].map((_, i) => (
                <div key={i} className="skeleton-card-wrapper">
                    <div className="skeleton skeleton-card" />
                </div>
            ))}
        </>
    );
}

export function SkeletonRow() {
    return (
        <section className="home-section skeleton-row">
            <div className="home-section-header skeleton-row-header">
                <div className="skeleton skeleton-text" style={{ width: '80px', height: '10px', marginBottom: '8px' }} />
                <div className="skeleton skeleton-text" style={{ width: '220px', height: '32px', marginBottom: '10px' }} />
                <div className="home-section-rule" style={{ opacity: 0.2 }} />
            </div>
            <div className="content-row">
                <div className="content-row-items">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="skeleton skeleton-card content-card-medium" />
                    ))}
                </div>
            </div>
        </section>
    );
}

export function SkeletonHero() {
    return (
        <div className="skeleton-hero">
            <div className="hero-gradient" />
            <div className="hero-gradient-bottom" />
            <div className="skeleton-hero-content">
                <div className="skeleton skeleton-text" style={{ width: '120px', height: '12px' }} />
                <div className="skeleton skeleton-text" style={{ width: 'clamp(260px, 32vw, 460px)', height: '48px', marginTop: '16px' }} />
                <div className="skeleton-hero-meta">
                    <div className="skeleton skeleton-text" style={{ width: '50px', height: '16px' }} />
                    <div className="skeleton skeleton-text" style={{ width: '40px', height: '16px' }} />
                    <div className="skeleton skeleton-text" style={{ width: '60px', height: '16px' }} />
                </div>
                <div className="skeleton skeleton-text" style={{ width: 'clamp(240px, 40vw, 520px)', height: '44px', marginTop: '16px' }} />
                <div className="skeleton-hero-buttons">
                    <div className="skeleton" style={{ width: '130px', height: '44px', borderRadius: '4px' }} />
                </div>
            </div>
        </div>
    );
}

export function SkeletonDetail() {
    return (
        <div className="skeleton-detail">
            <div className="skeleton skeleton-detail-backdrop" />
            <div className="skeleton-detail-content">
                <div className="skeleton skeleton-detail-poster" />
                <div className="skeleton-detail-info">
                    <div className="skeleton skeleton-text" style={{ width: '300px', height: '40px' }} />
                    <div className="skeleton-detail-meta">
                        <div className="skeleton skeleton-text" style={{ width: '60px', height: '20px' }} />
                        <div className="skeleton skeleton-text" style={{ width: '60px', height: '20px' }} />
                        <div className="skeleton skeleton-text" style={{ width: '80px', height: '20px' }} />
                    </div>
                    <div className="skeleton-detail-tags">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="skeleton" style={{ width: '80px', height: '28px', borderRadius: '999px' }} />
                        ))}
                    </div>
                    <div className="skeleton skeleton-text" style={{ width: '100%', height: '100px', marginTop: '16px' }} />
                    <div className="skeleton-detail-buttons">
                        <div className="skeleton" style={{ width: '120px', height: '44px', borderRadius: '4px' }} />
                        <div className="skeleton" style={{ width: '100px', height: '44px', borderRadius: '4px' }} />
                        <div className="skeleton" style={{ width: '100px', height: '44px', borderRadius: '4px' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function SkeletonCast({ count = 8 }: { count?: number }) {
    return (
        <div className="skeleton-cast">
            <div className="skeleton skeleton-text" style={{ width: '60px', height: '24px' }} />
            <div className="skeleton-cast-items">
                {[...Array(count)].map((_, i) => (
                    <div key={i} className="skeleton-cast-item">
                        <div className="skeleton skeleton-circle" style={{ width: '60px', height: '60px' }} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function SkeletonGrid({ count = 20 }: { count?: number }) {
    return (
        <div className="skeleton-grid">
            <div className="skeleton-grid-header">
                <div className="skeleton skeleton-text" style={{ width: '200px', height: '32px' }} />
                <div className="skeleton skeleton-text" style={{ width: '250px', height: '20px', marginTop: '8px' }} />
            </div>
            <div className="skeleton-grid-items">
                <SkeletonCard count={count} />
            </div>
        </div>
    );
}
