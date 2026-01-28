'use client';

import { Box } from '@mantine/core';
import type { LaptopDIYOptions } from '../types';
import { BEZEL_WIDTHS, CORNER_RADII, BASE_DIMENSIONS } from '../types';
import { Notch, WebcamDot, LaptopBase } from './shared';

interface LaptopRendererProps {
  options: LaptopDIYOptions;
  scale: number;
  frameColor: string;
  children?: React.ReactNode;
}

export function LaptopRenderer({ options, scale, frameColor, children }: LaptopRendererProps) {
  const bezelWidth = BEZEL_WIDTHS[options.bezel] * scale;
  const cornerRadius = CORNER_RADII[options.corners] * scale;
  const screenRadius = Math.max(0, cornerRadius - bezelWidth);
  const isFrameless = options.bezel === 'none';

  const { width: baseWidth, height: baseHeight } = BASE_DIMENSIONS.laptop;
  const width = baseWidth * scale;
  const height = baseHeight * scale;

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Screen/Lid */}
      <Box
        style={{
          width,
          height,
          borderRadius: `${cornerRadius}px ${cornerRadius}px 0 0`,
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
        {/* Top cutout / webcam */}
        {options.topCutout === 'notch' && !isFrameless && <Notch scale={scale} width={60} />}
        {options.topCutout === 'none' && !isFrameless && <WebcamDot scale={scale} />}

        {/* Screen */}
        <Box
          style={{
            flex: 1,
            width: '100%',
            borderRadius: isFrameless ? `${cornerRadius}px ${cornerRadius}px 0 0` : screenRadius,
            backgroundColor: '#000',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 0 1px rgba(255, 255, 255, 0.1)',
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Keyboard base */}
      <LaptopBase
        scale={scale}
        frameColor={frameColor}
        width={baseWidth}
        baseStyle={options.baseStyle}
        hinge={options.hinge}
      />
    </Box>
  );
}
