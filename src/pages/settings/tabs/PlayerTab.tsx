import React, { useState } from 'react';
import { Subtitles, Volume2, Gamepad2, Play, Cpu } from 'lucide-react';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { CustomSelect } from '../common/CustomSelect';
import { ColorPickerModal } from '../color_picker';
import './PlayerTab.css';

const SUBTITLE_LANGUAGES = [
    'English',
    'Spanish',
    'French',
    'German',
    'Japanese',
    'Korean',
    'Chinese',
    'Hindi',
    'Bengali',
    'Arabic',
    'Portuguese',
    'Russian',
];

const SUBTITLE_SIZES = ['50%', '75%', '100%', '125%', '150%', '175%', '200%'];

const AUDIO_TRACKS = [
    'English',
    'Japanese',
    'Korean',
    'Spanish',
    'French',
    'German',
    'Hindi',
    'Bengali',
    'Original Audio',
];

const SEEK_TIMES = [
    '3 seconds',
    '5 seconds',
    '10 seconds',
    '15 seconds',
    '30 seconds',
    '60 seconds',
];

const SHIFT_SEEK_TIMES = [
    '1 second',
    '2 seconds',
    '3 seconds',
    '5 seconds',
    '10 seconds',
    '15 seconds',
];

const POPUP_DURATIONS = [
    '10 seconds',
    '15 seconds',
    '20 seconds',
    '25 seconds',
    '30 seconds',
    '35 seconds',
    '40 seconds',
    '50 seconds',
    '60 seconds',
];

