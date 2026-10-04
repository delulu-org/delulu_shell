import React from 'react';
import { HeroBackdrop } from './HeroBackdrop';
import { HeroPoster } from './HeroPoster';
import { HeroInfo } from './HeroInfo';
import type { DetailsPayload } from '../../../../api/types';
import './DetailHero.css';

interface DetailHeroProps {
    details: DetailsPayload;
    onPlay?: () => void;
    onTrailer?: () => void;
    onToggleWatchlist?: (active: boolean) => void;
    onToggleFavorites?: (active: boolean) => void;
    onToggleWatched?: (active: boolean) => void;
    onEpisodeSelect?: (seasonNumber: number, episodeNumber: number, episodeName?: string) => void;
    onSeasonChange?: (seasonNumber: number) => void;
}

export const DetailHero: React.FC<DetailHeroProps> = ({
    details,
    onPlay,
    onTrailer,
    onToggleWatchlist,
    onToggleFavorites,
    onToggleWatched,
    onEpisodeSelect,
    onSeasonChange,
}) => {
    return (
        <section className="details-hero-section">
            <HeroBackdrop backdropPath={details.backdrop_path} />

            <div className="details-content">
                <HeroPoster posterPath={details.poster_path} title={details.title} />

                <HeroInfo
                    details={details}
                    onPlay={onPlay}
                    onTrailer={onTrailer}
                    onToggleWatchlist={onToggleWatchlist}
                    onToggleFavorites={onToggleFavorites}
                    onToggleWatched={onToggleWatched}
                    onEpisodeSelect={onEpisodeSelect}
                    onSeasonChange={onSeasonChange}
                />
            </div>
        </section>
    );
};
