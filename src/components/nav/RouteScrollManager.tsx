import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getRouteScroll, setRouteScroll } from '../../utils/scrollRegistry';

/**
 * RouteScrollManager
 * 
 * Provides bulletproof, flicker-free, per-route scroll isolation in Tauri / WebView2:
 * - Real-time scroll position tracking while active on a route (never saves post-unmount!).
 * - Zero "scroll bleed" between routes: switching views instantly isolates scroll.
 * - Exact pixel restoration when navigating back to previously visited pages.
 * - Reactive ResizeObserver watcher: as async rows/cards render and expand document height,
 *   smoothly restores the exact targetY without clamping or stuttering.
 * - /random is strictly locked to 0px (100dvh canvas).
 * - Immediately cancels auto-restoration if user touches mouse wheel/touchpad/keys.
 */
export function RouteScrollManager() {
    const location = useLocation();
    const activeRouteRef = useRef(location.pathname);
    const isProgrammaticScrollRef = useRef(false);
    const activeWatcherRef = useRef<ResizeObserver | null>(null);
    const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cleanupUserListenersRef = useRef<(() => void) | null>(null);

    // Disable browser engine's unpredictable native scroll restoration on mount
    useLayoutEffect(() => {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
    }, []);

    // 1. Continuous real-time scroll recording while user is actively browsing
    useEffect(() => {
        let rafId: number | null = null;

        const handleScroll = () => {
            if (isProgrammaticScrollRef.current) return;
            if (rafId !== null) return;
            rafId = requestAnimationFrame(() => {
                rafId = null;
                if (!isProgrammaticScrollRef.current) {
                    setRouteScroll(activeRouteRef.current, window.scrollY);
                }
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            if (rafId !== null) cancelAnimationFrame(rafId);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // 2. Synchronous scroll restoration on route navigation
    useLayoutEffect(() => {
        const nextPath = location.pathname;

        // Cleanup any previous height watchers
        if (activeWatcherRef.current) {
            activeWatcherRef.current.disconnect();
            activeWatcherRef.current = null;
        }
        if (safetyTimerRef.current) {
            clearTimeout(safetyTimerRef.current);
            safetyTimerRef.current = null;
        }
        if (cleanupUserListenersRef.current) {
            cleanupUserListenersRef.current();
            cleanupUserListenersRef.current = null;
        }

        // Switch active route immediately and lock out programmatic scroll events
        activeRouteRef.current = nextPath;
        isProgrammaticScrollRef.current = true;

        // Determine target position: /random is strictly 0; otherwise fetch saved position
        const targetY = nextPath === '/random' ? 0 : getRouteScroll(nextPath);

        // Immediately apply target scroll before browser paints (instant, zero animation)
        window.scrollTo({
            top: targetY,
            left: 0,
            behavior: 'instant' as ScrollBehavior,
        });

        // Dispatch synthetic scroll event to keep DefaultNav frosted glass state in sync
        window.dispatchEvent(new Event('scroll'));

        const unlockProgrammatic = () => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    isProgrammaticScrollRef.current = false;
                });
            });
        };

        if (targetY === 0) {
            unlockProgrammatic();
            return;
        }

        // If targetY > 0, the DOM might not have rendered all its async rows/cards yet.
        // Observe document height expansions and keep re-applying targetY until content is fully painted.
        let isUserInteracting = false;

        const onUserInteraction = () => {
            isUserInteracting = true;
            if (activeWatcherRef.current) {
                activeWatcherRef.current.disconnect();
                activeWatcherRef.current = null;
            }
            if (safetyTimerRef.current) {
                clearTimeout(safetyTimerRef.current);
                safetyTimerRef.current = null;
            }
            isProgrammaticScrollRef.current = false;
        };

        window.addEventListener('wheel', onUserInteraction, { passive: true, once: true });
        window.addEventListener('touchstart', onUserInteraction, { passive: true, once: true });
        window.addEventListener('keydown', onUserInteraction, { passive: true, once: true });

        cleanupUserListenersRef.current = () => {
            window.removeEventListener('wheel', onUserInteraction);
            window.removeEventListener('touchstart', onUserInteraction);
            window.removeEventListener('keydown', onUserInteraction);
        };

        const tryRestore = () => {
            if (isUserInteracting) return;
            const scrollableDist = document.documentElement.scrollHeight - window.innerHeight;

            if (scrollableDist >= targetY) {
                window.scrollTo({ top: targetY, left: 0, behavior: 'instant' as ScrollBehavior });
                window.dispatchEvent(new Event('scroll'));
                if (Math.abs(window.scrollY - targetY) <= 1) {
                    if (activeWatcherRef.current) {
                        activeWatcherRef.current.disconnect();
                        activeWatcherRef.current = null;
                    }
                    unlockProgrammatic();
                }
            } else if (scrollableDist > 0) {
                window.scrollTo({ top: scrollableDist, left: 0, behavior: 'instant' as ScrollBehavior });
            }
        };

        const observer = new ResizeObserver(tryRestore);
        observer.observe(document.documentElement);
        observer.observe(document.body);
        activeWatcherRef.current = observer;

        requestAnimationFrame(tryRestore);

        // Maximum safety guard: stop observing after 1200ms
        safetyTimerRef.current = setTimeout(() => {
            if (activeWatcherRef.current) {
                activeWatcherRef.current.disconnect();
                activeWatcherRef.current = null;
            }
            if (cleanupUserListenersRef.current) {
                cleanupUserListenersRef.current();
                cleanupUserListenersRef.current = null;
            }
            unlockProgrammatic();
        }, 1200);

        return () => {
            if (activeWatcherRef.current) {
                activeWatcherRef.current.disconnect();
                activeWatcherRef.current = null;
            }
            if (safetyTimerRef.current) {
                clearTimeout(safetyTimerRef.current);
                safetyTimerRef.current = null;
            }
            if (cleanupUserListenersRef.current) {
                cleanupUserListenersRef.current();
                cleanupUserListenersRef.current = null;
            }
        };
    }, [location.pathname]);

    return null;
}
