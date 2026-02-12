import type { Screen, SharedBackground } from './types';
import type { CSSProperties } from 'react';

/**
 * Get slice info for a screen in a shared background group.
 * Returns null if the screen is not in the shared background group.
 */
export function getSliceInfo(
  screenId: string,
  allScreens: Screen[],
  sharedBg: SharedBackground
): { sliceIndex: number; totalSlices: number } | null {
  // Filter to only participating screen IDs that still exist
  const participatingIds = sharedBg.screenIds.filter(id =>
    allScreens.some(s => s.id === id)
  );

  const sliceIndex = participatingIds.indexOf(screenId);
  if (sliceIndex === -1) return null;

  return {
    sliceIndex,
    totalSlices: participatingIds.length,
  };
}

/**
 * Generate CSS gradient string for a screen's slice of a shared gradient.
 *
 * The trick is remapping the gradient stops so that the visible portion of this screen
 * shows the correct segment of the overall gradient.
 *
 * For example, screen 1 of 4 remaps the full gradient into its 0-25% window,
 * screen 2 into 25-50%, etc.
 */
export function getScreenGradientCSS(
  gradient: NonNullable<SharedBackground['gradient']>,
  sliceIndex: number,
  totalSlices: number
): string {
  const sliceStart = sliceIndex / totalSlices;
  const sliceEnd = (sliceIndex + 1) / totalSlices;

  // Remap each stop from global [0,1] to screen-local coordinates
  // Stops outside 0-100% will naturally extend the edge colors
  const remappedStops = gradient.stops.map(stop => {
    const globalPos = stop.position / 100;
    const localPos = (globalPos - sliceStart) / (sliceEnd - sliceStart) * 100;
    return `${stop.color} ${localPos.toFixed(2)}%`;
  });

  const directionMap: Record<string, string> = {
    'horizontal': 'to right',
    'vertical': 'to bottom',
    'diagonal-down': '135deg',
    'diagonal-up': '45deg',
  };

  const direction = directionMap[gradient.direction] || 'to right';
  return `linear-gradient(${direction}, ${remappedStops.join(', ')})`;
}

/**
 * Generate CSS styles for a screen's slice of a shared background image.
 *
 * The key idea: we think of the image as covering a virtual canvas that is N screens wide.
 * Each screen is a viewport into 1/N of that canvas.
 */
export function getScreenBackgroundImageStyle(
  imageUrl: string,
  sliceIndex: number,
  totalSlices: number,
  imageFit: 'fill' | 'fit',
  verticalAlign: 'top' | 'center' | 'bottom',
  horizontalAlign: 'left' | 'center' | 'right',
  imageWidth: number,
  imageHeight: number,
  screenWidth: number,
  screenHeight: number
): CSSProperties {
  const combinedWidth = screenWidth * totalSlices;
  const combinedHeight = screenHeight;

  const combinedAspect = combinedWidth / combinedHeight;
  const imageAspect = imageWidth / imageHeight;

  let renderWidth: number;
  let renderHeight: number;

  if (imageFit === 'fill') {
    // Cover: scale until both dimensions are covered, crop overflow
    if (imageAspect > combinedAspect) {
      // Image is wider than combined canvas — match heights, crop sides
      renderHeight = combinedHeight;
      renderWidth = combinedHeight * imageAspect;
    } else {
      // Image is taller — match widths, crop top/bottom
      renderWidth = combinedWidth;
      renderHeight = combinedWidth / imageAspect;
    }
  } else {
    // Fit/contain: scale until image fits entirely, background color fills gaps
    if (imageAspect > combinedAspect) {
      renderWidth = combinedWidth;
      renderHeight = combinedWidth / imageAspect;
    } else {
      renderHeight = combinedHeight;
      renderWidth = combinedHeight * imageAspect;
    }
  }

  // Express as percentage of a single screen
  const bgWidthPercent = (renderWidth / screenWidth) * 100;
  const bgHeightPercent = (renderHeight / screenHeight) * 100;

  // CSS background-position percentage formula:
  //   pixel_offset = (container_size - bg_size) * percentage / 100
  //   visible_start = -pixel_offset = (bg_size - container_size) * percentage / 100
  //
  // For seamless panoramic tiling, each screen must show exactly screenWidth
  // of adjacent image content. Screen i should display:
  //   visible_start_i = i * screenWidth + globalOffset
  //
  // Solving for percentage:
  //   P_i = (i * screenWidth + globalOffset) / (renderWidth - screenWidth) * 100
  //
  // globalOffset controls alignment within any excess image width:
  //   left:   0
  //   center: (renderWidth - combinedWidth) / 2
  //   right:  renderWidth - combinedWidth

  let bgPosXPercent: number;
  if (totalSlices <= 1 || renderWidth <= screenWidth) {
    // Single screen or image smaller than one screen — use simple alignment
    bgPosXPercent = horizontalAlign === 'left' ? 0 : horizontalAlign === 'right' ? 100 : 50;
  } else {
    // Multiple screens, image wider than one screen — panoramic calculation
    const excess = renderWidth - combinedWidth;
    const globalOffset = horizontalAlign === 'left' ? 0
      : horizontalAlign === 'right' ? excess
      : excess / 2; // center

    bgPosXPercent = (sliceIndex * screenWidth + globalOffset) / (renderWidth - screenWidth) * 100;
  }

  // Vertical position based on alignment
  const bgPosYPercent = verticalAlign === 'top' ? 0 : verticalAlign === 'bottom' ? 100 : 50;

  return {
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: `${bgWidthPercent.toFixed(2)}% ${bgHeightPercent.toFixed(2)}%`,
    backgroundPosition: `${bgPosXPercent.toFixed(2)}% ${bgPosYPercent.toFixed(2)}%`,
    backgroundRepeat: 'no-repeat',
  };
}

