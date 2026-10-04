/**
 * Production Hardening Guard
 * 
 * Blocks DevTools shortcuts, context menu, text selection, copy, and
 * common inspection vectors in PRODUCTION builds only.
 * 
 * In dev (import.meta.env.DEV === true), everything stays enabled.
 * In prod (import.meta.env.PROD === true), lockdown is active.
 */

const IS_PROD = import.meta.env.PROD;

// ── Blocked keyboard shortcuts in production ──────────────────────
const BLOCKED_SHORTCUTS: Array<{
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
}> = [
    // DevTools
    { key: 'F12' },
    { key: 'I', ctrl: true, shift: true },   // Ctrl+Shift+I
    { key: 'J', ctrl: true, shift: true },   // Ctrl+Shift+J (Console)
    { key: 'C', ctrl: true, shift: true },   // Ctrl+Shift+C (Inspect element)
    { key: 'U', ctrl: true },                 // Ctrl+U (View source)
    { key: 'S', ctrl: true },                 // Ctrl+S (Save page)
    { key: 'P', ctrl: true },                 // Ctrl+P (Print)
    // macOS DevTools shortcuts
    { key: 'I', meta: true, alt: true },
    { key: 'J', meta: true, alt: true },
    { key: 'U', meta: true },
];

function isShortcutBlocked(e: KeyboardEvent): boolean {
    return BLOCKED_SHORTCUTS.some(shortcut => {
        const keyMatch = e.key.toUpperCase() === shortcut.key.toUpperCase();
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true;
        const shiftMatch = shortcut.shift ? e.shiftKey : true;
        const altMatch = shortcut.alt ? e.altKey : true;
        const metaMatch = shortcut.meta ? e.metaKey : true;

        // Ensure we don't accidentally block when modifier isn't required
        if (!shortcut.ctrl && !shortcut.meta && (e.ctrlKey || e.metaKey) && shortcut.key !== 'F12') return false;
        if (!shortcut.shift && e.shiftKey && shortcut.key !== 'F12') return false;
        if (!shortcut.alt && e.altKey) return false;

        return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch;
    });
}

// ── Disable right-click context menu ──────────────────────────────
function blockContextMenu(e: MouseEvent) {
    // Allow context menu on input/textarea for paste etc.
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
    e.preventDefault();
}

// ── Block copy/cut except in inputs ───────────────────────────────
function blockCopy(e: ClipboardEvent) {
    const target = e.target as HTMLElement;
    const isEditable = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    const isAllowed = target.closest('[data-allow-copy]') !== null;
    if (!isEditable && !isAllowed) {
        e.preventDefault();
    }
}

// ── Block drag (prevents dragging images to reveal URLs) ──────────
function blockDrag(e: DragEvent) {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' || target.tagName === 'A') {
        e.preventDefault();
    }
}

// ── CSS-based anti-selection (injected dynamically) ───────────────
function injectAntiSelectCSS() {
    const style = document.createElement('style');
    style.id = 'prod-guard-css';
    style.textContent = `
        /* Production: disable text selection globally */
        *:not(input):not(textarea):not([contenteditable="true"]):not([data-allow-copy] *) {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
        }
        /* Re-enable for form inputs */
        input, textarea, [contenteditable="true"], [data-allow-copy], [data-allow-copy] * {
            -webkit-user-select: text !important;
            user-select: text !important;
        }
        /* Prevent image dragging */
        img {
            -webkit-user-drag: none !important;
            user-drag: none !important;
            pointer-events: auto;
        }
    `;
    document.head.appendChild(style);
}

// ── Polyfills for restricted environments ──────────────────────────
function applyWebviewPolyfills() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    try {
        // Simple, non-prototype based mock for plugins
        if (!navigator.plugins) {
            Object.defineProperty(navigator, 'plugins', {
                get: () => {
                    const mock: any = [];
                    mock.refresh = () => {};
                    return mock;
                },
                configurable: true
            });
        }

        // Simple mock for mimeTypes
        if (!navigator.mimeTypes) {
            Object.defineProperty(navigator, 'mimeTypes', {
                get: () => ({}),
                configurable: true
            });
        }
    } catch (e) {
        console.warn('[Guard] Navigator polyfill failed:', e);
    }
}

// ── Main initialization ──────────────────────────────────────────
export function initProductionGuard() {
    // Apply polyfills in ALL environments (Dev and Prod)
    // because YouTube errors can happen during local development too
    applyWebviewPolyfills();

    if (!IS_PROD) {
        console.log('[Guard] Development mode — all inspection tools enabled');
        return;
    }

    // 1. Block DevTools keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (isShortcutBlocked(e)) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }, { capture: true });

    // 2. Block right-click context menu
    document.addEventListener('contextmenu', blockContextMenu, { capture: true });

    // 3. Block copy/cut outside inputs
    document.addEventListener('copy', blockCopy, { capture: true });
    document.addEventListener('cut', blockCopy as EventListener, { capture: true });

    // 4. Block image/link dragging
    document.addEventListener('dragstart', blockDrag, { capture: true });

    // 5. Inject anti-selection CSS
    injectAntiSelectCSS();

    // NOTE: Anti-tamper debugger check and console freezing were removed.
    // The debugger timing trick is an exact AV signature for phishing kits,
    // and console.log is already stripped by terser in production builds.
}
