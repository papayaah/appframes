'use client';

import { useState } from 'react';
import {
  Stack,
  Text,
  SimpleGrid,
  Box,
  Group,
} from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { CanvasSettings, Screen } from './AppFrames';
import { getCanvasDimensions } from './FramesContext';

// Helper to detect if a background value is a gradient
export const isGradient = (color: string): boolean => {
  return color.startsWith('linear-gradient') || color.startsWith('radial-gradient');
};

// Helper to get background styles for a color/gradient
export const getBackgroundStyle = (color: string): React.CSSProperties => {
  if (color === 'transparent') {
    return { backgroundColor: 'transparent' };
  }
  if (isGradient(color)) {
    return { backgroundImage: color };
  }
  return { backgroundColor: color };
};

// Background presets: solid colors + gradients
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

// Canvas size data organized by device category
interface SizeOption {
  value: string;
  label: string;
}

interface SizeSubgroup {
  subLabel: string;
  items: SizeOption[];
}

interface DeviceCategory {
  id: string;
  label: string;
  subgroups: SizeSubgroup[];
}

const DEVICE_CATEGORIES: DeviceCategory[] = [
  {
    id: 'iphone',
    label: 'iPhone',
    subgroups: [
      {
        subLabel: '6.9" Display',
        items: [
          { value: 'iphone-6.9-1260x2736', label: '1260 × 2736' },
          { value: 'iphone-6.9-1290x2796', label: '1290 × 2796' },
          { value: 'iphone-6.9', label: '1320 × 2868' },
        ],
      },
      {
        subLabel: '6.5" Display',
        items: [
          { value: 'iphone-6.5-1242x2688', label: '1242 × 2688' },
          { value: 'iphone-6.5', label: '1284 × 2778' },
        ],
      },
      {
        subLabel: '6.3" Display',
        items: [
          { value: 'iphone-6.3-1179x2556', label: '1179 × 2556' },
          { value: 'iphone-6.3', label: '1206 × 2622' },
        ],
      },
      {
        subLabel: '6.1" Display',
        items: [
          { value: 'iphone-6.1-1170x2532', label: '1170 × 2532' },
          { value: 'iphone-6.1-1125x2436', label: '1125 × 2436' },
          { value: 'iphone-6.1-1080x2340', label: '1080 × 2340' },
        ],
      },
      {
        subLabel: '5.5" Display',
        items: [{ value: 'iphone-5.5', label: '1242 × 2208' }],
      },
      {
        subLabel: '4.7" Display',
        items: [{ value: 'iphone-4.7', label: '750 × 1334' }],
      },
      {
        subLabel: '4.0" Display',
        items: [
          { value: 'iphone-4.0-640x1096', label: '640 × 1096 (no status bar)' },
          { value: 'iphone-4.0', label: '640 × 1136 (with status bar)' },
        ],
      },
      {
        subLabel: '3.5" Display',
        items: [
          { value: 'iphone-3.5-640x920', label: '640 × 920 (no status bar)' },
          { value: 'iphone-3.5', label: '640 × 960 (with status bar)' },
        ],
      },
    ],
  },
  {
    id: 'ipad',
    label: 'iPad',
    subgroups: [
      {
        subLabel: 'App Store',
        items: [
          { value: 'ipad-13', label: '2064 × 2752 (13")' },
          { value: 'ipad-11', label: '1668 × 2388 (11")' },
          { value: 'ipad-12.9-gen2', label: '2048 × 2732 (12.9" 2nd Gen)' },
          { value: 'ipad-10.5', label: '1668 × 2224 (10.5")' },
          { value: 'ipad-9.7', label: '1536 × 2048 (9.7")' },
        ],
      },
    ],
  },
  {
    id: 'watch',
    label: 'Apple Watch',
    subgroups: [
      {
        subLabel: 'All Models',
        items: [
          { value: 'watch-ultra-3', label: '422 × 514 (Ultra 3)' },
          { value: 'watch-ultra-3-alt', label: '410 × 502 (Ultra 3 Alt)' },
          { value: 'watch-s11', label: '416 × 496 (Series 11)' },
          { value: 'watch-s9', label: '396 × 484 (Series 9)' },
          { value: 'watch-s6', label: '368 × 448 (Series 6)' },
          { value: 'watch-s3', label: '312 × 390 (Series 3)' },
        ],
      },
    ],
  },
  {
    id: 'google',
    label: 'Google Play',
    subgroups: [
      {
        subLabel: 'All Formats',
        items: [
          { value: 'google-phone', label: '1080 × 1920 (Phone)' },
          { value: 'google-tablet-7', label: '1536 × 2048 (7" Tablet)' },
          { value: 'google-tablet-10', label: '2048 × 2732 (10" Tablet)' },
          { value: 'google-chromebook', label: '1920 × 1080 (Chromebook)' },
          { value: 'google-xr', label: '1920 × 1080 (Android XR)' },
          { value: 'google-feature-graphic', label: '1024 × 500 (Feature Graphic)' },
        ],
      },
    ],
  },
];

