'use client';

import { useState } from 'react';
import { Box, Text, SimpleGrid, Button, Popover, ColorPicker, Stack, Divider } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import type { DIYOptions } from './diy-frames/types';
import type { FrameEffects } from './types';
import { DEFAULT_FRAME_EFFECTS } from './types';
import { DIYSettingsPanel } from './diy-frames/DIYSettingsPanel';
import { FrameEffectsPanel } from './FrameEffectsPanel';
import { TransformControls } from './TransformControls';

// Frame color presets
const FRAME_COLOR_PRESETS = [
  // Default/Auto (uses device default)
  undefined,
  // Dark tones
  '#1a1a1a',
  '#2a2a2a',
  '#3a3a3a',
  '#4a4a4a',
  // Light tones
  '#e0e0e0',
  '#f0f0f0',
  '#ffffff',
  // Colors
  '#1e3a5f', // Navy
  '#2d4a3e', // Forest
  '#5c2a2a', // Burgundy
  '#4a3728', // Brown
  '#3d3d5c', // Slate purple
  '#c4a35a', // Gold
  '#b76e79', // Rose gold
] as const;

export interface FrameSettingsPanelProps {
  /** Current frame color (undefined = device default) */
  frameColor?: string;
  /** Default frame color from device config */
  defaultFrameColor: string;
  /** Callback when frame color changes */
  onFrameColorChange: (color: string | undefined) => void;
  /** Current frame rotation in degrees (-180 to 180) */
  frameRotation?: number;
  /** Callback when frame rotation changes */
  onFrameRotationChange?: (rotation: number) => void;
  /** Current frame scale percentage (20 to 500) */
  frameScale?: number;
  /** Callback when frame scale changes */
  onFrameScaleChange?: (scale: number) => void;
  /** Current frame tiltX in degrees (-60 to 60) */
  frameTiltX?: number;
  /** Current frame tiltY in degrees (-60 to 60) */
  frameTiltY?: number;
  /** Callback when frame tilt changes */
  onFrameTiltChange?: (tiltX: number, tiltY: number) => void;
  /** Current frame X position in pixels */
  frameX?: number;
  /** Current frame Y position in pixels */
  frameY?: number;
  /** Callback when frame position changes */
  onFramePositionChange?: (frameX: number, frameY: number) => void;
  /** Callback to reset frame transforms to defaults */
  onResetTransforms?: () => void;
  /** Current DIY options */
  diyOptions?: DIYOptions;
  /** Callback when DIY options change */
  onDIYOptionsChange?: (options: DIYOptions) => void;
  /** Current frame effects */
  frameEffects?: FrameEffects;
  /** Callback when frame effects change */
  onFrameEffectsChange?: (effects: FrameEffects) => void;
}

export function FrameSettingsPanel({
  frameColor,
  defaultFrameColor,
  onFrameColorChange,
  frameRotation = 0,
  onFrameRotationChange,
  frameScale = 100,
  onFrameScaleChange,
  frameTiltX = 0,
  frameTiltY = 0,
  onFrameTiltChange,
  frameX = 0,
  frameY = 0,
  onFramePositionChange,
  onResetTransforms,
  diyOptions,
  onDIYOptionsChange,
  frameEffects,
  onFrameEffectsChange,
}: FrameSettingsPanelProps) {
  const [customColorOpen, setCustomColorOpen] = useState(false);
  const [customColor, setCustomColor] = useState(frameColor || defaultFrameColor);

  return (
    <>
      <Text size="xs" c="dimmed" mb="xs" tt="uppercase">
        Frame Color
      </Text>
      <SimpleGrid cols={6} spacing={4}>
        {FRAME_COLOR_PRESETS.map((color, index) => {
          const isDefault = color === undefined;
          const displayColor = isDefault ? defaultFrameColor : color;
          const isSelected = isDefault
            ? frameColor === undefined
            : frameColor === color;

          return (
            <Box
              key={index}
              onClick={() => onFrameColorChange(color)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: displayColor,
                cursor: 'pointer',
                border: isSelected ? '3px solid #228be6' : '1px solid #dee2e6',
                position: 'relative',
              }}
            >
              {isDefault && (
                <Text
                  size="8px"
                  c="dimmed"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Auto
                </Text>
              )}
            </Box>
          );
        })}
        {/* Custom color picker button */}
        <Popover opened={customColorOpen} onChange={setCustomColorOpen} position="top" withArrow zIndex={1100}>
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
            <Stack gap="xs">
              <ColorPicker
                format="hex"
                value={customColor}
                onChange={(color) => {
                  setCustomColor(color);
                  // Apply color in real-time as user picks
                  onFrameColorChange(color);
                }}
                swatches={['#1a1a1a', '#2a2a2a', '#e0e0e0', '#ffffff', '#1e3a5f', '#c4a35a', '#b76e79']}
              />
              <Button
                size="xs"
                variant="light"
                onClick={() => setCustomColorOpen(false)}
              >
                Done
              </Button>
            </Stack>
          </Popover.Dropdown>
        </Popover>
      </SimpleGrid>

      <Button
        size="xs"
        variant="light"
        fullWidth
        mt="md"
        onClick={() => onFrameColorChange(undefined)}
        disabled={frameColor === undefined}
      >
        Reset to Default
      </Button>

      {/* Frame Transform Controls (2x2 grid: Rotation, Scale, Tilt, Position) */}
      {onFrameRotationChange && onFrameScaleChange && (
        <Box mt="md">
          <TransformControls
            rotation={frameRotation}
            scale={frameScale}
            tiltX={frameTiltX}
            tiltY={frameTiltY}
            frameX={frameX}
            frameY={frameY}
            onRotationChange={onFrameRotationChange}
            onScaleChange={onFrameScaleChange}
            onTiltChange={onFrameTiltChange}
            onFramePositionChange={onFramePositionChange}
            onReset={onResetTransforms}
          />
        </Box>
      )}

      {/* Frame Effects */}
      {onFrameEffectsChange && (
        <>
          <Divider my="lg" />
          <Text size="xs" c="dimmed" mb="xs" tt="uppercase">
            Effects
          </Text>
          <FrameEffectsPanel
            effects={frameEffects ?? DEFAULT_FRAME_EFFECTS}
            onChange={onFrameEffectsChange}
          />
        </>
      )}

      {/* DIY Options */}
      {diyOptions && onDIYOptionsChange && (
        <>
          <Divider my="lg" />
          <Text size="xs" c="dimmed" mb="xs" tt="uppercase">
            Frame Options
          </Text>
          <DIYSettingsPanel
            options={diyOptions}
            onChange={onDIYOptionsChange}
          />
        </>
      )}
    </>
  );
}
