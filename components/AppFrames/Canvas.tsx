'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Box } from '@mantine/core';
import { CanvasSettings, Screen } from './AppFrames';
import { CompositionRenderer } from './CompositionRenderer';
import { useCrossCanvasDrag } from './CrossCanvasDragContext';
import { OverflowDeviceRenderer } from './OverflowDeviceRenderer';
import { getCanvasDimensions } from './FramesContext';
import { useMediaImage } from '../../hooks/useMediaImage';
import { TextElement as CanvasTextElement } from './TextElement';
import { getBackgroundStyle } from './Sidebar';

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
  onFrameScaleChange?: (screenIndex: number, frameIndex: number, frameScale: number) => void;
  onFrameRotateChange?: (screenIndex: number, frameIndex: number, rotateZ: number) => void;
  onMediaSelect?: (screenIndex: number, frameIndex: number, mediaId: number) => void;
  onPexelsSelect?: (screenIndex: number, frameIndex: number, url: string) => void;
  onSelectTextElement?: (screenIndex: number, textId: string | null) => void;
  onUpdateTextElement?: (screenIndex: number, textId: string, updates: any) => void;
  onDeleteTextElement?: (screenIndex: number, textId: string) => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

function CanvasBackground({ mediaId }: { mediaId?: number }) {
  const { imageUrl } = useMediaImage(mediaId);
  if (!imageUrl) return null;
  return (
    <Box
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

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
  onFrameScaleChange,
  onFrameRotateChange,
  onMediaSelect,
  onPexelsSelect,
  onSelectTextElement,
  onUpdateTextElement,
  onDeleteTextElement,
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

  const getFrameIndexAtPoint = useCallback((screenIndex: number, clientX: number, clientY: number): number | null => {
    const canvasEl = canvasRefs.current.get(screenIndex);
    if (!canvasEl) return null;
    const zones = Array.from(
      canvasEl.querySelectorAll<HTMLElement>('[data-frame-drop-zone="true"][data-frame-index]')
    );
    for (const el of zones) {
      const rect = el.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
        const idx = Number(el.dataset.frameIndex);
        if (Number.isFinite(idx)) return idx;
      }
    }
    return null;
  }, []);

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

  // Wheel handler: Cmd+Scroll = zoom (leave normal scroll alone)
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
      }
    };

    // Use passive: false to allow preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, onZoomChange]);

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
          // Only show *one* set of handles at a time:
          // - If a text element is selected, suppress frame selection/handles.
          const effectiveSelectedFrameIndex =
            isPrimaryScreen && !screenSettings.selectedTextId ? selectedFrameIndex : undefined;

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
                const dropFrameIndex = getFrameIndexAtPoint(screenIndex, e.clientX, e.clientY);
                // 1) Prefer mediaId payload (dragging from media library)
                const mediaIdRaw = (() => {
                  try {
                    return e.dataTransfer.getData('mediaId');
                  } catch {
                    return '';
                  }
                })();
                const mediaId = Number(mediaIdRaw);
                if (Number.isFinite(mediaId) && mediaId > 0) {
                  const targetFrameIndex =
                    dropFrameIndex ??
                    hoveredFrameIndex ??
                    // Fall back to currently selected frame (primary screen), or 0.
                    (screenIndex === selectedScreenIndices[selectedScreenIndices.length - 1]
                      ? (selectedFrameIndex ?? 0)
                      : 0);
                  onMediaSelect?.(screenIndex, targetFrameIndex, mediaId);
                  setHoveredFrameIndex(null);
                  setHoveredScreenIndex(null);
                  setDragFileCount(0);
                  return;
                }

                // 2) Otherwise treat it as a file drop (upload/replace)
                const files = Array.from(e.dataTransfer.files);
                handleDrop(files, dropFrameIndex ?? hoveredFrameIndex ?? undefined, screenIndex);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setHoveredScreenIndex(screenIndex);
                if (e.dataTransfer?.types?.includes('Files')) {
                  const idx = getFrameIndexAtPoint(screenIndex, e.clientX, e.clientY);
                  setHoveredFrameIndex(idx);
                }
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
                  ...getBackgroundStyle(screenSettings.backgroundColor),
                  position: 'relative',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  borderRadius: 8,
                  // Clip content that goes outside the canvas boundaries
                  // The overflow will be rendered in adjacent canvases via OverflowDeviceRenderer
                  overflow: 'hidden',
                }}
                onMouseDown={() => {
                  if (!isPrimaryScreen) return;
                  onSelectTextElement?.(screenIndex, null);
                }}
              >
                {dragFileCount > 0 && hoveredScreenIndex === screenIndex && hoveredFrameIndex == null && (
                  <Box
                    data-export-hide="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      pointerEvents: 'none',
                      zIndex: 0,
                      border: '2px dashed rgba(102, 126, 234, 0.7)',
                      borderRadius: 8,
                      boxShadow: 'inset 0 0 0 2px rgba(102, 126, 234, 0.15)',
                    }}
                  />
                )}
                <CanvasBackground mediaId={screenSettings.canvasBackgroundMediaId} />
                <Box style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
                  <CompositionRenderer
                    settings={screenSettings}
                    screen={screen}
                    screenIndex={screenIndex}
                    viewportScale={zoom / 100}
                    onPanChange={(frameIndex, x, y) => onPanChange?.(screenIndex, frameIndex, x, y)}
                    onFramePositionChange={(frameIndex, x, y) => onFramePositionChange?.(screenIndex, frameIndex, x, y)}
                    onFrameScaleChange={(frameIndex, scale) => onFrameScaleChange?.(screenIndex, frameIndex, scale)}
                    onFrameRotateChange={(frameIndex, rotateZ) => onFrameRotateChange?.(screenIndex, frameIndex, rotateZ)}
                    hoveredFrameIndex={hoveredScreenIndex === screenIndex ? hoveredFrameIndex : null}
                    onFrameHover={setHoveredFrameIndex}
                    dragFileCount={dragFileCount}
                    selectedFrameIndex={effectiveSelectedFrameIndex}
                    onSelectFrame={isPrimaryScreen ? onSelectFrame : undefined}
                    onMediaSelect={(frameIndex, mediaId) => onMediaSelect?.(screenIndex, frameIndex, mediaId)}
                    onPexelsSelect={(frameIndex, url) => onPexelsSelect?.(screenIndex, frameIndex, url)}
                  />
                </Box>
                {(screen.textElements || [])
                  .filter(t => t.visible)
                  .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
                  .map((t) => (
                    <CanvasTextElement
                      key={t.id}
                      element={t}
                      selected={!!isPrimaryScreen && screenSettings.selectedTextId === t.id}
                      disabled={!isPrimaryScreen}
                      onSelect={() => onSelectTextElement?.(screenIndex, t.id)}
                      onUpdate={(updates) => onUpdateTextElement?.(screenIndex, t.id, updates)}
                      onDelete={() => onDeleteTextElement?.(screenIndex, t.id)}
                    />
                  ))}
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
