import { CanvasSettings, Screen, ScreenImage, TextElement, DEFAULT_TEXT_STYLE, DEFAULT_BACKGROUND_EFFECTS } from '../types';
import { DIYOptions, DIYDeviceType } from '../diy-frames/types';
export { getDefaultDIYOptions } from '../diy-frames/types';

// Canvas dimensions helper (App Store requirements)
export const getCanvasDimensions = (canvasSize: string, orientation: string) => {
    const dimensions: Record<
        string,
        { width: number; height: number } | { portrait: { width: number; height: number }; landscape: { width: number; height: number } }
    > = {
        // Apple App Store - iPhone (base portrait dimensions; landscape is computed by swapping)
        'iphone-6.9': { width: 1320, height: 2868 },
        'iphone-6.9-1290x2796': { width: 1290, height: 2796 },
        'iphone-6.9-1260x2736': { width: 1260, height: 2736 },
        'iphone-6.5': { width: 1284, height: 2778 },
        'iphone-6.5-1242x2688': { width: 1242, height: 2688 },
        'iphone-6.3': { width: 1206, height: 2622 },
        'iphone-6.3-1179x2556': { width: 1179, height: 2556 },
        // Apple App Store - iPhone 6.1" display (additional accepted sizes)
        'iphone-6.1-1170x2532': { width: 1170, height: 2532 },
        'iphone-6.1-1125x2436': { width: 1125, height: 2436 },
        'iphone-6.1-1080x2340': { width: 1080, height: 2340 },
        'iphone-5.5': { width: 1242, height: 2208 },
        'iphone-4.7': { width: 750, height: 1334 },
        'iphone-4.0': { width: 640, height: 1136 },
        // iPhone 4.0" "without status bar" is NOT a simple swap in landscape (Apple accepts 1136×600).
        'iphone-4.0-640x1096': {
            portrait: { width: 640, height: 1096 },
            landscape: { width: 1136, height: 600 },
        },
        'iphone-3.5': { width: 640, height: 960 },
        // iPhone 3.5" "without status bar" is NOT a simple swap in landscape (Apple accepts 960×600).
        'iphone-3.5-640x920': {
            portrait: { width: 640, height: 920 },
            landscape: { width: 960, height: 600 },
        },
        // Apple App Store - iPad (base portrait dimensions; landscape is computed by swapping)
        'ipad-13': { width: 2064, height: 2752 },
        'ipad-11': { width: 1668, height: 2388 },
        'ipad-12.9-gen2': { width: 2048, height: 2732 },
        'ipad-10.5': { width: 1668, height: 2224 },
        'ipad-9.7': { width: 1536, height: 2048 },
        // Apple Watch
        'watch-ultra-3': { width: 422, height: 514 },
        'watch-ultra-3-alt': { width: 410, height: 502 },
        'watch-s11': { width: 416, height: 496 },
        'watch-s9': { width: 396, height: 484 },
        'watch-s6': { width: 368, height: 448 },
        'watch-s3': { width: 312, height: 390 },
        // Google Play Store (base portrait dimensions; landscape is computed by swapping)
        'google-phone': { width: 1080, height: 1920 },
        'google-tablet-7': { width: 1536, height: 2048 },
        'google-tablet-10': { width: 2048, height: 2732 },
        'google-chromebook': { width: 1920, height: 1080 },
        'google-xr': { width: 1920, height: 1080 },
        'google-feature-graphic': { portrait: { width: 1024, height: 500 }, landscape: { width: 1024, height: 500 } },
    };

    const entry = dimensions[canvasSize] || { width: 1284, height: 2778 };
    const dim =
        'portrait' in entry
            ? (orientation === 'landscape' ? entry.landscape : entry.portrait)
            : entry;

    // If the entry had explicit portrait/landscape dims, we're done.
    if ('portrait' in entry) return dim;

    // Otherwise, compute landscape by swapping base portrait dimensions.
    if (orientation === 'landscape') return { width: dim.height, height: dim.width };
    return dim;
};

