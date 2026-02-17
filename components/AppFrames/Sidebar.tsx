'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { Stack, Text, SimpleGrid, Box, Group, Button, SegmentedControl, Select, Popover, Card, Image, Badge, Loader, Center, Skeleton } from '@mantine/core';
import { IconChevronDown, IconBrandApple, IconBrandGooglePlay } from '@tabler/icons-react';
import { CanvasSettings, SharedBackground, Screen } from './AppFrames';
import { getCanvasDimensions } from './FramesContext';
import { GradientEditor } from './GradientEditor';
import { getRecommendedImageDimensions } from './sharedBackgroundUtils';
import type { BackgroundEffects } from './types';
import { useMediaImage } from '../../hooks/useMediaImage';
import { QuickMediaPicker, MediaLibraryProvider } from '@reactkits.dev/react-media-library';
import type { ComponentPreset } from '@reactkits.dev/react-media-library';

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

// Canvas size data organized by store and device
interface SizeOption {
  value: string;
  label: string;
}

interface DeviceConfig {
  id: string;
  label: string;
  shortLabel?: string;
  defaultSize: string; // The default size when this device is selected
  sizes: SizeOption[];
}

interface StoreConfig {
  id: string;
  label: string;
  devices: DeviceConfig[];
}

const STORES: StoreConfig[] = [
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
function findStoreAndDevice(value: string): { store: StoreConfig; device: DeviceConfig } | null {
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
function getSizeLabel(value: string): string {
  for (const store of STORES) {
    for (const device of store.devices) {
      const size = device.sizes.find((s) => s.value === value);
      if (size) return size.label;
    }
  }
  return value;
}

// Device Icons
function DeviceIcon({ deviceId, size = 40 }: { deviceId: string; size?: number }) {
  const s = size;
  const strokeWidth = 2;
  const color = 'currentColor';

  // iPhone - tall rectangle with notch indicator
  if (deviceId === 'iphone') {
    return (
      <Box style={{ width: s * 0.5, height: s * 0.9, position: 'relative' }}>
        <Box
          style={{
            width: '100%',
            height: '100%',
            border: `${strokeWidth}px solid ${color}`,
            borderRadius: s * 0.12,
          }}
        />
        <Box
          style={{
            position: 'absolute',
            bottom: s * 0.06,
            left: '50%',
            transform: 'translateX(-50%)',
            width: s * 0.15,
            height: s * 0.03,
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
      </Box>
    );
  }

  // iPad - wider rectangle with home button
  if (deviceId === 'ipad') {
    return (
      <Box style={{ width: s * 0.7, height: s * 0.9, position: 'relative' }}>
        <Box
          style={{
            width: '100%',
            height: '100%',
            border: `${strokeWidth}px solid ${color}`,
            borderRadius: s * 0.08,
          }}
        />
        <Box
          style={{
            position: 'absolute',
            bottom: s * 0.05,
            left: '50%',
            transform: 'translateX(-50%)',
            width: s * 0.1,
            height: s * 0.1,
            border: `1.5px solid ${color}`,
            borderRadius: '50%',
          }}
        />
      </Box>
    );
  }

  // Watch - small rectangle with bands
  if (deviceId === 'watch') {
    return (
      <Box style={{ width: s * 0.5, height: s * 0.9, position: 'relative' }}>
        {/* Top band */}
        <Box
          style={{
            width: s * 0.3,
            height: s * 0.15,
            backgroundColor: color,
            opacity: 0.4,
            borderRadius: '3px 3px 0 0',
            margin: '0 auto',
          }}
        />
        {/* Watch face */}
        <Box
          style={{
            width: s * 0.45,
            height: s * 0.5,
            border: `${strokeWidth}px solid ${color}`,
            borderRadius: s * 0.1,
            margin: '0 auto',
          }}
        />
        {/* Bottom band */}
        <Box
          style={{
            width: s * 0.3,
            height: s * 0.15,
            backgroundColor: color,
            opacity: 0.4,
            borderRadius: '0 0 3px 3px',
            margin: '0 auto',
          }}
        />
      </Box>
    );
  }

  // Phone (Android) - rectangle with camera dot at top
  if (deviceId === 'phone') {
    return (
      <Box style={{ width: s * 0.5, height: s * 0.9, position: 'relative' }}>
        <Box
          style={{
            width: '100%',
            height: '100%',
            border: `${strokeWidth}px solid ${color}`,
            borderRadius: s * 0.08,
          }}
        />
        <Box
          style={{
            position: 'absolute',
            top: s * 0.06,
            left: '50%',
            transform: 'translateX(-50%)',
            width: s * 0.06,
            height: s * 0.06,
            backgroundColor: color,
            borderRadius: '50%',
          }}
        />
      </Box>
    );
  }

  // Tablet (7" / 10") - landscape-oriented rectangle
  if (deviceId === 'tablet-7' || deviceId === 'tablet-10') {
    return (
      <Box style={{ width: s * 0.85, height: s * 0.6, position: 'relative' }}>
        <Box
          style={{
            width: '100%',
            height: '100%',
            border: `${strokeWidth}px solid ${color}`,
            borderRadius: s * 0.06,
          }}
        />
      </Box>
    );
  }

  // Chromebook - laptop shape
  if (deviceId === 'chromebook') {
    return (
      <Box style={{ width: s * 0.9, height: s * 0.7, position: 'relative' }}>
        {/* Screen */}
        <Box
          style={{
            width: '100%',
            height: '70%',
            border: `${strokeWidth}px solid ${color}`,
            borderRadius: `${s * 0.04}px ${s * 0.04}px 0 0`,
          }}
        />
        {/* Keyboard base */}
        <Box
          style={{
            width: '110%',
            height: '20%',
            marginLeft: '-5%',
            backgroundColor: color,
            opacity: 0.3,
            borderRadius: `0 0 ${s * 0.04}px ${s * 0.04}px`,
          }}
        />
      </Box>
    );
  }

  // XR - VR headset shape
  if (deviceId === 'xr') {
    return (
      <Box style={{ width: s * 0.9, height: s * 0.5, position: 'relative' }}>
        <Box
          style={{
            width: '100%',
            height: '100%',
            border: `${strokeWidth}px solid ${color}`,
            borderRadius: s * 0.15,
          }}
        />
        {/* Left lens */}
        <Box
          style={{
            position: 'absolute',
            top: '50%',
            left: '25%',
            transform: 'translate(-50%, -50%)',
            width: s * 0.2,
            height: s * 0.2,
            border: `1.5px solid ${color}`,
            borderRadius: '50%',
          }}
        />
        {/* Right lens */}
        <Box
          style={{
            position: 'absolute',
            top: '50%',
            left: '75%',
            transform: 'translate(-50%, -50%)',
            width: s * 0.2,
            height: s * 0.2,
            border: `1.5px solid ${color}`,
            borderRadius: '50%',
          }}
        />
      </Box>
    );
  }

  // Feature graphic - landscape rectangle with play icon
  if (deviceId === 'feature') {
    return (
      <Box style={{ width: s * 0.9, height: s * 0.45, position: 'relative' }}>
        <Box
          style={{
            width: '100%',
            height: '100%',
            border: `${strokeWidth}px solid ${color}`,
            borderRadius: s * 0.04,
          }}
        />
        {/* Play triangle */}
        <Box
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-40%, -50%)',
            width: 0,
            height: 0,
            borderTop: `${s * 0.1}px solid transparent`,
            borderBottom: `${s * 0.1}px solid transparent`,
            borderLeft: `${s * 0.15}px solid ${color}`,
          }}
        />
      </Box>
    );
  }

  // Default fallback
  return (
    <Box
      style={{
        width: s * 0.5,
        height: s * 0.9,
        border: `${strokeWidth}px solid ${color}`,
        borderRadius: s * 0.08,
      }}
    />
  );
}

// Minimal Mantine preset for QuickMediaPicker (shared background image selection)
const quickPickerPreset: ComponentPreset = {
  Card: ({ children, onClick, selected, style }) => (
    <Card shadow="none" padding={0} radius="sm" withBorder onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', borderColor: selected ? 'var(--mantine-color-violet-6)' : undefined, borderWidth: selected ? 2 : 1, ...style }}>
      {children}
    </Card>
  ),
  Button: ({ children, onClick, variant = 'primary', disabled, loading, size = 'md', fullWidth, leftIcon, ...rest }) => (
    <Button onClick={onClick} variant={variant === 'primary' ? 'filled' : variant === 'danger' ? 'filled' : 'light'}
      color={variant === 'danger' ? 'red' : 'violet'} disabled={disabled} loading={loading} size={size} fullWidth={fullWidth} leftSection={leftIcon} {...rest}>
      {children}
    </Button>
  ),
  TextInput: () => null, Select: () => null, Checkbox: () => null,
  Badge: ({ children }) => <Badge size="xs">{children}</Badge>,
  Image: ({ src, alt, style, onLoad }) => <Image src={src} alt={alt} style={style} fit="cover" w="100%" h="100%" onLoad={onLoad} />,
  Modal: () => null,
  Loader: ({ size = 'md' }) => <Loader size={size} />,
  EmptyState: ({ icon, message }) => (<Center p="md"><Stack align="center" gap="xs">{icon}<Text size="xs" c="dimmed">{message}</Text></Stack></Center>),
  FileButton: () => null,
  Grid: ({ children, columns = 3, gap = '6px' }) => (<div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>{children}</div>),
  Skeleton: () => <Skeleton height={60} />,
  UploadCard: () => null, Viewer: () => null, ViewerThumbnail: () => null,
};

// Shared background gradient preview
function SharedGradientPreview({ gradient }: { gradient: NonNullable<SharedBackground['gradient']> }) {
  const directionMap: Record<string, string> = {
    'horizontal': 'to right', 'vertical': 'to bottom', 'diagonal-down': '135deg', 'diagonal-up': '45deg',
  };
  const direction = directionMap[gradient.direction] || 'to right';
  const stops = gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ');
  return (
    <Box style={{ width: '100%', height: 40, borderRadius: 8, background: `linear-gradient(${direction}, ${stops})`, border: '1px solid #dee2e6' }} />
  );
}

// Shared background image preview
function SharedImagePreview({ mediaId }: { mediaId: number }) {
  const { imageUrl } = useMediaImage(mediaId);
  if (!imageUrl) return null;
  return (
    <Box style={{ width: '100%', height: 60, borderRadius: 8, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #dee2e6' }} />
  );
}

// Visual 3×3 alignment trackpad — drag the knob or click anywhere to set position.
// Snaps to nearest grid position (top/center/bottom × left/center/right).
const ALIGN_PAD = 90;
const ALIGN_KNOB = 16;
const ALIGN_DOT = 6;
const ALIGN_INSET = 10; // padding so knob doesn't clip at edges

const vMap: ('top' | 'center' | 'bottom')[] = ['top', 'center', 'bottom'];
const hMap: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];

function alignToXY(h: 'left' | 'center' | 'right', v: 'top' | 'center' | 'bottom') {
  const x = h === 'left' ? ALIGN_INSET : h === 'right' ? ALIGN_PAD - ALIGN_INSET : ALIGN_PAD / 2;
  const y = v === 'top' ? ALIGN_INSET : v === 'bottom' ? ALIGN_PAD - ALIGN_INSET : ALIGN_PAD / 2;
  return { x, y };
}

function snapToGrid(clientX: number, clientY: number, rect: DOMRect) {
  const relX = clientX - rect.left;
  const relY = clientY - rect.top;
  // Map to 0-2 grid index based on thirds
  const col = Math.max(0, Math.min(2, Math.round(((relX / ALIGN_PAD) * 2))));
  const row = Math.max(0, Math.min(2, Math.round(((relY / ALIGN_PAD) * 2))));
  return { h: hMap[col], v: vMap[row] };
}

function AlignmentControl({
  vertical,
  horizontal,
  onVerticalChange,
  onHorizontalChange,
}: {
  vertical: 'top' | 'center' | 'bottom';
  horizontal: 'left' | 'center' | 'right';
  onVerticalChange: (v: 'top' | 'center' | 'bottom') => void;
  onHorizontalChange: (h: 'left' | 'center' | 'right') => void;
}) {
  const padRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const applySnap = useCallback((clientX: number, clientY: number) => {
    if (!padRef.current) return;
    const { h, v } = snapToGrid(clientX, clientY, padRef.current.getBoundingClientRect());
    if (h !== horizontal) onHorizontalChange(h);
    if (v !== vertical) onVerticalChange(v);
  }, [horizontal, vertical, onHorizontalChange, onVerticalChange]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    applySnap(e.clientX, e.clientY);
  }, [applySnap]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    applySnap(e.clientX, e.clientY);
  }, [isDragging, applySnap]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const knobPos = alignToXY(horizontal, vertical);

  return (
    <Box>
      <Text size="xs" c="dimmed" mb={4} tt="uppercase" ta="center">Alignment</Text>
      <Box style={{ display: 'flex', justifyContent: 'center' }}>
        <Box
          ref={padRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            position: 'relative',
            width: ALIGN_PAD,
            height: ALIGN_PAD,
            borderRadius: 8,
            border: '2px solid #e9ecef',
            backgroundColor: '#f8f9fa',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            overflow: 'hidden',
          }}
        >
          {/* Grid lines */}
          <Box style={{ position: 'absolute', top: '50%', left: 8, right: 8, height: 1, backgroundColor: '#dee2e6', pointerEvents: 'none' }} />
          <Box style={{ position: 'absolute', left: '50%', top: 8, bottom: 8, width: 1, backgroundColor: '#dee2e6', pointerEvents: 'none' }} />

          {/* 9 anchor dots */}
          {vMap.map((v) =>
            hMap.map((h) => {
              const pos = alignToXY(h, v);
              const isActive = v === vertical && h === horizontal;
              if (isActive) return null; // knob covers this
              return (
                <Box
                  key={`${v}-${h}`}
                  style={{
                    position: 'absolute',
                    left: pos.x - ALIGN_DOT / 2,
                    top: pos.y - ALIGN_DOT / 2,
                    width: ALIGN_DOT,
                    height: ALIGN_DOT,
                    borderRadius: '50%',
                    backgroundColor: '#ced4da',
                    pointerEvents: 'none',
                  }}
                />
              );
            })
          )}

          {/* Draggable knob */}
          <Box
            style={{
              position: 'absolute',
              left: knobPos.x - ALIGN_KNOB / 2,
              top: knobPos.y - ALIGN_KNOB / 2,
              width: ALIGN_KNOB,
              height: ALIGN_KNOB,
              borderRadius: '50%',
              backgroundColor: '#667eea',
              boxShadow: '0 2px 6px rgba(102,126,234,0.4)',
              transition: isDragging ? 'none' : 'all 0.15s ease-out',
              pointerEvents: 'none',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

interface SidebarProps {
  settings: CanvasSettings;
  setSettings: (settings: CanvasSettings) => void;
  screens: Screen[];
  sharedBackground?: SharedBackground;
  onSharedBackgroundChange?: (sharedBg: SharedBackground | undefined) => void;
  onToggleScreenInSharedBg?: (screenId: string) => void;
  onApplyEffectsToAll?: (effects: BackgroundEffects) => void;
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
      border: '2px solid',
      borderColor: selected ? '#228be6' : '#dee2e6',
      borderRadius: 8,
      padding: '12px 8px',
      cursor: 'pointer',
      textAlign: 'center',
      backgroundColor: selected ? '#e7f5ff' : 'white',
      transition: 'all 0.2s',
    }}
  >
    <Box style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 40 }}>
      {type === 'single' && <Box style={{ width: 20, height: 35, border: '2px solid #495057', borderRadius: 4 }} />}
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

export function Sidebar({ settings, setSettings, screens, sharedBackground, onSharedBackgroundChange, onToggleScreenInSharedBg, onApplyEffectsToAll }: SidebarProps) {
  const currentScreen = screens[settings.selectedScreenIndex];
  const hasAnyFrames = (currentScreen?.images ?? []).some((img) => !(img?.cleared === true) && img?.diyOptions);
  const effectiveComposition = hasAnyFrames ? settings.composition : undefined;

  // Find current store and device based on selected canvas size
  const current = findStoreAndDevice(settings.canvasSize);
  const currentStore = current?.store || STORES[0];
  const currentDevice = current?.device || STORES[0].devices[0];

  // State for UI
  const [activeStoreId, setActiveStoreId] = useState<string>(currentStore.id);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);

  const activeStore = STORES.find((s) => s.id === activeStoreId) || STORES[0];

  const handleSizeSelect = (value: string) => {
    const dims = getCanvasDimensions(value, 'portrait');
    const orientation = dims.width > dims.height ? 'landscape' : 'portrait';
    setSettings({ ...settings, canvasSize: value, orientation });
    setShowSizeDropdown(false);
  };

  const handleDeviceSelect = (device: DeviceConfig) => {
    // Select the default size for this device
    handleSizeSelect(device.defaultSize);
  };

  // Check if a device is currently selected
  const isDeviceSelected = (device: DeviceConfig) => {
    return device.sizes.some((s) => s.value === settings.canvasSize);
  };

  // Shared background state & handlers
  const [sharedGradientOpen, setSharedGradientOpen] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  const hasSharedBackgroundSupport = !!onSharedBackgroundChange && screens.length >= 2;

  const recommendedDimensions = useMemo(() => {
    if (!sharedBackground || sharedBackground.screenIds.length < 2) return null;
    return getRecommendedImageDimensions(sharedBackground.screenIds.length, settings.canvasSize, settings.orientation);
  }, [sharedBackground?.screenIds.length, settings.canvasSize, settings.orientation]);

  const handleSharedTypeChange = (type: 'gradient' | 'image') => {
    if (!sharedBackground) return;
    onSharedBackgroundChange?.({ ...sharedBackground, type });
  };

  const handleSelectMedia = (mediaId: number) => {
    if (!sharedBackground) return;
    onSharedBackgroundChange?.({ ...sharedBackground, mediaId });
    setImagePickerOpen(false);
  };

  const handleGradientApply = (gradientString: string) => {
    if (!sharedBackground) return;
    const dirMatch = gradientString.match(/linear-gradient\(([^,]+)/);
    const colorStops = gradientString.match(/#[a-fA-F0-9]{6}\s+[\d.]+%/g) || [];
    let direction: NonNullable<SharedBackground['gradient']>['direction'] = 'horizontal';
    if (dirMatch) {
      const dir = dirMatch[1].trim();
      if (dir === 'to bottom' || dir === '180deg') direction = 'vertical';
      else if (dir === '135deg') direction = 'diagonal-down';
      else if (dir === '45deg') direction = 'diagonal-up';
    }
    const stops = colorStops.map(s => {
      const parts = s.trim().split(/\s+/);
      return { color: parts[0], position: parseFloat(parts[1]) };
    });
    if (stops.length >= 2) {
      onSharedBackgroundChange?.({ ...sharedBackground, gradient: { stops, direction } });
    }
    setSharedGradientOpen(false);
  };

  const handleDirectionChange = (direction: string | null) => {
    if (!sharedBackground?.gradient || !direction) return;
    onSharedBackgroundChange?.({ ...sharedBackground, gradient: { ...sharedBackground.gradient, direction: direction as NonNullable<SharedBackground['gradient']>['direction'] } });
  };

  const handleImageFitChange = (fit: string | null) => {
    if (!sharedBackground || !fit) return;
    onSharedBackgroundChange?.({ ...sharedBackground, imageFit: fit as 'fill' | 'fit' });
  };

  const handleVerticalAlignChange = (align: string | null) => {
    if (!sharedBackground || !align) return;
    onSharedBackgroundChange?.({ ...sharedBackground, imageVerticalAlign: align as 'top' | 'center' | 'bottom' });
  };

  const handleHorizontalAlignChange = (align: string | null) => {
    if (!sharedBackground || !align) return;
    onSharedBackgroundChange?.({ ...sharedBackground, imageHorizontalAlign: align as 'left' | 'center' | 'right' });
  };

  return (
    <Stack gap="lg" style={{ overflow: 'auto', height: '100%', padding: '16px' }}>
      {/* Canvas Size */}
      <Box>
        <Group justify="space-between" align="center" mb="xs">
          <Text size="xs" c="dimmed" tt="uppercase">
            Canvas Size
          </Text>
          {currentScreen && (
            <Badge variant="light" color="blue" size="sm" style={{ textTransform: 'none' }}>
              {currentScreen.name}
            </Badge>
          )}
        </Group>

        {/* Store Tabs */}
        <Group gap={8} mb="sm">
          {STORES.map((store) => {
            const isActive = activeStoreId === store.id;
            return (
              <Box
                key={store.id}
                onClick={() => setActiveStoreId(store.id)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: isActive ? '#228be6' : '#dee2e6',
                  backgroundColor: isActive ? '#e7f5ff' : 'white',
                  color: isActive ? '#228be6' : '#868e96',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                  flex: 1,
                }}
              >
                {store.id === 'apple' ? (
                  <IconBrandApple size={24} style={{ marginBottom: 4 }} />
                ) : (
                  <IconBrandGooglePlay size={24} style={{ marginBottom: 4 }} />
                )}
                <Text size="xs" fw={isActive ? 600 : 500}>
                  {store.id === 'apple' ? 'Apple' : 'Google'}
                </Text>
              </Box>
            );
          })}
        </Group>

        {/* Device Cards Grid */}
        <SimpleGrid cols={3} spacing={8}>
          {activeStore.devices.map((device) => {
            const isSelected = isDeviceSelected(device);
            return (
              <Box
                key={device.id}
                onClick={() => handleDeviceSelect(device)}
                style={{
                  padding: '10px 4px',
                  borderRadius: 8,
                  border: '2px solid',
                  borderColor: isSelected ? '#228be6' : '#dee2e6',
                  backgroundColor: isSelected ? '#e7f5ff' : 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <Box
                  style={{
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSelected ? '#228be6' : '#868e96',
                    marginBottom: 4,
                  }}
                >
                  <DeviceIcon deviceId={device.id} size={40} />
                </Box>
                <Text size="xs" fw={isSelected ? 600 : 400} c={isSelected ? '#228be6' : undefined}>
                  {device.shortLabel || device.label}
                </Text>
              </Box>
            );
          })}
        </SimpleGrid>

        {/* Current Size Display & Dropdown */}
        <Box mt="sm">
          <Box
            onClick={() => currentDevice.sizes.length > 1 && setShowSizeDropdown(!showSizeDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 6,
              backgroundColor: '#f8f9fa',
              cursor: currentDevice.sizes.length > 1 ? 'pointer' : 'default',
            }}
          >
            <Text size="xs" c="dimmed">
              {getSizeLabel(settings.canvasSize)}
            </Text>
            {currentDevice.sizes.length > 1 && (
              <IconChevronDown
                size={14}
                color="#868e96"
                style={{
                  transition: 'transform 0.2s ease',
                  transform: showSizeDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            )}
          </Box>

          {/* Size Dropdown */}
          {showSizeDropdown && currentDevice.sizes.length > 1 && (
            <Box
              style={{
                marginTop: 4,
                padding: '4px',
                borderRadius: 6,
                border: '1px solid #dee2e6',
                backgroundColor: 'white',
              }}
            >
              <Stack gap={1}>
                {currentDevice.sizes.map((size) => {
                  const isSelected = settings.canvasSize === size.value;
                  return (
                    <Box
                      key={size.value}
                      onClick={() => handleSizeSelect(size.value)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 4,
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#e7f5ff' : 'transparent',
                      }}
                    >
                      <Text size="xs" fw={isSelected ? 600 : 400} c={isSelected ? '#228be6' : undefined}>
                        {size.label}
                      </Text>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Box>
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

      {/* Shared Background */}
      {hasSharedBackgroundSupport && (
        <Box>
          <Text size="xs" c="dimmed" mb="xs" tt="uppercase">
            Shared Background
          </Text>

          <Stack gap="sm">
            {/* Screen Selector */}
            <Box>
              <Text size="xs" c="dimmed" mb={6}>Select screens to share a background</Text>
              <Group gap={4}>
                {screens.map((screen, idx) => {
                  const isInGroup = sharedBackground?.screenIds.includes(screen.id) ?? false;
                  return (
                    <Button key={screen.id} size="xs" variant={isInGroup ? 'filled' : 'light'}
                      onClick={() => onToggleScreenInSharedBg?.(screen.id)}
                      style={{ minWidth: 32, padding: '0 8px' }}>
                      {idx + 1}
                    </Button>
                  );
                })}
              </Group>
            </Box>

            {/* Type Selector & Controls — shown once screens are selected */}
            {sharedBackground && sharedBackground.screenIds.length > 0 && (
              <>
                <Box>
                  <Text size="sm" fw={600} mb="xs">Background Type</Text>
                  <SegmentedControl fullWidth size="xs"
                    value={sharedBackground.type}
                    onChange={(v) => handleSharedTypeChange(v as 'gradient' | 'image')}
                    data={[
                      { label: 'Gradient', value: 'gradient' },
                      { label: 'Image', value: 'image' },
                    ]}
                  />
                </Box>

                {/* Gradient Controls */}
                {sharedBackground.type === 'gradient' && sharedBackground.gradient && (
                  <Stack gap="xs">
                    <SharedGradientPreview gradient={sharedBackground.gradient} />
                    <Select size="xs" label="Direction"
                      value={sharedBackground.gradient.direction}
                      onChange={handleDirectionChange}
                      data={[
                        { value: 'horizontal', label: 'Horizontal (Left to Right)' },
                        { value: 'vertical', label: 'Vertical (Top to Bottom)' },
                        { value: 'diagonal-down', label: 'Diagonal (Top-Left to Bottom-Right)' },
                        { value: 'diagonal-up', label: 'Diagonal (Bottom-Left to Top-Right)' },
                      ]}
                    />
                    <Popover opened={sharedGradientOpen} onChange={setSharedGradientOpen} position="bottom" withArrow>
                      <Popover.Target>
                        <Button size="xs" variant="light" fullWidth onClick={() => setSharedGradientOpen(true)}>Edit Colors</Button>
                      </Popover.Target>
                      <Popover.Dropdown>
                        <GradientEditor
                          initialGradient={
                            sharedBackground.gradient
                              ? `linear-gradient(to right, ${sharedBackground.gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`
                              : undefined
                          }
                          onApply={handleGradientApply}
                          onCancel={() => setSharedGradientOpen(false)}
                        />
                      </Popover.Dropdown>
                    </Popover>
                  </Stack>
                )}

                {/* Image Controls */}
                {sharedBackground.type === 'image' && (
                  <Stack gap="xs">
                    {sharedBackground.mediaId ? (
                      <>
                        <SharedImagePreview mediaId={sharedBackground.mediaId} />
                        <Group grow>
                          <Popover opened={imagePickerOpen} onChange={setImagePickerOpen} position="bottom" withArrow width={280}>
                            <Popover.Target>
                              <Button size="xs" variant="light" onClick={() => setImagePickerOpen(true)}>Change Image</Button>
                            </Popover.Target>
                            <Popover.Dropdown p={0}>
                              <MediaLibraryProvider enableDragDrop={false}>
                                <QuickMediaPicker onSelectMedia={handleSelectMedia} onClose={() => setImagePickerOpen(false)}
                                  preset={quickPickerPreset} width={280} scrollHeight={200} maxItems={9} columns={3} gap="4px" />
                              </MediaLibraryProvider>
                            </Popover.Dropdown>
                          </Popover>
                          <Button size="xs" variant="light" color="red"
                            onClick={() => onSharedBackgroundChange?.({ ...sharedBackground, mediaId: undefined })}>
                            Remove
                          </Button>
                        </Group>
                      </>
                    ) : (
                      <Popover opened={imagePickerOpen} onChange={setImagePickerOpen} position="bottom" withArrow width={280}>
                        <Popover.Target>
                          <Button size="xs" variant="light" fullWidth onClick={() => setImagePickerOpen(true)}>Select Image</Button>
                        </Popover.Target>
                        <Popover.Dropdown p={0}>
                          <MediaLibraryProvider enableDragDrop={false}>
                            <QuickMediaPicker onSelectMedia={handleSelectMedia} onClose={() => setImagePickerOpen(false)}
                              preset={quickPickerPreset} width={280} scrollHeight={200} maxItems={9} columns={3} gap="4px" />
                          </MediaLibraryProvider>
                        </Popover.Dropdown>
                      </Popover>
                    )}

                    <Group gap="md" align="flex-start" wrap="nowrap">
                      {/* Fit Mode toggle */}
                      <Box style={{ flex: 1 }}>
                        <Text size="xs" c="dimmed" mb={4} tt="uppercase" ta="center">Fit Mode</Text>
                        <SimpleGrid cols={2} spacing={4}>
                          {([['fill', 'Fill'], ['fit', 'Fit']] as const).map(([value, label]) => {
                            const isFill = value === 'fill';
                            const selected = (sharedBackground.imageFit ?? 'fill') === value;
                            return (
                              <Box
                                key={value}
                                onClick={() => handleImageFitChange(value)}
                                style={{
                                  border: '2px solid',
                                  borderColor: selected ? '#228be6' : '#dee2e6',
                                  borderRadius: 6,
                                  padding: '6px 2px 4px',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  backgroundColor: selected ? '#e7f5ff' : 'white',
                                  transition: 'all 0.2s',
                                }}
                              >
                                <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 24, marginBottom: 2 }}>
                                  <Box style={{
                                    position: 'relative', width: 28, height: 22,
                                    border: '2px solid #495057', borderRadius: 2,
                                    overflow: isFill ? 'hidden' : undefined,
                                    display: isFill ? undefined : 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}>
                                    {isFill ? (
                                      <Box style={{ position: 'absolute', inset: -3, background: 'linear-gradient(135deg, #a8d8ea 0%, #aa96da 50%, #fcbad3 100%)' }} />
                                    ) : (
                                      <Box style={{ width: 14, height: 16, borderRadius: 1, background: 'linear-gradient(135deg, #a8d8ea 0%, #aa96da 50%, #fcbad3 100%)' }} />
                                    )}
                                  </Box>
                                </Box>
                                <Text size="xs" fw={500}>{label}</Text>
                              </Box>
                            );
                          })}
                        </SimpleGrid>
                      </Box>
                      {/* Alignment pad */}
                      <AlignmentControl
                        vertical={sharedBackground.imageVerticalAlign ?? 'center'}
                        horizontal={sharedBackground.imageHorizontalAlign ?? 'center'}
                        onVerticalChange={(v) => handleVerticalAlignChange(v)}
                        onHorizontalChange={(h) => handleHorizontalAlignChange(h)}
                      />
                    </Group>
                    {recommendedDimensions && (
                      <Box style={{ backgroundColor: '#f1f3f5', borderRadius: 8, padding: '8px 12px' }}>
                        <Text size="xs" c="dimmed">Recommended size: {recommendedDimensions.width} x {recommendedDimensions.height}px</Text>
                        <Text size="xs" c="dimmed">Aspect ratio: {recommendedDimensions.aspectRatio}</Text>
                      </Box>
                    )}
                  </Stack>
                )}
              </>
            )}

          </Stack>
        </Box>
      )}
    </Stack>
  );
}
