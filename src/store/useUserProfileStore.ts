import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UiMode = 'top-aligned' | 'left-aligned';
export type WindowButtonMode = 'maximize' | 'fullscreen';
export type ThemeMode = 'midnight' | 'pitch';
export type InterfaceZoom = 75 | 100 | 125 | 150 | 175;

export interface UserProfile {
    name: string;
    avatarUrl: string;
    uiMode: UiMode;
    windowButtonMode: WindowButtonMode;
    episodeCardBgType: 'glass' | 'solid';
    episodeCardBgColor: string;
    themeMode: ThemeMode;
    interfaceZoom: InterfaceZoom;
}

interface UserProfileStore {
    profile: UserProfile;
    updateProfile: (name: string, avatarUrl: string) => void;
    updateUiMode: (mode: UiMode) => void;
    updateWindowButtonMode: (mode: WindowButtonMode) => void;
    updateEpisodeCardBg: (type: 'glass' | 'solid', color?: string) => void;
    updateThemeMode: (mode: ThemeMode) => void;
    updateInterfaceZoom: (zoom: InterfaceZoom) => void;
}

import { getCurrentWebview } from '@tauri-apps/api/webview';

let lastAppliedZoom: InterfaceZoom | null = null;

// Apply zoom via Tauri's native WebView2 API.
// This is the identical approach used by Stremio (stremio-shell-ng + stremio-web):
//   - Operates at the OS/WebView2 level via put_zoom_factor
//   - Deduplicates identical zoom requests to avoid redundant IPC calls
//   - Falls back gracefully to CSS zoom on #root for non-Tauri browser previews
export function applyZoom(zoom: InterfaceZoom) {
    if (lastAppliedZoom === zoom) return;
    lastAppliedZoom = zoom;

    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        try {
            getCurrentWebview()
                .setZoom(zoom / 100)
                .catch((err) => {
                    console.warn('Native webview setZoom failed, using fallback:', err);
                    const root = document.getElementById('root');
                    if (root) (root as HTMLElement).style.zoom = zoom === 100 ? '' : String(zoom / 100);
                });
        } catch (err) {
            console.warn('Native getCurrentWebview failed, using fallback:', err);
            const root = document.getElementById('root');
            if (root) (root as HTMLElement).style.zoom = zoom === 100 ? '' : String(zoom / 100);
        }
    } else if (typeof document !== 'undefined') {
        const root = document.getElementById('root');
        if (root) (root as HTMLElement).style.zoom = zoom === 100 ? '' : String(zoom / 100);
    }
}

export function applyThemeCssVariables(mode: ThemeMode) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    if (mode === 'pitch') {
        root.style.setProperty('--color-bg-primary', '#000000');
        root.style.setProperty('--color-bg-rgb', '0, 0, 0');
        root.style.setProperty('--color-bg-hero-fade', 'rgba(0, 0, 0, 0.7)');
        root.style.setProperty('--color-bg-sidebar-cutout', '#000000');
        root.style.setProperty('--color-bg-cast-edge', '#000000');
    } else {
        root.style.setProperty('--color-bg-primary', '#0a0a10');
        root.style.setProperty('--color-bg-rgb', '10, 10, 16');
        root.style.setProperty('--color-bg-hero-fade', 'rgba(10, 10, 16, 0.7)');
        root.style.setProperty('--color-bg-sidebar-cutout', '#0a0a10');
        root.style.setProperty('--color-bg-cast-edge', '#0a0a10');
    }
}

export function applyEpisodeCardCssVariables(type: 'glass' | 'solid', color: string) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (type === 'glass') {
        root.style.setProperty('--episode-card-bg', 'rgba(255, 255, 255, 0.06)');
        root.style.setProperty('--episode-card-hover-bg', 'rgba(255, 255, 255, 0.1)');
        root.style.setProperty('--episode-card-hover-filter', 'none');
        root.style.setProperty('--episode-card-backdrop', 'blur(10px)');
        root.style.setProperty('--episode-card-webkit-backdrop', 'blur(20px)');
        root.style.setProperty('--episode-card-border', '1px solid rgba(255, 255, 255, 0.08)');
    } else {
        const solidColor =
            !color || color.startsWith('rgba(255, 255, 255') ? '#181824' : color;
        root.style.setProperty('--episode-card-bg', solidColor);
        root.style.setProperty('--episode-card-hover-bg', solidColor);
        root.style.setProperty('--episode-card-hover-filter', 'brightness(1.2)');
        root.style.setProperty('--episode-card-backdrop', 'none');
        root.style.setProperty('--episode-card-webkit-backdrop', 'none');
        root.style.setProperty('--episode-card-border', '1px solid rgba(255, 255, 255, 0.12)');
    }
}

