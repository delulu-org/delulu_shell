import { useState, useEffect } from 'react';

/**
 * Extracts dominant RGB color from an image URL using a 32x32 canvas sample.
 * Uses TMDB w300 small thumbnail matching original tauri.deluluapp implementation.
 * Clamps tone according to page type ('movie' vs 'tv').
 */
export function useDominantColor(
    imageUrl: string | null | undefined,
    fallback: string,
    mode: 'movie' | 'tv' = 'movie'
): string {
    const [toneRgb, setToneRgb] = useState(fallback);

    useEffect(() => {
        if (!imageUrl) {
            setToneRgb(fallback);
            return;
        }

        let cancelled = false;

        // Use w300 thumbnail for fast, reliable color sampling (matching tauri.deluluapp 'small')
        const sampleUrl = imageUrl.replace(/\/w\d+\/|\/original\//, '/w300/');

        const image = new Image();
        image.crossOrigin = 'anonymous';

        const extractColor = () => {
            if (cancelled) return;
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 32;
                canvas.height = 32;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                ctx.drawImage(image, 0, 0, 32, 32);
                const data = ctx.getImageData(0, 0, 32, 32).data;
                let r = 0;
                let g = 0;
                let b = 0;
                const pixelCount = data.length / 4;

                for (let i = 0; i < data.length; i += 4) {
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                }

                if (mode === 'tv') {
                    const tonedR = Math.max(40, Math.min(170, Math.round(r / pixelCount)));
                    const tonedG = Math.max(45, Math.min(170, Math.round(g / pixelCount)));
                    const tonedB = Math.max(60, Math.min(190, Math.round(b / pixelCount)));
                    setToneRgb(`${tonedR}, ${tonedG}, ${tonedB}`);
                } else {
                    const tonedR = Math.max(40, Math.min(190, Math.round(r / pixelCount)));
                    const tonedG = Math.max(30, Math.min(150, Math.round(g / pixelCount)));
                    const tonedB = Math.max(35, Math.min(170, Math.round(b / pixelCount)));
                    setToneRgb(`${tonedR}, ${tonedG}, ${tonedB}`);
                }
            } catch {
                if (!cancelled) setToneRgb(fallback);
            }
        };

        image.onload = extractColor;
        image.onerror = () => {
            if (!cancelled) setToneRgb(fallback);
        };

        image.src = sampleUrl;

        // If the browser already has the image completed, process immediately
        if (image.complete) {
            extractColor();
        }

        return () => {
            cancelled = true;
        };
    }, [imageUrl, fallback, mode]);

    return toneRgb;
}
