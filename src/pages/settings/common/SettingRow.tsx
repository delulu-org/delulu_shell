import React from 'react';
import './SettingRow.css';

interface SettingRowProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export const SettingRow: React.FC<SettingRowProps> = ({ title, description, children }) => {
    return (
        <div className="settings-row">
            <div className="settings-row-info">
                <span className="settings-row-title">{title}</span>
                {description && <span className="settings-row-desc">{description}</span>}
            </div>
            {children && <div className="settings-row-control">{children}</div>}
        </div>
    );
};
