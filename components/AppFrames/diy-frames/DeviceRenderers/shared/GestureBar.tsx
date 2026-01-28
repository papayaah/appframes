'use client';

import { Box } from '@mantine/core';

interface GestureBarProps {
  scale: number;
}

export function GestureBar({ scale }: GestureBarProps) {
  return (
    <Box
      style={{
        position: 'absolute',
        bottom: 8 * scale,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 100 * scale,
        height: 4 * scale,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 2 * scale,
        zIndex: 10,
      }}
    />
  );
}
