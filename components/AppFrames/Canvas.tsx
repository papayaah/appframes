'use client';

import { useState, useRef, useEffect } from 'react';
import { Box } from '@mantine/core';
import { CanvasSettings, Screen } from './AppFrames';
import { CompositionRenderer } from './CompositionRenderer';
import { DraggableText } from './DraggableText';
import { useCrossCanvasDrag } from './CrossCanvasDragContext';
import { OverflowDeviceRenderer } from './OverflowDeviceRenderer';

interface CanvasProps {
  settings: CanvasSettings;
  screens: Screen[];
  selectedScreenIndices: number[];
  selectedFrameIndex?: number;
  onSelectFrame?: (index: number) => void;
  onSelectScreen?: (index: number, multi: boolean) => void;
  onReplaceScreen?: (files: File[], targetFrameIndex?: number, screenIndex?: number) => void;
  onPanChange?: (screenIndex: number, frameIndex: number, panX: number, panY: number) => void;
  onFramePositionChange?: (screenIndex: number, frameIndex: number, frameX: number, frameY: number) => void;
  onMediaSelect?: (screenIndex: number, frameIndex: number, mediaId: number) => void;
  onPexelsSelect?: (screenIndex: number, frameIndex: number, url: string) => void;
  onCaptionPositionChange?: (screenIndex: number, x: number, y: number) => void;
  onCaptionTextChange?: (screenIndex: number, text: string) => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
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

export function Canvas({
  settings: _settings,
  screens,
  selectedScreenIndices,
  selectedFrameIndex,
  onSelectFrame,
  onSelectScreen,
  onReplaceScreen,
  onPanChange,
  onFramePositionChange,
  onMediaSelect,
  onPexelsSelect,
  onCaptionPositionChange,
  onCaptionTextChange,
  zoom = 100,
  onZoomChange,
}: CanvasProps) {
  const [hoveredFrameIndex, setHoveredFrameIndex] = useState<number | null>(null);
  const [hoveredScreenIndex, setHoveredScreenIndex] = useState<number | null>(null);
  const [dragFileCount, setDragFileCount] = useState<number>(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef<number>(0);
  const canvasRefs = useRef<Map<number, HTMLElement>>(new Map());
  
  // Get cross-canvas drag context
  const crossCanvasDrag = useCrossCanvasDrag();

  // Wheel handler: Cmd+Scroll = zoom, regular scroll = navigate screens
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux) = zoom
      if (e.metaKey || e.ctrlKey) {
        if (!onZoomChange) return;
        e.preventDefault();

        // Calculate zoom delta (normalize across different browsers/devices)
        // Negative deltaY = scroll up = zoom in
        // Use smaller multiplier for smoother zooming
        const zoomDelta = -e.deltaY * 0.1;

        // Clamp zoom between 10% and 400%
        const newZoom = Math.min(400, Math.max(10, zoom + zoomDelta));

        onZoomChange(Math.round(newZoom));
      } else if (onSelectScreen && screens.length > 0) {
        // Regular scroll = navigate between screens
        // Debounce to prevent too rapid navigation
        const now = Date.now();
        if (now - lastScrollTime.current < 200) return;
        lastScrollTime.current = now;

        e.preventDefault();

        // Get current primary selected screen index
        const currentIndex = selectedScreenIndices.length > 0
          ? selectedScreenIndices[selectedScreenIndices.length - 1]
          : 0;

        // Scroll down = next screen, scroll up = previous screen
        let newIndex: number;
        if (e.deltaY > 0) {
          // Next screen
          newIndex = Math.min(screens.length - 1, currentIndex + 1);
        } else {
          // Previous screen
          newIndex = Math.max(0, currentIndex - 1);
        }

        // Select single screen (remove multi-selection)
        if (newIndex !== currentIndex || selectedScreenIndices.length > 1) {
          onSelectScreen(newIndex, false);
        }
      }
    };

    // Use passive: false to allow preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, onZoomChange, onSelectScreen, screens.length, selectedScreenIndices]);

