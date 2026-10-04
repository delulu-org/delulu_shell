import React from 'react';
import './ToggleSwitch.css';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    ariaLabel?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
    checked,
    onChange,
    disabled = false,
    ariaLabel = 'Toggle setting',
}) => {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            disabled={disabled}
            className={`delulu-toggle-switch ${checked ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onChange(!checked)}
        >
            <span className="delulu-toggle-thumb" />
        </button>
    );
};
