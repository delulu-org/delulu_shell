import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HSVA, parseColor, formatColorString, hsvToRgb } from './colorUtils';
import './ColorPickerModal.css';

interface ColorPickerModalProps {
    isOpen: boolean;
    initialColor?: string;
    onClose: () => void;
    onSelect: (color: string) => void;
    onChange?: (color: string) => void;
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
    isOpen,
    initialColor = '#181824',
    onClose,
    onSelect,
    onChange,
}) => {
    // Use a ref to track what the MODAL was opened with, so live onChange
    // callbacks never cause the initialColor prop to feed back and reset the picker
    const openColorRef = useRef(initialColor);
    const [hsva, setHsva] = useState<HSVA>(() => parseColor(initialColor));

    const satValRef = useRef<HTMLDivElement>(null);
    const hueRef = useRef<HTMLDivElement>(null);
    const alphaRef = useRef<HTMLDivElement>(null);

    // Keep onChange in a ref so callbacks inside useCallback don't go stale
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const [isDraggingSatVal, setIsDraggingSatVal] = useState(false);
    const [isDraggingHue, setIsDraggingHue] = useState(false);
    const [isDraggingAlpha, setIsDraggingAlpha] = useState(false);

    // Sync ONLY when modal transitions from closed → open.
    // Capture the color that was active at open time (openColorRef) so that
    // subsequent store updates (from our own onChange callbacks) don't re-seed the picker.
    const wasOpenRef = useRef(false);
    useEffect(() => {
        if (isOpen && !wasOpenRef.current) {
            // Modal just opened — lock in the color from initialColor (preserving alpha: 0 for transparent)
            openColorRef.current = initialColor;
            setHsva(parseColor(initialColor));
        }
        wasOpenRef.current = isOpen;
    }, [isOpen, initialColor]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Safety global pointer up
    useEffect(() => {
        const handleGlobalPointerUp = () => {
            setIsDraggingSatVal(false);
            setIsDraggingHue(false);
            setIsDraggingAlpha(false);
        };
        window.addEventListener('pointerup', handleGlobalPointerUp);
        return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
    }, []);

    // Helper to emit hsva change upward without triggering a re-seed
    const emitChange = useCallback((next: HSVA) => {
        const colorStr = formatColorString(next);
        onChangeRef.current?.(colorStr);
        return next;
    }, []);

    // ----------------------------------------------------
    // 1. Saturation & Value (2D Canvas) Drag Handling
    // ----------------------------------------------------
    const updateSatVal = useCallback((clientX: number, clientY: number) => {
        if (!satValRef.current) return;
        const rect = satValRef.current.getBoundingClientRect();
        const pad = 9;
        const availableW = Math.max(1, rect.width - pad * 2);
        const availableH = Math.max(1, rect.height - pad * 2);

        const x = Math.max(0, Math.min(availableW, clientX - rect.left - pad));
        const y = Math.max(0, Math.min(availableH, clientY - rect.top - pad));

        const s = Math.round((x / availableW) * 100);
        const v = Math.round((1 - y / availableH) * 100);

        setHsva((prev) => {
            const next = { ...prev, s, v };
            emitChange(next);
            return next;
        });
    }, [emitChange]);

    const handleSatValPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
        setIsDraggingSatVal(true);
        updateSatVal(e.clientX, e.clientY);
    };
    const handleSatValPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isDraggingSatVal) updateSatVal(e.clientX, e.clientY);
    };
    const handleSatValPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDraggingSatVal(false);
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    };

    // ----------------------------------------------------
    // 2. Hue Slider Drag Handling
    // ----------------------------------------------------
    const updateHue = useCallback((clientX: number) => {
        if (!hueRef.current) return;
        const rect = hueRef.current.getBoundingClientRect();
        const pad = 9;
        const availableW = Math.max(1, rect.width - pad * 2);
        const x = Math.max(0, Math.min(availableW, clientX - rect.left - pad));
        const h = Math.round((x / availableW) * 360) % 360;

        setHsva((prev) => {
            const next = { ...prev, h };
            emitChange(next);
            return next;
        });
    }, [emitChange]);

    const handleHuePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
        setIsDraggingHue(true);
        updateHue(e.clientX);
    };
    const handleHuePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isDraggingHue) updateHue(e.clientX);
    };
    const handleHuePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDraggingHue(false);
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    };

    // ----------------------------------------------------
    // 3. Alpha Slider Drag Handling
    // ----------------------------------------------------
    const updateAlpha = useCallback((clientX: number) => {
        if (!alphaRef.current) return;
        const rect = alphaRef.current.getBoundingClientRect();
        const pad = 9;
        const availableW = Math.max(1, rect.width - pad * 2);
        const x = Math.max(0, Math.min(availableW, clientX - rect.left - pad));
        const a = Math.round((x / availableW) * 100) / 100;

        setHsva((prev) => {
            const next = { ...prev, a };
            emitChange(next);
            return next;
        });
    }, [emitChange]);

    const handleAlphaPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
        setIsDraggingAlpha(true);
        updateAlpha(e.clientX);
    };
    const handleAlphaPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (isDraggingAlpha) updateAlpha(e.clientX);
    };
    const handleAlphaPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDraggingAlpha(false);
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    };

    if (!isOpen) return null;

    const [r, g, b] = hsvToRgb(hsva.h, hsva.s, hsva.v);
    const currentColor = formatColorString(hsva);
    const pureHueColor = `hsl(${hsva.h}, 100%, 50%)`;

    const handleConfirm = () => {
        // Only call onSelect — the parent's onSelect handler owns closing the modal.
        // Calling onClose here would fire the stale-closure revert in InterfaceTab
        // immediately AFTER the new color was applied, producing a brief flicker.
        onSelect(currentColor);
    };

    return (
        <div className="color-picker-overlay" onClick={onClose}>
            <div
                className="color-picker-dialog"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Choose a color"
            >
                {/* Header */}
                <div className="color-picker-header">
                    <span className="color-picker-title">Choose a color:</span>
                    <button
                        type="button"
                        className="color-picker-close-btn"
                        onClick={onClose}
                        aria-label="Close color picker"
                    >
                        ✕
                    </button>
                </div>

                {/* 2D Saturation / Value Gradient Canvas */}
                <div
                    ref={satValRef}
                    className="color-picker-canvas-wrapper"
                    onPointerDown={handleSatValPointerDown}
                    onPointerMove={handleSatValPointerMove}
                    onPointerUp={handleSatValPointerUp}
                    onPointerCancel={handleSatValPointerUp}
                >
                    <div
                        className="color-picker-canvas-bg"
                        style={{
                            background: `
                                linear-gradient(to top, #000000 0%, rgba(0, 0, 0, 0) 100%),
                                linear-gradient(to right, #ffffff 0%, ${pureHueColor} 100%)
                            `,
                        }}
                    />
                    <div
                        className="color-picker-canvas-thumb"
                        style={{
                            left: `calc(9px + (${hsva.s} / 100) * (100% - 18px))`,
                            top: `calc(9px + (${100 - hsva.v} / 100) * (100% - 18px))`,
                        }}
                    />
                </div>

                {/* Sliders Area */}
                <div className="color-picker-sliders">
                    {/* Hue Rainbow Slider Track */}
                    <div
                        ref={hueRef}
                        className="color-picker-slider-wrapper"
                        onPointerDown={handleHuePointerDown}
                        onPointerMove={handleHuePointerMove}
                        onPointerUp={handleHuePointerUp}
                        onPointerCancel={handleHuePointerUp}
                    >
                        <div className="color-picker-slider-bar hue-bar" />
                        <div
                            className="color-picker-slider-thumb"
                            style={{
                                left: `calc(9px + (${hsva.h} / 360) * (100% - 18px))`,
                            }}
                        />
                    </div>

                    {/* Alpha Opacity Slider Track with Checkerboard */}
                    <div
                        ref={alphaRef}
                        className="color-picker-slider-wrapper"
                        onPointerDown={handleAlphaPointerDown}
                        onPointerMove={handleAlphaPointerMove}
                        onPointerUp={handleAlphaPointerUp}
                        onPointerCancel={handleAlphaPointerUp}
                    >
                        <div className="color-picker-slider-bar alpha-bar">
                            <div
                                className="alpha-bar-gradient"
                                style={{
                                    background: `linear-gradient(to right, transparent, rgb(${r}, ${g}, ${b}))`,
                                }}
                            />
                        </div>
                        <div
                            className="color-picker-slider-thumb"
                            style={{
                                left: `calc(9px + ${hsva.a} * (100% - 18px))`,
                            }}
                        />
                    </div>
                </div>

                {/* Select Button: Solid White with Crisp Black Text */}
                <button
                    type="button"
                    className="color-picker-select-btn"
                    onClick={handleConfirm}
                >
                    Select
                </button>
            </div>
        </div>
    );
};