// Build flat lookup + legacy grouped format for any consumers that still need it
const ALL_SIZE_VALUES = new Set(
  DEVICE_CATEGORIES.flatMap((c) => c.subgroups.flatMap((s) => s.items.map((i) => i.value)))
);

export const CANVAS_SIZE_OPTIONS = DEVICE_CATEGORIES.flatMap((cat) =>
  cat.subgroups.map((sg) => ({
    group: cat.subgroups.length === 1 ? cat.label : `${cat.label} — ${sg.subLabel}`,
    items: sg.items,
  }))
);

// Find which category a canvas size value belongs to
function getCategoryForValue(value: string): string | null {
  for (const cat of DEVICE_CATEGORIES) {
    for (const sg of cat.subgroups) {
      if (sg.items.some((i) => i.value === value)) return cat.id;
    }
  }
  return null;
}

// Device shape icons for the category cards
function DeviceIcon({ type, size = 32 }: { type: string; size?: number }) {
  const s = size;
  if (type === 'iphone') {
    return (
      <Box style={{ width: s * 0.45, height: s * 0.85, border: '2px solid currentColor', borderRadius: s * 0.1, position: 'relative' }}>
        <Box style={{ position: 'absolute', bottom: s * 0.04, left: '50%', transform: 'translateX(-50%)', width: s * 0.12, height: s * 0.02, borderRadius: 1, backgroundColor: 'currentColor' }} />
      </Box>
    );
  }
  if (type === 'ipad') {
    return (
      <Box style={{ width: s * 0.65, height: s * 0.85, border: '2px solid currentColor', borderRadius: s * 0.08, position: 'relative' }}>
        <Box style={{ position: 'absolute', bottom: s * 0.04, left: '50%', transform: 'translateX(-50%)', width: s * 0.08, height: s * 0.08, borderRadius: '50%', border: '1.5px solid currentColor' }} />
      </Box>
    );
  }
  if (type === 'watch') {
    return (
      <Box style={{ position: 'relative', width: s * 0.5, height: s * 0.85 }}>
        {/* Band top */}
        <Box style={{ width: s * 0.3, height: s * 0.15, backgroundColor: 'currentColor', borderRadius: '3px 3px 0 0', margin: '0 auto', opacity: 0.4 }} />
        {/* Face */}
        <Box style={{ width: s * 0.45, height: s * 0.45, border: '2px solid currentColor', borderRadius: s * 0.1, margin: '0 auto' }} />
        {/* Band bottom */}
        <Box style={{ width: s * 0.3, height: s * 0.15, backgroundColor: 'currentColor', borderRadius: '0 0 3px 3px', margin: '0 auto', opacity: 0.4 }} />
      </Box>
    );
  }
  // google / android
  return (
    <Box style={{ width: s * 0.45, height: s * 0.85, border: '2px solid currentColor', borderRadius: s * 0.06, position: 'relative' }}>
      <Box style={{ position: 'absolute', top: s * 0.04, left: '50%', transform: 'translateX(-50%)', width: s * 0.06, height: s * 0.06, borderRadius: '50%', backgroundColor: 'currentColor' }} />
    </Box>
  );
}

