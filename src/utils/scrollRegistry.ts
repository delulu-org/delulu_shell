// Delulu Stream - Global Scroll & Layout State Registry
//
// Maintains exact pixel-perfect scroll positions across route transitions:
// - Vertical route scroll memory for all primary views
// - Horizontal scroll memory for media carousels (Top TV Shows, Movies, Trending, Continue Watching, Cast)
// - Prevents "scroll bleed" (where one view inherits the scroll of another)

const routeScrollRegistry = new Map<string, number>();
const horizontalScrollRegistry = new Map<string, number>();

export function getRouteScroll(pathname: string): number {
    return routeScrollRegistry.get(pathname) ?? 0;
}

export function setRouteScroll(pathname: string, y: number): void {
    routeScrollRegistry.set(pathname, Math.max(0, y));
}

export function getHorizontalScroll(rowId: string): number {
    return horizontalScrollRegistry.get(rowId) ?? 0;
}

export function setHorizontalScroll(rowId: string, scrollLeft: number): void {
    horizontalScrollRegistry.set(rowId, Math.max(0, scrollLeft));
}

export function clearScrollRegistry(): void {
    routeScrollRegistry.clear();
    horizontalScrollRegistry.clear();
}
