'use client';

import { useState } from 'react';
import {
  Stack,
  Text,
  SimpleGrid,
  Box,
  Group,
  Button,
  Popover,
  ColorPicker,
  Tabs,
  Slider,
  Divider,
} from '@mantine/core';
import { IconPlus, IconZoomIn } from '@tabler/icons-react';
import { CanvasSettings } from './AppFrames';
import { GradientEditor } from './GradientEditor';
import { isGradient, getBackgroundStyle, BACKGROUND_PRESETS } from './Sidebar';
import { isFixedOrientationCanvas } from './FramesContext';
import { BackgroundEffectsPanel } from './BackgroundEffectsPanel';
import { DEFAULT_BACKGROUND_EFFECTS } from './types';
import { PanControl } from './PanControl';
import { RotationControl } from './RotationControl';

export interface CanvasSettingsPanelProps {
  settings: CanvasSettings;
  setSettings: (settings: CanvasSettings | ((prev: CanvasSettings) => CanvasSettings)) => void;
  hasBackgroundMedia?: boolean;
  onClearBackgroundMedia?: () => void;
  onApplyEffectsToAll?: (effects: import('./types').BackgroundEffects) => void;
  onBackgroundScaleChange?: (value: number, persistent?: boolean) => void;
  onBackgroundRotationChange?: (value: number, persistent?: boolean) => void;
  onBackgroundPanChange?: (x: number, y: number, persistent?: boolean) => void;
}

export function CanvasSettingsPanel({
  settings,
  setSettings,
  hasBackgroundMedia,
  onClearBackgroundMedia,
  onApplyEffectsToAll,
  onBackgroundScaleChange,
  onBackgroundRotationChange,
  onBackgroundPanChange,
}: CanvasSettingsPanelProps) {
  const [customColorOpen, setCustomColorOpen] = useState(false);
  const [customColor, setCustomColor] = useState('#ffffff');
  const fixedOrientation = isFixedOrientationCanvas(settings.canvasSize);

  return (
    <Stack gap="md">
      {!fixedOrientation && (
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
      )}

      {/* Per-screen background controls */}
      <Box>
        <Text size="sm" fw={700} mb="xs">
          Background Color
        </Text>
        <SimpleGrid cols={6} spacing={4}>
          {BACKGROUND_PRESETS.map((color) => (
            <Box
              key={color}
              onClick={() => {
                setSettings((prev: CanvasSettings) => ({
                  ...prev,
                  backgroundColor: color,
                  canvasBackgroundMediaId: undefined,
                }));
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                ...(color === 'transparent'
                  ? {
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
                        setSettings((prev: CanvasSettings) => ({
                          ...prev,
                          backgroundColor: customColor,
                          canvasBackgroundMediaId: undefined,
                        }));
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
                      setSettings((prev: CanvasSettings) => ({
                        ...prev,
                        backgroundColor: gradient,
                        canvasBackgroundMediaId: undefined,
                      }));
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

      {hasBackgroundMedia && (
        <>
          <Divider size="xs" label="Background Image" labelPosition="center" />

          {/* 2x2 Grid Layout for Zoom and Rotation */}
          <SimpleGrid cols={2} spacing="sm">
            {/* 1. Rotation Dial */}
            <Box style={{ display: 'flex', justifyContent: 'center' }}>
              <RotationControl
                rotation={settings.backgroundRotation ?? 0}
                onRotationChange={(value) => {
                  if (onBackgroundRotationChange) onBackgroundRotationChange(value, true);
                  else setSettings({ ...settings, backgroundRotation: value });
                }}
              />
            </Box>

            {/* 2. Zoom Slider */}
            <Box>
              <Text size="xs" c="dimmed" mb={4} tt="uppercase" ta="center">Image Zoom</Text>
              <Stack gap={4} align="center">
                <IconZoomIn size={14} color="#666" />
                <Slider
                  w="100%"
                  value={settings.backgroundScale ?? 0}
                  onChange={(value) => {
                    if (onBackgroundScaleChange) onBackgroundScaleChange(value, false);
                    else setSettings({ ...settings, backgroundScale: value });
                  }}
                  onChangeEnd={(value) => {
                    if (onBackgroundScaleChange) onBackgroundScaleChange(value, true);
                  }}
                  min={0}
                  max={300}
                  label={(v) => `${Math.round(100 + (v ?? 0))}%`}
                  styles={{ thumb: { width: 12, height: 12 } }}
                />
                <Text size="xs" c="dimmed">{Math.round(100 + (settings.backgroundScale ?? 0))}%</Text>
              </Stack>
            </Box>

            {/* 3. Pan Control - Spans 2 columns */}
            <Box style={{ display: 'flex', justifyContent: 'center', gridColumn: 'span 2' }}>
              <PanControl
                panX={settings.screenPanX ?? 50}
                panY={settings.screenPanY ?? 50}
                onPanChange={(newPanX: number, newPanY: number, p?: boolean) => {
                  if (onBackgroundPanChange) onBackgroundPanChange(newPanX, newPanY, p);
                  else setSettings({ ...settings, screenPanX: newPanX, screenPanY: newPanY });
                }}
                onReset={() => {
                  if (onBackgroundPanChange && onBackgroundScaleChange && onBackgroundRotationChange) {
                    onBackgroundPanChange(50, 50, true);
                    onBackgroundScaleChange(0, true);
                    onBackgroundRotationChange(0, true);
                  } else {
                    setSettings({ ...settings, screenPanX: 50, screenPanY: 50, backgroundScale: 0, backgroundRotation: 0 });
                  }
                }}
              />
            </Box>
          </SimpleGrid>

          {onClearBackgroundMedia && (
            <Button
              size="xs"
              variant="light"
              color="red"
              fullWidth
              onClick={onClearBackgroundMedia}
            >
              Remove Background Image
            </Button>
          )}
        </>
      )}

      {/* Background Effects */}
      <Box>
        <Text size="sm" fw={700} mb="xs">
          Background Effects
        </Text>
        <BackgroundEffectsPanel
          effects={settings.backgroundEffects ?? DEFAULT_BACKGROUND_EFFECTS}
          onChange={(effects) => setSettings({ ...settings, backgroundEffects: effects })}
          onApplyToAll={onApplyEffectsToAll ? () => onApplyEffectsToAll(settings.backgroundEffects ?? DEFAULT_BACKGROUND_EFFECTS) : undefined}
        />
      </Box>
    </Stack>
  );
}
