'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
    // Apple App Store - iPhone (Portrait only)
    'iphone-6.9': { width: 1320, height: 2868 },
    'iphone-6.5': { width: 1284, height: 2778 },
    'iphone-6.3': { width: 1206, height: 2622 },
    'iphone-6.1': { width: 1179, height: 2556 },
    'iphone-5.5': { width: 1242, height: 2208 },
    'iphone-4.7': { width: 750, height: 1334 },
    'iphone-4.0': { width: 640, height: 1136 },
    'iphone-3.5': { width: 640, height: 960 },
    // Apple App Store - iPad (Portrait only)
    'ipad-13': { width: 2064, height: 2752 },
    'ipad-11': { width: 1668, height: 2388 },
    'ipad-12.9-gen2': { width: 2048, height: 2732 },
    'ipad-10.5': { width: 1668, height: 2224 },
    'ipad-9.7': { width: 1536, height: 2048 },
    // Apple Watch
    'watch-ultra-3': { width: 422, height: 514 },
    'watch-ultra-3-alt': { width: 410, height: 502 },
    'watch-s11': { width: 416, height: 496 },
    'watch-s9': { width: 396, height: 484 },
    'watch-s6': { width: 368, height: 448 },
    'watch-s3': { width: 312, height: 390 },
    // Google Play Store (Portrait only for phones and tablets)
    'google-phone': { width: 1080, height: 1920 },
    'google-tablet-7': { width: 1536, height: 2048 },
    'google-tablet-10': { width: 2048, height: 2732 },
    'google-chromebook': { width: 1920, height: 1080 },
    'google-xr': { width: 1920, height: 1080 },
  };

  const dim = dimensions[canvasSize] || { width: 1284, height: 2778 };

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

  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef<number>(0);
  const canvasRefs = useRef<Map<number, HTMLElement>>(new Map());
  const canvasSizes = useRef<Map<number, { width: number; height: number }>>(new Map());
  const canvasResizeObservers = useRef<Map<number, ResizeObserver>>(new Map());

  // Pan + zoom hot path: keep in refs, apply transform in rAF (avoid React renders per mousemove)
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  const transformRafRef = useRef<number | null>(null);
  zoomRef.current = zoom;
  
  // Get cross-canvas drag context
  const crossCanvasDrag = useCrossCanvasDrag();

  const refreshCanvasBounds = useCallback(() => {
    canvasRefs.current.forEach((el, screenIndex) => {
      crossCanvasDrag.registerCanvas(screenIndex, el);
    });
  }, [crossCanvasDrag]);

  const applyInnerTransform = useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    const { x, y } = panOffsetRef.current;
    const s = zoomRef.current / 100;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
    el.style.transformOrigin = 'center center';
  }, []);

  const scheduleTransform = useCallback(() => {
    if (transformRafRef.current != null) return;
    transformRafRef.current = window.requestAnimationFrame(() => {
      transformRafRef.current = null;
      applyInnerTransform();
    });
  }, [applyInnerTransform]);

  // Keep transform in sync when zoom changes (no need to rerender panning transform)
  useEffect(() => {
    applyInnerTransform();
    // Zoom changes affect canvas DOM bounds used by cross-canvas drag
    refreshCanvasBounds();
  }, [zoom, applyInnerTransform, refreshCanvasBounds]);

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
        const startPanX = panOffsetRef.current.x;
        const startPanY = panOffsetRef.current.y;

        const handleMouseMove = (moveEvent: MouseEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const deltaY = moveEvent.clientY - startY;
          panOffsetRef.current = {
            x: startPanX + deltaX,
            y: startPanY + deltaY,
          };
          scheduleTransform();
        };

        const handleMouseUp = () => {
          setIsPanning(false);
          container.style.cursor = '';
          // Pan changes affect canvas DOM bounds used by cross-canvas drag
          refreshCanvasBounds();
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
  }, [scheduleTransform]);

  const handleDrop = (files: File[], targetFrameIndex?: number, screenIndex?: number) => {
    if (!onReplaceScreen || files.length === 0) {
      return;
    }
    setHoveredFrameIndex(null);
    setHoveredScreenIndex(null);
    setDragFileCount(0);
    onReplaceScreen(files, targetFrameIndex, screenIndex);
  };

  const setCanvasRef = useCallback((screenIndex: number, el: HTMLElement | null) => {
    // Clean up old observer/ref
    const prev = canvasRefs.current.get(screenIndex);
    if (prev && prev !== el) {
      const ro = canvasResizeObservers.current.get(screenIndex);
      ro?.disconnect();
      canvasResizeObservers.current.delete(screenIndex);
      canvasSizes.current.delete(screenIndex);
      canvasRefs.current.delete(screenIndex);
      crossCanvasDrag.unregisterCanvas(screenIndex);
    }

    if (!el) {
      const ro = canvasResizeObservers.current.get(screenIndex);
      ro?.disconnect();
      canvasResizeObservers.current.delete(screenIndex);
      canvasSizes.current.delete(screenIndex);
      canvasRefs.current.delete(screenIndex);
      crossCanvasDrag.unregisterCanvas(screenIndex);
      return;
    }

    canvasRefs.current.set(screenIndex, el);
    // Register bounds for cross-canvas drag logic
    crossCanvasDrag.registerCanvas(screenIndex, el);

    // Track size without forcing layout reads during render
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const { width, height } = entry.contentRect;
        canvasSizes.current.set(screenIndex, { width, height });
        // Keep drag bounds current when layout changes
        crossCanvasDrag.registerCanvas(screenIndex, el);
      });
      ro.observe(el);
      canvasResizeObservers.current.set(screenIndex, ro);
    }
  }, [crossCanvasDrag]);

  // Prevent leaking ResizeObservers on unmount
  useEffect(() => {
    return () => {
      canvasResizeObservers.current.forEach((ro) => ro.disconnect());
      canvasResizeObservers.current.clear();
      if (transformRafRef.current != null) {
        cancelAnimationFrame(transformRafRef.current);
        transformRafRef.current = null;
      }
    };
  }, []);

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
          // Avoid state spam while dragging over
          if (fileCount !== dragFileCount) setDragFileCount(fileCount);
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
        ref={innerRef}
        style={{
          display: 'flex',
          gap: 60, // Fixed gap between canvases
          height: '100%',
          alignItems: 'center',
          margin: '0 auto', // Center if content is smaller than viewport
          minWidth: 'min-content', // Ensure container grows with content
          // Transform is applied imperatively (rAF-batched) for smooth panning
          willChange: 'transform',
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
                ref={(el) => setCanvasRef(screenIndex, el)}
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
                  viewportScale={zoom / 100}
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
                  const size = canvasSizes.current.get(screenIndex);
                  const canvasEl = canvasRefs.current.get(screenIndex);
                  const rect = !size && canvasEl ? canvasEl.getBoundingClientRect() : null;
                  const width = size?.width ?? rect?.width;
                  const height = size?.height ?? rect?.height;

                  if (sourceScreen && width && height) {
                    // If we fell back to a one-off rect read, cache it to avoid repeated reads
                    if (!size) {
                      canvasSizes.current.set(screenIndex, { width, height });
                    }

                    return (
                      <Box
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width,
                          height,
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
