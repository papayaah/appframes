'use client';

import { Box } from '@mantine/core';
import type { PhoneDIYOptions } from '../types';
import { BEZEL_WIDTHS, CORNER_RADII, BASE_DIMENSIONS } from '../types';
import {
  Notch,
  DynamicIsland,
  PunchHole,
  HomeButton,
  GestureBar,
  CameraModule,
  SideButtons,
} from './shared';

interface PhoneRendererProps {
  options: PhoneDIYOptions;
  scale: number;
  frameColor: string;
  children?: React.ReactNode;
}

export function PhoneRenderer({ options, scale, frameColor, children }: PhoneRendererProps) {
  const bezelWidth = BEZEL_WIDTHS[options.bezel] * scale;
  const cornerRadius = CORNER_RADII[options.corners] * scale;
  const screenRadius = Math.max(0, cornerRadius - bezelWidth);
  const isFrameless = options.bezel === 'none';

  const { width: baseWidth, height: baseHeight } = BASE_DIMENSIONS.phone;
  const hasHomeButton = options.bottom === 'home-button';

  const width = baseWidth * scale;
  const height = (hasHomeButton ? baseHeight - 75 : baseHeight) * scale;

  const topPadding = hasHomeButton ? 60 * scale : bezelWidth;
  const bottomPadding = hasHomeButton ? 60 * scale : bezelWidth;

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
        <SideButtons scale={scale} frameColor={frameColor} />
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
      {/* Top cutout decorations */}
      {options.topCutout === 'notch' && !isFrameless && <Notch scale={scale} />}
      {options.topCutout === 'dynamic-island' && (
        <DynamicIsland scale={scale} topOffset={isFrameless ? 8 : bezelWidth / scale + 6} />
      )}
      {options.topCutout.startsWith('punch-hole') && (
        <PunchHole
          scale={scale}
          position={options.topCutout.replace('punch-hole-', '') as 'center' | 'left' | 'right'}
          topOffset={isFrameless ? 8 : bezelWidth / scale + 4}
        />
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
      {options.bottom === 'gesture-bar' && <GestureBar scale={scale} />}

      {/* Side buttons */}
      {!isFrameless && <SideButtons scale={scale} frameColor={frameColor} />}
    </Box>
  );
}
