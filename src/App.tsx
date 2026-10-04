import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation, RouteScrollManager } from './components/nav';
import { Home } from './pages/home';
import { BrowseSkeleton } from './pages/movie_tv/common';
import { DetailsSkeleton } from './pages/movie_tv_detail';
import { initIdleRoutePreload } from './utils/routePreload';
import { useUserProfileStore, applyEpisodeCardCssVariables, applyThemeCssVariables } from './store/useUserProfileStore';
import './styles/index.css';

// Lazy-load secondary tabs on demand, pre-warmed during idle time
const Movies = lazy(() => import('./pages/movie_tv/Movies').then((m) => ({ default: m.Movies })));
const TvShows = lazy(() => import('./pages/movie_tv/TvShows').then((m) => ({ default: m.TvShows })));
const Random = lazy(() => import('./pages/random').then((m) => ({ default: m.Random })));
const DetailsPage = lazy(() => import('./pages/movie_tv_detail').then((m) => ({ default: m.DetailsPage })));
const Settings = lazy(() => import('./pages/settings').then((m) => ({ default: m.Settings })));

export default function App() {
    const uiMode = useUserProfileStore((state) => state.profile.uiMode);
    const themeMode = useUserProfileStore((state) => state.profile.themeMode);
    const episodeCardBgType = useUserProfileStore((state) => state.profile.episodeCardBgType);
    const episodeCardBgColor = useUserProfileStore((state) => state.profile.episodeCardBgColor);

    useEffect(() => {
        applyEpisodeCardCssVariables(episodeCardBgType || 'glass', episodeCardBgColor || '#121212');
    }, [episodeCardBgType, episodeCardBgColor]);

    useEffect(() => {
        applyThemeCssVariables(themeMode || 'midnight');
    }, [themeMode]);

    useEffect(() => {
        // Pre-warm primary tabs in background idle time for zero-latency clicks without RAM bloat
        initIdleRoutePreload();
    }, []);

    return (
        <HashRouter>
            <RouteScrollManager />
            <Navigation />
            <main className={`app-main-content ${uiMode === 'left-aligned' ? 'power-mode-active' : ''}`}>
                <Routes>
                    {/* Home is the landing view: mounted immediately with zero ghost-skeleton flicker */}
                    <Route path="/" element={<Home />} />

                    {/* Secondary views: scoped to their own exact skeleton fallbacks */}
                    <Route
                        path="/movies"
                        element={
                            <Suspense fallback={<BrowseSkeleton />}>
                                <Movies />
                            </Suspense>
                        }
                    />
                    <Route
                        path="/tv-shows"
                        element={
                            <Suspense fallback={<BrowseSkeleton isTv />}>
                                <TvShows />
                            </Suspense>
                        }
                    />
                    <Route
                        path="/random"
                        element={
                            <Suspense fallback={<div className="random-page" />}>
                                <Random />
                            </Suspense>
                        }
                    />
                    <Route
                        path="/details/:mediaType/:id"
                        element={
                            <Suspense fallback={<DetailsSkeleton />}>
                                <DetailsPage />
                            </Suspense>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <Suspense fallback={<div className="settings-page" />}>
                                <Settings />
                            </Suspense>
                        }
                    />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </HashRouter>
    );
}
