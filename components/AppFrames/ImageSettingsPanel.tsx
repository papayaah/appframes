import { useRef, useState } from 'react';
import { Box, Text, Button, SimpleGrid } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { PanControl } from './PanControl';
import { ScaleControl } from './ScaleControl';
import { RotationControl } from './RotationControl';

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
  onPanXChange: (value: number, persistent?: boolean) => void;
  /** Callback when pan Y changes */
  onPanYChange: (value: number, persistent?: boolean) => void;
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
  const hasChanges = imageRotation !== 0 || screenScale !== 0 || Math.round(screenPanX) !== 50 || Math.round(screenPanY) !== 50;

  return (
    <Box>
      {/* Reset Button - Full Width at Top */}
      <Button
        variant="light"
        color="gray"
        size="sm"
        onClick={onReset}
        disabled={!hasChanges}
        fullWidth
        leftSection={<IconRefresh size={14} />}
        style={{ marginBottom: 12 }}
      >
        Reset to Default
      </Button>

      {/* 2x2 Grid Layout */}
      <SimpleGrid cols={2} spacing="sm">
        {/* 1. Rotation Dial */}
        <Box style={{ display: 'flex', justifyContent: 'center' }}>
          <RotationControl
            rotation={imageRotation}
            onRotationChange={onRotationChange}
          />
        </Box>

        {/* 2. Zoom Control */}
        <Box style={{ display: 'flex', justifyContent: 'center' }}>
          <ScaleControl
            scale={screenScale}
            min={0}
            max={100}
            defaultValue={0}
            label="Zoom"
            onScaleChange={onScaleChange}
          />
        </Box>

        {/* 3. Pan Control - spans to center if odd */}
        <Box style={{ display: 'flex', justifyContent: 'center', gridColumn: 'span 2' }}>
          <PanControl
            panX={screenPanX}
            panY={screenPanY}
            onPanChange={(newPanX: number, newPanY: number, p?: boolean) => {
              onPanXChange(newPanX, p);
              onPanYChange(newPanY, p);
            }}
          />
        </Box>
      </SimpleGrid>
    </Box>
  );
}
