'use client';

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
} from '@mantine/core';
import { CanvasSettings, Screen } from './AppFrames';

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
      {type === 'split' && (
        <Group gap={4}>
          <Box style={{ width: 16, height: 30, border: '2px solid #495057', borderRadius: 3 }} />
          <Box style={{ width: 16, height: 30, border: '2px solid #495057', borderRadius: 3 }} />
        </Group>
      )}
    </Box>
    <Text size="xs" fw={500}>
      {label}
    </Text>
  </Box>
);

export function Sidebar({ settings, setSettings, screens }: SidebarProps) {
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
          onChange={(value) => setSettings({ ...settings, canvasSize: value || 'iphone-6.5-1' })}
          data={[
            { 
              group: 'iPhone 6.5" Display',
              items: [
                { value: 'iphone-6.5-1', label: '1242 × 2688' },
                { value: 'iphone-6.5-2', label: '2688 × 1242' },
                { value: 'iphone-6.5-3', label: '1284 × 2778' },
                { value: 'iphone-6.5-4', label: '2778 × 1284' },
              ]
            },
            { 
              group: 'iPad 13" Display',
              items: [
                { value: 'ipad-13-1', label: '2064 × 2752' },
                { value: 'ipad-13-2', label: '2752 × 2064' },
                { value: 'ipad-13-3', label: '2048 × 2732' },
                { value: 'ipad-13-4', label: '2732 × 2048' },
              ]
            },
            { 
              group: 'Apple Watch Ultra 3',
              items: [
                { value: 'watch-ultra-3-1', label: '422 × 514' },
                { value: 'watch-ultra-3-2', label: '410 × 502' },
              ]
            },
            { 
              group: 'Apple Watch Series 11',
              items: [
                { value: 'watch-s11', label: '416 × 496' },
              ]
            },
            { 
              group: 'Apple Watch Series 9',
              items: [
                { value: 'watch-s9', label: '396 × 484' },
              ]
            },
            { 
              group: 'Apple Watch Series 6',
              items: [
                { value: 'watch-s6', label: '368 × 448' },
              ]
            },
            { 
              group: 'Apple Watch Series 3',
              items: [
                { value: 'watch-s3', label: '312 × 390' },
              ]
            },
            { 
              group: 'Google Play - Phone',
              items: [
                { value: 'google-phone-1', label: '1080 × 1920 (Portrait)' },
                { value: 'google-phone-2', label: '1920 × 1080 (Landscape)' },
                { value: 'google-phone-3', label: '1440 × 2560 (Portrait 2K)' },
                { value: 'google-phone-4', label: '2560 × 1440 (Landscape 2K)' },
              ]
            },
            { 
              group: 'Google Play - Tablet',
              items: [
                { value: 'google-tablet-1', label: '1600 × 2560 (Portrait)' },
                { value: 'google-tablet-2', label: '2560 × 1600 (Landscape)' },
                { value: 'google-tablet-3', label: '2048 × 2732 (Portrait)' },
                { value: 'google-tablet-4', label: '2732 × 2048 (Landscape)' },
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
            selected={settings.composition === 'single'}
            onClick={() => setSettings({ ...settings, composition: 'single' })}
          />
          <CompositionButton
            type="dual"
            label="Dual"
            selected={settings.composition === 'dual'}
            onClick={() => setSettings({ ...settings, composition: 'dual' })}
          />
          <CompositionButton
            type="stack"
            label="Stack"
            selected={settings.composition === 'stack'}
            onClick={() => setSettings({ ...settings, composition: 'stack' })}
          />
          <CompositionButton
            type="triple"
            label="Triple"
            selected={settings.composition === 'triple'}
            onClick={() => setSettings({ ...settings, composition: 'triple' })}
          />
        </SimpleGrid>
        <SimpleGrid cols={2} spacing="xs" mt="xs">
          <CompositionButton
            type="fan"
            label="Fan"
            selected={settings.composition === 'fan'}
            onClick={() => setSettings({ ...settings, composition: 'fan' })}
          />
          <CompositionButton
            type="split"
            label="Split"
            selected={settings.composition === 'split'}
            onClick={() => setSettings({ ...settings, composition: 'split' })}
          />
        </SimpleGrid>
      </Box>

      <Box>
        <Text size="xs" c="dimmed" mb="xs">
          COMPOSITION SCALE
        </Text>
        <Slider
          value={settings.compositionScale}
          onChange={(value) => setSettings({ ...settings, compositionScale: value })}
          min={50}
          max={100}
          label={(value) => `${value}%`}
          marks={[
            { value: 50, label: '50%' },
            { value: 100, label: '100%' },
          ]}
        />
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
        <Group gap="xs">
          {['#E5E7EB', '#F3F4F6', '#DBEAFE', '#E0E7FF', '#FCE7F3', '#FEF3C7', '#D1FAE5'].map(
            (color) => (
              <Box
                key={color}
                onClick={() => setSettings({ ...settings, backgroundColor: color })}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: color,
                  cursor: 'pointer',
                  border:
                    settings.backgroundColor === color ? '3px solid #228be6' : '1px solid #dee2e6',
                }}
              />
            )
          )}
        </Group>
      </Box>
    </Stack>
  );
}
