import React, { useState, useRef, useEffect } from 'react';
import './CustomSelect.css';

export interface SelectOption {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: (string | SelectOption)[];
    value: string;
    onChange: (val: string) => void;
    ariaLabel?: string;
    className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    value,
    onChange,
    ariaLabel,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Normalize options to { value, label }
    const normalizedOptions: SelectOption[] = options.map((opt) =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
    );

    const selectedOption = normalizedOptions.find((opt) => opt.value === value) || normalizedOptions[0];

    // Close on click outside and escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('pointerdown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div
            className={`delulu-custom-select ${isOpen ? 'open' : ''} ${className}`}
            ref={containerRef}
        >
            <button
                type="button"
                className="delulu-custom-select-trigger"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={ariaLabel || (selectedOption ? selectedOption.label : value)}
            >
                <span className="delulu-custom-select-value">
                    {selectedOption ? selectedOption.label : value}
                </span>
                <svg
                    className={`delulu-custom-select-chevron ${isOpen ? 'rotated' : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="M7 10l5 5 5-5z" />
                </svg>
            </button>

            {isOpen && (
                <div className="delulu-custom-select-menu" role="listbox">
                    <div className="delulu-custom-select-list">
                        {normalizedOptions.map((opt) => {
                            const isSelected = opt.value === value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    className={`delulu-custom-select-option ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleSelect(opt.value)}
                                >
                                    <span>{opt.label}</span>
                                    {isSelected && (
                                        <svg
                                            className="delulu-custom-select-check"
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
