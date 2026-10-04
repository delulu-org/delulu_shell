import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { useUserProfileStore, applyEpisodeCardCssVariables } from '../../../store/useUserProfileStore';
import type { WindowButtonMode, InterfaceZoom } from '../../../store/useUserProfileStore';

import { ColorPickerModal } from '../color_picker';
import './InterfaceTab.css';

const ZOOM_STEPS: InterfaceZoom[] = [75, 100, 125, 150, 175];

interface ZoomSliderProps {
    value: InterfaceZoom;
    onChange: (zoom: InterfaceZoom) => void;
}

function ZoomSlider({ value, onChange }: ZoomSliderProps) {
    const [preview, setPreview] = useState<InterfaceZoom>(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const dragging = useRef<number | null>(null);

    // Keep preview synced with store value
    useEffect(() => {
        setPreview(value);
    }, [value]);

    const onTickClick = useCallback((step: InterfaceZoom) => {
        setPreview(step);
        onChange(step);
    }, [onChange]);

    const onPointerDown = useCallback((event: React.PointerEvent<HTMLInputElement>) => {
        if (event.isPrimary && event.button === 0) {
            dragging.current = event.pointerId;
        }
    }, []);

    const onInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const nextIdx = Number(event.currentTarget.value);
        const nextStep = ZOOM_STEPS[nextIdx] ?? 100;
        setPreview(nextStep);
        // Zooming during a mouse drag or click shifts the slider coordinates under the cursor.
        // Therefore, we only trigger immediate onChange during keyboard navigation (when dragging.current === null).
        if (dragging.current === null) {
            onChange(nextStep);
        }
    }, [onChange]);

    useEffect(() => {
        const finishDrag = (event: PointerEvent) => {
            if (dragging.current !== event.pointerId || !inputRef.current) return;
            dragging.current = null;
            const finalIdx = Number(inputRef.current.value);
            const finalStep = ZOOM_STEPS[finalIdx] ?? 100;
            onChange(finalStep);
        };

        const cancelDrag = () => {
            if (dragging.current === null) return;
            dragging.current = null;
            setPreview(value);
        };

        // Pointer capture listener on document ensures clean single-commit on mouseup
        document.addEventListener('pointerup', finishDrag, true);
        document.addEventListener('pointercancel', cancelDrag, true);
        window.addEventListener('blur', cancelDrag);
        return () => {
            document.removeEventListener('pointerup', finishDrag, true);
            document.removeEventListener('pointercancel', cancelDrag, true);
            window.removeEventListener('blur', cancelDrag);
        };
    }, [value, onChange]);

    const activeIdx = ZOOM_STEPS.indexOf(preview);
    const pct = (activeIdx / (ZOOM_STEPS.length - 1)) * 100;

    return (
        <div className="interface-setting-row">
            <span className="interface-setting-label">Interface zoom</span>
            <div className="zoom-slider-shell">
                {/* Step labels */}
                <div className="zoom-labels">
                    {ZOOM_STEPS.map((step) => (
                        <button
                            type="button"
                            key={step}
                            className={`zoom-label${step === preview ? ' zoom-label--active' : ''}`}
                            onClick={() => onTickClick(step)}
                            aria-pressed={step === preview}
                        >
                            {step}%
                        </button>
                    ))}
                </div>

                {/* Track + filled portion + thumb */}
                <div className="zoom-track-wrap">
                    <div className="zoom-track">
                        <div className="zoom-track-fill" style={{ width: `${pct}%` }} />
                        <div className="zoom-thumb" style={{ left: `${pct}%` }} />
                    </div>

                    {/* Native range input with deferred single-commit */}
                    <input
                        ref={inputRef}
                        type="range"
                        className="zoom-input-native"
                        min={0}
                        max={ZOOM_STEPS.length - 1}
                        step={1}
                        value={activeIdx}
                        aria-label="Interface zoom"
                        aria-valuetext={`${preview}%`}
                        onPointerDown={onPointerDown}
                        onChange={onInputChange}
                    />
                </div>
            </div>
        </div>
    );
}

