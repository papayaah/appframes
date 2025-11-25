'use client';

import { useState } from 'react';
import { Box, Center } from '@mantine/core';
import { CanvasSettings, Screen } from './AppFrames';
import { DeviceFrame } from './DeviceFrame';

interface CanvasProps {
  settings: CanvasSettings;
  screens: Screen[];
  // Optional target screen index lets us drop directly into a specific screen
  onReplaceScreen?: (files: File[], targetScreenIndex?: number) => void;
  onPanChange?: (panX: number, panY: number) => void;
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

export function Canvas({ settings, screens, onReplaceScreen, onPanChange }: CanvasProps) {
  const canvasDimensions = getCanvasDimensions(settings.canvasSize, settings.orientation);
  const aspectRatio = canvasDimensions.width / canvasDimensions.height;
  const [hoveredScreenIndex, setHoveredScreenIndex] = useState<number | null>(null);

  const handleDrop = (files: File[], targetScreenIndex?: number) => {
    if (!onReplaceScreen || files.length === 0) {
      return;
    }
    // When multiple canvases are visible (multi-select in Single composition),
    // only allow drops on specific device frames to avoid ambiguity.
    if (
      typeof targetScreenIndex !== 'number' &&
      settings.composition === 'single' &&
      settings.selectedScreenIndices &&
      settings.selectedScreenIndices.length > 1
    ) {
      return;
    }

    onReplaceScreen(files, targetScreenIndex);
  };
  
  const renderComposition = () => {
    const scale = settings.compositionScale / 100;
    const selectedScreen = screens[settings.selectedScreenIndex] || screens[0];

    switch (settings.composition) {
      case 'single':
        return (
          <Center style={{ height: '100%' }}>
            <Box
              onDragOver={(e) => {
                e.preventDefault();
                setHoveredScreenIndex(settings.selectedScreenIndex);
              }}
              onDragLeave={() => setHoveredScreenIndex(null)}
              onDrop={(e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files);
                handleDrop(files, settings.selectedScreenIndex);
                setHoveredScreenIndex(null);
              }}
              style={{
                padding: 4,
                borderRadius: 16,
                border:
                  hoveredScreenIndex === settings.selectedScreenIndex
                    ? '2px solid #6366f1'
                    : '2px solid transparent',
                transition: 'border-color 120ms ease-out',
              }}
            >
              <DeviceFrame
                deviceType={settings.deviceFrame}
                image={selectedScreen?.image}
                mediaId={selectedScreen?.mediaId}
                scale={scale}
                screenScale={settings.screenScale}
                panX={settings.screenPanX}
                panY={settings.screenPanY}
                showInstructions={screens.length === 0}
                onPanChange={onPanChange}
              />
            </Box>
          </Center>
        );

      case 'dual':
        return (
          <Center style={{ height: '100%', gap: 20 }}>
            {[0, 1].map((screenIndex) => {
              const screen = screens[screenIndex];
              return (
                <Box
                  key={screenIndex}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHoveredScreenIndex(screenIndex);
                  }}
                  onDragLeave={() => setHoveredScreenIndex(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files);
                    handleDrop(files, screenIndex);
                    setHoveredScreenIndex(null);
                  }}
                  style={{
                    padding: 4,
                    borderRadius: 16,
                    border:
                      hoveredScreenIndex === screenIndex
                        ? '2px solid #6366f1'
                        : '2px solid transparent',
                    transition: 'border-color 120ms ease-out',
                  }}
                >
                  <DeviceFrame
                    deviceType={settings.deviceFrame}
                    image={screen?.image}
                    mediaId={screen?.mediaId}
                    scale={scale * 0.9}
                    screenScale={settings.screenScale}
                    panX={settings.screenPanX}
                    panY={settings.screenPanY}
                  />
                </Box>
              );
            })}
          </Center>
        );

      case 'stack':
        return (
          <Center style={{ height: '100%', position: 'relative' }}>
            <Box style={{ position: 'relative' }}>
              <Box
                style={{ position: 'absolute', top: -20, left: -20, zIndex: 1 }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setHoveredScreenIndex(0);
                }}
                onDragLeave={() => setHoveredScreenIndex(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files);
                  handleDrop(files, 0);
                  setHoveredScreenIndex(null);
                }}
              >
                <DeviceFrame
                  deviceType={settings.deviceFrame}
                  image={screens[0]?.image}
                  mediaId={screens[0]?.mediaId}
                  scale={scale * 0.85}
                  screenScale={settings.screenScale}
                  panX={settings.screenPanX}
                  panY={settings.screenPanY}
                />
              </Box>
              <Box
                style={{ position: 'relative', zIndex: 2 }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setHoveredScreenIndex(1);
                }}
                onDragLeave={() => setHoveredScreenIndex(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files);
                  handleDrop(files, 1);
                  setHoveredScreenIndex(null);
                }}
              >
                <DeviceFrame
                  deviceType={settings.deviceFrame}
                  image={screens[1]?.image}
                  mediaId={screens[1]?.mediaId}
                  scale={scale * 0.85}
                  screenScale={settings.screenScale}
                  panX={settings.screenPanX}
                  panY={settings.screenPanY}
                />
              </Box>
            </Box>
          </Center>
        );

      case 'triple':
        return (
          <Center style={{ height: '100%', gap: 15 }}>
            {[0, 1, 2].map((screenIndex) => {
              const screen = screens[screenIndex];
              return (
                <Box
                  key={screenIndex}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHoveredScreenIndex(screenIndex);
                  }}
                  onDragLeave={() => setHoveredScreenIndex(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files);
                    handleDrop(files, screenIndex);
                    setHoveredScreenIndex(null);
                  }}
                  style={{
                    padding: 4,
                    borderRadius: 16,
                    border:
                      hoveredScreenIndex === screenIndex
                        ? '2px solid #6366f1'
                        : '2px solid transparent',
                    transition: 'border-color 120ms ease-out',
                  }}
                >
                  <DeviceFrame
                    deviceType={settings.deviceFrame}
                    image={screen?.image}
                    mediaId={screen?.mediaId}
                    scale={scale * 0.75}
                    screenScale={settings.screenScale}
                    panX={settings.screenPanX}
                    panY={settings.screenPanY}
                  />
                </Box>
              );
            })}
          </Center>
        );

      case 'fan':
        return (
          <Center style={{ height: '100%', position: 'relative' }}>
            <Box style={{ position: 'relative', width: 600, height: 500 }}>
              <Box
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '20%',
                  transform: 'translate(-50%, -50%) rotate(-8deg)',
                  zIndex: 1,
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setHoveredScreenIndex(0);
                }}
                onDragLeave={() => setHoveredScreenIndex(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files);
                  handleDrop(files, 0);
                  setHoveredScreenIndex(null);
                }}
              >
                <DeviceFrame
                  deviceType={settings.deviceFrame}
                  image={screens[0]?.image}
                  mediaId={screens[0]?.mediaId}
                  scale={scale * 0.7}
                  screenScale={settings.screenScale}
                  panX={settings.screenPanX}
                  panY={settings.screenPanY}
                />
              </Box>
              <Box
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 3,
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setHoveredScreenIndex(1);
                }}
                onDragLeave={() => setHoveredScreenIndex(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files);
                  handleDrop(files, 1);
                  setHoveredScreenIndex(null);
                }}
              >
                <DeviceFrame
                  deviceType={settings.deviceFrame}
                  image={screens[1]?.image}
                  mediaId={screens[1]?.mediaId}
                  scale={scale * 0.7}
                  screenScale={settings.screenScale}
                  panX={settings.screenPanX}
                  panY={settings.screenPanY}
                />
              </Box>
              <Box
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '80%',
                  transform: 'translate(-50%, -50%) rotate(8deg)',
                  zIndex: 2,
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setHoveredScreenIndex(2);
                }}
                onDragLeave={() => setHoveredScreenIndex(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files);
                  handleDrop(files, 2);
                  setHoveredScreenIndex(null);
                }}
              >
                <DeviceFrame
                  deviceType={settings.deviceFrame}
                  image={screens[2]?.image}
                  mediaId={screens[2]?.mediaId}
                  scale={scale * 0.7}
                  screenScale={settings.screenScale}
                  panX={settings.screenPanX}
                  panY={settings.screenPanY}
                />
              </Box>
            </Box>
          </Center>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      style={{
        flex: 1,
        minHeight: 0,
        backgroundColor: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        overflow: 'auto',
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        handleDrop(files);
      }}
    >
      <Box
        data-canvas="true"
        style={{
          width: '100%',
          maxWidth: aspectRatio > 1 ? '90%' : 600,
          maxHeight: '100%',
          aspectRatio: `${aspectRatio}`,
          backgroundColor: settings.backgroundColor,
          position: 'relative',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {renderComposition()}
        {settings.showCaption && settings.captionText && screens.length > 0 && (
          <Box
            style={{
              position: 'absolute',
              top: `${settings.captionVertical}%`,
              left: `${settings.captionHorizontal}%`,
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
            {settings.captionText}
          </Box>
        )}
      </Box>
    </Box>
  );
}
