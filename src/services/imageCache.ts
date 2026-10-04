// ==========================================================================
// Image Cache & Session Preload Service
// Clean session-level tracking without dead blob pipeline or memory leaks
// ==========================================================================

const loadedUrls = new Set<string>();

/**
 * Returns true if this image URL was already loaded in this session.
 */
export function isImageCached(url: string): boolean {
    return loadedUrls.has(url);
}

export const isImageLoaded = isImageCached;

/**
 * Mark an image URL as successfully loaded in this session.
 */
export function markImageLoaded(url: string): void {
    if (url) loadedUrls.add(url);
}

/**
 * Returns the URL directly (native Chromium disk/memory cache handles bytes).
 */
export function getCachedImageUrl(originalUrl: string): string {
    return originalUrl;
}

/**
 * Optional image preloader using browser native cache without blob overhead.
 */
export async function cacheImage(url: string): Promise<string> {
    if (!url || loadedUrls.has(url)) return url;
    return new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
            loadedUrls.add(url);
            resolve(url);
        };
        img.onerror = () => resolve(url);
        img.src = url;
    });
}

/**
 * Clear session image cache.
 */
export function clearImageCache(): void {
    loadedUrls.clear();
}

/**
 * Current cache size (count of warm URLs in this session).
 */
export function getImageCacheSize(): number {
    return loadedUrls.size;
}
