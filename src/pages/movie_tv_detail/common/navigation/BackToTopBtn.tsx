import React, { useState, useEffect, useCallback } from 'react';
import './BackToTopBtn.css';

export interface BackToTopBtnProps {
    threshold?: number;
}

export const BackToTopBtn: React.FC<BackToTopBtnProps> = ({ threshold = 400 }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const shouldShow = window.scrollY > threshold;
                    setIsVisible((prev) => (prev !== shouldShow ? shouldShow : prev));
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        // Initial check in case user loaded scrolled
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [threshold]);

    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    if (!isVisible) {
        return null;
    }

    return (
        <button
            type="button"
            className="back-to-top-btn"
            onClick={scrollToTop}
            aria-label="Back to top"
            title="Back to top"
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M18 15l-6-6-6 6" />
            </svg>
        </button>
    );
};
