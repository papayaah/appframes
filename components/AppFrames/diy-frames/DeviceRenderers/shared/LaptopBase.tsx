'use client';

import { Box } from '@mantine/core';
import type { LaptopBaseStyle, LaptopHinge } from '../../types';

interface LaptopBaseProps {
  scale: number;
  frameColor: string;
  width: number;
  baseStyle: LaptopBaseStyle;
  hinge: LaptopHinge;
}

export function LaptopBase({ scale, frameColor, width, baseStyle, hinge }: LaptopBaseProps) {
  const baseHeight = 140 * scale;
  const keyboardKeys = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  const baseColor = baseStyle === 'fabric' ? '#5a5a5a' : frameColor;
  const baseTexture = baseStyle === 'fabric'
    ? 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)'
    : 'none';

  return (
    <Box
      style={{
        width: width * scale,
        height: baseHeight,
        backgroundColor: baseColor,
        backgroundImage: baseTexture,
        borderRadius: `0 0 ${8 * scale}px ${8 * scale}px`,
        marginTop: hinge === 'visible' ? 4 * scale : 0,
        padding: `${12 * scale}px ${20 * scale}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: 6 * scale,
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      }}
    >
      {/* Hinge */}
      {hinge === 'visible' && (
        <Box
          style={{
            position: 'absolute',
            top: -4 * scale,
            left: '10%',
            right: '10%',
            height: 4 * scale,
            backgroundColor: '#333',
            borderRadius: `${2 * scale}px ${2 * scale}px 0 0`,
          }}
        />
      )}

      {/* Keyboard */}
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3 * scale,
          alignItems: 'center',
        }}
      >
        {keyboardKeys.map((row, rowIndex) => (
          <Box
            key={rowIndex}
            style={{
              display: 'flex',
              gap: 2 * scale,
              justifyContent: 'center',
            }}
          >
            {row.map((key) => (
              <Box
                key={key}
                style={{
                  width: 16 * scale,
                  height: 14 * scale,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: 2 * scale,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 6 * scale,
                  color: 'rgba(255,255,255,0.4)',
                  fontFamily: 'system-ui',
                }}
              >
                {key}
              </Box>
            ))}
          </Box>
        ))}
      </Box>

      {/* Trackpad */}
      <Box
        style={{
          width: 80 * scale,
          height: 50 * scale,
          backgroundColor: 'rgba(0,0,0,0.15)',
          borderRadius: 4 * scale,
          margin: '0 auto',
          marginTop: 4 * scale,
        }}
      />
    </Box>
  );
}
