'use client';

import { Box } from '@mantine/core';

interface SideButtonsProps {
  scale: number;
  frameColor: string;
}

export function SideButtons({ scale, frameColor }: SideButtonsProps) {
  return (
    <>
      {/* Right side button (power) */}
      <Box
        style={{
          position: 'absolute',
          right: -3 * scale,
          top: '25%',
          width: 3 * scale,
          height: 50 * scale,
          backgroundColor: frameColor,
          borderRadius: `0 ${2 * scale}px ${2 * scale}px 0`,
          opacity: 0.9,
        }}
      />
      {/* Left side button (volume) */}
      <Box
        style={{
          position: 'absolute',
          left: -3 * scale,
          top: '20%',
          width: 3 * scale,
          height: 30 * scale,
          backgroundColor: frameColor,
          borderRadius: `${2 * scale}px 0 0 ${2 * scale}px`,
          opacity: 0.9,
        }}
      />
    </>
  );
}
