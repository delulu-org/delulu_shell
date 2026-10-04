import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WindowControls, SearchButton, ProfileButton } from '../common';
import { AppLogo } from '../../../common_comps/app_logo';
import { preloadRoute } from '../../../utils/routePreload';
import './DefaultNav.css';

const navItems = [
    { path: '/', label: 'Home' },
    { path: '/movies', label: 'Movies' },
    { path: '/tv-shows', label: 'TV Shows' },
    { path: '/calendar', label: 'Calendar' },
    { path: '/random', label: 'Random' },
    { path: '/library', label: 'Library' },
];

interface DefaultNavProps {
    onSearchClick?: () => void;
    onUserClick?: () => void;
}

export function DefaultNav({ onSearchClick, onUserClick }: DefaultNavProps) {
    const location = useLocation();
    const [scrollState, setScrollState] = useState<'top' | 'scrolled' | 'deep'>('top');

    useEffect(() => {
        let frameId: number | null = null;
        let lastState: 'top' | 'scrolled' | 'deep' = 'top';

        const updateState = (y: number) => {
            const nextState: 'top' | 'scrolled' | 'deep' = y <= 10 ? 'top' : y <= 120 ? 'scrolled' : 'deep';
            if (nextState !== lastState) {
                lastState = nextState;
                setScrollState(nextState);
            }
        };

        const handleScroll = () => {
            if (frameId !== null) return;
            frameId = requestAnimationFrame(() => {
                updateState(window.scrollY);
                frameId = null;
            });
        };

        const handleOverlayScroll = (e: Event) => {
            const y = (e as CustomEvent<number>).detail;
            if (frameId !== null) return;
            frameId = requestAnimationFrame(() => {
                updateState(y);
                frameId = null;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('delulu-overlay-scroll', handleOverlayScroll);
        updateState(window.scrollY);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('delulu-overlay-scroll', handleOverlayScroll);
            if (frameId !== null) cancelAnimationFrame(frameId);
        };
    }, []);

    return (
        <nav className={`navbar ${scrollState !== 'top' ? `navbar-${scrollState}` : ''}`}>
            {/* Drag region for window movement */}
            <div className="navbar-drag-region" data-tauri-drag-region />

            {/* Left - App Logo */}
            <div className="navbar-left">
                <AppLogo size="md" />
            </div>

            {/* Center - Menu */}
            <ul className="navbar-menu">
                {navItems.map((item) => (
                    <li key={item.path}>
                        <Link
                            to={item.path}
                            className={`navbar-link ${location.pathname === item.path ? 'navbar-link-active' : ''}`}
                            onClick={() => {
                                if (location.pathname === item.path) {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                            }}
                            onMouseEnter={() => preloadRoute(item.path)}
                            onFocus={() => preloadRoute(item.path)}
                        >
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>

            {/* Right - Icons & Window Controls */}
            <div className="navbar-right">
                <SearchButton onClick={onSearchClick} />
                <ProfileButton onClick={onUserClick} />
                <WindowControls />
            </div>
        </nav>
    );
}
