
export const BACKGROUND_PRESETS = [
    // Solid colors (existing)
    'transparent',
    '#E5E7EB',
    '#F3F4F6',
    '#DBEAFE',
    '#E0E7FF',
    '#FCE7F3',
    '#FEF3C7',
    '#D1FAE5',
    // Horizontal gradients
    'linear-gradient(to right, #667eea, #764ba2)',
    'linear-gradient(to right, #f093fb, #f5576c)',
    'linear-gradient(to right, #4facfe, #00f2fe)',
    'linear-gradient(to right, #43e97b, #38f9d7)',
    // Vertical gradients
    'linear-gradient(to bottom, #fa709a, #fee140)',
    'linear-gradient(to bottom, #6a11cb, #2575fc)',
    'linear-gradient(to bottom, #ff0844, #ffb199)',
    // Diagonal gradient
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
] as const;

export interface SizeOption {
    value: string;
    label: string;
}

export interface DeviceConfig {
    id: string;
    label: string;
    shortLabel?: string;
    defaultSize: string; // The default size when this device is selected
    sizes: SizeOption[];
}

export interface StoreConfig {
    id: string;
    label: string;
    devices: DeviceConfig[];
}

export const STORES: StoreConfig[] = [
    {
        id: 'apple',
        label: 'Apple Store',
        devices: [
            {
                id: 'iphone',
                label: 'iPhone',
                defaultSize: 'iphone-6.9',
                sizes: [
                    { value: 'iphone-6.9', label: '6.9" — 1320 × 2868' },
                    { value: 'iphone-6.5', label: '6.5" — 1284 × 2778' },
                    { value: 'iphone-6.9-1290x2796', label: '6.9" — 1290 × 2796' },
                    { value: 'iphone-6.9-1260x2736', label: '6.9" — 1260 × 2736' },
                    { value: 'iphone-6.5-1242x2688', label: '6.5" — 1242 × 2688' },
                    { value: 'iphone-6.3', label: '6.3" — 1206 × 2622' },
                    { value: 'iphone-6.3-1179x2556', label: '6.3" — 1179 × 2556' },
                    { value: 'iphone-6.1-1170x2532', label: '6.1" — 1170 × 2532' },
                    { value: 'iphone-6.1-1125x2436', label: '6.1" — 1125 × 2436' },
                    { value: 'iphone-6.1-1080x2340', label: '6.1" — 1080 × 2340' },
                    { value: 'iphone-5.5', label: '5.5" — 1242 × 2208' },
                    { value: 'iphone-4.7', label: '4.7" — 750 × 1334' },
                    { value: 'iphone-4.0', label: '4.0" — 640 × 1136' },
                    { value: 'iphone-3.5', label: '3.5" — 640 × 960' },
                ],
            },
            {
                id: 'ipad',
                label: 'iPad',
                defaultSize: 'ipad-13',
                sizes: [
                    { value: 'ipad-13', label: '13" — 2064 × 2752' },
                    { value: 'ipad-12.9-gen2', label: '12.9" — 2048 × 2732' },
                    { value: 'ipad-11', label: '11" — 1668 × 2388' },
                    { value: 'ipad-10.5', label: '10.5" — 1668 × 2224' },
                    { value: 'ipad-9.7', label: '9.7" — 1536 × 2048' },
                ],
            },
            {
                id: 'watch',
                label: 'Watch',
                defaultSize: 'watch-ultra-3',
                sizes: [
                    { value: 'watch-ultra-3', label: 'Ultra 3 — 422 × 514' },
                    { value: 'watch-s11', label: 'Series 11 — 416 × 496' },
                    { value: 'watch-ultra-3-alt', label: 'Ultra 3 Alt — 410 × 502' },
                    { value: 'watch-s9', label: 'Series 9 — 396 × 484' },
                    { value: 'watch-s6', label: 'Series 6 — 368 × 448' },
                    { value: 'watch-s3', label: 'Series 3 — 312 × 390' },
                ],
            },
        ],
    },
    {
        id: 'google',
        label: 'Google Play',
        devices: [
            {
                id: 'phone',
                label: 'Phone',
                defaultSize: 'google-phone',
                sizes: [{ value: 'google-phone', label: 'Phone — 1080 × 1920' }],
            },
            {
                id: 'tablet-7',
                label: '7" Tablet',
                shortLabel: '7"',
                defaultSize: 'google-tablet-7',
                sizes: [{ value: 'google-tablet-7', label: '7" Tablet — 1536 × 2048' }],
            },
            {
                id: 'tablet-10',
                label: '10" Tablet',
                shortLabel: '10"',
                defaultSize: 'google-tablet-10',
                sizes: [{ value: 'google-tablet-10', label: '10" Tablet — 2048 × 2732' }],
            },
            {
                id: 'chromebook',
                label: 'Chromebook',
                shortLabel: 'Chrome',
                defaultSize: 'google-chromebook',
                sizes: [{ value: 'google-chromebook', label: 'Chromebook — 1920 × 1080' }],
            },
            {
                id: 'xr',
                label: 'Android XR',
                shortLabel: 'XR',
                defaultSize: 'google-xr',
                sizes: [{ value: 'google-xr', label: 'Android XR — 1920 × 1080' }],
            },
            {
                id: 'feature',
                label: 'Feature Graphic',
                shortLabel: 'Feature',
                defaultSize: 'google-feature-graphic',
                sizes: [{ value: 'google-feature-graphic', label: 'Feature Graphic — 1024 × 500' }],
            },
        ],
    },
];

// Legacy export for consumers that need grouped format
export const CANVAS_SIZE_OPTIONS = STORES.flatMap((store) =>
    store.devices.map((device) => ({
        group: `${store.label} — ${device.label}`,
        items: device.sizes,
    }))
);

// Find store and device for a given size value
export function findStoreAndDevice(value: string): { store: StoreConfig; device: DeviceConfig } | null {
    for (const store of STORES) {
        for (const device of store.devices) {
            if (device.sizes.some((s) => s.value === value)) {
                return { store, device };
            }
        }
    }
    return null;
}

// Get current size label
export function getSizeLabel(value: string): string {
    for (const store of STORES) {
        for (const device of store.devices) {
            const size = device.sizes.find((s) => s.value === value);
            if (size) return size.label;
        }
    }
    return value;
}
