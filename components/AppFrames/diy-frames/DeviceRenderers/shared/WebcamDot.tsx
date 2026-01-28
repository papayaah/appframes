'use client';

import { Box } from '@mantine/core';

interface WebcamDotProps {
  scale: number;
}

export function WebcamDot({ scale }: WebcamDotProps) {
  return (
    <Box
      style={{
        position: 'absolute',
        top: 4 * scale,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 6 * scale,
        height: 6 * scale,
        backgroundColor: '#444',
        borderRadius: '50%',
        zIndex: 10,
      }}
    />
  );
}
