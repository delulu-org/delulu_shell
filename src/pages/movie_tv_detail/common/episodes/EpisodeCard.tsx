import { forwardRef } from 'react';
import { Play } from 'lucide-react';
import type { EpisodeItem } from '../../../../api/types';
import './EpisodeCard.css';

export interface EpisodeCardProps {
    episode: EpisodeItem;
    isSelected?: boolean;
    onClick?: (episode: EpisodeItem) => void;
}

const formatRuntime = (minutes: number | null): string => {
    if (!minutes || minutes <= 0) return '—';
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
};

const formatAirDate = (airDate: string): string => {
    try {
        const parsed = new Date(airDate);
        if (isNaN(parsed.getTime())) return airDate;
        return parsed.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        return airDate;
    }
};

export const EpisodeCard = forwardRef<HTMLDivElement, EpisodeCardProps>(
    ({ episode, onClick }, ref) => {
        const isUnreleased = Boolean(
            episode.air_date &&
            new Date(`${episode.air_date}T00:00:00Z`).getTime() > Date.now()
        );

        const stillUrl = episode.still_path
            ? episode.still_path.startsWith('http')
                ? episode.still_path
                : `https://image.tmdb.org/t/p/w300${episode.still_path}`
            : '';

        const handleClick = () => {
            if (isUnreleased) return;
            onClick?.(episode);
        };

        return (
            <div
                ref={ref}
                className={`episode-card ${isUnreleased ? 'episode-card--locked' : ''}`}
                onClick={handleClick}
                role="button"
                tabIndex={isUnreleased ? -1 : 0}
                aria-disabled={isUnreleased}
                title={
                    isUnreleased && episode.air_date
                        ? `Releases on ${episode.air_date}`
                        : undefined
                }
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isUnreleased) {
                        e.preventDefault();
                        handleClick();
                    }
                }}
            >
                {/* Episode Thumbnail */}
                <div className="episode-thumbnail">
                    {stillUrl ? (
                        <img
                            src={stillUrl}
                            alt={episode.name}
                            loading="lazy"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="episode-thumbnail-placeholder" />
                    )}

                    {!isUnreleased && (
                        <div className="episode-play-overlay">
                            <Play size={28} fill="white" stroke="none" />
                        </div>
                    )}
                </div>

                {/* Episode Info */}
                <div className="episode-info">
                    <div className="episode-header">
                        <span className="episode-number">{episode.episode_number}</span>
                        <h4 className="episode-title">{episode.name}</h4>
                    </div>

                    <div className="episode-meta">
                        <span className="episode-runtime">
                            {formatRuntime(episode.runtime)}
                        </span>
                        {episode.air_date && (
                            <span className="episode-date">
                                {formatAirDate(episode.air_date)}
                            </span>
                        )}
                        {isUnreleased && (
                            <span className="episode-release-state">Not Released Yet</span>
                        )}
                    </div>

                    {episode.overview && (
                        <p className="episode-overview">{episode.overview}</p>
                    )}
                </div>
            </div>
        );
    }
);

EpisodeCard.displayName = 'EpisodeCard';
