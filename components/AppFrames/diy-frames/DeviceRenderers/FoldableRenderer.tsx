'use client';

import { Box } from '@mantine/core';
import type { FoldableDIYOptions } from '../types';
import { BEZEL_WIDTHS, CORNER_RADII, BASE_DIMENSIONS } from '../types';
import { PunchHole, Crease, CameraModule, SideButtons } from './shared';

interface FoldableRendererProps {
  options: FoldableDIYOptions;
  scale: number;
  frameColor: string;
  children?: React.ReactNode;
}

export function FoldableRenderer({ options, scale, frameColor, children }: FoldableRendererProps) {
  const bezelWidth = BEZEL_WIDTHS[options.bezel] * scale;
  const cornerRadius = CORNER_RADII[options.corners] * scale;
  const screenRadius = Math.max(0, cornerRadius - bezelWidth);

  const { width: baseWidth, height: baseHeight } = BASE_DIMENSIONS.foldable;

  // Folded state is narrower
  const width = options.state === 'folded' ? (baseWidth / 2) * scale : baseWidth * scale;
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
        {/* Camera */}
        <CameraModule scale={scale} layout="triple-triangle" flash />
        {/* Crease (only visible when unfolded) */}
        {options.state === 'unfolded' && <Crease scale={scale} orientation="vertical" />}
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
      <PunchHole scale={scale} position="right" topOffset={bezelWidth / scale + 4} />

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

      {/* Crease overlay (only visible when unfolded) */}
      {options.state === 'unfolded' && <Crease scale={scale} orientation="vertical" />}

      {/* Side buttons */}
      <SideButtons scale={scale} frameColor={frameColor} />
    </Box>
  );
}