const defaultProfile: UserProfile = {
    name: 'Local User',
    avatarUrl: '',
    uiMode: 'top-aligned',
    windowButtonMode: 'maximize',
    episodeCardBgType: 'glass',
    episodeCardBgColor: '#181824',
    themeMode: 'midnight',
    interfaceZoom: 100,
};

// Initialize CSS variables on module load if document is present
if (typeof document !== 'undefined') {
    applyEpisodeCardCssVariables(defaultProfile.episodeCardBgType, defaultProfile.episodeCardBgColor);
    applyThemeCssVariables(defaultProfile.themeMode);
}


export const useUserProfileStore = create<UserProfileStore>()(
    persist(
        (set) => ({
            profile: defaultProfile,
            updateProfile: (name, avatarUrl) =>
                set((state) => ({ profile: { ...state.profile, name, avatarUrl } })),
            updateUiMode: (mode) =>
                set((state) => ({ profile: { ...state.profile, uiMode: mode } })),
            updateWindowButtonMode: (mode) =>
                set((state) => ({ profile: { ...state.profile, windowButtonMode: mode } })),
            updateThemeMode: (mode) => {
                applyThemeCssVariables(mode);
                set((state) => ({ profile: { ...state.profile, themeMode: mode } }));
            },
            updateInterfaceZoom: (zoom) => {
                // Apply instantly — before React re-renders — so there is zero visual flash
                applyZoom(zoom);
                set((state) => ({ profile: { ...state.profile, interfaceZoom: zoom } }));
            },
            updateEpisodeCardBg: (type, color) =>
                set((state) => {
                    const fallbackColor =
                        state.profile.episodeCardBgColor &&
                        !state.profile.episodeCardBgColor.startsWith('rgba(255, 255, 255')
                            ? state.profile.episodeCardBgColor
                            : '#181824';
                    const newColor = color ?? fallbackColor;
                    applyEpisodeCardCssVariables(type, newColor);
                    return {
                        profile: {
                            ...state.profile,
                            episodeCardBgType: type,
                            episodeCardBgColor: newColor,
                        },
                    };
                }),
        }),
        {
            name: 'delulu-local-profile',
            merge: (persistedState: any, currentState) => {
                const rawMode = persistedState?.profile?.uiMode;
                const uiMode: UiMode =
                    rawMode === 'left-aligned' || rawMode === 'power'
                        ? 'left-aligned'
                        : 'top-aligned';

                const rawWindowMode = persistedState?.profile?.windowButtonMode;
                const windowButtonMode: WindowButtonMode =
                    rawWindowMode === 'fullscreen' ? 'fullscreen' : 'maximize';

                const rawTheme = persistedState?.profile?.themeMode;
                const themeMode: ThemeMode =
                    rawTheme === 'pitch' ? 'pitch' : 'midnight';

                const VALID_ZOOMS: InterfaceZoom[] = [75, 100, 125, 150, 175];
                const rawZoom = persistedState?.profile?.interfaceZoom;
                const interfaceZoom: InterfaceZoom =
                    VALID_ZOOMS.includes(rawZoom) ? rawZoom : 100;

                const mergedProfile: UserProfile = {
                    ...currentState.profile,
                    ...(persistedState?.profile || {}),
                    uiMode,
                    windowButtonMode,
                    themeMode,
                    interfaceZoom,
                };
                applyEpisodeCardCssVariables(
                    mergedProfile.episodeCardBgType || 'glass',
                    mergedProfile.episodeCardBgColor || '#121212'
                );
                applyThemeCssVariables(themeMode);
                applyZoom(interfaceZoom);
                return {
                    ...currentState,
                    ...persistedState,
                    profile: mergedProfile,
                };
            },
        }
    )
);
