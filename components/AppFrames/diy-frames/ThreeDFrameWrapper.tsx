'use client';

import { Box } from '@mantine/core';
import { ReactNode } from 'react';

interface ThreeDFrameWrapperProps {
  children: ReactNode;
  width: number;
  height: number;
  thickness: number;
  frameColor: string;
  borderRadius?: number;
}

/**
 * Utility to darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Darken
  r = Math.max(0, Math.floor(r * (1 - percent / 100)));
  g = Math.max(0, Math.floor(g * (1 - percent / 100)));
  b = Math.max(0, Math.floor(b * (1 - percent / 100)));

  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Wraps a device frame with 3D side faces to give it depth/thickness.
 * When the parent applies tilt transforms (rotateX/rotateY), the side faces
 * become visible, creating a realistic 3D box effect.
 */
export function ThreeDFrameWrapper({
  children,
  width,
  height,
  thickness,
  frameColor,
  borderRadius = 0,
}: ThreeDFrameWrapperProps) {
  // Side face colors - vary darkness for realistic shading
  const topColor = darkenColor(frameColor, 15);      // Top edge slightly darker
  const bottomColor = darkenColor(frameColor, 25);   // Bottom edge darker
  const leftColor = darkenColor(frameColor, 10);     // Left side
  const rightColor = darkenColor(frameColor, 20);    // Right side darker (shadow side)

  return (
    <Box
      style={{
        position: 'relative',
        width,
        height,
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Front face - the main device frame (no translateZ to keep clicks working) */}
      <Box
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}
      >
        {children}
      </Box>

      {/* Top edge face - folds backward from top of front face */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: thickness,
          backgroundColor: topColor,
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
          transform: 'rotateX(90deg)',
          transformOrigin: 'top center',
          pointerEvents: 'none',
        }}
      />

      {/* Bottom edge face - folds backward from bottom of front face */}
      <Box
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: thickness,
          backgroundColor: bottomColor,
          borderBottomLeftRadius: borderRadius,
          borderBottomRightRadius: borderRadius,
          transform: 'rotateX(-90deg)',
          transformOrigin: 'bottom center',
          pointerEvents: 'none',
        }}
      />

      {/* Left edge face - folds backward from left of front face */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: thickness,
          height: '100%',
          backgroundColor: leftColor,
          borderTopLeftRadius: borderRadius,
          borderBottomLeftRadius: borderRadius,
          transform: 'rotateY(-90deg)',
          transformOrigin: 'left center',
          pointerEvents: 'none',
        }}
      />

      {/* Right edge face - folds backward from right of front face */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: thickness,
          height: '100%',
          backgroundColor: rightColor,
          borderTopRightRadius: borderRadius,
          borderBottomRightRadius: borderRadius,
          transform: 'rotateY(90deg)',
          transformOrigin: 'right center',
          pointerEvents: 'none',
        }}
      />

      {/* Back face - positioned behind the front face */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: darkenColor(frameColor, 30),
          borderRadius,
          transform: `translateZ(-${thickness}px)`,
          backfaceVisibility: 'hidden',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
}

/**
 * Device thickness values in pixels (scaled representation of real mm thickness)
 */
export const DEVICE_THICKNESS: Record<string, number> = {
  phone: 10,      // ~8mm real phones scaled up for visibility
  flip: 8,
  foldable: 12,
  tablet: 8,
  laptop: 16,
  desktop: 20,
};