export const PlayerTab: React.FC = () => {
    // Subtitles state (UI only)
    const [subLang, setSubLang] = useState('English');
    const [subSize, setSubSize] = useState('100%');

    // Subtitle color states (UI only)
    const [subColor, setSubColor] = useState('#ffffff');
    const [subBgColor, setSubBgColor] = useState('transparent');
    const [subOutlineColor, setSubOutlineColor] = useState('transparent');
    const [activeColorPicker, setActiveColorPicker] = useState<'subColor' | 'subBgColor' | 'subOutlineColor' | null>(null);

    // Audio state (UI only)
    const [audioTrack, setAudioTrack] = useState('English');
    const [surroundSound, setSurroundSound] = useState(false);

    // Controls state (UI only)
    const [seekTime, setSeekTime] = useState('10 seconds');
    const [shiftSeekTime, setShiftSeekTime] = useState('3 seconds');
    const [pauseWhenMinimized, setPauseWhenMinimized] = useState(false);

    // Auto-Play state (UI only)
    const [autoPlayNext, setAutoPlayNext] = useState(true);
    const [popupDuration, setPopupDuration] = useState('35 seconds');

    // Advanced state (UI only)
    const [hardwareDecoding, setHardwareDecoding] = useState(true);
    const [nvidiaGpuProcessing, setNvidiaGpuProcessing] = useState(true);

    return (
        <div className="player-tab-content">
            <h2 className="player-section-title">Player</h2>

            {/* 1. Subtitles */}
            <div className="player-group">
                <div className="player-group-header">
                    <span className="player-group-icon" aria-hidden="true">
                        <Subtitles size={20} strokeWidth={1.8} />
                    </span>
                    <h3 className="player-group-title">Subtitles</h3>
                </div>

                <div className="player-settings-list">
                    {/* Default Subtitles Language */}
                    <div className="player-setting-row">
                        <span className="player-setting-label">Default Subtitles Language</span>
                        <div className="player-setting-control">
                            <CustomSelect
                                options={SUBTITLE_LANGUAGES}
                                value={subLang}
                                onChange={setSubLang}
                                ariaLabel="Default Subtitles Language"
                            />
                        </div>
                    </div>

                    {/* Default Subtitles Size */}
                    <div className="player-setting-row">
                        <span className="player-setting-label">Default Subtitles Size</span>
                        <div className="player-setting-control">
                            <CustomSelect
                                options={SUBTITLE_SIZES}
                                value={subSize}
                                onChange={setSubSize}
                                ariaLabel="Default Subtitles Size"
                            />
                        </div>
                    </div>

                    {/* Subtitles color */}
                    <div className="player-setting-row">
                        <span className="player-setting-label">Subtitles color</span>
                        <div className="player-setting-control">
                            <button
                                type="button"
                                className="player-color-pill white"
                                style={{ backgroundColor: subColor }}
                                onClick={() => setActiveColorPicker('subColor')}
                                aria-label={`Subtitles color: ${subColor}. Click to choose color`}
                                title="Click to choose color"
                            />
                        </div>
                    </div>

                    {/* Subtitles background color with visible thin white border */}
                    <div className="player-setting-row">
                        <span className="player-setting-label">Subtitles background color</span>
                        <div className="player-setting-control">
                            <button
                                type="button"
                                className={`player-color-pill ${subBgColor === 'transparent' ? 'transparent' : ''}`}
                                style={subBgColor !== 'transparent' ? { backgroundColor: subBgColor, border: '1px solid rgba(255, 255, 255, 0.45)' } : undefined}
                                onClick={() => setActiveColorPicker('subBgColor')}
                                aria-label={`Subtitles background color: ${subBgColor}. Click to choose color`}
                                title="Click to choose color"
                            >
                                {subBgColor === 'transparent' && <span>Transparent</span>}
                            </button>
                        </div>
                    </div>

                    {/* Subtitles outline color with visible thin white border when transparent */}
                    <div className="player-setting-row">
                        <span className="player-setting-label">Subtitles outline color</span>
                        <div className="player-setting-control">
                            <button
                                type="button"
                                className={`player-color-pill ${subOutlineColor === 'transparent' ? 'transparent' : 'black'}`}
                                style={subOutlineColor !== 'transparent' ? { backgroundColor: subOutlineColor, border: '1px solid rgba(255, 255, 255, 0.45)' } : undefined}
                                onClick={() => setActiveColorPicker('subOutlineColor')}
                                aria-label={`Subtitles outline color: ${subOutlineColor}. Click to choose color`}
                                title="Click to choose color"
                            >
                                {subOutlineColor === 'transparent' && <span>Transparent</span>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="player-divider" />

            {/* 2. Audio */}
            <div className="player-group">
                <div className="player-group-header">
                    <span className="player-group-icon" aria-hidden="true">
                        <Volume2 size={20} strokeWidth={1.8} />
                    </span>
                    <h3 className="player-group-title">Audio</h3>
                </div>

                <div className="player-settings-list">
                    {/* Default Audio Track */}
                    <div className="player-setting-row">
                        <span className="player-setting-label">Default Audio Track</span>
                        <div className="player-setting-control">
                            <CustomSelect
                                options={AUDIO_TRACKS}
                                value={audioTrack}
                                onChange={setAudioTrack}
                                ariaLabel="Default Audio Track"
                            />
                        </div>
                    </div>

                    {/* Surround sound */}
                    <div className="player-setting-row">
                        <span className="player-setting-label">Surround sound</span>
                        <div className="player-setting-control">
                            <ToggleSwitch
                                checked={surroundSound}
                                onChange={setSurroundSound}
                                ariaLabel="Surround sound"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="player-divider" />

            {/* 3. Controls */}
            <div className="player-group">
                <div className="player-group-header">
                    <span className="player-group-icon" aria-hidden="true">
                        <Gamepad2 size={20} strokeWidth={1.8} />
                    </span>
                    <h3 className="player-group-title">Controls</h3>
                </div>

                <div className="player-settings-list">
                    {/* Arrow keys seek time */}
                    <div className="player-setting-row">
                        <span className="player-setting-label">Arrow keys seek time</span>
                        <div className="player-setting-control">
                            <CustomSelect
                                options={SEEK_TIMES}
                                value={seekTime}
                                onChange={setSeekTime}
                                ariaLabel="Arrow keys seek time"
                            />
                        </div>
                    </div>

                    {/* Arrow keys seek time when Shift key is held */}
                    <div className="player-setting-row">
                        <span className="player-setting-label">Arrow keys seek time when Shift key is held</span>
                        <div className="player-setting-control">
                            <CustomSelect
                                options={SHIFT_SEEK_TIMES}
                                value={shiftSeekTime}
                                onChange={setShiftSeekTime}
                                ariaLabel="Arrow keys seek time when Shift key is held"
                            />
                        </div>
                    </div>

                    {/* Pause playback when minimized */}
                    <div className="player-setting-row">
                        <span className="player-setting-label">Pause playback when minimized</span>
                        <div className="player-setting-control">
                            <ToggleSwitch
                                checked={pauseWhenMinimized}
                                onChange={setPauseWhenMinimized}
                                ariaLabel="Pause playback when minimized"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="player-divider" />

            {/* 4. Auto-Play */}
            <div className="player-group">
                <div className="player-group-header">
                    <span className="player-group-icon" aria-hidden="true">
                        <Play size={18} strokeWidth={1.8} fill="currentColor" />
                    </span>
                    <h3 className="player-group-title">Auto-Play</h3>
                </div>

                <div className="player-settings-list">
                    {/* Auto-Play Next Episode */}
                    <div className="player-setting-row">
                        <span className="player-setting-label">Auto-Play Next Episode</span>
                        <div className="player-setting-control">
                            <ToggleSwitch
                                checked={autoPlayNext}
                                onChange={setAutoPlayNext}
                                ariaLabel="Auto-Play Next Episode"
                            />
                        </div>
                    </div>

                    {/* Next video popup duration */}
                    <div className="player-setting-row">
                        <span className="player-setting-label">Next video popup duration</span>
                        <div className="player-setting-control">
                            <CustomSelect
                                options={POPUP_DURATIONS}
                                value={popupDuration}
                                onChange={setPopupDuration}
                                ariaLabel="Next video popup duration"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="player-divider" />

            {/* 5. Advanced (Equipped with high-tech CPU/Chip icon instead of sunglasses) */}
            <div className="player-group">
                <div className="player-group-header">
                    <span className="player-group-icon" aria-hidden="true">
                        <Cpu size={20} strokeWidth={1.8} />
                    </span>
                    <h3 className="player-group-title">Advanced</h3>
                </div>

                <div className="player-settings-list">
                    {/* Hardware-accelerated decoding */}
                    <div className="player-setting-row">
                        <span className="player-setting-label">Hardware-accelerated decoding</span>
                        <div className="player-setting-control">
                            <ToggleSwitch
                                checked={hardwareDecoding}
                                onChange={setHardwareDecoding}
                                ariaLabel="Hardware-accelerated decoding"
                            />
                        </div>
                    </div>

                    {/* Nvidia GPU Video Processing */}
                    <div className="player-setting-row">
                        <span className="player-setting-label">Nvidia GPU Video Processing</span>
                        <div className="player-setting-control">
                            <ToggleSwitch
                                checked={nvidiaGpuProcessing}
                                onChange={setNvidiaGpuProcessing}
                                ariaLabel="Nvidia GPU Video Processing"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtitles Color Picker Modal */}
            <ColorPickerModal
                isOpen={activeColorPicker !== null}
                initialColor={
                    activeColorPicker === 'subColor'
                        ? subColor
                        : activeColorPicker === 'subOutlineColor'
                        ? subOutlineColor
                        : subBgColor
                }
                onClose={() => setActiveColorPicker(null)}
                onSelect={(newColor) => {
                    if (activeColorPicker === 'subColor') {
                        setSubColor(newColor);
                    } else if (activeColorPicker === 'subOutlineColor') {
                        if (newColor === 'rgba(0, 0, 0, 0)' || newColor.endsWith(', 0)') || newColor === 'transparent') {
                            setSubOutlineColor('transparent');
                        } else {
                            setSubOutlineColor(newColor);
                        }
                    } else if (activeColorPicker === 'subBgColor') {
                        if (newColor === 'rgba(0, 0, 0, 0)' || newColor.endsWith(', 0)') || newColor === 'transparent') {
                            setSubBgColor('transparent');
                        } else {
                            setSubBgColor(newColor);
                        }
                    }
                    setActiveColorPicker(null);
                }}
            />
        </div>
    );
};
