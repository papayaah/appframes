'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Box } from '@mantine/core';
import { CanvasSettings, Screen, SharedBackground } from './AppFrames';
import { CompositionRenderer } from './CompositionRenderer';
import { useCrossCanvasDrag } from './CrossCanvasDragContext';
import { OverflowDeviceRenderer } from './OverflowDeviceRenderer';
import { getCanvasDimensions } from './FramesContext';
import { useMediaImage } from '../../hooks/useMediaImage';
import { TextElement as CanvasTextElement } from './TextElement';
import { getBackgroundStyle } from './sharedBackgroundUtils';
import { SharedCanvasBackground } from './SharedCanvasBackground';
import { BackgroundEffectsOverlay } from './BackgroundEffectsOverlay';

interface CanvasProps {
  settings: CanvasSettings;
  screens: Screen[];
  selectedScreenIndices: number[];
  selectedFrameIndex?: number;
  frameSelectionVisible?: boolean;
  sharedBackground?: SharedBackground;
  onSelectFrame?: (screenIndex: number, frameIndex: number, e?: React.MouseEvent) => void;
  onSelectScreen?: (index: number, multi: boolean) => void;
  onReplaceScreen?: (files: File[], targetFrameIndex?: number, screenIndex?: number) => void;
  onPanChange?: (screenIndex: number, frameIndex: number, panX: number, panY: number, persistent?: boolean) => void;
  onBackgroundPanChange?: (screenIndex: number, panX: number, panY: number, persistent?: boolean) => void;
  onFramePositionChange?: (screenIndex: number, frameIndex: number, frameX: number, frameY: number, persistent?: boolean) => void;
  onFrameScaleChange?: (screenIndex: number, frameIndex: number, frameScale: number, persistent?: boolean) => void;
  onFrameRotateChange?: (screenIndex: number, frameIndex: number, rotateZ: number, persistent?: boolean) => void;
  onMediaSelect?: (screenIndex: number, frameIndex: number, mediaId: number) => void;
  onCanvasBackgroundMediaSelect?: (screenIndex: number, mediaId: number) => void;
  onPexelsSelect?: (screenIndex: number, frameIndex: number, url: string) => void;
  onSelectTextElement?: (screenIndex: number, textId: string | null, e?: React.MouseEvent) => void;
  onUpdateTextElement?: (screenIndex: number, textId: string, updates: any) => void;
  onDeleteTextElement?: (screenIndex: number, textId: string) => void;
  onClickCanvas?: (screenIndex: number) => void;
  onClickOutsideCanvas?: () => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

function CanvasBackground({
  mediaId,
  blur,
  panX = 50,
  panY = 50,
  backgroundScale = 0,
  backgroundRotation = 0
}: {
  mediaId?: number;
  blur?: number;
  panX?: number;
  panY?: number;
  backgroundScale?: number;
  backgroundRotation?: number;
}) {
  const { imageUrl } = useMediaImage(mediaId);
  if (!imageUrl) return null;
  const hasBlur = blur != null && blur > 0;

  // backgroundScale 0 = cover (1x), 100 = 2x zoom
  // Negative inset makes the element larger, creating real overflow for backgroundPosition to pan
  const zoomInset = -(backgroundScale / 2);
  const blurPadding = hasBlur ? blur : 0;

  // Rotation compensation to avoid empty corners when rotated
  const rotationCompensation = [90, 270].includes(backgroundRotation % 360) ? 1.42 : 1;

  return (
    <Box
      style={{
        position: 'absolute',
        inset: `calc(${zoomInset}% - ${blurPadding}px)`,
        clipPath: hasBlur ? `inset(${blurPadding}px)` : undefined,
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: `${panX}% ${panY}%`,
        backgroundRepeat: 'no-repeat',
        filter: hasBlur ? `blur(${blur}px)` : undefined,
        transform: backgroundRotation !== 0 ? `rotate(${backgroundRotation}deg)` : undefined,
        transformOrigin: 'center center',
        scale: rotationCompensation !== 1 ? rotationCompensation : undefined,
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
  frameSelectionVisible = false,
  sharedBackground,
  onSelectFrame,
  onSelectScreen,
  onReplaceScreen,
  onPanChange,
  onBackgroundPanChange,
  onFramePositionChange,
  onFrameScaleChange,
  onFrameRotateChange,
  onMediaSelect,
  onCanvasBackgroundMediaSelect,
  onPexelsSelect,
  onSelectTextElement,
  onUpdateTextElement,
  onDeleteTextElement,
  onClickCanvas,
  onClickOutsideCanvas,
  zoom = 100,
  onZoomChange,
}: CanvasProps) {
  const [hoveredFrameIndex, setHoveredFrameIndex] = useState<number | null>(null);
  const [hoveredScreenIndex, setHoveredScreenIndex] = useState<number | null>(null);
  const [dragFileCount, setDragFileCount] = useState<number>(0);
  const [isPanning, setIsPanning] = useState(false);
  const [isBackgroundPanning, setIsBackgroundPanning] = useState(false);

  // Track the actual rendered width of EACH canvas to enable proportional scaling
  const [canvasWidths, setCanvasWidths] = useState<Record<string, number>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Map<number, HTMLElement>>(new Map());
  const canvasResizeObservers = useRef<Map<number, ResizeObserver>>(new Map());
  const spacePressedRef = useRef(false);

  // Pan + zoom hot path: keep in refs, apply transform in rAF (avoid React renders per mousemove)
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  const transformRafRef = useRef<number | null>(null);
  zoomRef.current = zoom;

  // Track global spacebar state for background panning
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') spacePressedRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') spacePressedRef.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Get cross-canvas drag context
  const crossCanvasDrag = useCrossCanvasDrag();

  const handleBackgroundPan = useCallback((e: React.MouseEvent, screenIndex: number) => {
    const screen = screens[screenIndex];
    if (!screen || !onBackgroundPanChange) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startPanX = screen.settings.screenPanX ?? 50;
    const startPanY = screen.settings.screenPanY ?? 50;
    const backgroundScale = screen.settings.backgroundScale ?? 0;

    const canvasEl = canvasRefs.current.get(screenIndex);
    if (!canvasEl) return;

    const actualWidth = canvasEl.offsetWidth;
    const actualHeight = canvasEl.offsetHeight;

    // totalScale for the background includes the image's own zoom (backgroundScale)
    // plus the canvas viewport scaling (zoom/100)
    const currentZoom = zoomRef.current / 100;
    const scaleFactor = currentZoom * (1 + backgroundScale / 100);

    // Account for rotation the same way DeviceFrame does
    const backgroundRotation = screen.settings.backgroundRotation ?? 0;
    const radians = (backgroundRotation * Math.PI) / 180;
    const cos = Math.cos(-radians);
    const sin = Math.sin(-radians);

    setIsBackgroundPanning(true);

    let currentPanX = startPanX;
    let currentPanY = startPanY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const screenDx = moveEvent.clientX - startX;
      const screenDy = moveEvent.clientY - startY;

      // Rotate delta into image local space
      const localDx = screenDx * cos - screenDy * sin;
      const localDy = screenDx * sin + screenDy * cos;

      const dx = (localDx / (actualWidth * scaleFactor)) * 100;
      const dy = (localDy / (actualHeight * scaleFactor)) * 100;

      currentPanX = Math.round(Math.max(0, Math.min(100, startPanX + dx)));
      currentPanY = Math.round(Math.max(0, Math.min(100, startPanY + dy)));

      onBackgroundPanChange(screenIndex, currentPanX, currentPanY, false);
    };

    const handleMouseUp = () => {
      setIsBackgroundPanning(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Final persistent commit
      onBackgroundPanChange(screenIndex, currentPanX, currentPanY, true);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [screens, onBackgroundPanChange]);

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

  const setCanvasRef = useCallback((screenIndex: number, screenId: string, el: HTMLElement | null) => {
    // Clean up old observer/ref
    const prev = canvasRefs.current.get(screenIndex);
    if (prev && prev !== el) {
      canvasResizeObservers.current.get(screenIndex)?.disconnect();
      canvasResizeObservers.current.delete(screenIndex);
      canvasRefs.current.delete(screenIndex);
      crossCanvasDrag.unregisterCanvas(screenIndex);
    }

    if (!el) return;

    canvasRefs.current.set(screenIndex, el);
    // Register bounds for cross-canvas drag (initially)
    crossCanvasDrag.registerCanvas(screenIndex, el);

    // Track size to calculate the scaling ratio between official units and actual viewport pixels
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const width = entry.contentRect.width;
        setCanvasWidths(prev => ({ ...prev, [screenId]: width }));
        // Keep drag bounds current
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

  const handleContainerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!onClickOutsideCanvas) return;
      // Only deselect when clicking outside any canvas (e.g. gray editor area)
      const target = e.target as HTMLElement;
      if (!target.closest('[data-canvas="true"]')) {
        onClickOutsideCanvas();
      }
    },
    [onClickOutsideCanvas]
  );

  // No longer using a hardcoded 1000px. We use the official target resolution width.
  // This makes 1 unit = 1 pixel at 1x export, which is much more intuitive.

  return (
    <Box
      ref={containerRef}
      style={{
        flex: 1,
        backgroundColor: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: 40,
        overflowX: 'auto',
        overflowY: 'hidden',
        position: 'relative',
      }}
      onMouseDown={handleContainerMouseDown}
      onDragOver={(e) => {
        e.preventDefault();
        if (e.dataTransfer.types.includes('Files')) {
          const count = e.dataTransfer.items.length;
          if (count !== dragFileCount) setDragFileCount(count);
        }
      }}
      onDragLeave={(e) => {
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
          gap: 60,
          height: '100%',
          alignItems: 'center',
          margin: '0 auto',
          minWidth: 'min-content',
          willChange: 'transform',
          cursor: isPanning ? 'grabbing' : undefined,
        }}
      >
        {(() => {
          const sortedIndices = [...selectedScreenIndices].sort((a, b) => a - b);
          const primaryScreenIndex = selectedScreenIndices[selectedScreenIndices.length - 1];

          return sortedIndices.map((screenIndex) => {
            const screen = screens[screenIndex];
            if (!screen) return null;

            const screenSettings = { ...screen.settings, selectedScreenIndex: screenIndex };
            const canvasDimensions = getCanvasDimensions(screenSettings.canvasSize, screenSettings.orientation);
            const aspectRatio = canvasDimensions.width / canvasDimensions.height;
            const isPrimaryScreen = screenIndex === primaryScreenIndex;
            const effSelectedFrameIndex = isPrimaryScreen && !screenSettings.selectedTextId && frameSelectionVisible ? selectedFrameIndex : undefined;

            // Content Scaling Logic:
            // We scale the target coordinate system (e.g. 1320px) down to the responsive actualWidth.
            // This ensures editor units = target pixels.
            const designRefWidth = canvasDimensions.width;
            const actualWidth = canvasWidths[screen.id] || 0;
            // Default to a 1:1 scale if the observer hasn't reported a width yet to avoid initial flicker
            const contentScale = actualWidth ? actualWidth / designRefWidth : 1;
            const designHeight = designRefWidth / aspectRatio;

            return (
              <Box
                key={screen.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  width: aspectRatio > 1 ? '60vw' : `max(40vh, ${Math.round(80 * aspectRatio)}vh)`,
                  flexShrink: 0,
                  position: 'relative',
                }}
                onDrop={(e) => {
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile && (droppedFile.name.toLowerCase().endsWith('.appframes') || droppedFile.name.toLowerCase().endsWith('.zip'))) return;
                  e.preventDefault();
                  e.stopPropagation();
                  const dropFrameIndex = getFrameIndexAtPoint(screenIndex, e.clientX, e.clientY);
                  const mediaId = Number(e.dataTransfer.getData('mediaId'));
                  if (Number.isFinite(mediaId) && mediaId > 0) {
                    if (dropFrameIndex != null) onMediaSelect?.(screenIndex, dropFrameIndex, mediaId);
                    else onCanvasBackgroundMediaSelect?.(screenIndex, mediaId);
                  } else {
                    onReplaceScreen?.(Array.from(e.dataTransfer.files), dropFrameIndex ?? hoveredFrameIndex ?? undefined, screenIndex);
                  }
                  setHoveredFrameIndex(null);
                  setHoveredScreenIndex(null);
                  setDragFileCount(0);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setHoveredScreenIndex(screenIndex);
                  setHoveredFrameIndex(getFrameIndexAtPoint(screenIndex, e.clientX, e.clientY));
                }}
              >
                <Box
                  id={`canvas-${screen.id}`}
                  data-canvas="true"
                  ref={(el) => setCanvasRef(screenIndex, screen.id, el)}
                  style={{
                    width: '100%',
                    maxWidth: aspectRatio > 1 ? '90%' : '100%',
                    aspectRatio: `${aspectRatio}`,
                    position: 'relative',
                    boxShadow: selectedScreenIndices.length > 1
                      ? (isPrimaryScreen
                        ? '0 0 60px rgba(102, 126, 234, 0.5), 0 20px 50px rgba(0,0,0,0.25)'
                        : '0 0 30px rgba(102, 126, 234, 0.2), 0 10px 40px rgba(0,0,0,0.15)')
                      : '0 10px 40px rgba(0,0,0,0.15)',
                    borderRadius: 8,
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    zIndex: isPrimaryScreen ? 1 : 0,
                  }}
                  onMouseDown={(e) => {
                    const target = e.target as HTMLElement;
                    const isFrameHit = !!target.closest('[data-frame-drop-zone="true"]');
                    const isTextHit = !!target.closest('[data-text-element="true"]');

                    // Space held + background click = pan background
                    if (spacePressedRef.current && !isFrameHit && !isTextHit) {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBackgroundPan(e, screenIndex);
                      return;
                    }

                    if (!isFrameHit && !isTextHit) onClickCanvas?.(screenIndex);
                    onSelectTextElement?.(screenIndex, null);
                  }}
                >
                  {/* Scaling Content Container (Stability Layer) */}
                  <Box
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: designRefWidth,
                      height: designHeight,
                      transformOrigin: 'top left',
                      transform: `scale(${contentScale})`,
                      ['--appframes-canvas-scale' as any]: contentScale,
                      pointerEvents: 'none',
                    }}
                  >
                    <Box style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}>
                      {/* Background Stack (Layer 0) */}
                      <Box style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
                        {/* Background Color */}
                        <Box
                          style={{
                            position: 'absolute',
                            inset: 0,
                            ...getBackgroundStyle(screenSettings.backgroundColor),
                            zIndex: 0,
                          }}
                        />

                        {/* Background Image / Shared Background */}
                        {sharedBackground && sharedBackground.screenIds.includes(screen.id) ? (
                          <SharedCanvasBackground
                            screenId={screen.id}
                            allScreens={screens}
                            sharedBackground={sharedBackground}
                            screenWidth={designRefWidth}
                            screenHeight={designHeight}
                            blur={screenSettings.backgroundEffects?.blur}
                          />
                        ) : (
                          <CanvasBackground
                            mediaId={screenSettings.canvasBackgroundMediaId}
                            blur={screenSettings.backgroundEffects?.blur}
                            panX={screenSettings.screenPanX}
                            panY={screenSettings.screenPanY}
                            backgroundScale={screenSettings.backgroundScale}
                            backgroundRotation={screenSettings.backgroundRotation}
                          />
                        )}

                        {/* Background Effects Overlay */}
                        <BackgroundEffectsOverlay effects={screenSettings.backgroundEffects} screenId={screen.id} />


                        {/* Global Background Blur */}
                        {(() => {
                          const blur = screenSettings.backgroundEffects?.blur ?? 0;
                          if (blur <= 0) return null;
                          return (
                            <Box
                              style={{
                                position: 'absolute',
                                inset: `-${blur}px`,
                                backdropFilter: `blur(${blur}px)`,
                                pointerEvents: 'none',
                                zIndex: 10, // Top of background stack
                              }}
                            />
                          );
                        })()}
                      </Box>

                      {/* Content Layer (Layer 1) */}
                      <Box style={{ position: 'relative', zIndex: 1, width: designRefWidth, height: designHeight }}>
                        <CompositionRenderer
                          settings={{
                            ...screenSettings,
                            composition: screenSettings.composition || 'single' // Fallback to prevent removal
                          }}
                          screen={screen}
                          screenIndex={screenIndex}
                          // Important: normalize coordinates by BOTH zoom and design scale
                          viewportScale={(zoom / 100) * contentScale}
                          onPanChange={(fi, x, y, p) => onPanChange?.(screenIndex, fi, x, y, p)}
                          onFramePositionChange={(fi, x, y, p) => onFramePositionChange?.(screenIndex, fi, x, y, p)}
                          onFrameScaleChange={(fi, s, p) => onFrameScaleChange?.(screenIndex, fi, s, p)}
                          onFrameRotateChange={(fi, r, p) => onFrameRotateChange?.(screenIndex, fi, r, p)}
                          hoveredFrameIndex={hoveredScreenIndex === screenIndex ? hoveredFrameIndex : null}
                          onFrameHover={setHoveredFrameIndex}
                          dragFileCount={dragFileCount}
                          selectedFrameIndex={effSelectedFrameIndex}
                          onSelectFrame={(frameIndex, e) => onSelectFrame?.(screenIndex, frameIndex, e)}
                          onMediaSelect={(fi, mid) => onMediaSelect?.(screenIndex, fi, mid)}
                          onPexelsSelect={(fi, url) => onPexelsSelect?.(screenIndex, fi, url)}
                        />
                      </Box>
                      {(screen.textElements || [])
                        .filter(t => t.visible)
                        .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
                        .map((t) => (
                          <CanvasTextElement
                            key={t.id}
                            element={t}
                            selected={screenSettings.selectedTextId === t.id}
                            onSelect={(e) => onSelectTextElement?.(screenIndex, t.id, e)}
                            onUpdate={(u) => onUpdateTextElement?.(screenIndex, t.id, u)}
                            onDelete={() => onDeleteTextElement?.(screenIndex, t.id)}
                          />
                        ))}
                    </Box>
                  </Box>
                  {/* Drop highlight overlay (Outside design box to ensure correct depth) */}
                  {dragFileCount > 0 && hoveredScreenIndex === screenIndex && hoveredFrameIndex == null && (
                    <Box style={{ position: 'absolute', inset: 0, border: '2px dashed #667eea', borderRadius: 8, zIndex: 10, pointerEvents: 'none' }} />
                  )}
                </Box>
                {/* Render overflow from devices dragged from other canvases (or persisted shared devices) */}
                {(() => {
                  const overflow = crossCanvasDrag.getOverflowForCanvas(screenIndex);
                  if (overflow && overflow.visible) {
                    const sourceScreen = screens[overflow.sourceScreenIndex];
                    if (sourceScreen && actualWidth) {
                      const actualHeight = actualWidth / aspectRatio;
                      return (
                        <Box
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: actualWidth,
                            height: actualHeight,
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
                            designScale={contentScale}
                          />
                        </Box>
                      );
                    }
                  }
                  return null;
                })()}
              </Box>
            );
          });
        })()}
      </Box>
    </Box>
  );
}
