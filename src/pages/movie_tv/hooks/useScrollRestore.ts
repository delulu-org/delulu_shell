import { useEffect, useRef } from 'react';

const scrollCacheByRoute: Record<string, number> = {};

/**
 * Saves and restores scroll position keyed by a route string.
 * On mount: restores from sessionStorage or module-level cache.
 * On unmount: saves current scrollY.
 */
export function useScrollRestore(route: string) {
    const scrollKey = `delulu-scroll:${route}`;
    const hasRestoredRef = useRef(false);

    useEffect(() => {
        if (hasRestoredRef.current) return;

        let targetY = scrollCacheByRoute[route] ?? 0;
        try {
            const p = sessionStorage.getItem(scrollKey);
            if (p) { const n = parseInt(p, 10); if (Number.isFinite(n) && n > 0) targetY = Math.max(targetY, n); }
        } catch { /* ignore */ }

        if (targetY > 0) requestAnimationFrame(() => { window.scrollTo(0, targetY); });
        hasRestoredRef.current = true;

        return () => {
            const y = window.scrollY;
            scrollCacheByRoute[route] = y;
            try { sessionStorage.setItem(scrollKey, String(y)); } catch { /* ignore */ }
        };
    }, [route, scrollKey]);
}
