import React, { useState, useEffect, useRef } from 'react';
import { GeneralTab } from './tabs/GeneralTab';
import { InterfaceTab } from './tabs/InterfaceTab';
import { PlayerTab } from './tabs/PlayerTab';
import { StreamingTab } from './tabs/StreamingTab';
import { ShortcutsTab } from './tabs/ShortcutsTab';
import './Settings.css';

export type SettingsTabId = 'general' | 'interface' | 'player' | 'streaming' | 'shortcuts';

interface TabItem {
    id: SettingsTabId;
    label: string;
}

const TABS: TabItem[] = [
    { id: 'general', label: 'General' },
    { id: 'interface', label: 'Interface' },
    { id: 'player', label: 'Player' },
    { id: 'streaming', label: 'Streaming' },
    { id: 'shortcuts', label: 'Shortcuts' },
];

export const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTabId>('general');
    const isManualScroll = useRef(false);

    const handleTabClick = (tabId: SettingsTabId) => {
        setActiveTab(tabId);
        isManualScroll.current = true;
        const target = document.getElementById(`section-${tabId}`);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => {
                isManualScroll.current = false;
            }, 800);
        }
    };

    // ScrollSpy to highlight the active section on scroll
    useEffect(() => {
        const handleScroll = () => {
            if (isManualScroll.current) return;
            const sections = TABS.map((t) => document.getElementById(`section-${t.id}`)).filter(Boolean);
            const scrollPos = window.scrollY + 180;

            for (let i = sections.length - 1; i >= 0; i--) {
                const sec = sections[i];
                if (sec && sec.offsetTop <= scrollPos) {
                    const id = sec.id.replace('section-', '') as SettingsTabId;
                    setActiveTab(id);
                    break;
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="settings-page">
            <div className="settings-layout">
                {/* Left Sidebar Sub-tabs & Footer */}
                <aside className="settings-sidebar">
                    <nav className="settings-nav-list" aria-label="Settings navigation">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    className={`settings-tab-btn ${isActive ? 'active' : ''}`}
                                    onClick={() => handleTabClick(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Bottom Metadata Matching Screenshot */}
                    <div className="settings-sidebar-footer">
                        <div className="settings-meta-item">App Version: 1.0.0</div>
                        <div className="settings-meta-item">Build: bd312845f820a...</div>
                        <div className="settings-meta-item">Engine: delulu_core</div>
                        <div className="settings-meta-item">Shell Version: 1.0.0</div>
                    </div>
                </aside>

                {/* Single Continuous Scrollable Content Area */}
                <main className="settings-content-wrapper">
                    <div className="settings-content-column">
                        {/* Section 1: General */}
                        <section id="section-general" className="settings-scroll-section">
                            <GeneralTab />
                        </section>

                        {/* Section Divider */}
                        <div className="settings-continuous-divider" />

                        {/* Section 2: Interface */}
                        <section id="section-interface" className="settings-scroll-section">
                            <InterfaceTab />
                        </section>

                        {/* Section Divider */}
                        <div className="settings-continuous-divider" />

                        {/* Section 3: Player */}
                        <section id="section-player" className="settings-scroll-section">
                            <PlayerTab />
                        </section>

                        {/* Section Divider */}
                        <div className="settings-continuous-divider" />

                        {/* Section 4: Streaming */}
                        <section id="section-streaming" className="settings-scroll-section">
                            <StreamingTab />
                        </section>

                        {/* Section Divider */}
                        <div className="settings-continuous-divider" />

                        {/* Section 5: Shortcuts */}
                        <section id="section-shortcuts" className="settings-scroll-section">
                            <ShortcutsTab />
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Settings;
