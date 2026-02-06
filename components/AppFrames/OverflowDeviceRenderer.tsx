'use client';

import { Box } from '@mantine/core';
import { DeviceFrame } from './DeviceFrame';
import { Screen, CanvasSettings } from './AppFrames';
import { getDefaultDIYOptions } from './diy-frames/types';

// Must match CompositionRenderer baseline to preserve old default sizing.
const BASE_COMPOSITION_SCALE = 0.85;

interface OverflowDeviceRendererProps {
  screen: Screen;
  settings: CanvasSettings;
  frameIndex: number;
  clipLeft: number; // Percentage to clip from left (0-100)
  clipRight: number; // Percentage to clip from right (0-100)
  offsetX: number; // Position offset within the target canvas (in pixels)
  offsetY: number;
}

export function OverflowDeviceRenderer({
  screen,
  settings,
  frameIndex,
  clipLeft,
  clipRight,
  offsetX,
  offsetY,
}: OverflowDeviceRendererProps) {
  const image = screen.images?.[frameIndex];
  const effectiveScale = BASE_COMPOSITION_SCALE * ((image?.frameScale ?? 100) / 100);

  // We render even without an image to show the device frame itself
  if (image?.cleared === true || !image?.diyOptions) return null;

  return (
    <Box
      style={{
        position: 'absolute',
        left: offsetX,
        top: offsetY,
        overflow: 'hidden',
        // Clip the device using clip-path
        clipPath: `inset(0 ${clipRight}% 0 ${clipLeft}%)`,
        pointerEvents: 'none', // Overflow portion is not interactive
        zIndex: 100,
      }}
    >
      <DeviceFrame
        diyOptions={image?.diyOptions ?? getDefaultDIYOptions('phone')}
        image={image?.image}
        mediaId={image?.mediaId}
        serverMediaPath={(image as any)?.serverMediaPath}
        scale={effectiveScale}
        screenScale={settings.screenScale}
        panX={image?.panX ?? 50}
        panY={image?.panY ?? 50}
      />
    </Box>
  );
}
