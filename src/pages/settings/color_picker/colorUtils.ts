export interface HSVA {
    h: number; // 0 - 360
    s: number; // 0 - 100
    v: number; // 0 - 100
    a: number; // 0 - 1
}

export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    const hNorm = ((h % 360) + 360) % 360;
    const sNorm = Math.max(0, Math.min(100, s)) / 100;
    const vNorm = Math.max(0, Math.min(100, v)) / 100;

    const c = vNorm * sNorm;
    const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
    const m = vNorm - c;

    let r = 0, g = 0, b = 0;
    if (hNorm < 60) {
        [r, g, b] = [c, x, 0];
    } else if (hNorm < 120) {
        [r, g, b] = [x, c, 0];
    } else if (hNorm < 180) {
        [r, g, b] = [0, c, x];
    } else if (hNorm < 240) {
        [r, g, b] = [0, x, c];
    } else if (hNorm < 300) {
        [r, g, b] = [x, 0, c];
    } else {
        [r, g, b] = [c, 0, x];
    }

    const clampByte = (val: number) => Math.max(0, Math.min(255, Math.round((val + m) * 255)));

    return [clampByte(r), clampByte(g), clampByte(b)];
}

export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const d = max - min;

    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (d !== 0) {
        if (max === rNorm) {
            h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) * 60;
        } else if (max === gNorm) {
            h = ((bNorm - rNorm) / d + 2) * 60;
        } else {
            h = ((rNorm - gNorm) / d + 4) * 60;
        }
    }

    return [Math.round(h) % 360, Math.round(s * 100), Math.round(v * 100)];
}

export function parseColor(color: string): HSVA {
    const fallback: HSVA = { h: 0, s: 0, v: 7, a: 1 }; // ~ #121212
    if (!color) return fallback;

    const trimmed = color.trim().toLowerCase();

    // Parse transparent keyword
    if (trimmed === 'transparent') {
        return { h: 220, s: 60, v: 40, a: 0 };
    }

    // Parse hex (#fff or #ffffff)
    if (trimmed.startsWith('#')) {
        let hex = trimmed.slice(1);
        if (hex.length === 3) {
            hex = hex.split('').map((c) => c + c).join('');
        }
        if (hex.length === 6) {
            const r = parseInt(hex.slice(0, 2), 16) || 0;
            const g = parseInt(hex.slice(2, 4), 16) || 0;
            const b = parseInt(hex.slice(4, 6), 16) || 0;
            const [h, s, v] = rgbToHsv(r, g, b);
            return { h, s, v, a: 1 };
        }
        if (hex.length === 8) {
            const r = parseInt(hex.slice(0, 2), 16) || 0;
            const g = parseInt(hex.slice(2, 4), 16) || 0;
            const b = parseInt(hex.slice(4, 6), 16) || 0;
            const a = Math.round(((parseInt(hex.slice(6, 8), 16) || 255) / 255) * 100) / 100;
            const [h, s, v] = rgbToHsv(r, g, b);
            return { h, s, v, a };
        }
    }

    // Parse rgba or rgb
    const rgbaMatch = trimmed.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (rgbaMatch) {
        const r = parseInt(rgbaMatch[1], 10);
        const g = parseInt(rgbaMatch[2], 10);
        const b = parseInt(rgbaMatch[3], 10);
        const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
        const [h, s, v] = rgbToHsv(r, g, b);
        return { h, s, v, a: isNaN(a) ? 1 : Math.max(0, Math.min(1, a)) };
    }

    return fallback;
}

export function formatColorString(hsva: HSVA): string {
    const [r, g, b] = hsvToRgb(hsva.h, hsva.s, hsva.v);
    if (hsva.a <= 0) {
        return 'transparent';
    }
    if (hsva.a < 1) {
        const aFixed = Math.round(hsva.a * 100) / 100;
        return `rgba(${r}, ${g}, ${b}, ${aFixed})`;
    }
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
