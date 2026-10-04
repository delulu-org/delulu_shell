import React from 'react';
import './ShortcutsTab.css';

interface ShortcutElement {
    type: 'key' | 'operator' | 'text';
    value: string;
}

interface ShortcutItem {
    action: string;
    elements: ShortcutElement[];
}

const PLAYER_SHORTCUTS: ShortcutItem[] = [
    {
        action: 'Play / Pause',
        elements: [{ type: 'key', value: 'Space' }],
    },
    {
        action: 'Seek forward',
        elements: [
            { type: 'key', value: '→' },
            { type: 'text', value: 'or' },
            { type: 'key', value: 'Shift' },
            { type: 'operator', value: '+' },
            { type: 'key', value: 'Scroll Up' },
        ],
    },
    {
        action: 'Seek backward',
        elements: [
            { type: 'key', value: '←' },
            { type: 'text', value: 'or' },
            { type: 'key', value: 'Shift' },
            { type: 'operator', value: '+' },
            { type: 'key', value: 'Scroll Down' },
        ],
    },
    {
        action: 'Increase volume',
        elements: [
            { type: 'key', value: '↑' },
            { type: 'text', value: 'or' },
            { type: 'key', value: 'Scroll Up' },
        ],
    },
    {
        action: 'Decrease volume',
        elements: [
            { type: 'key', value: '↓' },
            { type: 'text', value: 'or' },
            { type: 'key', value: 'Scroll Down' },
        ],
    },
    {
        action: 'Toggle mute',
        elements: [{ type: 'key', value: 'M' }],
    },
    {
        action: 'Zoom in player',
        elements: [
            { type: 'key', value: 'Ctrl' },
            { type: 'operator', value: '+' },
            { type: 'key', value: 'Scroll Up' },
        ],
    },
    {
        action: 'Zoom out player',
        elements: [
            { type: 'key', value: 'Ctrl' },
            { type: 'operator', value: '+' },
            { type: 'key', value: 'Scroll Down' },
        ],
    },
    {
        action: 'Exit fullscreen / Go back',
        elements: [{ type: 'key', value: 'Esc' }],
    },
];

export const ShortcutsTab: React.FC = () => {
    return (
        <div className="shortcuts-tab-content">
            <h2 className="shortcuts-section-title">Shortcuts</h2>
            <h3 className="shortcuts-group-title">Player</h3>

            <div className="shortcuts-list">
                {PLAYER_SHORTCUTS.map((item, idx) => (
                    <div key={idx} className="shortcuts-row">
                        <span className="shortcuts-action">{item.action}</span>

                        <div className="shortcuts-keys-container">
                            {item.elements.map((el, elIdx) => {
                                if (el.type === 'key') {
                                    return (
                                        <kbd key={elIdx} className="shortcuts-key">
                                            {el.value}
                                        </kbd>
                                    );
                                }
                                if (el.type === 'operator') {
                                    return (
                                        <span key={elIdx} className="shortcuts-operator">
                                            {el.value}
                                        </span>
                                    );
                                }
                                return (
                                    <span key={elIdx} className="shortcuts-connector">
                                        {el.value}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
