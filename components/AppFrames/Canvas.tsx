'use client';

import { useState } from 'react';
import { Box } from '@mantine/core';
import { CanvasSettings, Screen } from './AppFrames';
import { CompositionRenderer } from './CompositionRenderer';

interface CanvasProps {
  settings: CanvasSettings;
  screens: Screen[];
  selectedScreenIndices: number[];
  onReplaceScreen?: (files: File[], targetFrameIndex?: number, screenIndex?: number) => void;
  onPanChange?: (panX: number, panY: number, screenIndex: number) => void;
  zoom?: number;
}

// Canvas dimensions based on canvas size (App Store requirements)
const getCanvasDimensions = (canvasSize: string, _orientation: string) => {
  const dimensions: Record<string, { width: number; height: number }> = {
    // iPhone 6.5" Display
    'iphone-6.5-1': { width: 1242, height: 2688 },
    'iphone-6.5-2': { width: 2688, height: 1242 },
    'iphone-6.5-3': { width: 1284, height: 2778 },
    'iphone-6.5-4': { width: 2778, height: 1284 },
    // iPad 13" Display
    'ipad-13-1': { width: 2064, height: 2752 },
    'ipad-13-2': { width: 2752, height: 2064 },
    'ipad-13-3': { width: 2048, height: 2732 },
    'ipad-13-4': { width: 2732, height: 2048 },
    // Apple Watch Ultra 3
    'watch-ultra-3-1': { width: 422, height: 514 },
    'watch-ultra-3-2': { width: 410, height: 502 },
    // Apple Watch Series 11
    'watch-s11': { width: 416, height: 496 },
    // Apple Watch Series 9
    'watch-s9': { width: 396, height: 484 },
    // Apple Watch Series 6
    'watch-s6': { width: 368, height: 448 },
    // Apple Watch Series 3
    'watch-s3': { width: 312, height: 390 },
    // Google Play - Phone
    'google-phone-1': { width: 1080, height: 1920 },
    'google-phone-2': { width: 1920, height: 1080 },
    'google-phone-3': { width: 1440, height: 2560 },
    'google-phone-4': { width: 2560, height: 1440 },
    // Google Play - Tablet
    'google-tablet-1': { width: 1600, height: 2560 },
    'google-tablet-2': { width: 2560, height: 1600 },
    'google-tablet-3': { width: 2048, height: 2732 },
    'google-tablet-4': { width: 2732, height: 2048 },
  };

  const dim = dimensions[canvasSize] || { width: 1242, height: 2688 };

  // Don't apply orientation transform since dimensions already include orientation
  return dim;
};

export function Canvas({ settings, screens, selectedScreenIndices, onReplaceScreen, onPanChange, zoom = 100 }: CanvasProps) {
  const [hoveredFrameIndex, setHoveredFrameIndex] = useState<number | null>(null);
  const [hoveredScreenIndex, setHoveredScreenIndex] = useState<number | null>(null);
  const [dragFileCount, setDragFileCount] = useState<number>(0);

  const handleDrop = (files: File[], targetFrameIndex?: number, screenIndex?: number) => {
    if (!onReplaceScreen || files.length === 0) {
      return;
    }
    setHoveredFrameIndex(null);
    setHoveredScreenIndex(null);
    setDragFileCount(0);
    onReplaceScreen(files, targetFrameIndex, screenIndex);
  };

  return (
    <Box
      style={{
        flex: 1,
        backgroundColor: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start', // Start from left to allow scrolling
        padding: 40,
        overflowX: 'auto', // Enable horizontal scrolling
        overflowY: 'hidden',
        position: 'relative',
      }}
      onDragOver={(e) => {
        e.preventDefault();
        // Count files being dragged
        if (e.dataTransfer.types.includes('Files')) {
          const fileCount = e.dataTransfer.items.length;
          setDragFileCount(fileCount);
        }
      }}
      onDragLeave={(e) => {
        // Only clear if leaving the entire canvas area
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setHoveredFrameIndex(null);
          setHoveredScreenIndex(null);
          setDragFileCount(0);
        }
      }}
    >
      <Box
        style={{
          display: 'flex',
          gap: 60, // Space between canvases
          height: '100%',
          alignItems: 'center',
          margin: '0 auto', // Center if content is smaller than viewport
          minWidth: 'min-content', // Ensure container grows with content
        }}
      >
        {selectedScreenIndices.map((screenIndex) => {
          const screen = screens[screenIndex];
          if (!screen) return null;

          const screenSettings = {
            ...screen.settings,
            selectedScreenIndex: screenIndex,
          };

          const canvasDimensions = getCanvasDimensions(screenSettings.canvasSize, screenSettings.orientation);
          const aspectRatio = canvasDimensions.width / canvasDimensions.height;

          return (
            <Box
              key={screen.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center',
                height: '100%',
                // We need to ensure the container has width so scaling works properly
                width: aspectRatio > 1 ? '60vw' : '40vh', // Approximate sizing
                flexShrink: 0,
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation(); // Stop propagation to parent
                const files = Array.from(e.dataTransfer.files);
                handleDrop(files, hoveredFrameIndex ?? undefined, screenIndex);
              }}
              onDragOver={(e) => {
                setHoveredScreenIndex(screenIndex);
              }}
            >
              <Box
                id={`canvas-${screen.id}`}
                data-canvas="true"
                style={{
                  width: '100%',
                  maxWidth: aspectRatio > 1 ? '90%' : 600,
                  aspectRatio: `${aspectRatio}`,
                  backgroundColor: screenSettings.backgroundColor,
                  position: 'relative',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <CompositionRenderer
                  settings={screenSettings}
                  screen={screen}
                  onPanChange={(x, y) => onPanChange?.(x, y, screenIndex)}
                  hoveredFrameIndex={hoveredScreenIndex === screenIndex ? hoveredFrameIndex : null}
                  onFrameHover={setHoveredFrameIndex}
                  dragFileCount={dragFileCount}
                />
                {screenSettings.showCaption && screenSettings.captionText && screen.images && screen.images.some(img => img.image || img.mediaId) && (
                  <Box
                    style={{
                      position: 'absolute',
                      top: `${screenSettings.captionVertical}%`,
                      left: `${screenSettings.captionHorizontal}%`,
                      transform: 'translate(-50%, -50%)',
                      color: '#1a1a1a',
                      fontSize: 32,
                      fontWeight: 700,
                      textAlign: 'center',
                      maxWidth: '80%',
                      pointerEvents: 'none',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {screenSettings.captionText}
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
