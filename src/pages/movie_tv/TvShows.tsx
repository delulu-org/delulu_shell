import { type CSSProperties } from 'react';
import { engineApi } from '../../api/engine';
import { Featured, CuratedRows, DiscoverGrid, BrowseSkeleton } from './common';
import { useBrowseFeed } from './hooks/useBrowseFeed';
import { useDominantColor } from './hooks/useDominantColor';
import { useFeaturedSlide } from './hooks/useFeaturedSlide';
import './BrowsePage.css';

export function TvShows() {
    const { heroes, moodRows, discoverItems, isLoading, isLoadingMore, loadError, hasMore, loadMore } =
        useBrowseFeed({
            sessionKey: 'delulu_tvshows_browse_v1',
            fetchFn: (page) => engineApi.getTvFeed(page),
            errorMessage: 'Could not load more series. Scroll to retry or use the retry button.',
        });

    const slide = useFeaturedSlide(heroes, 'delulu_tvshows_browse_v1');
    const toneRgb = useDominantColor(slide.targetHero?.backdrop_path || slide.targetHero?.poster_path, '82, 103, 138', 'tv');

    if (isLoading) {
        return <BrowseSkeleton isTv />;
    }

    return (
        <div className="browse-page browse-page--tv page" style={{ '--feature-rgb': toneRgb } as CSSProperties}>
            <div className="browse-page__bg" aria-hidden="true" />
            <div className="browse-page__grain" aria-hidden="true" />

            {slide.baseHero && slide.infoHero && (
                <Featured
                    baseHero={slide.baseHero}
                    infoHero={slide.infoHero}
                    onNext={slide.goNext}
                    onPrev={slide.goPrev}
                    textAnimKey={slide.textAnimKey}
                    overlayBackdrop={slide.overlayBackdrop}
                    isCanvasSliding={slide.isCanvasSliding}
                    onCanvasDown={slide.onCanvasDown}
                    onCanvasUp={slide.onCanvasUp}
                    swipeDidSwipe={slide.swipeDidSwipe}
                />
            )}

            {moodRows.length > 0 && <CuratedRows rows={moodRows} mediaType="tv" />}

            <DiscoverGrid
                items={discoverItems}
                mediaType="tv"
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                loadError={loadError}
                endcapLabel="End of curated series catalog for now."
                onLoadMore={loadMore}
            />
        </div>
    );
}
