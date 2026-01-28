'use client';

import { Box } from '@mantine/core';

interface CreaseProps {
  scale: number;
  orientation: 'horizontal' | 'vertical';
}

export function Crease({ scale, orientation }: CreaseProps) {
  if (orientation === 'horizontal') {
    return (
      <Box
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 2 * scale,
          transform: 'translateY(-50%)',
          background: 'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.3) 100%)',
          boxShadow: `0 0 ${4 * scale}px rgba(0,0,0,0.2)`,
          zIndex: 5,
        }}
      />
    );
  }

  return (
    <Box
      style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        bottom: 0,
        width: 2 * scale,
        transform: 'translateX(-50%)',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.3) 100%)',
        boxShadow: `0 0 ${4 * scale}px rgba(0,0,0,0.2)`,
        zIndex: 5,
      }}
    />
  );
}
