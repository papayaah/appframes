'use client';

import { Box } from '@mantine/core';
import type { PhoneDIYOptions } from '../types';
import { BEZEL_WIDTHS, CORNER_RADII, BASE_DIMENSIONS } from '../types';
import {
  DynamicIsland,
  GestureBar,
} from './shared';

interface Phone3DRendererProps {
  options: PhoneDIYOptions;
  scale: number;
  frameColor: string;
  thickness?: number; // Optional thickness override (in unscaled pixels)
  children?: React.ReactNode;
}

/**
 * Utility to darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  hex = hex.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  r = Math.max(0, Math.floor(r * (1 - percent / 100)));
  g = Math.max(0, Math.floor(g * (1 - percent / 100)));
  b = Math.max(0, Math.floor(b * (1 - percent / 100)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Utility to lighten a hex color by a percentage
 */
function lightenColor(hex: string, percent: number): string {
  hex = hex.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
  g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
  b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 3D iPhone Pro renderer with realistic rounded edges and side buttons.
 * This creates a more realistic 3D appearance with proper edge curvature.
 */
export function Phone3DRenderer({ options, scale, frameColor, thickness: thicknessProp, children }: Phone3DRendererProps) {
  const bezelWidth = BEZEL_WIDTHS[options.bezel] * scale;
  const cornerRadius = CORNER_RADII[options.corners] * scale;
  const screenRadius = Math.max(0, cornerRadius - bezelWidth);

  const { width: baseWidth, height: baseHeight } = BASE_DIMENSIONS.phone;
  const width = baseWidth * scale;
  const height = baseHeight * scale;

  // 3D depth settings - use prop if provided, otherwise default to 12px
  const thickness = (thicknessProp ?? 12) * scale;
  const edgeRadius = 4 * scale; // Rounded edge profile

  // Colors for 3D shading
  const sideColorLight = lightenColor(frameColor, 10);
  const sideColorDark = darkenColor(frameColor, 15);
  const edgeHighlight = lightenColor(frameColor, 25);
  const edgeShadow = darkenColor(frameColor, 30);

  // Button dimensions
  const buttonWidth = 4 * scale;
  const volumeButtonHeight = 35 * scale;
  const powerButtonHeight = 45 * scale;
  const muteButtonHeight = 18 * scale;

  // Back view - show camera module and back design
  if (options.view === 'back') {
    return (
      <Box
        style={{
          width,
          height,
          borderRadius: cornerRadius,
          backgroundColor: frameColor,
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Camera module placeholder */}
        <Box
          style={{
            position: 'absolute',
            top: 12 * scale,
            left: 12 * scale,
            width: 80 * scale,
            height: 80 * scale,
            borderRadius: 20 * scale,
            backgroundColor: darkenColor(frameColor, 10),
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
          }}
        />
        {/* Side buttons on back view */}
        <SideButtons scale={scale} frameColor={frameColor} isBackView />
      </Box>
    );
  }

  // Front view with 3D edges
  return (
    <Box
      style={{
        width,
        height,
        position: 'relative',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Main phone body (front face) */}
      <Box
        style={{
          width,
          height,
          borderRadius: cornerRadius,
          backgroundColor: frameColor,
          padding: `${bezelWidth}px`,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          zIndex: 1,
        }}
      >
        {/* Dynamic Island */}
        {options.topCutout === 'dynamic-island' && (
          <DynamicIsland scale={scale} topOffset={bezelWidth / scale + 6} />
        )}

        {/* Screen */}
        <Box
          style={{
            flex: 1,
            width: '100%',
            borderRadius: screenRadius,
            backgroundColor: '#000',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 0 1px rgba(255, 255, 255, 0.1)',
          }}
        >
          {children}
        </Box>

        {/* Gesture bar */}
        {options.bottom === 'gesture-bar' && <GestureBar scale={scale} />}
      </Box>

      {/* Left edge - with rounded profile using gradient */}
      <Box
        style={{
          position: 'absolute',
          top: cornerRadius,
          left: 0,
          width: thickness,
          height: height - cornerRadius * 2,
          background: `linear-gradient(to right, ${edgeShadow} 0%, ${sideColorLight} 30%, ${sideColorDark} 100%)`,
          transform: 'rotateY(-90deg)',
          transformOrigin: 'right center',
          borderRadius: `${edgeRadius}px 0 0 ${edgeRadius}px`,
          pointerEvents: 'none',
        }}
      >
        {/* Mute switch */}
        <Box
          style={{
            position: 'absolute',
            top: 60 * scale,
            left: 0,
            width: buttonWidth,
            height: muteButtonHeight,
            backgroundColor: darkenColor(frameColor, 20),
            borderRadius: `${2 * scale}px 0 0 ${2 * scale}px`,
            boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.3)',
          }}
        />
        {/* Volume Up */}
        <Box
          style={{
            position: 'absolute',
            top: 100 * scale,
            left: 0,
            width: buttonWidth,
            height: volumeButtonHeight,
            backgroundColor: darkenColor(frameColor, 15),
            borderRadius: `${2 * scale}px 0 0 ${2 * scale}px`,
            boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.2)',
          }}
        />
        {/* Volume Down */}
        <Box
          style={{
            position: 'absolute',
            top: 145 * scale,
            left: 0,
            width: buttonWidth,
            height: volumeButtonHeight,
            backgroundColor: darkenColor(frameColor, 15),
            borderRadius: `${2 * scale}px 0 0 ${2 * scale}px`,
            boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.2)',
          }}
        />
      </Box>

      {/* Right edge - with power button */}
      <Box
        style={{
          position: 'absolute',
          top: cornerRadius,
          right: 0,
          width: thickness,
          height: height - cornerRadius * 2,
          background: `linear-gradient(to left, ${edgeShadow} 0%, ${sideColorDark} 30%, ${sideColorLight} 100%)`,
          transform: 'rotateY(90deg)',
          transformOrigin: 'left center',
          borderRadius: `0 ${edgeRadius}px ${edgeRadius}px 0`,
          pointerEvents: 'none',
        }}
      >
        {/* Power button */}
        <Box
          style={{
            position: 'absolute',
            top: 120 * scale,
            right: 0,
            width: buttonWidth,
            height: powerButtonHeight,
            backgroundColor: darkenColor(frameColor, 15),
            borderRadius: `0 ${2 * scale}px ${2 * scale}px 0`,
            boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.2)',
          }}
        />
      </Box>

      {/* Top edge - with speaker grille area */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: cornerRadius,
          width: width - cornerRadius * 2,
          height: thickness,
          background: `linear-gradient(to bottom, ${edgeHighlight} 0%, ${sideColorLight} 40%, ${sideColorDark} 100%)`,
          transform: 'rotateX(90deg)',
          transformOrigin: 'bottom center',
          borderRadius: `${edgeRadius}px ${edgeRadius}px 0 0`,
          pointerEvents: 'none',
        }}
      />

      {/* Bottom edge - with speaker/port area */}
      <Box
        style={{
          position: 'absolute',
          bottom: 0,
          left: cornerRadius,
          width: width - cornerRadius * 2,
          height: thickness,
          background: `linear-gradient(to top, ${edgeShadow} 0%, ${sideColorDark} 40%, ${sideColorLight} 100%)`,
          transform: 'rotateX(-90deg)',
          transformOrigin: 'top center',
          borderRadius: `0 0 ${edgeRadius}px ${edgeRadius}px`,
          pointerEvents: 'none',
        }}
      >
        {/* Speaker grilles */}
        <Box style={{
          position: 'absolute',
          bottom: 3 * scale,
          left: '25%',
          display: 'flex',
          gap: 3 * scale
        }}>
          {[...Array(6)].map((_, i) => (
            <Box
              key={i}
              style={{
                width: 2 * scale,
                height: 2 * scale,
                borderRadius: '50%',
                backgroundColor: darkenColor(frameColor, 40),
              }}
            />
          ))}
        </Box>
        {/* USB-C / Lightning port */}
        <Box
          style={{
            position: 'absolute',
            bottom: 2 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 12 * scale,
            height: 5 * scale,
            borderRadius: 2 * scale,
            backgroundColor: darkenColor(frameColor, 50),
          }}
        />
        {/* Right speaker grilles */}
        <Box style={{
          position: 'absolute',
          bottom: 3 * scale,
          right: '25%',
          display: 'flex',
          gap: 3 * scale
        }}>
          {[...Array(6)].map((_, i) => (
            <Box
              key={i}
              style={{
                width: 2 * scale,
                height: 2 * scale,
                borderRadius: '50%',
                backgroundColor: darkenColor(frameColor, 40),
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Corner pieces to fill the gaps */}
      {/* Top-left corner */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: cornerRadius,
          height: cornerRadius,
          background: `radial-gradient(circle at bottom right, transparent 0%, transparent ${cornerRadius - thickness}px, ${sideColorLight} ${cornerRadius - thickness}px, ${sideColorDark} 100%)`,
          borderTopLeftRadius: cornerRadius,
          pointerEvents: 'none',
          transformStyle: 'preserve-3d',
        }}
      />
      {/* Top-right corner */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: cornerRadius,
          height: cornerRadius,
          background: `radial-gradient(circle at bottom left, transparent 0%, transparent ${cornerRadius - thickness}px, ${sideColorDark} ${cornerRadius - thickness}px, ${sideColorLight} 100%)`,
          borderTopRightRadius: cornerRadius,
          pointerEvents: 'none',
          transformStyle: 'preserve-3d',
        }}
      />
      {/* Bottom-left corner */}
      <Box
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: cornerRadius,
          height: cornerRadius,
          background: `radial-gradient(circle at top right, transparent 0%, transparent ${cornerRadius - thickness}px, ${sideColorLight} ${cornerRadius - thickness}px, ${edgeShadow} 100%)`,
          borderBottomLeftRadius: cornerRadius,
          pointerEvents: 'none',
          transformStyle: 'preserve-3d',
        }}
      />
      {/* Bottom-right corner */}
      <Box
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: cornerRadius,
          height: cornerRadius,
          background: `radial-gradient(circle at top left, transparent 0%, transparent ${cornerRadius - thickness}px, ${sideColorDark} ${cornerRadius - thickness}px, ${edgeShadow} 100%)`,
          borderBottomRightRadius: cornerRadius,
          pointerEvents: 'none',
          transformStyle: 'preserve-3d',
        }}
      />
    </Box>
  );
}

