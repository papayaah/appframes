'use client';

import { useState } from 'react';
import {
  Stack,
  Text,
  Select,
  SimpleGrid,
  Box,
  Slider,
  NumberInput,
  Group,
  Button,
  TextInput,
  Switch,
  Popover,
  ColorPicker,
  Tabs,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { CanvasSettings, Screen } from './AppFrames';
import { GradientEditor } from './GradientEditor';

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
const BACKGROUND_PRESETS = [
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
  const [customColorOpen, setCustomColorOpen] = useState(false);
  const [customColor, setCustomColor] = useState('#ffffff');

  const currentScreen = screens[settings.selectedScreenIndex];
  const hasAnyFrames =
    (currentScreen?.images ?? []).some((img) => !(img?.cleared === true || img?.deviceFrame === ''));
  const effectiveComposition = hasAnyFrames ? settings.composition : undefined;

  return (
    <Stack gap="lg" style={{ overflow: 'auto', height: '100%', padding: '16px' }}>
      <Box>
        <Text size="sm" fw={700} mb="xs">
          Canvas Size
        </Text>
        <Text size="xs" c="dimmed" mb="xs" tt="uppercase">
          Export Dimensions (Store Requirement)
        </Text>
        <Select
          size="xs"
          value={settings.canvasSize}
          onChange={(value) => setSettings({ ...settings, canvasSize: value || 'iphone-6.9' })}
          data={[
            { 
              group: 'iPhone — 6.9" Display',
              items: [
                { value: 'iphone-6.9-1260x2736', label: '1260 × 2736' },
                { value: 'iphone-6.9-1290x2796', label: '1290 × 2796' },
                { value: 'iphone-6.9', label: '1320 × 2868' },
              ]
            },
            { 
              group: 'iPhone — 6.5" Display',
              items: [
                { value: 'iphone-6.5-1242x2688', label: '1242 × 2688' },
                { value: 'iphone-6.5', label: '1284 × 2778' },
              ]
            },
            { 
              group: 'iPhone — 6.3" Display',
              items: [
                { value: 'iphone-6.3-1179x2556', label: '1179 × 2556' },
                { value: 'iphone-6.3', label: '1206 × 2622' },
              ]
            },
            { 
              group: 'iPhone — 6.1" Display',
              items: [
                { value: 'iphone-6.1-1170x2532', label: '1170 × 2532' },
                { value: 'iphone-6.1-1125x2436', label: '1125 × 2436' },
                { value: 'iphone-6.1-1080x2340', label: '1080 × 2340' },
              ]
            },
            { 
              group: 'iPhone — 5.5" Display',
              items: [
                { value: 'iphone-5.5', label: '1242 × 2208' },
              ]
            },
            { 
              group: 'iPhone — 4.7" Display',
              items: [
                { value: 'iphone-4.7', label: '750 × 1334' },
              ]
            },
            { 
              group: 'iPhone — 4.0" Display',
              items: [
                { value: 'iphone-4.0-640x1096', label: '640 × 1096 (without status bar)' },
                { value: 'iphone-4.0', label: '640 × 1136 (with status bar)' },
              ]
            },
            { 
              group: 'iPhone — 3.5" Display',
              items: [
                { value: 'iphone-3.5-640x920', label: '640 × 920 (without status bar)' },
                { value: 'iphone-3.5', label: '640 × 960 (with status bar)' },
              ]
            },
            { 
              group: 'Apple App Store - iPad',
              items: [
                { value: 'ipad-13', label: '2064 × 2752 (13")' },
                { value: 'ipad-11', label: '1668 × 2388 (11")' },
                { value: 'ipad-12.9-gen2', label: '2048 × 2732 (12.9" 2nd Gen)' },
                { value: 'ipad-10.5', label: '1668 × 2224 (10.5")' },
                { value: 'ipad-9.7', label: '1536 × 2048 (9.7")' },
              ]
            },
            { 
              group: 'Apple Watch',
              items: [
                { value: 'watch-ultra-3', label: '422 × 514 (Ultra 3)' },
                { value: 'watch-ultra-3-alt', label: '410 × 502 (Ultra 3 Alt)' },
                { value: 'watch-s11', label: '416 × 496 (Series 11)' },
                { value: 'watch-s9', label: '396 × 484 (Series 9)' },
                { value: 'watch-s6', label: '368 × 448 (Series 6)' },
                { value: 'watch-s3', label: '312 × 390 (Series 3)' },
              ]
            },
            { 
              group: 'Google Play Store',
              items: [
                { value: 'google-phone', label: '1080 × 1920 (Phone)' },
                { value: 'google-tablet-7', label: '1536 × 2048 (7" Tablet)' },
                { value: 'google-tablet-10', label: '2048 × 2732 (10" Tablet)' },
                { value: 'google-chromebook', label: '1920 × 1080 (Chromebook)' },
                { value: 'google-xr', label: '1920 × 1080 (Android XR)' },
              ]
            },
          ]}
        />
        <Text size="xs" c="dimmed" mt={4}>
          Select the target store resolution for export.
        </Text>
      </Box>

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

      {screens.length > 0 && (
        <Box>
          <Text size="sm" fw={700} mb="xs">
            Selected Image
          </Text>
          <Text size="xs" c="dimmed" mb="xs">
            Slot {settings.selectedScreenIndex + 1}
          </Text>

          <Text size="xs" c="dimmed" mb="xs" mt="md">
            SCALE
          </Text>
          <Slider
            value={settings.screenScale}
            onChange={(value) => setSettings({ ...settings, screenScale: value })}
            min={0}
            max={100}
            label={(value) => `${value}%`}
          />

          <Group grow mt="md">
            <Box>
              <Text size="xs" c="dimmed" mb="xs">
                Pan X
              </Text>
              <NumberInput
                size="xs"
                value={settings.screenPanX}
                onChange={(value) => setSettings({ ...settings, screenPanX: Number(value) })}
                min={0}
                max={100}
              />
            </Box>
            <Box>
              <Text size="xs" c="dimmed" mb="xs">
                Pan Y
              </Text>
              <NumberInput
                size="xs"
                value={settings.screenPanY}
                onChange={(value) => setSettings({ ...settings, screenPanY: Number(value) })}
                min={0}
                max={100}
              />
            </Box>
          </Group>

          <Button
            size="xs"
            variant="light"
            fullWidth
            mt="md"
            onClick={() =>
              setSettings({
                ...settings,
                screenScale: 50,
                screenPanX: 50,
                screenPanY: 50,
              })
            }
          >
            Reset
          </Button>
        </Box>
      )}

      <Box>
        <Text size="sm" fw={700} mb="xs">
          Canvas Orientation
        </Text>
        <Group grow>
          <Button
            size="xs"
            variant={settings.orientation === 'portrait' ? 'filled' : 'light'}
            onClick={() => setSettings({ ...settings, orientation: 'portrait' })}
          >
            Portrait
          </Button>
          <Button
            size="xs"
            variant={settings.orientation === 'landscape' ? 'filled' : 'light'}
            onClick={() => setSettings({ ...settings, orientation: 'landscape' })}
          >
            Landscape
          </Button>
        </Group>
      </Box>

      <Box>
        <Text size="sm" fw={700} mb="xs">
          Background Color
        </Text>
        <SimpleGrid cols={4} spacing="xs">
          {BACKGROUND_PRESETS.map((color) => (
            <Box
              key={color}
              onClick={() => setSettings({ ...settings, backgroundColor: color })}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                ...(color === 'transparent'
                  ? {
                      // Checkerboard to indicate transparency
                      backgroundImage:
                        'linear-gradient(45deg, #e9ecef 25%, transparent 25%), linear-gradient(-45deg, #e9ecef 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e9ecef 75%), linear-gradient(-45deg, transparent 75%, #e9ecef 75%)',
                      backgroundSize: '10px 10px',
                      backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                    }
                  : getBackgroundStyle(color)),
                cursor: 'pointer',
                border:
                  settings.backgroundColor === color ? '3px solid #228be6' : '1px solid #dee2e6',
              }}
            />
          ))}
          {/* Custom color/gradient picker button */}
          <Popover opened={customColorOpen} onChange={setCustomColorOpen} position="bottom" withArrow>
            <Popover.Target>
              <Box
                onClick={() => setCustomColorOpen(true)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '2px dashed #dee2e6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#fff',
                }}
              >
                <IconPlus size={16} color="#868e96" />
              </Box>
            </Popover.Target>
            <Popover.Dropdown>
              <Tabs defaultValue="solid">
                <Tabs.List>
                  <Tabs.Tab value="solid" size="xs">
                    Solid
                  </Tabs.Tab>
                  <Tabs.Tab value="gradient" size="xs">
                    Gradient
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="solid" pt="xs">
                  <Stack gap="xs">
                    <ColorPicker
                      format="hex"
                      value={customColor}
                      onChange={setCustomColor}
                      swatches={['#E5E7EB', '#F3F4F6', '#DBEAFE', '#E0E7FF', '#FCE7F3', '#FEF3C7', '#D1FAE5', '#000000', '#FFFFFF']}
                    />
                    <Button
                      size="xs"
                      onClick={() => {
                        setSettings({ ...settings, backgroundColor: customColor });
                        setCustomColorOpen(false);
                      }}
                    >
                      Apply
                    </Button>
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="gradient" pt="xs">
                  <GradientEditor
                    initialGradient={isGradient(settings.backgroundColor) ? settings.backgroundColor : undefined}
                    onApply={(gradient) => {
                      setSettings({ ...settings, backgroundColor: gradient });
                      setCustomColorOpen(false);
                    }}
                    onCancel={() => setCustomColorOpen(false)}
                  />
                </Tabs.Panel>
              </Tabs>
            </Popover.Dropdown>
          </Popover>
        </SimpleGrid>
      </Box>
    </Stack>
  );
}