// Canvas size dimensions (portrait mode, will be swapped for landscape)
const CANVAS_DIMENSIONS: Record<string, { width: number; height: number }> = {
  'iphone-6.9': { width: 1320, height: 2868 },
  'iphone-6.5': { width: 1290, height: 2796 },
  'ipad-13': { width: 2064, height: 2752 },
  'google-phone': { width: 1080, height: 1920 },
  'google-tablet-7': { width: 1536, height: 2048 },
  'google-tablet-10': { width: 1920, height: 1200 },
  'watch-s9': { width: 410, height: 502 },
  'watch-ultra': { width: 410, height: 502 },
};

/**
 * Get canvas dimensions for a given canvas size and orientation.
 */
export function getCanvasDimensions(
  canvasSize: string,
  orientation: 'portrait' | 'landscape'
): { width: number; height: number } {
  const dims = CANVAS_DIMENSIONS[canvasSize] || { width: 1290, height: 2796 };

  if (orientation === 'landscape') {
    return { width: dims.height, height: dims.width };
  }
  return dims;
}

/**
 * Get recommended image dimensions for a shared background.
 * Returns the combined canvas dimensions and aspect ratio.
 */
export function getRecommendedImageDimensions(
  screenCount: number,
  canvasSize: string,
  orientation: 'portrait' | 'landscape'
): { width: number; height: number; aspectRatio: string } {
  const { width, height } = getCanvasDimensions(canvasSize, orientation);
  const combinedWidth = width * screenCount;
  const ratio = (combinedWidth / height).toFixed(2);

  return {
    width: combinedWidth,
    height,
    aspectRatio: `${ratio}:1`,
  };
}

/**
 * Create a default shared background with a horizontal gradient.
 */
export function createDefaultSharedBackground(screenIds: string[]): SharedBackground {
  return {
    screenIds,
    type: 'gradient',
    gradient: {
      stops: [
        { color: '#667eea', position: 0 },
        { color: '#764ba2', position: 100 },
      ],
      direction: 'horizontal',
    },
  };
}

/**
 * Maintain screenIds order based on the actual screen array order.
 * This should be called when screens are reordered to keep screenIds in sync.
 */
export function reorderScreenIds(
  sharedBg: SharedBackground,
  allScreens: Screen[]
): string[] {
  const screenOrder = new Map(allScreens.map((s, i) => [s.id, i]));

  return [...sharedBg.screenIds]
    .filter(id => screenOrder.has(id))
    .sort((a, b) => (screenOrder.get(a) ?? 0) - (screenOrder.get(b) ?? 0));
}

/**
 * Insert a screen ID into the correct position in screenIds based on screen array order.
 */
export function insertScreenIdInOrder(
  screenIds: string[],
  newScreenId: string,
  allScreens: Screen[]
): string[] {
  const screenOrder = new Map(allScreens.map((s, i) => [s.id, i]));
  const newScreenPos = screenOrder.get(newScreenId);

  if (newScreenPos === undefined) return screenIds;

  // Find the correct insertion point
  let insertIdx = screenIds.length;
  for (let i = 0; i < screenIds.length; i++) {
    const existingPos = screenOrder.get(screenIds[i]) ?? Infinity;
    if (newScreenPos < existingPos) {
      insertIdx = i;
      break;
    }
  }

  const result = [...screenIds];
  result.splice(insertIdx, 0, newScreenId);
  return result;
}
