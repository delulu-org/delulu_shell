import React, { useState, useEffect } from 'react';
import './MediaLogo.css';

interface MediaLogoProps {
    src?: string | null;
    title: string;
    size?: 'hero' | 'detail' | 'card';
    className?: string;
    isVisible?: boolean;
    as?: 'h1' | 'h2' | 'h3' | 'span';
}

export const MediaLogo: React.FC<MediaLogoProps> = ({
    src,
    title,
    size = 'hero',
    className = '',
    isVisible = true,
    as,
}) => {
    const [imgFailed, setImgFailed] = useState(false);

    useEffect(() => {
        setImgFailed(false);
    }, [src]);

    const Tag = as || (size === 'card' ? 'h3' : 'h1');

    if (src && !imgFailed) {
        return (
            <div className={`media-logo-wrapper media-logo-${size} ${className}`}>
                <img
                    src={src}
                    alt={title}
                    className={`media-logo-img ${isVisible ? 'is-visible' : ''}`}
                    onError={() => setImgFailed(true)}
                    loading="lazy"
                />
            </div>
        );
    }

    return (
        <div className={`media-logo-wrapper media-logo-${size} ${className}`}>
            <Tag className={`media-logo-fallback-title ${isVisible ? 'is-visible' : ''}`}>
                {title}
            </Tag>
        </div>
    );
};
