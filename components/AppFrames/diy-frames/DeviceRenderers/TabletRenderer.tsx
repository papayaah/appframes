'use client';

import { Box } from '@mantine/core';
import type { TabletDIYOptions } from '../types';
import { BEZEL_WIDTHS, CORNER_RADII, BASE_DIMENSIONS } from '../types';
import { PunchHole, HomeButton, CameraModule, SideButtons } from './shared';

interface TabletRendererProps {
  options: TabletDIYOptions;
  scale: number;
  frameColor: string;
  children?: React.ReactNode;
}

export function TabletRenderer({ options, scale, frameColor, children }: TabletRendererProps) {
  const bezelWidth = BEZEL_WIDTHS[options.bezel] * scale;
  const cornerRadius = CORNER_RADII[options.corners] * scale;
  const screenRadius = Math.max(0, cornerRadius - bezelWidth);
  const isFrameless = options.bezel === 'none';

  const { width: baseWidth, height: baseHeight } = BASE_DIMENSIONS.tablet;
  const hasHomeButton = options.bottom === 'home-button';

  const width = baseWidth * scale;
  const height = baseHeight * scale;

  const topPadding = hasHomeButton ? 50 * scale : bezelWidth;
  const bottomPadding = hasHomeButton ? 50 * scale : bezelWidth;

  // Back view
  if (options.view === 'back') {
    return (
      <Box
        style={{
          width,
          height,
          borderRadius: cornerRadius,
          backgroundColor: frameColor,
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <CameraModule
          scale={scale}
          layout={options.cameraLayout || 'single'}
          flash={options.flash || false}
        />
      </Box>
    );
  }

  // Front view
  return (
    <Box
      style={{
        width,
        height,
        borderRadius: cornerRadius,
        backgroundColor: isFrameless ? 'transparent' : frameColor,
        padding: isFrameless ? 0 : `${topPadding}px ${bezelWidth}px ${bottomPadding}px`,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isFrameless
          ? '0 18px 40px -14px rgba(0, 0, 0, 0.35)'
          : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Top cutout */}
      {options.topCutout === 'punch-hole' && (
        <PunchHole scale={scale} position="center" topOffset={isFrameless ? 8 : bezelWidth / scale + 4} />
      )}

      {/* Screen */}
      <Box
        style={{
          flex: 1,
          width: '100%',
          borderRadius: isFrameless ? cornerRadius : screenRadius,
          backgroundColor: '#000',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'inset 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        {children}
      </Box>

      {/* Bottom decorations */}
      {options.bottom === 'home-button' && <HomeButton scale={scale} />}

      {/* Side buttons */}
      {!isFrameless && <SideButtons scale={scale} frameColor={frameColor} />}
    </Box>
  );
}
