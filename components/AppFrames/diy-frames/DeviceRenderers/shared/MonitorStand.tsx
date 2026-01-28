'use client';

import { Box } from '@mantine/core';
import type { DesktopStand, DesktopChin } from '../../types';

interface MonitorStandProps {
  scale: number;
  frameColor: string;
  width: number;
  stand: DesktopStand;
  chin: DesktopChin;
  allInOne: boolean;
}

export function MonitorStand({ scale, frameColor, width, stand, chin, allInOne }: MonitorStandProps) {
  if (stand === 'none') {
    return null;
  }

  const chinHeight = chin === 'none' ? 0 : chin === 'standard' ? 20 : 40;

  const renderChin = () => {
    if (chin === 'none') return null;

    return (
      <Box
        style={{
          width: width * scale,
          height: chinHeight * scale,
          backgroundColor: frameColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {allInOne && (
          <Box
            style={{
              width: 60 * scale,
              height: 4 * scale,
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: 2 * scale,
            }}
          />
        )}
      </Box>
    );
  };

  const renderStand = () => {
    switch (stand) {
      case 'simple':
        return (
          <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box
              style={{
                width: 20 * scale,
                height: 60 * scale,
                backgroundColor: frameColor,
              }}
            />
            <Box
              style={{
                width: 120 * scale,
                height: 8 * scale,
                backgroundColor: frameColor,
                borderRadius: 4 * scale,
              }}
            />
          </Box>
        );

      case 'apple-style':
        return (
          <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box
              style={{
                width: 8 * scale,
                height: 80 * scale,
                backgroundColor: frameColor,
                borderRadius: 4 * scale,
              }}
            />
            <Box
              style={{
                width: 160 * scale,
                height: 12 * scale,
                backgroundColor: frameColor,
                borderRadius: `0 0 ${6 * scale}px ${6 * scale}px`,
              }}
            />
          </Box>
        );

      case 'vesa-mount':
        return (
          <Box
            style={{
              width: 40 * scale,
              height: 40 * scale,
              backgroundColor: '#333',
              borderRadius: 4 * scale,
              marginTop: 10 * scale,
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {renderChin()}
      {renderStand()}
    </Box>
  );
}
