import { useEffect, useMemo, useRef, useCallback, useState, memo } from 'react';
import { useGesture } from '@use-gesture/react';
import './DomeGallery.css';

export interface ImageItem {
    src: string;
    alt: string;
    id?: number;
    type?: 'movie' | 'tv';
    backdrop?: string;
    title?: string;
    overview?: string | null;
    rating?: number | null;
    release_year?: string | null;
    logo_url?: string | null;
    imdb_rating?: number | null;
}

interface DomeGalleryProps {
    images?: ImageItem[];
    fit?: number;
    fitBasis?: 'auto' | 'min' | 'max' | 'width' | 'height';
    minRadius?: number;
    maxRadius?: number;
    padFactor?: number;
    overlayBlurColor?: string;
    maxVerticalRotationDeg?: number;
    dragSensitivity?: number;
    segments?: number;
    dragDampening?: number;
    imageBorderRadius?: string;
    grayscale?: boolean;
    onImageClick?: (image: ImageItem) => void;
}

const DEFAULTS = {
    maxVerticalRotationDeg: 5,
    dragSensitivity: 20,
    segments: 35
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const wrapAngleSigned = (deg: number) => {
    const a = (((deg + 180) % 360) + 360) % 360;
    return a - 180;
};

interface DomeItem {
    x: number;
    y: number;
    sizeX: number;
    sizeY: number;
    src: string;
    alt: string;
    id?: number;
    type?: 'movie' | 'tv';
    backdrop?: string;
    title?: string;
    overview?: string | null;
    rating?: number | null;
    release_year?: string | null;
    logo_url?: string | null;
    imdb_rating?: number | null;
}

function buildItems(pool: ImageItem[], seg: number): DomeItem[] {
    const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
    const evenYs = [-4, -2, 0, 2, 4];
    const oddYs = [-3, -1, 1, 3, 5];

    const coords = xCols.flatMap((x, c) => {
        const ys = c % 2 === 0 ? evenYs : oddYs;
        return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }));
    });

    const totalSlots = coords.length;
    if (pool.length === 0) {
        return coords.map(c => ({ ...c, src: '', alt: '', id: undefined, type: undefined, backdrop: undefined, logo_url: undefined, imdb_rating: undefined }));
    }

    const normalizedImages = pool.map(image => {
        return {
            src: image.src || '',
            alt: image.alt || image.title || '',
            id: image.id,
            type: image.type,
            backdrop: image.backdrop,
            title: image.title,
            overview: image.overview,
            rating: image.rating,
            release_year: image.release_year,
            logo_url: image.logo_url,
            imdb_rating: image.imdb_rating,
        };
    });

    const usedImages = Array.from({ length: totalSlots }, (_, i) => normalizedImages[i % normalizedImages.length]);

    for (let i = 1; i < usedImages.length; i++) {
        if (usedImages[i].src === usedImages[i - 1].src) {
            for (let j = i + 1; j < usedImages.length; j++) {
                if (usedImages[j].src !== usedImages[i].src) {
                    const tmp = usedImages[i];
                    usedImages[i] = usedImages[j];
                    usedImages[j] = tmp;
                    break;
                }
            }
        }
    }

    return coords.map((c, i) => ({
        ...c,
        src: usedImages[i].src,
        alt: usedImages[i].alt,
        id: usedImages[i].id,
        type: usedImages[i].type,
        backdrop: usedImages[i].backdrop,
        title: usedImages[i].title,
        overview: usedImages[i].overview,
        rating: usedImages[i].rating,
        release_year: usedImages[i].release_year,
        logo_url: usedImages[i].logo_url,
        imdb_rating: usedImages[i].imdb_rating,
    }));
}

// Individual poster with loading skeleton
const DomePoster = memo(function DomePoster({ src, alt, grayscale }: { src: string; alt: string; grayscale: boolean }) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    return (
        <>
            {!loaded && !error && (
                <div className="dome-item-skeleton" />
            )}
            <img
                src={src}
                draggable={false}
                alt={alt}
                className="dome-item-img"
                style={{
                    filter: grayscale ? 'grayscale(1)' : 'none',
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    pointerEvents: 'none'
                }}
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
            />
        </>
    );
});

