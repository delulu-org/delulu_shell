import { Link, useLocation } from 'react-router-dom';
import { Clapperboard, Tv, Calendar, Dices, Bookmark, Settings } from 'lucide-react';
import { WindowControls, SearchButton, ProfileButton } from '../common';
import { AppLogo } from '../../../common_comps/app_logo';
import { preloadRoute } from '../../../utils/routePreload';
import './LeftAlignedNav.css';

const NAV_ICON_SIZE = 24;

function HomeNavIcon({ size = NAV_ICON_SIZE }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="nav-home-icon"
        >
            <path d="M 11.2 3.4 a 1.2 1.2 0 0 0 -0.4 0.5 L 2.6 11.2 a 0.7 0.7 0 0 0 0.5 1.3 H 5.5 V 19 a 1.5 1.5 0 0 0 1.5 1.5 h 2.7 V 14.5 a 1 1 0 0 1 1 -1 h 2.6 a 1 1 0 0 1 1 1 v 6 H 17 a 1.5 1.5 0 0 0 1.5 -1.5 V 12.5 H 20.9 a 0.7 0.7 0 0 0 0.5 -1.3 L 13.2 3.9 a 1.2 1.2 0 0 0 -2 0 Z" />
        </svg>
    );
}

interface LeftAlignedNavProps {
    onSearchClick?: () => void;
    onUserClick?: () => void;
}

export function LeftAlignedNav({ onSearchClick, onUserClick }: LeftAlignedNavProps) {
    const location = useLocation();

    const isActive = (path: string) =>
        location.pathname === path || (path === '/library' && location.pathname.startsWith('/library'));

    const handleNavClick = (path: string) => {
        if (location.pathname === path) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <>
            {/* ── Fixed 68px Left Vertical Sidebar ── */}
            <aside className="power-sidebar" data-tauri-drag-region>
                {/* Brand Logo - Anchored at Top */}
                <div className="sidebar-brand">
                    <AppLogo size="md" />
                </div>

                {/* Nav Links - Vertically Centered in Middle */}
                <nav className="sidebar-nav">
                    <Link
                        to="/"
                        className={`sidebar-link ${isActive('/') ? 'active' : ''}`}
                        title="Home"
                        onClick={() => handleNavClick('/')}
                        onMouseEnter={() => preloadRoute('/')}
                        onFocus={() => preloadRoute('/')}
                    >
                        <HomeNavIcon size={NAV_ICON_SIZE} />
                    </Link>
                    <Link
                        to="/movies"
                        className={`sidebar-link ${isActive('/movies') ? 'active' : ''}`}
                        title="Movies"
                        onClick={() => handleNavClick('/movies')}
                        onMouseEnter={() => preloadRoute('/movies')}
                        onFocus={() => preloadRoute('/movies')}
                    >
                        <Clapperboard size={NAV_ICON_SIZE} strokeWidth={1.8} />
                    </Link>
                    <Link
                        to="/tv-shows"
                        className={`sidebar-link ${isActive('/tv-shows') ? 'active' : ''}`}
                        title="TV Shows"
                        onClick={() => handleNavClick('/tv-shows')}
                        onMouseEnter={() => preloadRoute('/tv-shows')}
                        onFocus={() => preloadRoute('/tv-shows')}
                    >
                        <Tv size={NAV_ICON_SIZE} strokeWidth={1.8} />
                    </Link>
                    <Link
                        to="/calendar"
                        className={`sidebar-link ${isActive('/calendar') ? 'active' : ''}`}
                        title="Calendar"
                        onClick={() => handleNavClick('/calendar')}
                    >
                        <Calendar size={NAV_ICON_SIZE} strokeWidth={1.8} />
                    </Link>
                    <Link
                        to="/random"
                        className={`sidebar-link ${isActive('/random') ? 'active' : ''}`}
                        title="Random"
                        onClick={() => handleNavClick('/random')}
                    >
                        <Dices size={NAV_ICON_SIZE} strokeWidth={1.8} />
                    </Link>
                    <Link
                        to="/library"
                        className={`sidebar-link ${isActive('/library') ? 'active' : ''}`}
                        title="Library"
                        onClick={() => handleNavClick('/library')}
                    >
                        <Bookmark size={NAV_ICON_SIZE} strokeWidth={1.8} />
                    </Link>
                </nav>

                {/* Settings Icon - Anchored at Bottom */}
                <div className="sidebar-bottom">
                    <Link
                        to="/settings"
                        state={{ tab: 'profile' }}
                        className={`sidebar-link ${location.pathname === '/settings' && ((location.state as any)?.tab === 'profile' || !(location.state as any)?.tab) ? 'active' : ''}`}
                        title="Settings"
                    >
                        <Settings size={NAV_ICON_SIZE} strokeWidth={1.8} />
                    </Link>
                </div>
            </aside>

            {/* ── Top Bar with Window Drag Region & Solid Black Punchhole Pill ── */}
            <header className="power-top-bar">
                <div className="power-top-drag-region" data-tauri-drag-region />
                <div className="power-floating-pill">
                    <SearchButton onClick={onSearchClick} />
                    <ProfileButton onClick={onUserClick} />
                    <WindowControls />
                </div>
            </header>
        </>
    );
}
