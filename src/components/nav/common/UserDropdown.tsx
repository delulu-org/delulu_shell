import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserProfileStore } from '../../../store/useUserProfileStore';
import './UserDropdown.css';

interface UserDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UserDropdown({ isOpen, onClose }: UserDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const profile = useUserProfileStore((state) => state.profile);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement | null;
            // If clicking the profile button itself, let the button's toggle handler close it
            if (target?.closest('[data-profile-btn]') || target?.closest('.profile-nav-btn')) {
                return;
            }
            if (dropdownRef.current && !dropdownRef.current.contains(target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const handleGoToSettings = () => {
        navigate('/settings');
        onClose();
    };

    const handleGoToWatchlist = () => {
        navigate('/library?tab=watchlist');
        onClose();
    };

    const handleGoToFavorites = () => {
        navigate('/library?tab=favorites');
        onClose();
    };


    if (!isOpen) return null;

    return (
        <div className="user-dropdown" ref={dropdownRef}>
            <div className="user-dropdown-header">
                <div className="user-dropdown-avatar">
                    {profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                        <span>{profile.name.charAt(0).toUpperCase()}</span>
                    )}
                </div>
                <div className="user-dropdown-info" style={{ display: 'flex', alignItems: 'center' }}>
                    <p className="user-dropdown-name" style={{ margin: 0 }}>{profile.name}</p>
                </div>
            </div>
            <div className="user-dropdown-menu">
                <button className="user-dropdown-item" onClick={handleGoToWatchlist}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="user-dropdown-icon">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    Watchlist
                </button>
                <button className="user-dropdown-item" onClick={handleGoToFavorites}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="user-dropdown-icon">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    Favorites
                </button>
                <button className="user-dropdown-item" onClick={handleGoToSettings}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="user-dropdown-icon">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Settings
                </button>
            </div>
        </div>
    );
}
