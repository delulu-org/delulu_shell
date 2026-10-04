import React, { useState } from 'react';
import { Blobatar } from '@blobatar/react';
import { ToggleSwitch } from '../common/ToggleSwitch';
import './GeneralTab.css';

export const GeneralTab: React.FC = () => {
    // Client-side persistent random seed for Blobatar
    const [seed, setSeed] = useState<string>(() => {
        const saved = localStorage.getItem('delulu_avatar_seed');
        if (saved) return saved;
        const newSeed = crypto.randomUUID();
        localStorage.setItem('delulu_avatar_seed', newSeed);
        return newSeed;
    });

    const [discordActivity, setDiscordActivity] = useState(false);

    const handleRandomize = () => {
        const nextSeed = crypto.randomUUID();
        setSeed(nextSeed);
        localStorage.setItem('delulu_avatar_seed', nextSeed);
    };

    return (
        <div className="general-tab-content">
            {/* 1. Profile Banner */}
            <div className="general-profile-banner">
                <button
                    type="button"
                    className="general-avatar-btn"
                    onClick={handleRandomize}
                    title="Click to randomize avatar"
                    aria-label="Randomize avatar"
                >
                    <Blobatar
                        name={seed}
                        size={80}
                        className="general-avatar-img"
                    />
                </button>

                <div className="general-profile-info">
                    <span className="general-profile-name">Anonymous user</span>
                    <button
                        type="button"
                        className="general-profile-auth-btn"
                        onClick={() => {
                            // Mock auth action
                        }}
                    >
                        Log in / Sign up
                    </button>
                </div>
            </div>

            <div className="general-divider" />

            {/* 2. Quick Links */}
            <div className="general-links-list">
                <a href="#support" className="general-text-link" onClick={(e) => e.preventDefault()}>Contact support</a>
                <a href="#source" className="general-text-link" onClick={(e) => e.preventDefault()}>Source code</a>
                <a href="#terms" className="general-text-link" onClick={(e) => e.preventDefault()}>Terms of Service</a>
                <a href="#privacy" className="general-text-link" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            </div>

            {/* 4. Discord Activity Toggle Row */}
            <div className="general-setting-inline-row">
                <span className="general-setting-label">
                    Show what you're watching on Discord
                </span>
                <ToggleSwitch
                    checked={discordActivity}
                    onChange={setDiscordActivity}
                    ariaLabel="Show watching activity on Discord"
                />
            </div>
        </div>
    );
};