// Returns true if the canvas size has a fixed aspect ratio (orientation toggle has no effect)
export const isFixedOrientationCanvas = (canvasSize: string): boolean => {
    const portrait = getCanvasDimensions(canvasSize, 'portrait');
    const landscape = getCanvasDimensions(canvasSize, 'landscape');
    return portrait.width === landscape.width && portrait.height === landscape.height;
};

// Helper function to convert canvas size ID to readable label
export const getCanvasSizeLabel = (canvasSize: string): string => {
    const labels: Record<string, string> = {
        // Apple App Store - iPhone
        'iphone-6.9': 'iPhone 6.9" (1320×2868)',
        'iphone-6.9-1290x2796': 'iPhone 6.9" (1290×2796)',
        'iphone-6.9-1260x2736': 'iPhone 6.9" (1260×2736)',
        'iphone-6.5': 'iPhone 6.5" (1284×2778)',
        'iphone-6.5-1242x2688': 'iPhone 6.5" (1242×2688)',
        'iphone-6.3': 'iPhone 6.3" (1206×2622)',
        'iphone-6.3-1179x2556': 'iPhone 6.3" (1179×2556)',
        'iphone-6.1-1170x2532': 'iPhone 6.1" (1170×2532)',
        'iphone-6.1-1125x2436': 'iPhone 6.1" (1125×2436)',
        'iphone-6.1-1080x2340': 'iPhone 6.1" (1080×2340)',
        'iphone-5.5': 'iPhone 5.5" (1242×2208)',
        'iphone-4.7': 'iPhone 4.7" (750×1334)',
        'iphone-4.0': 'iPhone 4.0" (640×1136)',
        'iphone-4.0-640x1096': 'iPhone 4.0" (640×1096)',
        'iphone-3.5': 'iPhone 3.5" (640×960)',
        'iphone-3.5-640x920': 'iPhone 3.5" (640×920)',
        // Apple App Store - iPad
        'ipad-13': 'iPad 13"',
        'ipad-11': 'iPad 11"',
        'ipad-12.9-gen2': 'iPad 12.9"',
        'ipad-10.5': 'iPad 10.5"',
        'ipad-9.7': 'iPad 9.7"',
        // Apple Watch
        'watch-ultra-3': 'Watch Ultra 3',
        'watch-ultra-3-alt': 'Watch Ultra 3',
        'watch-s11': 'Watch S11',
        'watch-s9': 'Watch S9',
        'watch-s6': 'Watch S6',
        'watch-s3': 'Watch S3',
        // Google Play Store
        'google-phone': 'Phone',
        'google-tablet-7': '7" Tablet',
        'google-tablet-10': '10" Tablet',
        'google-chromebook': 'Chromebook',
        'google-xr': 'Android XR',
        'google-feature-graphic': 'Feature Graphic (1024×500)',
    };

    return labels[canvasSize] || canvasSize;
};

// Helper function to determine how many device frames a composition uses
export const getCompositionFrameCount = (composition: string): number => {
    switch (composition) {
        case 'single': return 1;
        case 'dual': return 2;
        case 'stack': return 2;
        case 'triple': return 3;
        case 'fan': return 3;
        default: return 1;
    }
};

// Infer the device type (phone, tablet, laptop, etc.) from a canvas size string
export const inferDeviceTypeFromCanvasSize = (size: string): DIYDeviceType | null => {
    if (size === 'google-feature-graphic') return null; // frameless
    if (size.startsWith('ipad-')) return 'tablet';
    if (size.startsWith('watch-')) return 'phone';
    if (size.startsWith('google-tablet')) return 'tablet';
    if (size.startsWith('google-chromebook')) return 'laptop';
    return 'phone'; // iphone-*, google-phone, google-xr
};

