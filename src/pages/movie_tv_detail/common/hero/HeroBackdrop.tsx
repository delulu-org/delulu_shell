import React, { useState, useEffect } from 'react';

interface HeroBackdropProps {
    backdropPath?: string | null;
}

export const HeroBackdrop: React.FC<HeroBackdropProps> = ({ backdropPath }) => {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (!backdropPath) {
            setLoaded(false);
            return;
        }
        setLoaded(false);
        const img = new Image();
        img.src = backdropPath;
        img.onload = () => setLoaded(true);
        img.onerror = () => setLoaded(true); // fallback to render anyway

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [backdropPath]);

    return (
        <>
            <div
                className="details-backdrop"
                style={{
                    backgroundImage: backdropPath ? `url(${backdropPath})` : undefined,
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity 0.45s ease-out',
                }}
                aria-hidden="true"
            />
            <div className="details-backdrop-gradient" aria-hidden="true" />
        </>
    );
};

