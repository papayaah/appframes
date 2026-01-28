'use client';

import { Box } from '@mantine/core';

interface DynamicIslandProps {
  scale: number;
  topOffset?: number;
}

export function DynamicIsland({ scale, topOffset = 10 }: DynamicIslandProps) {
  return (
    <Box
      style={{
        position: 'absolute',
        top: topOffset * scale,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 80 * scale,
        height: 24 * scale,
        backgroundColor: '#000',
        borderRadius: 12 * scale,
        zIndex: 10,
      }}
    />
  );
}
