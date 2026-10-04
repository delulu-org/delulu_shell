import React, { useState, useRef, useEffect } from 'react';
import type { SeasonItem } from '../../../../api/types';
import './SeasonDropdown.css';

export interface SeasonDropdownProps {
    seasons: SeasonItem[];
    selectedSeason: number;
    onSeasonSelect: (seasonNumber: number) => void;
}

export const SeasonDropdown: React.FC<SeasonDropdownProps> = ({
    seasons,
    selectedSeason,
    onSeasonSelect,
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter out seasons with 0 episodes and sort ascending by season number
    const validSeasons = seasons
        .filter((s) => s.episode_count > 0)
        .sort((a, b) => a.season_number - b.season_number);

    useEffect(() => {
        if (!isDropdownOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isDropdownOpen]);

    const getSeasonName = (season: SeasonItem): string => {
        if (season.season_number === 0) return 'Specials';
        return season.name || `Season ${season.season_number}`;
    };

    const currentSeason = validSeasons.find((s) => s.season_number === selectedSeason);

    if (validSeasons.length === 0) {
        return null;
    }

    return (
        <div className="season-dropdown-container" ref={dropdownRef}>
            <button
                type="button"
                className="season-dropdown-trigger"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
            >
                <span className="season-dropdown-label">
                    {currentSeason ? getSeasonName(currentSeason) : 'Select Season'}
                </span>
                <svg
                    className={`season-dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="M7 10l5 5 5-5z" />
                </svg>
            </button>

            {isDropdownOpen && (
                <div className="season-dropdown-menu" role="listbox">
                    <div className="season-dropdown-scroll-content">
                        {validSeasons.map((season, index) => {
                            const isSelected = season.season_number === selectedSeason;
                            return (
                                <button
                                    key={season.id || season.season_number}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    style={{ '--stagger-idx': index } as React.CSSProperties}
                                    className={`season-dropdown-item ${isSelected ? 'active' : ''}`}
                                    onClick={() => {
                                        onSeasonSelect(season.season_number);
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    <span>{getSeasonName(season)}</span>
                                    <span className="season-episode-count">
                                        {season.episode_count} Episodes
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
