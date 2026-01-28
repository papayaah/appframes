'use client';

import { Box } from '@mantine/core';
import type { FlipDIYOptions } from '../types';
import { BEZEL_WIDTHS, CORNER_RADII, BASE_DIMENSIONS } from '../types';
import { PunchHole, Crease, CameraModule, SideButtons } from './shared';

interface FlipRendererProps {
  options: FlipDIYOptions;
  scale: number;
  frameColor: string;
  children?: React.ReactNode;
}

export function FlipRenderer({ options, scale, frameColor, children }: FlipRendererProps) {
  const bezelWidth = BEZEL_WIDTHS[options.bezel] * scale;
  const cornerRadius = CORNER_RADII[options.corners] * scale;
  const screenRadius = Math.max(0, cornerRadius - bezelWidth);

  const { width: baseWidth, height: baseHeight } = BASE_DIMENSIONS.flip;
  const width = baseWidth * scale;
  const height = baseHeight * scale;

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
        {/* Cover screen */}
        {options.coverScreen && (
          <Box
            style={{
              position: 'absolute',
              top: 20 * scale,
              right: 20 * scale,
              width: 60 * scale,
              height: 60 * scale,
              borderRadius: 12 * scale,
              backgroundColor: '#1a1a1a',
            }}
          />
        )}
        {/* Camera */}
        <CameraModule scale={scale} layout="dual-vertical" flash={false} />
        {/* Crease */}
        <Crease scale={scale} orientation="horizontal" />
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
        backgroundColor: frameColor,
        padding: `${bezelWidth}px`,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Punch hole camera */}
      <PunchHole scale={scale} position="center" topOffset={bezelWidth / scale + 4} />

      {/* Screen */}
      <Box
        style={{
          flex: 1,
          width: '100%',
          borderRadius: screenRadius,
          backgroundColor: '#000',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'inset 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        {children}
      </Box>

      {/* Crease overlay */}
      <Crease scale={scale} orientation="horizontal" />

      {/* Side buttons */}
      <SideButtons scale={scale} frameColor={frameColor} />
    </Box>
  );
}