export const InterfaceTab: React.FC = () => {
    const uiMode = useUserProfileStore((state) => state.profile.uiMode);
    const updateUiMode = useUserProfileStore((state) => state.updateUiMode);
    const themeMode = useUserProfileStore((state) => state.profile.themeMode || 'midnight');
    const updateThemeMode = useUserProfileStore((state) => state.updateThemeMode);
    const windowButtonMode = useUserProfileStore((state) => state.profile.windowButtonMode ?? 'maximize');
    const updateWindowButtonMode = useUserProfileStore((state) => state.updateWindowButtonMode);
    const episodeCardBgType = useUserProfileStore((state) => state.profile.episodeCardBgType || 'glass');
    const episodeCardBgColor = useUserProfileStore((state) => state.profile.episodeCardBgColor || '#121212');
    const updateEpisodeCardBg = useUserProfileStore((state) => state.updateEpisodeCardBg);

    const interfaceZoom = useUserProfileStore((state) => (state.profile.interfaceZoom ?? 100) as InterfaceZoom);
    const updateInterfaceZoom = useUserProfileStore((state) => state.updateInterfaceZoom);

    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [quitOnClose, setQuitOnClose] = useState(true);
    const [escExitFullscreen, setEscExitFullscreen] = useState(false);
    // Tracks whether the modal was closed via "Select" (not cancel/ESC/overlay).
    // Prevents the onClose revert from running when closing after a successful commit.
    const didSelectRef = useRef(false);

    return (
        <div className="interface-tab-content">
            <h2 className="interface-section-title">Interface</h2>

            <div className="interface-settings-list">
                {/* 1. Navigation Alignment (Top aligned vs Left aligned) */}
                <div className="interface-setting-row">
                    <span className="interface-setting-label">Navigation alignment</span>
                    <div className="interface-pill-selector">
                        <button
                            type="button"
                            className={`interface-pill-btn ${uiMode === 'top-aligned' ? 'active' : ''}`}
                            onClick={() => updateUiMode('top-aligned')}
                        >
                            Top aligned
                        </button>
                        <button
                            type="button"
                            className={`interface-pill-btn ${uiMode === 'left-aligned' ? 'active' : ''}`}
                            onClick={() => updateUiMode('left-aligned')}
                        >
                            Left aligned
                        </button>
                    </div>
                </div>

                {/* 2. Theme (Midnight Black vs Pitch Black) */}
                <div className="interface-setting-row">
                    <span className="interface-setting-label">Theme</span>
                    <div className="interface-pill-selector">
                        <button
                            type="button"
                            className={`interface-pill-btn ${themeMode === 'midnight' ? 'active' : ''}`}
                            onClick={() => updateThemeMode('midnight')}
                        >
                            Midnight Black
                        </button>
                        <button
                            type="button"
                            className={`interface-pill-btn ${themeMode === 'pitch' ? 'active' : ''}`}
                            onClick={() => updateThemeMode('pitch')}
                        >
                            Pitch Black
                        </button>
                    </div>
                </div>

                {/* 2. Window button action (Maximize vs Fullscreen) */}
                <div className="interface-setting-row">
                    <span className="interface-setting-label">Window button action</span>
                    <div className="interface-pill-selector">
                        <button
                            type="button"
                            className={`interface-pill-btn ${windowButtonMode === 'maximize' ? 'active' : ''}`}
                            onClick={() => updateWindowButtonMode('maximize' as WindowButtonMode)}
                        >
                            Maximize
                        </button>
                        <button
                            type="button"
                            className={`interface-pill-btn ${windowButtonMode === 'fullscreen' ? 'active' : ''}`}
                            onClick={() => updateWindowButtonMode('fullscreen' as WindowButtonMode)}
                        >
                            Fullscreen
                        </button>
                    </div>
                </div>

                {/* 3. Episode Card Design (Glassmorphism vs Solid) */}
                <div className="interface-setting-row">
                    <span className="interface-setting-label">Episode card design</span>
                    <div className="interface-pill-selector">
                        <button
                            type="button"
                            className={`interface-pill-btn ${episodeCardBgType === 'glass' ? 'active' : ''}`}
                            onClick={() => updateEpisodeCardBg('glass')}
                        >
                            Glassmorphism
                        </button>
                        <button
                            type="button"
                            className={`interface-pill-btn ${episodeCardBgType === 'solid' ? 'active' : ''}`}
                            onClick={() => {
                                const validColor =
                                    episodeCardBgColor && !episodeCardBgColor.startsWith('rgba(255, 255, 255')
                                        ? episodeCardBgColor
                                        : '#181824';
                                updateEpisodeCardBg('solid', validColor);
                            }}
                        >
                            Solid
                        </button>
                    </div>
                </div>

                {/* 3. Conditional: Episode Card Background Color (When Solid is selected) */}
                {episodeCardBgType === 'solid' && (
                    <div className="interface-setting-row interface-setting-row-sub anim-slide-down">
                        <span className="interface-setting-label">Episode card background color</span>
                        <button
                            type="button"
                            className="interface-color-pill-btn"
                            style={{ backgroundColor: episodeCardBgColor }}
                            onClick={() => setIsColorPickerOpen(true)}
                            aria-label={`Episode card background color: ${episodeCardBgColor}. Click to choose color`}
                            title="Click to choose color"
                        />
                    </div>
                )}

                {/* 4. Quit on close */}
                <div className="interface-setting-row">
                    <span className="interface-setting-label">Quit on close</span>
                    <ToggleSwitch
                        checked={quitOnClose}
                        onChange={setQuitOnClose}
                        ariaLabel="Quit on close"
                    />
                </div>

                {/* 5. Escape key exit full screen */}
                <div className="interface-setting-row">
                    <span className="interface-setting-label">Escape key exit full screen</span>
                    <ToggleSwitch
                        checked={escExitFullscreen}
                        onChange={setEscExitFullscreen}
                        ariaLabel="Escape key exit full screen"
                    />
                </div>

                {/* 6. Interface Zoom */}
                <ZoomSlider value={interfaceZoom} onChange={updateInterfaceZoom} />

            </div>

            {/* Episode Card Color Picker Modal */}
            <ColorPickerModal
                isOpen={isColorPickerOpen}
                initialColor={episodeCardBgColor}
                onClose={() => {
                    if (!didSelectRef.current) {
                        // Cancelled (ESC / overlay / X) — revert live preview to last committed color
                        applyEpisodeCardCssVariables('solid', episodeCardBgColor);
                    }
                    didSelectRef.current = false;
                    setIsColorPickerOpen(false);
                }}
                onChange={(liveColor) => {
                    // Live CSS preview only — no store write to avoid feedback loop
                    applyEpisodeCardCssVariables('solid', liveColor);
                }}
                onSelect={(newColor) => {
                    // Commit to store; mark that this close is a confirm, not a cancel
                    didSelectRef.current = true;
                    updateEpisodeCardBg('solid', newColor);
                    setIsColorPickerOpen(false);
                }}
            />
        </div>
    );
};
