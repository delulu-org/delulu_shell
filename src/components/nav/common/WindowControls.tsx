import { useState, useEffect, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useUserProfileStore } from '../../../store/useUserProfileStore';
import './WindowControls.css';

interface WindowControlsProps {
    className?: string;
}

export function WindowControls({ className = '' }: WindowControlsProps) {
    const [isMaximized, setIsMaximized] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const checkInFlight = useRef(false);

    const windowButtonMode = useUserProfileStore(
        (state) => state.profile.windowButtonMode ?? 'maximize'
    );

    useEffect(() => {
        const appWindow = getCurrentWindow();
        const checkState = async () => {
            if (checkInFlight.current) return;
            checkInFlight.current = true;
            try {
                const [maximized, fullscreen] = await Promise.all([
                    appWindow.isMaximized(),
                    appWindow.isFullscreen(),
                ]);
                setIsMaximized(maximized);
                setIsFullscreen(fullscreen);
            } catch { /* ignore */ } finally {
                checkInFlight.current = false;
            }
        };
        checkState();

        let timer: ReturnType<typeof setTimeout> | null = null;
        const unlisten = appWindow.onResized(() => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => { checkState(); }, 100);
        });

        return () => {
            if (timer) clearTimeout(timer);
            unlisten.then(fn => fn());
        };
    }, []);

    const handleMinimize = async () => {
        try { await getCurrentWindow().minimize(); } catch { /* ignore */ }
    };

    const actionInFlight = useRef(false);

    const handleMiddleButton = async () => {
        // Guard against rapid double-clicks racing each other
        if (actionInFlight.current) return;
        actionInFlight.current = true;
        try {
            const appWindow = getCurrentWindow();
            if (windowButtonMode === 'fullscreen') {
                const fs = await appWindow.isFullscreen();
                await appWindow.setFullscreen(!fs);
                setIsFullscreen(!fs);
                // Don't re-query isMaximized here — fullscreen and maximize are
                // independent states; the onResized listener will reconcile both.
            } else {
                await appWindow.toggleMaximize();
                const maximized = await appWindow.isMaximized();
                setIsMaximized(maximized);
            }
        } catch { /* ignore */ } finally {
            actionInFlight.current = false;
        }
    };

    const handleClose = async () => {
        try { await getCurrentWindow().close(); } catch { /* ignore */ }
    };

    // Determine the icon/label for the middle button based on mode + state
    const middleIsActive = windowButtonMode === 'fullscreen' ? isFullscreen : isMaximized;

    return (
        <div className={`navbar-window-controls ${className}`}>
            <button
                className="navbar-window-btn"
                onClick={handleMinimize}
                aria-label="Minimize"
            >
                <svg width="10" height="10" viewBox="0 0 10 10">
                    <rect y="4" width="10" height="1.5" fill="currentColor" />
                </svg>
            </button>
            <button
                className="navbar-window-btn"
                onClick={handleMiddleButton}
                aria-label={
                    windowButtonMode === 'fullscreen'
                        ? (isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen')
                        : (isMaximized ? 'Restore' : 'Maximize')
                }
            >
                {windowButtonMode === 'fullscreen' ? (
                    /* Fullscreen mode: show two-arrow expand / compress icon */
                    isFullscreen ? (
                        // Compress icon (exit fullscreen)
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M3.5 0v3.5H0M6.5 0v3.5H10M3.5 10V6.5H0M6.5 10V6.5H10"
                                stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                    ) : (
                        // Expand icon (enter fullscreen)
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M0 3.5V0h3.5M10 3.5V0H6.5M0 6.5V10h3.5M10 6.5V10H6.5"
                                stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                    )
                ) : (
                    /* Maximize mode: classic square / restore icon */
                    middleIsActive ? (
                        <svg width="10" height="10" viewBox="0 0 10 10">
                            <path d="M2 0h8v8h-2v2H0V2h2V0zm6 1.5H3v5h5v-5z" fill="currentColor" />
                        </svg>
                    ) : (
                        <svg width="10" height="10" viewBox="0 0 10 10">
                            <rect x="0.5" y="0.5" width="9" height="9"
                                stroke="currentColor" strokeWidth="1" fill="none" />
                        </svg>
                    )
                )}
            </button>
            <button
                className="navbar-window-btn navbar-window-btn-close"
                onClick={handleClose}
                aria-label="Close"
            >
                <svg width="10" height="10" viewBox="0 0 10 10">
                    <path d="M1 1l8 8M9 1L1 9"
                        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </button>
        </div>
    );
}
