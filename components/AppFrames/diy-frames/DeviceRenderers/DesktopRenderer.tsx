'use client';

import { Box } from '@mantine/core';
import type { DesktopDIYOptions } from '../types';
import { BEZEL_WIDTHS, CORNER_RADII, BASE_DIMENSIONS } from '../types';
import { MonitorStand } from './shared';

interface DesktopRendererProps {
  options: DesktopDIYOptions;
  scale: number;
  frameColor: string;
  children?: React.ReactNode;
}

export function DesktopRenderer({ options, scale, frameColor, children }: DesktopRendererProps) {
  const bezelWidth = BEZEL_WIDTHS[options.bezel] * scale;
  const cornerRadius = CORNER_RADII[options.corners] * scale;
  const screenRadius = Math.max(0, cornerRadius - bezelWidth);
  const isFrameless = options.bezel === 'none';

  const { width: baseWidth, height: baseHeight } = BASE_DIMENSIONS.desktop;
  const width = baseWidth * scale;
  const height = baseHeight * scale;

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Monitor */}
      <Box
        style={{
          width,
          height,
          borderRadius: options.stand !== 'none' ? `${cornerRadius}px ${cornerRadius}px 0 0` : cornerRadius,
          backgroundColor: isFrameless ? 'transparent' : frameColor,
          padding: isFrameless ? 0 : bezelWidth,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isFrameless
            ? '0 18px 40px -14px rgba(0, 0, 0, 0.35)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Screen */}
        <Box
          style={{
            flex: 1,
            width: '100%',
            borderRadius: isFrameless
              ? options.stand !== 'none'
                ? `${cornerRadius}px ${cornerRadius}px 0 0`
                : cornerRadius
              : screenRadius,
            backgroundColor: '#000',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 0 1px rgba(255, 255, 255, 0.1)',
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Stand and chin */}
      <MonitorStand
        scale={scale}
        frameColor={frameColor}
        width={baseWidth}
        stand={options.stand}
        chin={options.chin}
        allInOne={options.allInOne}
      />
    </Box>
  );
}
