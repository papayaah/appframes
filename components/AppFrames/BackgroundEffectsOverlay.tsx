import { Box } from '@mantine/core';
import type { BackgroundEffects } from './types';

interface BackgroundEffectsOverlayProps {
  effects?: BackgroundEffects;
  screenId: string;
}

/** Renders color overlay, vignette, and noise layers on top of the background.
 *  Blur is NOT handled here — it's applied directly to the background element. */
export function BackgroundEffectsOverlay({ effects, screenId }: BackgroundEffectsOverlayProps) {
  if (!effects) return null;

  const overlayColor = effects.overlayColor ?? '#000000';
  const overlayOpacity = effects.overlayOpacity ?? 0;
  const vignetteIntensity = effects.vignetteIntensity ?? 0;
  const noiseIntensity = effects.noiseIntensity ?? 0;

  const hasOverlay = overlayOpacity > 0;
  const hasVignette = vignetteIntensity > 0;
  const hasNoise = noiseIntensity > 0;

  if (!hasOverlay && !hasVignette && !hasNoise) return null;

  const filterId = `noise-${screenId}`;

  return (
    <>
      {hasOverlay && (
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: overlayColor,
            opacity: overlayOpacity / 100,
            pointerEvents: 'none',
            zIndex: 1, // Color overlay first
          }}
        />
      )}

      {hasVignette && (
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${vignetteIntensity / 100}) 100%)`,
            pointerEvents: 'none',
            zIndex: 2, // Vignette on top of color
          }}
        />
      )}

      {hasNoise && (
        <>
          <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
            <filter id={filterId}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.65"
                numOctaves={3}
                stitchTiles="stitch"
              />
            </filter>
          </svg>
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              filter: `url(#${filterId})`,
              opacity: noiseIntensity / 100,
              pointerEvents: 'none',
              zIndex: 3, // Noise on top
            }}
          />
        </>
      )}
    </>
  );
}