interface SidebarProps {
  settings: CanvasSettings;
  setSettings: (settings: CanvasSettings) => void;
  screens: Screen[];
}

const CompositionButton = ({
  type,
  label,
  selected,
  onClick,
}: {
  type: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <Box
    onClick={onClick}
    style={{
      border: selected ? '2px solid #228be6' : '1px solid #dee2e6',
      borderRadius: 8,
      padding: '12px 8px',
      cursor: 'pointer',
      textAlign: 'center',
      backgroundColor: selected ? '#e7f5ff' : 'white',
      transition: 'all 0.2s',
    }}
  >
    <Box style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 40 }}>
      {type === 'single' && (
        <Box style={{ width: 20, height: 35, border: '2px solid #495057', borderRadius: 4 }} />
      )}
      {type === 'dual' && (
        <Group gap={4}>
          <Box style={{ width: 18, height: 35, border: '2px solid #495057', borderRadius: 4 }} />
          <Box style={{ width: 18, height: 35, border: '2px solid #495057', borderRadius: 4 }} />
        </Group>
      )}
      {type === 'stack' && (
        <Box style={{ position: 'relative', width: 30, height: 40 }}>
          <Box
            style={{
              position: 'absolute',
              width: 20,
              height: 30,
              border: '2px solid #495057',
              borderRadius: 4,
              top: 0,
              left: 0,
            }}
          />
          <Box
            style={{
              position: 'absolute',
              width: 20,
              height: 30,
              border: '2px solid #495057',
              borderRadius: 4,
              top: 8,
              left: 8,
            }}
          />
        </Box>
      )}
      {type === 'triple' && (
        <Group gap={3}>
          <Box style={{ width: 14, height: 30, border: '2px solid #495057', borderRadius: 3 }} />
          <Box style={{ width: 14, height: 30, border: '2px solid #495057', borderRadius: 3 }} />
          <Box style={{ width: 14, height: 30, border: '2px solid #495057', borderRadius: 3 }} />
        </Group>
      )}
      {type === 'fan' && (
        <Box style={{ position: 'relative', width: 35, height: 40 }}>
          <Box
            style={{
              position: 'absolute',
              width: 18,
              height: 28,
              border: '2px solid #495057',
              borderRadius: 3,
              top: 5,
              left: 0,
              transform: 'rotate(-10deg)',
            }}
          />
          <Box
            style={{
              position: 'absolute',
              width: 18,
              height: 28,
              border: '2px solid #495057',
              borderRadius: 3,
              top: 0,
              left: 8,
            }}
          />
          <Box
            style={{
              position: 'absolute',
              width: 18,
              height: 28,
              border: '2px solid #495057',
              borderRadius: 3,
              top: 5,
              left: 16,
              transform: 'rotate(10deg)',
            }}
          />
        </Box>
      )}
    </Box>
    <Text size="xs" fw={500}>
      {label}
    </Text>
  </Box>
);

