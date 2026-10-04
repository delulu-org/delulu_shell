import { useState } from 'react';
import { useUserProfileStore } from '../../store/useUserProfileStore';
import { DefaultNav } from './default_nav/DefaultNav';
import { LeftAlignedNav } from './left_aligned_nav/LeftAlignedNav';
import { SearchModal, UserDropdown } from './common';

export function Navigation() {
    const uiMode = useUserProfileStore((state) => state.profile.uiMode);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

    const handleSearchClick = () => {
        setIsSearchOpen(true);
        setIsUserDropdownOpen(false);
    };

    const handleUserClick = () => {
        setIsUserDropdownOpen((prev) => !prev);
        setIsSearchOpen(false);
    };

    return (
        <>
            {uiMode === 'left-aligned' ? (
                <LeftAlignedNav
                    onSearchClick={handleSearchClick}
                    onUserClick={handleUserClick}
                />
            ) : (
                <DefaultNav
                    onSearchClick={handleSearchClick}
                    onUserClick={handleUserClick}
                />
            )}

            <SearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />

            <UserDropdown
                isOpen={isUserDropdownOpen}
                onClose={() => setIsUserDropdownOpen(false)}
            />
        </>
    );
}

export { DefaultNav } from './default_nav/DefaultNav';
export { LeftAlignedNav } from './left_aligned_nav/LeftAlignedNav';
export { RouteScrollManager } from './RouteScrollManager';
export * from './common';
