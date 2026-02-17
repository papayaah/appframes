'use client';

import { Box } from '@mantine/core';
import { useEffect, useState } from 'react';
import type { SharedBackground, Screen } from './types';
import {
  getSliceInfo,
  getScreenGradientCSS,
  getScreenBackgroundImageStyle,
} from './sharedBackgroundUtils';
import { useMediaImage } from '../../hooks/useMediaImage';
import { initDB } from '@reactkits.dev/react-media-library';

interface SharedGradientBackgroundProps {
  gradient: NonNullable<SharedBackground['gradient']>;
  sliceIndex: number;
  totalSlices: number;
  blur?: number;
}

function SharedGradientBackground({
  gradient,
  sliceIndex,
  totalSlices,
  blur,
}: SharedGradientBackgroundProps) {
  const gradientCSS = getScreenGradientCSS(gradient, sliceIndex, totalSlices);
  const hasBlur = blur != null && blur > 0;

  return (
    <Box
      style={{
        position: 'absolute',
        inset: hasBlur ? `-${blur}px` : 0,
        clipPath: hasBlur ? `inset(${blur}px)` : undefined,
        background: gradientCSS,
        filter: hasBlur ? `blur(${blur}px)` : undefined,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

interface SharedImageBackgroundProps {
  mediaId: number;
  sliceIndex: number;
  totalSlices: number;
  imageFit: 'fill' | 'fit';
  verticalAlign: 'top' | 'center' | 'bottom';
  horizontalAlign: 'left' | 'center' | 'right';
  screenWidth: number;
  screenHeight: number;
  blur?: number;
}

function SharedImageBackground({
  mediaId,
  sliceIndex,
  totalSlices,
  imageFit,
  verticalAlign,
  horizontalAlign,
  screenWidth,
  screenHeight,
  blur,
  initialDimensions,
}: SharedImageBackgroundProps & { initialDimensions?: { width: number; height: number } | null }) {
  const { imageUrl } = useMediaImage(mediaId);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(initialDimensions || null);

  // Load image dimensions from IndexedDB, fallback to loading from image itself
  useEffect(() => {
    if (!mediaId) return;
    let active = true;

    const loadDimensions = async () => {
      try {
        const db = await initDB();
        const asset = await db.get('assets', mediaId);
        if (asset && asset.width && asset.height && active) {
          setImageDimensions({ width: asset.width, height: asset.height });
        }
      } catch (error) {
        console.error('Error loading image dimensions from DB:', error);
      }
    };

    loadDimensions();
    return () => {
      active = false;
    };
  }, [mediaId]);

  // Fallback: if dimensions not in DB, load them from the image itself
  useEffect(() => {
    if (!imageUrl || imageDimensions) return;
    let active = true;

    const img = new Image();
    img.onload = () => {
      if (active && img.naturalWidth && img.naturalHeight) {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.src = imageUrl;

    return () => {
      active = false;
    };
  }, [imageUrl, imageDimensions]);

  if (!imageUrl || !imageDimensions) return null;

  const bgStyle = getScreenBackgroundImageStyle(
    imageUrl,
    sliceIndex,
    totalSlices,
    imageFit,
    verticalAlign,
    horizontalAlign,
    imageDimensions.width,
    imageDimensions.height,
    screenWidth,
    screenHeight
  );

  const hasBlur = blur != null && blur > 0;

  return (
    <Box
      style={{
        position: 'absolute',
        inset: hasBlur ? `-${blur}px` : 0,
        clipPath: hasBlur ? `inset(${blur}px)` : undefined,
        ...bgStyle,
        filter: hasBlur ? `blur(${blur}px)` : undefined,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

export interface SharedCanvasBackgroundProps {
  screenId: string;
  allScreens: Screen[];
  sharedBackground: SharedBackground;
  screenWidth: number;
  screenHeight: number;
  blur?: number;
  imageDimensions?: { width: number; height: number } | null;
}

export function SharedCanvasBackground({
  screenId,
  allScreens,
  sharedBackground,
  screenWidth,
  screenHeight,
  blur,
  imageDimensions,
}: SharedCanvasBackgroundProps) {
  if (!sharedBackground.screenIds.length) return null;

  const sliceInfo = getSliceInfo(screenId, allScreens, sharedBackground);
  if (!sliceInfo) return null;

  const { sliceIndex, totalSlices } = sliceInfo;

  if (sharedBackground.type === 'gradient' && sharedBackground.gradient) {
    return (
      <SharedGradientBackground
        gradient={sharedBackground.gradient}
        sliceIndex={sliceIndex}
        totalSlices={totalSlices}
        blur={blur}
      />
    );
  }

  if (sharedBackground.type === 'image' && sharedBackground.mediaId) {
    return (
      <SharedImageBackground
        mediaId={sharedBackground.mediaId}
        sliceIndex={sliceIndex}
        totalSlices={totalSlices}
        imageFit={sharedBackground.imageFit ?? 'fill'}
        verticalAlign={sharedBackground.imageVerticalAlign ?? 'center'}
        horizontalAlign={sharedBackground.imageHorizontalAlign ?? 'center'}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
        blur={blur}
        initialDimensions={imageDimensions}
      />
    );
  }

  return null;
}
