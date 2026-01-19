'use client';

import { Box, Text, Slider, NumberInput, Group, Button } from '@mantine/core';

export interface ImageSettingsPanelProps {
  /** Current scale value (0-100) */
  screenScale: number;
  /** Current pan X value (0-100) */
  screenPanX: number;
  /** Current pan Y value (0-100) */
  screenPanY: number;
  /** Current image rotation (0-360) */
  imageRotation: number;
  /** Callback when scale changes */
  onScaleChange: (value: number) => void;
  /** Callback when pan X changes */
  onPanXChange: (value: number) => void;
  /** Callback when pan Y changes */
  onPanYChange: (value: number) => void;
  /** Callback when image rotation changes */
  onRotationChange: (value: number) => void;
  /** Callback to reset all values to defaults */
  onReset: () => void;
}

export function ImageSettingsPanel({
  screenScale,
  screenPanX,
  screenPanY,
  imageRotation,
  onScaleChange,
  onPanXChange,
  onPanYChange,
  onRotationChange,
  onReset,
}: ImageSettingsPanelProps) {
  return (
    <>
      <Text size="xs" c="dimmed" mb="xs" tt="uppercase">
        Scale
      </Text>
      <Slider
        value={screenScale}
        onChange={onScaleChange}
        min={0}
        max={100}
        label={(value) => `${value}%`}
      />

      <Text size="xs" c="dimmed" mb="xs" mt="md" tt="uppercase">
        Rotation
      </Text>
      <Slider
        value={imageRotation}
        onChange={onRotationChange}
        min={0}
        max={360}
        label={(value) => `${value}°`}
        marks={[
          { value: 0, label: '0°' },
          { value: 90, label: '90°' },
          { value: 180, label: '180°' },
          { value: 270, label: '270°' },
          { value: 360, label: '360°' },
        ]}
      />

      <Group grow mt="md">
        <Box>
          <Text size="xs" c="dimmed" mb="xs">
            Pan X
          </Text>
          <NumberInput
            size="xs"
            value={screenPanX}
            onChange={(value) => onPanXChange(Number(value))}
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
            value={screenPanY}
            onChange={(value) => onPanYChange(Number(value))}
            min={0}
            max={100}
          />
        </Box>
      </Group>

      <Button size="xs" variant="light" fullWidth mt="md" onClick={onReset}>
        Reset
      </Button>
    </>
  );
}
