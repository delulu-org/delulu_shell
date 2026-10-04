import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isImageLoaded, markImageLoaded } from '../../services/imageCache';
import { CardBookmarkBtn, CardFavoriteBtn } from '../buttons';
import type { MediaCard } from '../../api/types';
import './ContentCard.css';

export interface ContentCardProps {
    item: MediaCard;
    showTitle?: boolean;
    size?: 'small' | 'medium' | 'large';
}

export function ContentCard({ item, showTitle = false, size = 'medium' }: ContentCardProps) {
    const navigate = useNavigate();
    const posterUrl = item.poster_path ?? '';
    const alreadyLoaded = posterUrl ? isImageLoaded(posterUrl) : false;

    const [isLoaded, setIsLoaded] = useState(alreadyLoaded);
    const [isHovered, setIsHovered] = useState(false);

    const ratingText = item.rating != null && Number.isFinite(item.rating)
        ? item.rating.toFixed(1) : 'N/A';

    const handleImageLoad = () => {
        if (posterUrl) markImageLoaded(posterUrl);
        setIsLoaded(true);
    };

    const handleClick = () => {
        navigate(`/details/${item.media_type}/${item.id}`);
    };

    return (
        <div
            className={`content-card content-card-${size}`}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="content-card-image-wrapper">
                {!isLoaded && <div className="skeleton skeleton-card" />}
                {posterUrl && (
                    <img
                        src={posterUrl}
                        alt={item.title}
                        className={`content-card-image ${isLoaded ? 'loaded' : ''}`}
                        loading="lazy"
                        onLoad={handleImageLoad}
                    />
                )}
                <div className="card-actions">
                    <CardBookmarkBtn isActive={false} onClick={e => e.stopPropagation()} />
                    <CardFavoriteBtn isActive={false} onClick={e => e.stopPropagation()} />
                </div>
                <div className={`content-card-overlay ${isHovered ? 'visible' : ''}`}>
                    <div className="content-card-play">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                    <div className="content-card-info">
                        <span className="content-card-rating">★ {ratingText}</span>
                        <span className="content-card-year">{item.release_year ?? ''}</span>
                    </div>
                </div>
            </div>
            {showTitle && <h3 className="content-card-title">{item.title}</h3>}
        </div>
    );
}