/**
 * Side buttons component for the phone
 */
function SideButtons({ scale, frameColor, isBackView = false }: { scale: number; frameColor: string; isBackView?: boolean }) {
  const buttonColor = darkenColor(frameColor, 15);

  return (
    <>
      {/* Power button - right side */}
      <Box
        style={{
          position: 'absolute',
          top: 140 * scale,
          [isBackView ? 'left' : 'right']: -3 * scale,
          width: 3 * scale,
          height: 45 * scale,
          backgroundColor: buttonColor,
          borderRadius: isBackView ? `${2 * scale}px 0 0 ${2 * scale}px` : `0 ${2 * scale}px ${2 * scale}px 0`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }}
      />
      {/* Volume buttons - left side */}
      <Box
        style={{
          position: 'absolute',
          top: 100 * scale,
          [isBackView ? 'right' : 'left']: -3 * scale,
          width: 3 * scale,
          height: 35 * scale,
          backgroundColor: buttonColor,
          borderRadius: isBackView ? `0 ${2 * scale}px ${2 * scale}px 0` : `${2 * scale}px 0 0 ${2 * scale}px`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          top: 145 * scale,
          [isBackView ? 'right' : 'left']: -3 * scale,
          width: 3 * scale,
          height: 35 * scale,
          backgroundColor: buttonColor,
          borderRadius: isBackView ? `0 ${2 * scale}px ${2 * scale}px 0` : `${2 * scale}px 0 0 ${2 * scale}px`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }}
      />
      {/* Mute switch */}
      <Box
        style={{
          position: 'absolute',
          top: 60 * scale,
          [isBackView ? 'right' : 'left']: -3 * scale,
          width: 3 * scale,
          height: 18 * scale,
          backgroundColor: buttonColor,
          borderRadius: isBackView ? `0 ${2 * scale}px ${2 * scale}px 0` : `${2 * scale}px 0 0 ${2 * scale}px`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }}
      />
    </>
  );
}