const createId = (prefix: string) =>
    `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const clamp01 = (v: number) => Math.max(0, Math.min(100, v));

export type FrameTransformProperty = 'tiltX' | 'tiltY' | 'rotateZ' | 'frameScale';

export function clampFrameTransform(value: number, property: FrameTransformProperty): number {
    if (!Number.isFinite(value)) return property === 'frameScale' ? 100 : 0;

    switch (property) {
        case 'rotateZ':
            return Math.max(-180, Math.min(180, value));
        case 'frameScale':
            return Math.max(20, Math.min(500, value));
        case 'tiltX':
        case 'tiltY':
        default:
            return Math.max(-60, Math.min(60, value));
    }
}

export const normalizeRotation = (deg: number) => {
    const n = ((deg % 360) + 360) % 360;
    return n;
};

const getNextTextName = (existing: TextElement[]) => {
    const used = new Set(existing.map(t => t.name));
    let i = existing.length + 1;
    while (used.has(`Text ${i}`)) i += 1;
    return `Text ${i}`;
};

const getMaxZIndex = (existing: TextElement[]) =>
    existing.reduce((max, t) => Math.max(max, t.zIndex ?? 0), 0);

export const createDefaultTextElement = (existing: TextElement[], overrides?: Partial<TextElement>): TextElement => {
    const z = getMaxZIndex(existing) + 1;
    const content = overrides?.content ?? 'Double-click to edit';
    return {
        id: createId('text'),
        content,
        x: 50,
        y: 20, // On top of canvas (was 50 = center)
        rotation: 0,
        style: { ...DEFAULT_TEXT_STYLE },
        visible: true,
        name: overrides?.name ?? content,
        zIndex: z,
        ...overrides,
    };
};

// Helper function to get default settings for a new screen
export const getDefaultScreenSettings = (): Omit<CanvasSettings, 'selectedScreenIndex'> => {
    return {
        canvasSize: 'iphone-6.9',
        composition: 'single',
        selectedTextId: undefined,
        screenScale: 0,
        screenPanX: 50,
        screenPanY: 50,
        backgroundScale: 0,
        backgroundRotation: 0,
        orientation: 'portrait',
        // Default to transparent so users can export/download with alpha without extra steps.
        backgroundColor: 'transparent',
        canvasBackgroundMediaId: undefined,
        backgroundEffects: DEFAULT_BACKGROUND_EFFECTS,
    };
};

export const generateDefaultScreenName = (canvasSize: string, screenList: Screen[]) => {
    const { width, height } = getCanvasDimensions(canvasSize, 'portrait');
    let label = getCanvasSizeLabel(canvasSize);
    // Standardize: remove quotes, convert × to x
    label = label.replace(/"/g, '').replace(/×/g, 'x');

    // Ensure resolution is present if not already in label
    if (!label.includes('x')) {
        label = `${label} (${width}x${height})`;
    }

    // Find next number for screens within the given screen list
    const pattern = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*-\\s*(\\d+)$`);
    let maxNum = 0;

    screenList.forEach(s => {
        const match = s.name.match(pattern);
        if (match) {
            maxNum = Math.max(maxNum, parseInt(match[1], 10));
        } else if (s.name === label) {
            maxNum = Math.max(maxNum, 1);
        }
    });

    return `${label} - ${maxNum + 1}`;
};

export const generateNextScreenName = (sourceName: string, canvasSize: string, screenList: Screen[]) => {
    // If it's a default name like "Screen 1" or contains "(copy)", upgrade it to the smart name
    if (sourceName.startsWith('Screen ') || sourceName.toLowerCase().includes('(copy)')) {
        return generateDefaultScreenName(canvasSize, screenList);
    }

    // Otherwise, if it already follows the "Name - N" pattern, increment it
    const pattern = /^(.*?)\s*-\s*(\d+)$/;
    const match = sourceName.match(pattern);
    if (match) {
        const base = match[1];
        let maxNum = parseInt(match[2], 10);
        screenList.forEach(s => {
            const m = s.name.match(new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*-\\s*(\\d+)$`));
            if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
        });
        return `${base} - ${maxNum + 1}`;
    }

    // Default fallback for custom names
    return `${sourceName} (copy)`;
};

// Exporting getMaxZIndex that was local
export { getMaxZIndex };