export function Sidebar({ settings, setSettings, screens }: SidebarProps) {
  const currentScreen = screens[settings.selectedScreenIndex];
  const hasAnyFrames =
    (currentScreen?.images ?? []).some((img) => !(img?.cleared === true) && img?.diyOptions);
  const effectiveComposition = hasAnyFrames ? settings.composition : undefined;

  // Determine which device category is currently selected based on the canvas size value
  const activeCategory = getCategoryForValue(settings.canvasSize);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(activeCategory);

  const handleCategoryClick = (catId: string) => {
    setExpandedCategory((prev) => (prev === catId ? null : catId));
  };

  const handleSizeSelect = (value: string) => {
    // Auto-set orientation based on the native aspect ratio of the selected size
    const dims = getCanvasDimensions(value, 'portrait');
    const orientation = dims.width > dims.height ? 'landscape' : 'portrait';
    setSettings({ ...settings, canvasSize: value, orientation });
  };

  return (
    <Stack gap="lg" style={{ overflow: 'auto', height: '100%', padding: '16px' }}>
      {/* Canvas Size — category cards */}
      <Box>
        <Text size="xs" c="dimmed" mb="xs" tt="uppercase">
          Canvas Size
        </Text>

        <Stack gap={6}>
          {DEVICE_CATEGORIES.map((cat) => {
            const isExpanded = expandedCategory === cat.id;
            const isCategoryActive = activeCategory === cat.id;

            return (
              <Box key={cat.id}>
                {/* Category card */}
                <Box
                  onClick={() => handleCategoryClick(cat.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: isCategoryActive
                      ? '2px solid #228be6'
                      : '1px solid #dee2e6',
                    backgroundColor: isCategoryActive ? '#e7f5ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Box style={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isCategoryActive ? '#228be6' : '#868e96',
                    flexShrink: 0,
                  }}>
                    <DeviceIcon type={cat.id} size={32} />
                  </Box>
                  <Text size="sm" fw={isCategoryActive ? 600 : 500} style={{ flex: 1 }}>
                    {cat.label}
                  </Text>
                  <IconChevronDown
                    size={14}
                    color="#868e96"
                    style={{
                      transition: 'transform 0.2s ease',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                    }}
                  />
                </Box>

                {/* Expanded sub-list */}
                {isExpanded && (
                  <Box
                    style={{
                      marginTop: 4,
                      marginLeft: 12,
                      borderLeft: '2px solid #e9ecef',
                      paddingLeft: 10,
                    }}
                  >
                    {cat.subgroups.map((sg) => (
                      <Box key={sg.subLabel}>
                        {cat.subgroups.length > 1 && (
                          <Text size="xs" c="dimmed" mt={6} mb={2} fw={500}>
                            {sg.subLabel}
                          </Text>
                        )}
                        <Stack gap={1}>
                          {sg.items.map((item) => {
                            const isSelected = settings.canvasSize === item.value;
                            return (
                              <Box
                                key={item.value}
                                onClick={() => handleSizeSelect(item.value)}
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                  backgroundColor: isSelected ? '#e7f5ff' : 'transparent',
                                  transition: 'background-color 0.1s ease',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) e.currentTarget.style.backgroundColor = '#f1f3f5';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <Text
                                  size="xs"
                                  fw={isSelected ? 600 : 400}
                                  c={isSelected ? '#228be6' : undefined}
                                  style={{ fontVariantNumeric: 'tabular-nums' }}
                                >
                                  {item.label}
                                </Text>
                              </Box>
                            );
                          })}
                        </Stack>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            );
          })}
        </Stack>
      </Box>

      {/* Composition */}
      <Box>
        <Text size="xs" c="dimmed" mb="xs" tt="uppercase">
          Composition
        </Text>
        <SimpleGrid cols={2} spacing="xs">
          <CompositionButton
            type="single"
            label="Single"
            selected={effectiveComposition === 'single'}
            onClick={() => setSettings({ ...settings, composition: 'single' })}
          />
          <CompositionButton
            type="dual"
            label="Dual"
            selected={effectiveComposition === 'dual'}
            onClick={() => setSettings({ ...settings, composition: 'dual' })}
          />
          <CompositionButton
            type="stack"
            label="Stack"
            selected={effectiveComposition === 'stack'}
            onClick={() => setSettings({ ...settings, composition: 'stack' })}
          />
          <CompositionButton
            type="triple"
            label="Triple"
            selected={effectiveComposition === 'triple'}
            onClick={() => setSettings({ ...settings, composition: 'triple' })}
          />
        </SimpleGrid>
        <Box mt="xs">
          <CompositionButton
            type="fan"
            label="Fan"
            selected={effectiveComposition === 'fan'}
            onClick={() => setSettings({ ...settings, composition: 'fan' })}
          />
        </Box>
      </Box>
    </Stack>
  );
}