  // Middle mouse button panning
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Middle mouse button (button 1) or scroll wheel press
      if (e.button === 1) {
        e.preventDefault();
        setIsPanning(true);
        container.style.cursor = 'grabbing';

        const startX = e.clientX;
        const startY = e.clientY;
        const startPanX = panOffset.x;
        const startPanY = panOffset.y;

        const handleMouseMove = (moveEvent: MouseEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const deltaY = moveEvent.clientY - startY;
          setPanOffset({
            x: startPanX + deltaX,
            y: startPanY + deltaY,
          });
        };

        const handleMouseUp = () => {
          setIsPanning(false);
          container.style.cursor = '';
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    };

    // Prevent default middle-click behavior (auto-scroll)
    const handleAuxClick = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('auxclick', handleAuxClick);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('auxclick', handleAuxClick);
    };
  }, [panOffset]);

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
      ref={containerRef}
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
          gap: 60, // Fixed gap between canvases
          height: '100%',
          alignItems: 'center',
          margin: '0 auto', // Center if content is smaller than viewport
          minWidth: 'min-content', // Ensure container grows with content
          // Apply zoom transform and pan offset to entire container
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100})`,
          transformOrigin: 'center center',
          // Change cursor when panning
          cursor: isPanning ? 'grabbing' : undefined,
        }}
      >
        {selectedScreenIndices.map((screenIndex) => {
          const screen = screens[screenIndex];
          if (!screen) {
            return null;
          }

          const screenSettings = {
            ...screen.settings,
            selectedScreenIndex: screenIndex,
          };

          const canvasDimensions = getCanvasDimensions(screenSettings.canvasSize, screenSettings.orientation);
          const aspectRatio = canvasDimensions.width / canvasDimensions.height;

          // Only show selection for the primary selected screen (last one)
          const isPrimaryScreen = screenIndex === selectedScreenIndices[selectedScreenIndices.length - 1];

          return (
            <Box
              key={screen.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                // We need to ensure the container has width so scaling works properly
                width: aspectRatio > 1 ? '60vw' : '40vh', // Approximate sizing
                flexShrink: 0,
                position: 'relative', // For positioning overflow layer
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation(); // Stop propagation to parent
                const files = Array.from(e.dataTransfer.files);
                handleDrop(files, hoveredFrameIndex ?? undefined, screenIndex);
              }}
              onDragOver={() => {
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
                  // Clip content that goes outside the canvas boundaries
                  // The overflow will be rendered in adjacent canvases via OverflowDeviceRenderer
                  overflow: 'hidden',
                }}
              >
                <CompositionRenderer
                  settings={screenSettings}
                  screen={screen}
                  screenIndex={screenIndex}
                  onPanChange={(frameIndex, x, y) => onPanChange?.(screenIndex, frameIndex, x, y)}
                  onFramePositionChange={(frameIndex, x, y) => onFramePositionChange?.(screenIndex, frameIndex, x, y)}
                  hoveredFrameIndex={hoveredScreenIndex === screenIndex ? hoveredFrameIndex : null}
                  onFrameHover={setHoveredFrameIndex}
                  dragFileCount={dragFileCount}
                  selectedFrameIndex={isPrimaryScreen ? selectedFrameIndex : undefined}
                  onSelectFrame={isPrimaryScreen ? onSelectFrame : undefined}
                  onMediaSelect={(frameIndex, mediaId) => onMediaSelect?.(screenIndex, frameIndex, mediaId)}
                  onPexelsSelect={(frameIndex, url) => onPexelsSelect?.(screenIndex, frameIndex, url)}
                />
                {screenSettings.showCaption && screenSettings.captionText && (
                  <DraggableText
                    text={screenSettings.captionText}
                    positionX={screenSettings.captionHorizontal}
                    positionY={screenSettings.captionVertical}
                    onPositionChange={(x, y) => onCaptionPositionChange?.(screenIndex, x, y)}
                    onTextChange={(text) => onCaptionTextChange?.(screenIndex, text)}
                    style={screenSettings.captionStyle}
                  />
                )}
              </Box>
              {/* Render overflow from devices dragged from other canvases (or persisted shared devices) */}
              {(() => {
                const overflow = crossCanvasDrag.getOverflowForCanvas(screenIndex);
                if (overflow && overflow.visible) {
                  const sourceScreen = screens[overflow.sourceScreenIndex];
                  const canvasEl = canvasRefs.current.get(screenIndex);
                  if (sourceScreen && canvasEl) {
                    // Get the canvas dimensions to calculate relative positioning
                    const canvasRect = canvasEl.getBoundingClientRect();

                    return (
                      <Box
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: canvasRect.width,
                          height: canvasRect.height,
                          pointerEvents: 'none',
                          overflow: 'hidden',
                          zIndex: 10,
                        }}
                      >
                        <OverflowDeviceRenderer
                          screen={sourceScreen}
                          settings={{
                            ...sourceScreen.settings,
                            selectedScreenIndex: overflow.sourceScreenIndex,
                          }}
                          frameIndex={overflow.frameIndex}
                          clipLeft={overflow.clipLeft}
                          clipRight={overflow.clipRight}
                          offsetX={overflow.offsetX}
                          offsetY={overflow.offsetY}
                        />
                      </Box>
                    );
                  }
                }
                return null;
              })()}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
