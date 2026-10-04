import React from 'react';

interface HeroPosterProps {
    posterPath?: string | null;
    title: string;
}

export const HeroPoster: React.FC<HeroPosterProps> = ({ posterPath, title }) => {
    if (!posterPath) return null;

    return (
        <div className="details-poster-wrapper">
            <img
                src={posterPath}
                alt={title}
                className="details-poster"
                loading="eager"
            />
        </div>
    );
};
