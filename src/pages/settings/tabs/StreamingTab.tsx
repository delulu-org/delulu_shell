import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CustomSelect } from '../common/CustomSelect';
import { ToggleSwitch } from '../common/ToggleSwitch';
import './StreamingTab.css';

const CACHE_SIZES = [
    '2GiB',
    '5GiB',
    '10GiB',
    '20GiB',
    '50GiB',
    '100GiB',
    'Infinite',
];

const PLAYBACK_BUFFER_SIZES = [
    '32MiB',
    '64MiB',
    '128MiB',
    '256MiB',
    '512MiB',
    '1GiB',
    '2GiB',
];

const TORRENT_PROFILES = [
    'Optimized',
    'Custom',
];

export const StreamingTab: React.FC = () => {
    // Port 27650 from d:\DeluluStream\port.txt
    const serverUrl = 'http://127.0.0.1:27650/';
    const [cacheSize, setCacheSize] = useState('2GiB');
    const [playbackBuffer, setPlaybackBuffer] = useState('256MiB');
    const [cachePath, setCachePath] = useState('C:\\Users\\Sparsho\\AppData\\Local\\DeluluStream');
    const [pendingPath, setPendingPath] = useState(cachePath);
    const [torrentProfile, setTorrentProfile] = useState('Optimized');
    const [isCacheModalOpen, setIsCacheModalOpen] = useState(false);

    // Custom BitTorrent profile parameters (Default Stremio server settings)
    const [btMaxConnections, setBtMaxConnections] = useState<number>(55);
    const [btRequestTimeout, setBtRequestTimeout] = useState<number>(4000);
    const [btDownloadSpeedSoftLimit, setBtDownloadSpeedSoftLimit] = useState<number>(52428800);
    const [btDownloadSpeedHardLimit, setBtDownloadSpeedHardLimit] = useState<number>(73400320);
    const [btMinPeersForStable, setBtMinPeersForStable] = useState<number>(5);
    const [btUseUtp, setBtUseUtp] = useState<boolean>(true);

    // Sync pendingPath when modal opens
    useEffect(() => {
        if (isCacheModalOpen) {
            setPendingPath(cachePath);
        }
    }, [isCacheModalOpen, cachePath]);

    // Dismiss modal on Escape key
    useEffect(() => {
        if (!isCacheModalOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setPendingPath(cachePath);
                setIsCacheModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCacheModalOpen, cachePath]);

    const handleChangePathClick = async () => {
        try {
            const { open } = await import('@tauri-apps/plugin-dialog');
            const selected = await open({
                directory: true,
                multiple: false,
                defaultPath: pendingPath || cachePath,
                title: 'Select Cache Storage Directory',
            });
            if (selected && typeof selected === 'string') {
                setPendingPath(selected);
            }
        } catch (err) {
            console.warn('Tauri open directory dialog failed, falling back:', err);
            const next = window.prompt('Enter new cache storage path:', pendingPath);
            if (next && next.trim()) {
                setPendingPath(next.trim());
            }
        }
    };

    const handleSave = () => {
        setCachePath(pendingPath);
        setIsCacheModalOpen(false);
    };

    const handleCancel = () => {
        setPendingPath(cachePath);
        setIsCacheModalOpen(false);
    };

    return (
        <div className="streaming-tab-content">
            <h2 className="streaming-section-title">Streaming</h2>

            {/* Server URL & Status Section */}
            <div className="streaming-server-section">
                {/* Column Headers */}
                <div className="streaming-table-header">
                    <span className="streaming-col-header">URL</span>
                    <span className="streaming-col-header status">Status</span>
                </div>

                {/* Server Status Pill Card (no radio dot on left) */}
                <div className="streaming-server-card">
                    <div className="streaming-server-left">
                        <span className="streaming-url-text">{serverUrl}</span>
                    </div>

                    <div className="streaming-server-right">
                        <span className="streaming-status-dot" />
                        <span className="streaming-status-text">Online</span>
                    </div>
                </div>
            </div>

            {/* Streaming Settings Rows */}
            <div className="streaming-settings-list">
                {/* Cache size */}
                <div className="streaming-setting-row">
                    <span className="streaming-setting-label">Cache size</span>
                    <div className="streaming-setting-control">
                        <CustomSelect
                            options={CACHE_SIZES}
                            value={cacheSize}
                            onChange={setCacheSize}
                            ariaLabel="Cache size"
                        />
                    </div>
                </div>

                {/* Playback buffer (RAM based ahead cache) */}
                <div className="streaming-setting-row">
                    <div className="streaming-setting-info">
                        <span className="streaming-setting-label">Playback buffer</span>
                        <span className="streaming-setting-subtext">
                            Preloads stream data into system RAM<br />
                            instead of disk for smoother playback.
                        </span>
                    </div>
                    <div className="streaming-setting-control">
                        <CustomSelect
                            options={PLAYBACK_BUFFER_SIZES}
                            value={playbackBuffer}
                            onChange={setPlaybackBuffer}
                            ariaLabel="Playback buffer"
                        />
                    </div>
                </div>

                {/* Caching drive (opens modal popup on click) */}
                <div className="streaming-setting-row">
                    <span className="streaming-setting-label">Caching drive</span>
                    <div className="streaming-setting-control">
                        <button
                            type="button"
                            className="streaming-path-pill-btn"
                            onClick={() => setIsCacheModalOpen(true)}
                            title={cachePath}
                            aria-label={`Current cache path: ${cachePath}. Click to change`}
                        >
                            <span className="streaming-path-text">{cachePath}</span>
                        </button>
                    </div>
                </div>

                {/* Torrent profile (Optimized / Custom) */}
                <div className="streaming-setting-row">
                    <span className="streaming-setting-label">Torrent profile</span>
                    <div className="streaming-setting-control">
                        <CustomSelect
                            options={TORRENT_PROFILES}
                            value={torrentProfile}
                            onChange={setTorrentProfile}
                            ariaLabel="Torrent profile"
                        />
                    </div>
                </div>

                {/* Custom BitTorrent Profile Parameters (shown when profile is Custom) */}
                {torrentProfile === 'Custom' && (
                    <div className="streaming-custom-panel">
                        <div className="streaming-custom-header">
                            <span className="streaming-custom-title">Custom BitTorrent Profile</span>
                            <span className="streaming-custom-hint">Tune peer, rate, and connection parameters</span>
                        </div>

                        {/* btMaxConnections */}
                        <div className="streaming-setting-row sub-row">
                            <div className="streaming-setting-info">
                                <span className="streaming-setting-label">Max connections</span>
                                <span className="streaming-setting-subtext">btMaxConnections</span>
                            </div>
                            <div className="streaming-setting-control">
                                <input
                                    type="number"
                                    className="streaming-custom-input"
                                    value={btMaxConnections}
                                    onChange={(e) => setBtMaxConnections(Number(e.target.value))}
                                    aria-label="Max connections (btMaxConnections)"
                                />
                            </div>
                        </div>

                        {/* btRequestTimeout */}
                        <div className="streaming-setting-row sub-row">
                            <div className="streaming-setting-info">
                                <span className="streaming-setting-label">Request timeout</span>
                                <span className="streaming-setting-subtext">btRequestTimeout (ms)</span>
                            </div>
                            <div className="streaming-setting-control">
                                <input
                                    type="number"
                                    className="streaming-custom-input"
                                    value={btRequestTimeout}
                                    onChange={(e) => setBtRequestTimeout(Number(e.target.value))}
                                    aria-label="Request timeout (btRequestTimeout)"
                                />
                            </div>
                        </div>

                        {/* btDownloadSpeedSoftLimit */}
                        <div className="streaming-setting-row sub-row">
                            <div className="streaming-setting-info">
                                <span className="streaming-setting-label">Download speed soft limit</span>
                                <span className="streaming-setting-subtext">btDownloadSpeedSoftLimit (bytes/s)</span>
                            </div>
                            <div className="streaming-setting-control">
                                <input
                                    type="number"
                                    className="streaming-custom-input wide"
                                    value={btDownloadSpeedSoftLimit}
                                    onChange={(e) => setBtDownloadSpeedSoftLimit(Number(e.target.value))}
                                    aria-label="Download speed soft limit (btDownloadSpeedSoftLimit)"
                                />
                            </div>
                        </div>

                        {/* btDownloadSpeedHardLimit */}
                        <div className="streaming-setting-row sub-row">
                            <div className="streaming-setting-info">
                                <span className="streaming-setting-label">Download speed hard limit</span>
                                <span className="streaming-setting-subtext">btDownloadSpeedHardLimit (bytes/s)</span>
                            </div>
                            <div className="streaming-setting-control">
                                <input
                                    type="number"
                                    className="streaming-custom-input wide"
                                    value={btDownloadSpeedHardLimit}
                                    onChange={(e) => setBtDownloadSpeedHardLimit(Number(e.target.value))}
                                    aria-label="Download speed hard limit (btDownloadSpeedHardLimit)"
                                />
                            </div>
                        </div>

                        {/* btMinPeersForStable */}
                        <div className="streaming-setting-row sub-row">
                            <div className="streaming-setting-info">
                                <span className="streaming-setting-label">Min peers for stable</span>
                                <span className="streaming-setting-subtext">btMinPeersForStable</span>
                            </div>
                            <div className="streaming-setting-control">
                                <input
                                    type="number"
                                    className="streaming-custom-input"
                                    value={btMinPeersForStable}
                                    onChange={(e) => setBtMinPeersForStable(Number(e.target.value))}
                                    aria-label="Min peers for stable (btMinPeersForStable)"
                                />
                            </div>
                        </div>

                        {/* btUseUtp */}
                        <div className="streaming-setting-row sub-row">
                            <div className="streaming-setting-info">
                                <span className="streaming-setting-label">Use uTP protocol</span>
                                <span className="streaming-setting-subtext">btUseUtp</span>
                            </div>
                            <div className="streaming-setting-control">
                                <ToggleSwitch
                                    checked={btUseUtp}
                                    onChange={setBtUseUtp}
                                    ariaLabel="Use uTP protocol (btUseUtp)"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Cache Storage Path Modal (Pure black background + crisp white border) */}
            {isCacheModalOpen && (
                <div className="streaming-modal-overlay" onClick={handleCancel}>
                    <div
                        className="streaming-modal-dialog"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Cache Storage Path"
                    >
                        <div className="streaming-modal-header">
                            <h3 className="streaming-modal-title">Cache Storage Path</h3>
                            <button
                                type="button"
                                className="streaming-modal-close-btn"
                                onClick={handleCancel}
                                aria-label="Close dialog"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="streaming-modal-body">
                            {/* Current cache path without file/folder icon */}
                            <div className="streaming-modal-section">
                                <label className="streaming-modal-label">Current cache path</label>
                                <div className="streaming-current-path-box">
                                    <span className="streaming-current-path-text">{cachePath}</span>
                                </div>
                            </div>

                            {/* Change cache path button */}
                            <div className="streaming-modal-section">
                                <button
                                    type="button"
                                    className="streaming-modal-change-path-btn"
                                    onClick={handleChangePathClick}
                                >
                                    Change cache path
                                </button>
                                {pendingPath !== cachePath && (
                                    <div className="streaming-pending-badge">
                                        <span className="streaming-pending-label">Selected new path:</span>
                                        <span className="streaming-pending-value">{pendingPath}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer with Cancel & Save Changes buttons */}
                        <div className="streaming-modal-footer">
                            <button
                                type="button"
                                className="streaming-modal-btn cancel"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="streaming-modal-btn save"
                                onClick={handleSave}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