export const DomeGallery = memo(function DomeGallery({
    images = [],
    fit = 0.5,
    fitBasis = 'auto',
    minRadius = 600,
    maxRadius = Infinity,
    padFactor = 0.25,
    overlayBlurColor = '#000000',
    maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
    dragSensitivity = DEFAULTS.dragSensitivity,
    segments = DEFAULTS.segments,
    dragDampening = 2,
    imageBorderRadius = '16px',
    grayscale = false,
    onImageClick
}: DomeGalleryProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLElement>(null);
    const sphereRef = useRef<HTMLDivElement>(null);

    const rotationRef = useRef({ x: 0, y: 0 });
    const startRotRef = useRef({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);
    const dragOriginRef = useRef<{ x: number; y: number } | null>(null);
    const inertiaRAF = useRef<number | null>(null);
    const pointerTypeRef = useRef('mouse');
    const lastDragEndAt = useRef(0);
    const DRAG_THRESHOLD = 7; // pixels deadzone for pure clicks

    const scrollLockedRef = useRef(false);
    const lockScroll = useCallback(() => {
        if (scrollLockedRef.current) return;
        scrollLockedRef.current = true;
        document.body.classList.add('dg-scroll-lock');
    }, []);
    const unlockScroll = useCallback(() => {
        if (!scrollLockedRef.current) return;
        scrollLockedRef.current = false;
        document.body.classList.remove('dg-scroll-lock');
    }, []);

    const items = useMemo(() => buildItems(images, segments), [images, segments]);

    const applyTransform = (xDeg: number, yDeg: number) => {
        const el = sphereRef.current;
        if (el) {
            el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
        }
    };

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const ro = new ResizeObserver(entries => {
            const cr = entries[0].contentRect;
            const w = Math.max(1, cr.width),
                h = Math.max(1, cr.height);
            const minDim = Math.min(w, h),
                maxDim = Math.max(w, h),
                aspect = w / h;
            let basis;
            switch (fitBasis) {
                case 'min':
                    basis = minDim;
                    break;
                case 'max':
                    basis = maxDim;
                    break;
                case 'width':
                    basis = w;
                    break;
                case 'height':
                    basis = h;
                    break;
                default:
                    basis = aspect >= 1.3 ? w : minDim;
            }
            let radius = basis * fit;
            const heightGuard = h * 1.35;
            radius = Math.min(radius, heightGuard);
            radius = clamp(radius, minRadius, maxRadius);

            const viewerPad = Math.max(8, Math.round(minDim * padFactor));
            root.style.setProperty('--radius', `${Math.round(radius)}px`);
            root.style.setProperty('--viewer-pad', `${viewerPad}px`);
            root.style.setProperty('--overlay-blur-color', overlayBlurColor);
            root.style.setProperty('--tile-radius', imageBorderRadius);
            root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none');
            applyTransform(rotationRef.current.x, rotationRef.current.y);
        });
        ro.observe(root);
        return () => ro.disconnect();
    }, [fit, fitBasis, minRadius, maxRadius, padFactor, overlayBlurColor, grayscale, imageBorderRadius]);

    useEffect(() => {
        applyTransform(rotationRef.current.x, rotationRef.current.y);
    }, []);

    const stopInertia = useCallback(() => {
        if (inertiaRAF.current) {
            cancelAnimationFrame(inertiaRAF.current);
            inertiaRAF.current = null;
        }
    }, []);

    const startInertia = useCallback(
        (vx: number, vy: number) => {
            const MAX_V = 1.2;
            let vX = clamp(vx, -MAX_V, MAX_V) * 60;
            let vY = clamp(vy, -MAX_V, MAX_V) * 60;
            let frames = 0;
            const d = clamp(dragDampening ?? 2, 0, 3);
            const frictionMul = 0.97 + 0.01 * d;
            const stopThreshold = 0.008;
            const maxFrames = Math.round(200 + 300 * d);

            const step = () => {
                vX *= frictionMul;
                vY *= frictionMul;

                if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
                    inertiaRAF.current = null;
                    return;
                }
                if (++frames > maxFrames) {
                    inertiaRAF.current = null;
                    return;
                }
                const nextX = clamp(rotationRef.current.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg);
                const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200);
                rotationRef.current = { x: nextX, y: nextY };
                applyTransform(nextX, nextY);
                inertiaRAF.current = requestAnimationFrame(step);
            };
            stopInertia();
            inertiaRAF.current = requestAnimationFrame(step);
        },
        [dragDampening, maxVerticalRotationDeg, stopInertia]
    );

    useGesture(
        {
            onDragStart: ({ event }) => {
                stopInertia();

                const pointerEvent = event as PointerEvent;
                pointerTypeRef.current = pointerEvent.pointerType || 'mouse';
                if (pointerTypeRef.current === 'touch') lockScroll();

                isDraggingRef.current = false;
                startRotRef.current = { ...rotationRef.current };
                dragOriginRef.current = { x: pointerEvent.clientX, y: pointerEvent.clientY };
            },
            onDrag: ({ event, last, velocity: velArr = [0, 0], direction: dirArr = [0, 0], movement }) => {
                if (!dragOriginRef.current) return;

                const pointerEvent = event as PointerEvent;
                if (pointerTypeRef.current === 'touch') event.preventDefault();

                const dxTotal = pointerEvent.clientX - dragOriginRef.current.x;
                const dyTotal = pointerEvent.clientY - dragOriginRef.current.y;
                const dist2 = dxTotal * dxTotal + dyTotal * dyTotal;

                // Threshold gate: only consider it a drag if moved >= DRAG_THRESHOLD pixels
                if (!isDraggingRef.current) {
                    if (dist2 >= DRAG_THRESHOLD * DRAG_THRESHOLD) {
                        isDraggingRef.current = true;
                        mainRef.current?.classList.add('is-dragging');
                    } else {
                        // Micro-movements while clicking: stay in click mode, do not rotate
                        return;
                    }
                }

                const nextX = clamp(
                    startRotRef.current.x - dyTotal / dragSensitivity,
                    -maxVerticalRotationDeg,
                    maxVerticalRotationDeg
                );
                const nextY = startRotRef.current.y + dxTotal / dragSensitivity;

                const cur = rotationRef.current;
                if (cur.x !== nextX || cur.y !== nextY) {
                    rotationRef.current = { x: nextX, y: nextY };
                    applyTransform(nextX, nextY);
                }

                if (last) {
                    const didDrag = isDraggingRef.current;
                    isDraggingRef.current = false;
                    dragOriginRef.current = null;
                    mainRef.current?.classList.remove('is-dragging');

                    if (pointerTypeRef.current === 'touch') unlockScroll();

                    if (didDrag) {
                        lastDragEndAt.current = performance.now();

                        let [vMagX, vMagY] = velArr;
                        const [dirX, dirY] = dirArr;
                        let vx = vMagX * dirX;
                        let vy = vMagY * dirY;

                        if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
                            const [mx, my] = movement;
                            vx = (mx / dragSensitivity) * 0.02;
                            vy = (my / dragSensitivity) * 0.02;
                        }

                        if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) {
                            startInertia(vx, vy);
                        }
                    }
                }
            }
        },
        { target: mainRef, eventOptions: { passive: false } }
    );

    useEffect(() => {
        return () => {
            document.body.classList.remove('dg-scroll-lock');
        };
    }, []);

    const onPosterActivate = useCallback((it: DomeItem) => {
        if (isDraggingRef.current) return;
        if (performance.now() - lastDragEndAt.current < 120) return;
        if (onImageClick && it.id && it.type) {
            onImageClick({
                src: it.src,
                alt: it.alt,
                id: it.id,
                type: it.type,
                backdrop: it.backdrop,
                title: it.title,
                overview: it.overview,
                rating: it.rating,
                release_year: it.release_year,
                logo_url: it.logo_url,
                imdb_rating: it.imdb_rating,
            });
        }
    }, [onImageClick]);

    return (
        <div
            ref={rootRef}
            className="dome-gallery-root"
            style={{
                ['--segments-x' as string]: segments,
                ['--segments-y' as string]: segments,
                ['--overlay-blur-color' as string]: overlayBlurColor,
                ['--tile-radius' as string]: imageBorderRadius,
                ['--image-filter' as string]: grayscale ? 'grayscale(1)' : 'none'
            }}
        >
            <main
                ref={mainRef}
                className="dome-gallery-main"
                style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
            >
                <div className="dome-stage">
                    <div ref={sphereRef} className="dome-sphere">
                        {items.map((it, i) => (
                            <div
                                key={`${it.x},${it.y},${i}`}
                                className="dome-item"
                                style={{
                                    ['--offset-x' as string]: it.x,
                                    ['--offset-y' as string]: it.y,
                                    ['--item-size-x' as string]: it.sizeX,
                                    ['--item-size-y' as string]: it.sizeY
                                }}
                            >
                                <div
                                    className="dome-item-image"
                                    role="button"
                                    tabIndex={0}
                                    aria-label={it.alt || it.title || 'Open image'}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPosterActivate(it);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onPosterActivate(it);
                                        }
                                    }}
                                >
                                    <DomePoster src={it.src} alt={it.alt} grayscale={grayscale} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dome-overlay dome-overlay-radial" />
                <div className="dome-overlay dome-overlay-blur" />
                <div className="dome-overlay dome-overlay-top" />
                <div className="dome-overlay dome-overlay-bottom" />
            </main>
        </div>
    );
});

