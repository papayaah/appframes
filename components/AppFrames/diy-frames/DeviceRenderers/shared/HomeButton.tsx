'use client';

import { Box } from '@mantine/core';

interface HomeButtonProps {
  scale: number;
}

export function HomeButton({ scale }: HomeButtonProps) {
  return (
    <Box
      style={{
        position: 'absolute',
        bottom: 10 * scale,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 40 * scale,
        height: 40 * scale,
        borderRadius: '50%',
        border: `2px solid rgba(255, 255, 255, 0.3)`,
        zIndex: 10,
      }}
    />
  );
}
