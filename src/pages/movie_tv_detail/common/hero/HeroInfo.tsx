import React from 'react';
import { MediaLogo, TMDbRating, ImdbRating } from '../../../../common_comps';
import {
    DetailPlayBtn,
    DetailTrailerBtn,
    DetailWatchlistBtn,
    DetailFavoritesBtn,
    DetailWatchedBtn,
} from '../buttons';
import { EpisodeSection } from '../episodes';
import { CastRow } from '../cast';
import type { DetailsPayload } from '../../../../api/types';

interface HeroInfoProps {
    details: DetailsPayload;
    onPlay?: () => void;
    onTrailer?: () => void;
    onToggleWatchlist?: (active: boolean) => void;
    onToggleFavorites?: (active: boolean) => void;
    onToggleWatched?: (active: boolean) => void;
    onEpisodeSelect?: (seasonNumber: number, episodeNumber: number, episodeName?: string) => void;
    onSeasonChange?: (seasonNumber: number) => void;
}

export const HeroInfo: React.FC<HeroInfoProps> = ({
    details,
    onPlay,
    onTrailer,
    onToggleWatchlist,
    onToggleFavorites,
    onToggleWatched,
    onEpisodeSelect,
    onSeasonChange,
}) => {
    const [isOverviewExpanded, setIsOverviewExpanded] = React.useState(false);

    React.useEffect(() => {
        setIsOverviewExpanded(false);
    }, [details.id]);

    const seasonsCount = details.seasons?.length ?? 0;
    const runtime = details.runtime ?? 0;

    return (
        <div className="details-info">
            {/* Title / Transparent PNG Logo */}
            <div className="details-logo-wrap">
                <MediaLogo
                    src={details.logo_url}
                    title={details.title}
                    size="detail"
                    as="h1"
                    isVisible={true}
                />
            </div>

            {/* Metadata Row */}
            <div className="details-meta">
                {details.rating != null && details.rating > 0 && (
                    <TMDbRating rating={details.rating} className="details-rating-tmdb" />
                )}
                {details.imdb_rating != null && details.imdb_rating > 0 && (
                    <ImdbRating rating={details.imdb_rating} className="details-rating-imdb" />
                )}
                {details.release_year && (
                    <span className="details-year">{details.release_year}</span>
                )}
                {runtime > 0 && (
                    <span className="details-runtime">{runtime} min</span>
                )}
                {seasonsCount > 0 && (
                    <span className="details-seasons">
                        {seasonsCount} Season{seasonsCount > 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Genres */}
            {details.genres && details.genres.length > 0 && (
                <div className="details-genres">
                    {details.genres.map((genre: string) => (
                        <span key={genre} className="genre-tag">
                            {genre}
                        </span>
                    ))}
                </div>
            )}

            {/* Tagline */}
            {details.tagline && (
                <p className="details-tagline">"{details.tagline}"</p>
            )}

            {/* Overview */}
            {details.overview && (
                <div className="details-overview-wrap">
                    <p className={`details-overview ${isOverviewExpanded ? 'expanded' : ''}`}>
                        {details.overview}
                    </p>
                    {details.overview.length > 200 && (
                        <button
                            type="button"
                            className="details-overview-toggle"
                            onClick={() => setIsOverviewExpanded((prev) => !prev)}
                            aria-expanded={isOverviewExpanded}
                        >
                            {isOverviewExpanded ? 'Show less' : 'More'}
                        </button>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="details-actions">
                <DetailPlayBtn onClick={onPlay} />
                <DetailTrailerBtn onClick={onTrailer} />
                <DetailWatchlistBtn onToggle={onToggleWatchlist} />
                <DetailFavoritesBtn onToggle={onToggleFavorites} />
                <DetailWatchedBtn onToggle={onToggleWatched} />
            </div>

            {/* Cast Row */}
            {details.cast && details.cast.length > 0 && (
                <CastRow cast={details.cast} />
            )}

            {/* Seasons & Episodes for TV Shows */}
            {details.media_type === 'tv' && details.seasons && details.seasons.length > 0 && (
                <EpisodeSection
                    tvId={details.id}
                    seasons={details.seasons}
                    onEpisodeSelect={onEpisodeSelect}
                    onSeasonChange={onSeasonChange}
                />
            )}
        </div>
    );
};
