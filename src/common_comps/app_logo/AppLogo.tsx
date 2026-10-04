import React from 'react';
import { Link } from 'react-router-dom';
import './AppLogo.css';

export interface AppLogoProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
    size = 'md',
    className = '',
}) => {
    return (
        <Link
            to="/"
            className={`app-logo app-logo--${size} ${className}`}
            title="Delulu Stream"
        >
            <img
                src="/icon.png"
                alt="Delulu Logo"
                className="app-logo-icon"
            />
        </Link>
    );
};

export default AppLogo;
