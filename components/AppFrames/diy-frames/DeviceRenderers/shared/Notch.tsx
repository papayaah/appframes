'use client';

import { Box } from '@mantine/core';

interface NotchProps {
  scale: number;
  width?: number;
}

export function Notch({ scale, width = 100 }: NotchProps) {
  return (
    <Box
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: width * scale,
        height: 25 * scale,
        backgroundColor: '#1a1a1a',
        borderBottomLeftRadius: 16 * scale,
        borderBottomRightRadius: 16 * scale,
        zIndex: 10,
      }}
    />
  );
}
