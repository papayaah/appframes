'use client';

import { Box } from '@mantine/core';

interface PunchHoleProps {
  scale: number;
  position: 'center' | 'left' | 'right';
  topOffset?: number;
}

export function PunchHole({ scale, position, topOffset = 8 }: PunchHoleProps) {
  const getLeft = () => {
    switch (position) {
      case 'left':
        return '25%';
      case 'right':
        return '75%';
      case 'center':
      default:
        return '50%';
    }
  };

  return (
    <Box
      style={{
        position: 'absolute',
        top: topOffset * scale,
        left: getLeft(),
        transform: 'translateX(-50%)',
        width: 12 * scale,
        height: 12 * scale,
        backgroundColor: '#000',
        borderRadius: '50%',
        zIndex: 10,
      }}
    />
  );
}
