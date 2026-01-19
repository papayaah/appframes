'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Box, Center } from '@mantine/core';
import { CanvasSettings, Screen } from './AppFrames';
import { DeviceFrame } from './DeviceFrame';
import { ResizeHandles, ResizeHandle } from './ResizeHandles';
import { clampFrameTransform } from './types';
import { useInteractionLock } from './InteractionLockContext';

interface CompositionRendererProps {
  settings: CanvasSettings;
  screen: Screen;
  screenIndex?: number;
  // Scale applied by the outer canvas (e.g. zoom). Used to normalize drag deltas.
  viewportScale?: number;
  disableCrossCanvasDrag?: boolean;
  onPanChange?: (frameIndex: number, panX: number, panY: number) => void;
  onFramePositionChange?: (frameIndex: number, frameX: number, frameY: number) => void;
  onFrameScaleChange?: (frameIndex: number, frameScale: number) => void;
  onFrameRotateChange?: (frameIndex: number, rotateZ: number) => void;
  hoveredFrameIndex?: number | null;
  onFrameHover?: (index: number | null) => void;
  dragFileCount?: number;
  selectedFrameIndex?: number;
  onSelectFrame?: (index: number) => void;
  onMediaSelect?: (frameIndex: number, mediaId: number) => void;
  onPexelsSelect?: (frameIndex: number, url: string) => void;
}

const getCompositionFrameCount = (composition: string): number => {
  switch (composition) {
    case 'single': return 1;
    case 'dual': return 2;
    case 'stack': return 2;
    case 'triple': return 3;
    case 'fan': return 3;
    default: return 1;
  }
};

// Legacy default for the old global `compositionScale` slider.
// We keep this as the baseline so new projects (frameScale=100) look like the old default (compositionScale=85).
const BASE_COMPOSITION_SCALE = 0.85;

const buildFrameTransform = (args: {
  baseTransform: string;
  frameX: number;
  frameY: number;
  frameScale: number;
  tiltX: number;
  tiltY: number;
  rotateZ: number;
}) => {
  const positionTransform = `translate(${args.frameX}px, ${args.frameY}px)`;
  const scaleTransform = `scale(${BASE_COMPOSITION_SCALE * (args.frameScale / 100)})`;
  const rotationTransform = `rotateX(${args.tiltX}deg) rotateY(${args.tiltY}deg) rotateZ(${args.rotateZ}deg)`;
  return `${args.baseTransform} ${positionTransform} ${scaleTransform} ${rotationTransform}`.trim();
};

// Helper component for draggable frame positioning
const DraggableFrame = ({
  children,
  baseStyle,
  fixedWidth,
  frameX,
  frameY,
  viewportScale = 1,
  tiltX = 0,
  tiltY = 0,
  rotateZ = 0,
  frameScale = 100,
  isSelected = false,
  onResizeScale,
  onRotate,
  gestureOwnerKey,
}: {
  children: React.ReactNode;
  baseStyle?: React.CSSProperties;
  fixedWidth?: boolean;
  frameX: number;
  frameY: number;
  viewportScale?: number;
  tiltX?: number;
  tiltY?: number;
  rotateZ?: number;
  frameScale?: number;
  isSelected?: boolean;
  onResizeScale?: (scale: number, handle: ResizeHandle) => void;
  onRotate?: (rotateZ: number) => void;
  gestureOwnerKey: string;
}) => {
  const { isLocked, isOwnerActive } = useInteractionLock();
  const [isHovered, setIsHovered] = useState(false);
  const [isChildFrameDragging, setIsChildFrameDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Preview values (avoid React re-render during drag)
  const previewScaleRef = useRef<number | null>(null);
  const previewRotateRef = useRef<number | null>(null);
  const latestRef = useRef({
    baseTransform: '',
    frameX: 0,
    frameY: 0,
    frameScale: 100,
    tiltX: 0,
    tiltY: 0,
    rotateZ: 0,
  });

  const { transform: baseTransform = '', ...baseStyleNoTransform } = baseStyle || {};

  // Keep latest inputs in a ref so rAF can always build the right transform string.
  latestRef.current = {
    baseTransform,
    frameX,
    frameY,
    frameScale,
    tiltX,
    tiltY,
    rotateZ,
  };

  const applyPreview = useRef(() => {});
  applyPreview.current = () => {
    const el = frameRef.current;
    if (!el) return;
    const latest = latestRef.current;
    const effectiveScale = previewScaleRef.current ?? latest.frameScale;
    const effectiveRotate = previewRotateRef.current ?? latest.rotateZ;
    el.style.transform = buildFrameTransform({
      baseTransform: latest.baseTransform,
      frameX: latest.frameX,
      frameY: latest.frameY,
      frameScale: effectiveScale,
      tiltX: latest.tiltX,
      tiltY: latest.tiltY,
      rotateZ: effectiveRotate,
    });
  };

  const schedulePreview = () => {
    // In non-browser contexts (e.g., some tests), skip rAF usage.
    if (typeof window === 'undefined') return;
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      applyPreview.current();
    });
  };

  useEffect(() => {
    // If not actively previewing, ensure DOM stays in sync with React props.
    if (previewScaleRef.current === null && previewRotateRef.current === null) {
      applyPreview.current();
    }
    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // Intentionally depends on render-time values via latestRef; this just keeps DOM in sync.
  });

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const onStart = () => setIsChildFrameDragging(true);
    const onEnd = () => setIsChildFrameDragging(false);

    el.addEventListener('appframes:framedragstart', onStart as EventListener);
    el.addEventListener('appframes:framedragend', onEnd as EventListener);

    return () => {
      el.removeEventListener('appframes:framedragstart', onStart as EventListener);
      el.removeEventListener('appframes:framedragend', onEnd as EventListener);
    };
  }, []);

  // If another element is being manipulated, suppress hover state.
  useEffect(() => {
    if (isLocked && !isOwnerActive(gestureOwnerKey)) {
      setIsHovered(false);
    }
  }, [gestureOwnerKey, isLocked, isOwnerActive]);

  return (
    <Box
      ref={frameRef}
      onMouseEnter={() => {
        if (isLocked && !isOwnerActive(gestureOwnerKey)) return;
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...baseStyleNoTransform,
        willChange: 'transform',
        transform: buildFrameTransform({
          baseTransform,
          frameX,
          frameY,
          frameScale,
          tiltX,
          tiltY,
          rotateZ,
        }),
        transformStyle: 'preserve-3d',
        transformOrigin: 'center center',
        position: baseStyleNoTransform.position ?? 'relative',
        // For side-by-side layouts, use fixed width to prevent shifting
        ...(fixedWidth ? {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          // Important: don't force a large min-width; the canvas clips overflow,
          // so big layout boxes can hide other frames entirely (transforms don't affect layout size).
          minWidth: 0,
          flex: '0 1 auto',
        } : {}),
      }}
    >
      {children}
      {(isHovered || isSelected) && onResizeScale && !isChildFrameDragging && (
        <ResizeHandles
          viewportScale={viewportScale}
          value={frameScale}
          onScalePreview={(next) => {
            previewScaleRef.current = next;
            schedulePreview();
          }}
          onScaleCommit={(next) => {
            previewScaleRef.current = null;
            schedulePreview(); // snap back to state-driven transform after commit
            onResizeScale(next, 'bottom-right');
          }}
          rotateZ={rotateZ}
          onRotatePreview={
            onRotate
              ? (next) => {
                  previewRotateRef.current = clampFrameTransform(next, 'rotateZ');
                  schedulePreview();
                }
              : undefined
          }
          onRotateCommit={
            onRotate
              ? (next) => {
                  previewRotateRef.current = null;
                  schedulePreview();
                  onRotate(clampFrameTransform(next, 'rotateZ'));
                }
              : undefined
          }
          frameRef={frameRef}
          gestureOwnerKey={gestureOwnerKey}
        />
      )}
    </Box>
  );
};

export function CompositionRenderer({
  settings,
  screen,
  screenIndex,
  viewportScale = 1,
  disableCrossCanvasDrag = false,
  onPanChange,
  onFramePositionChange,
  onFrameScaleChange,
  onFrameRotateChange,
  hoveredFrameIndex,
  onFrameHover,
  dragFileCount = 0,
  selectedFrameIndex,
  onSelectFrame,
  onMediaSelect,
  onPexelsSelect,
}: CompositionRendererProps) {
  const images = screen.images || [];

  // Helper to get per-frame pan values with defaults
  const getFramePan = (index: number) => ({
    panX: images[index]?.panX ?? 50,
    panY: images[index]?.panY ?? 50,
  });

  // Helper to get per-frame position offset
  const getFrameOffset = (index: number) => ({
    frameX: images[index]?.frameX ?? 0,
    frameY: images[index]?.frameY ?? 0,
  });

  // Helper to get per-frame transforms with defaults
  const getFrameTransforms = (index: number) => ({
    frameScale: images[index]?.frameScale ?? 100,
    tiltX: images[index]?.tiltX ?? 0,
    tiltY: images[index]?.tiltY ?? 0,
    rotateZ: images[index]?.rotateZ ?? 0,
  });

  // Determine which frames should be highlighted based on drag
  const getHighlightedFrames = (): number[] => {
    if (hoveredFrameIndex === null || hoveredFrameIndex === undefined) return [];
    const frameCount = getCompositionFrameCount(settings.composition);

    if (dragFileCount > 1) {
      const frames: number[] = [];
      for (let i = 0; i < Math.min(dragFileCount, frameCount); i++) {
        const frameIndex = (hoveredFrameIndex + i) % frameCount;
        if (!frames.includes(frameIndex)) {
          frames.push(frameIndex);
        }
      }
      return frames;
    } else {
      return [hoveredFrameIndex];
    }
  };

  const highlightedFrames = getHighlightedFrames();

  // Common props builder for DeviceFrame
  const getFrameProps = (index: number, scaleMultiplier: number = 1, baseRotateZ: number = 0) => {
    const { panX, panY } = getFramePan(index);
    const { frameY } = getFrameOffset(index);
    const { frameScale, rotateZ } = getFrameTransforms(index);
    // Convert pixel offset to a percentage-like value for handle positioning
    // Negative frameY means frame moved up, so handle should go to bottom
    // We use a threshold of -100 pixels to trigger bottom handle
    const handlePosition = frameY < -100 ? 0 : 50;
    return {
      deviceType: images[index]?.deviceFrame || 'iphone-14-pro',
      image: images[index]?.image,
      mediaId: images[index]?.mediaId,
      // The base size for layout (single/dual/stack/etc). Per-frame resizing is applied via wrapper transforms.
      scale: scaleMultiplier,
      viewportScale,
      dragRotateZ: baseRotateZ + rotateZ,
      dragScale: BASE_COMPOSITION_SCALE * (frameScale / 100),
      gestureOwnerKey: `frame:${screen.id}:${index}`,
      screenScale: settings.screenScale,
      panX,
      panY,
      frameIndex: index,
      isHighlighted: highlightedFrames.includes(index),
      isSelected: selectedFrameIndex === index,
      onClick: () => onSelectFrame?.(index),
      onDragOver: () => onFrameHover?.(index),
      onDragLeave: () => onFrameHover?.(null),
      onMediaSelect: (mediaId: number) => onMediaSelect?.(index, mediaId),
      onPexelsSelect: (url: string) => onPexelsSelect?.(index, url),
      onPanChange: (x: number, y: number) => onPanChange?.(index, x, y),
      onFramePositionChange: (x: number, y: number) => onFramePositionChange?.(index, x, y),
      frameY: handlePosition,
      frameColor: images[index]?.frameColor,
      imageRotation: images[index]?.imageRotation ?? 0,
      screenIndex,
    };
  };

  switch (settings.composition) {
    case 'single':
      const offset0 = getFrameOffset(0);
      const t0 = getFrameTransforms(0);
      const isCleared0 = images[0]?.cleared === true || images[0]?.deviceFrame === '';
      return (
        <Box style={{ height: '100%', perspective: '2000px', perspectiveOrigin: 'center center' }}>
          <Center style={{ height: '100%' }}>
            <DraggableFrame
              frameX={offset0.frameX}
              frameY={offset0.frameY}
              viewportScale={viewportScale}
              frameScale={t0.frameScale}
              tiltX={t0.tiltX}
              tiltY={t0.tiltY}
              rotateZ={t0.rotateZ}
              isSelected={selectedFrameIndex === 0 && !isCleared0}
              onResizeScale={isCleared0 ? undefined : (next, _handle) => onFrameScaleChange?.(0, next)}
              onRotate={isCleared0 ? undefined : (next) => onFrameRotateChange?.(0, next)}
              gestureOwnerKey={`frame:${screen.id}:0`}
            >
              {isCleared0 ? null : (
                <DeviceFrame
                  {...getFrameProps(0, 1)}
                  showInstructions={images.length === 0 || (!images[0]?.image && !images[0]?.mediaId)}
                />
              )}
            </DraggableFrame>
          </Center>
        </Box>
      );

    case 'dual':
      const dualOffset0 = getFrameOffset(0);
      const dualOffset1 = getFrameOffset(1);
      const dt0 = getFrameTransforms(0);
      const dt1 = getFrameTransforms(1);
      const isClearedDual0 = images[0]?.cleared === true || images[0]?.deviceFrame === '';
      const isClearedDual1 = images[1]?.cleared === true || images[1]?.deviceFrame === '';
      return (
        <Box style={{ height: '100%', perspective: '2000px', perspectiveOrigin: 'center center' }}>
          <Center style={{ height: '100%', gap: 20 }}>
            <DraggableFrame
              frameX={dualOffset0.frameX}
              frameY={dualOffset0.frameY}
              fixedWidth
              viewportScale={viewportScale}
              frameScale={dt0.frameScale}
              tiltX={dt0.tiltX}
              tiltY={dt0.tiltY}
              rotateZ={dt0.rotateZ}
              isSelected={selectedFrameIndex === 0 && !isClearedDual0}
              onResizeScale={isClearedDual0 ? undefined : (next, _handle) => onFrameScaleChange?.(0, next)}
              onRotate={isClearedDual0 ? undefined : (next) => onFrameRotateChange?.(0, next)}
              gestureOwnerKey={`frame:${screen.id}:0`}
            >
              {isClearedDual0 ? null : <DeviceFrame {...getFrameProps(0, 0.9)} />}
            </DraggableFrame>
            <DraggableFrame
              frameX={dualOffset1.frameX}
              frameY={dualOffset1.frameY}
              fixedWidth
              viewportScale={viewportScale}
              frameScale={dt1.frameScale}
              tiltX={dt1.tiltX}
              tiltY={dt1.tiltY}
              rotateZ={dt1.rotateZ}
              isSelected={selectedFrameIndex === 1 && !isClearedDual1}
              onResizeScale={isClearedDual1 ? undefined : (next, _handle) => onFrameScaleChange?.(1, next)}
              onRotate={isClearedDual1 ? undefined : (next) => onFrameRotateChange?.(1, next)}
              gestureOwnerKey={`frame:${screen.id}:1`}
            >
              {isClearedDual1 ? null : <DeviceFrame {...getFrameProps(1, 0.9)} />}
            </DraggableFrame>
          </Center>
        </Box>
      );

    case 'stack':
      const stackOffset0 = getFrameOffset(0);
      const stackOffset1 = getFrameOffset(1);
      const st0 = getFrameTransforms(0);
      const st1 = getFrameTransforms(1);
      const isClearedStack0 = images[0]?.cleared === true || images[0]?.deviceFrame === '';
      const isClearedStack1 = images[1]?.cleared === true || images[1]?.deviceFrame === '';
      return (
        <Box style={{ height: '100%', perspective: '2000px', perspectiveOrigin: 'center center' }}>
          <Center style={{ height: '100%', position: 'relative' }}>
            <Box style={{ position: 'relative' }}>
              <DraggableFrame
                frameX={stackOffset0.frameX}
                frameY={stackOffset0.frameY}
                baseStyle={{
                  position: 'absolute',
                  top: -20,
                  left: -20,
                  zIndex: 1,
                }}
                viewportScale={viewportScale}
                frameScale={st0.frameScale}
                tiltX={st0.tiltX}
                tiltY={st0.tiltY}
                rotateZ={st0.rotateZ}
                isSelected={selectedFrameIndex === 0 && !isClearedStack0}
                onResizeScale={isClearedStack0 ? undefined : (next, _handle) => onFrameScaleChange?.(0, next)}
                onRotate={isClearedStack0 ? undefined : (next) => onFrameRotateChange?.(0, next)}
                gestureOwnerKey={`frame:${screen.id}:0`}
              >
                {isClearedStack0 ? null : <DeviceFrame {...getFrameProps(0, 0.85)} />}
              </DraggableFrame>
              <DraggableFrame
                frameX={stackOffset1.frameX}
                frameY={stackOffset1.frameY}
                baseStyle={{
                  position: 'relative',
                  zIndex: 2,
                }}
                viewportScale={viewportScale}
                frameScale={st1.frameScale}
                tiltX={st1.tiltX}
                tiltY={st1.tiltY}
                rotateZ={st1.rotateZ}
                isSelected={selectedFrameIndex === 1 && !isClearedStack1}
                onResizeScale={isClearedStack1 ? undefined : (next, _handle) => onFrameScaleChange?.(1, next)}
                onRotate={isClearedStack1 ? undefined : (next) => onFrameRotateChange?.(1, next)}
                gestureOwnerKey={`frame:${screen.id}:1`}
              >
                {isClearedStack1 ? null : <DeviceFrame {...getFrameProps(1, 0.85)} />}
              </DraggableFrame>
            </Box>
          </Center>
        </Box>
      );

    case 'triple':
      const tripleOffset0 = getFrameOffset(0);
      const tripleOffset1 = getFrameOffset(1);
      const tripleOffset2 = getFrameOffset(2);
      const tt0 = getFrameTransforms(0);
      const tt1 = getFrameTransforms(1);
      const tt2 = getFrameTransforms(2);
      const isClearedTriple0 = images[0]?.cleared === true || images[0]?.deviceFrame === '';
      const isClearedTriple1 = images[1]?.cleared === true || images[1]?.deviceFrame === '';
      const isClearedTriple2 = images[2]?.cleared === true || images[2]?.deviceFrame === '';
      return (
        <Box style={{ height: '100%', perspective: '2000px', perspectiveOrigin: 'center center' }}>
          <Center style={{ height: '100%', gap: 12 }}>
            <DraggableFrame
              frameX={tripleOffset0.frameX}
              frameY={tripleOffset0.frameY}
              fixedWidth
              viewportScale={viewportScale}
              frameScale={tt0.frameScale}
              tiltX={tt0.tiltX}
              tiltY={tt0.tiltY}
              rotateZ={tt0.rotateZ}
              isSelected={selectedFrameIndex === 0 && !isClearedTriple0}
              onResizeScale={isClearedTriple0 ? undefined : (next, _handle) => onFrameScaleChange?.(0, next)}
              onRotate={isClearedTriple0 ? undefined : (next) => onFrameRotateChange?.(0, next)}
              gestureOwnerKey={`frame:${screen.id}:0`}
            >
              {isClearedTriple0 ? null : <DeviceFrame {...getFrameProps(0, 0.68)} />}
            </DraggableFrame>
            <DraggableFrame
              frameX={tripleOffset1.frameX}
              frameY={tripleOffset1.frameY}
              fixedWidth
              viewportScale={viewportScale}
              frameScale={tt1.frameScale}
              tiltX={tt1.tiltX}
              tiltY={tt1.tiltY}
              rotateZ={tt1.rotateZ}
              isSelected={selectedFrameIndex === 1 && !isClearedTriple1}
              onResizeScale={isClearedTriple1 ? undefined : (next, _handle) => onFrameScaleChange?.(1, next)}
              onRotate={isClearedTriple1 ? undefined : (next) => onFrameRotateChange?.(1, next)}
              gestureOwnerKey={`frame:${screen.id}:1`}
            >
              {isClearedTriple1 ? null : <DeviceFrame {...getFrameProps(1, 0.68)} />}
            </DraggableFrame>
            <DraggableFrame
              frameX={tripleOffset2.frameX}
              frameY={tripleOffset2.frameY}
              fixedWidth
              viewportScale={viewportScale}
              frameScale={tt2.frameScale}
              tiltX={tt2.tiltX}
              tiltY={tt2.tiltY}
              rotateZ={tt2.rotateZ}
              isSelected={selectedFrameIndex === 2 && !isClearedTriple2}
              onResizeScale={isClearedTriple2 ? undefined : (next, _handle) => onFrameScaleChange?.(2, next)}
              onRotate={isClearedTriple2 ? undefined : (next) => onFrameRotateChange?.(2, next)}
              gestureOwnerKey={`frame:${screen.id}:2`}
            >
              {isClearedTriple2 ? null : <DeviceFrame {...getFrameProps(2, 0.68)} />}
            </DraggableFrame>
          </Center>
        </Box>
      );

    case 'fan':
      const fanOffset0 = getFrameOffset(0);
      const fanOffset1 = getFrameOffset(1);
      const fanOffset2 = getFrameOffset(2);
      const ft0 = getFrameTransforms(0);
      const ft1 = getFrameTransforms(1);
      const ft2 = getFrameTransforms(2);
      const isClearedFan0 = images[0]?.cleared === true || images[0]?.deviceFrame === '';
      const isClearedFan1 = images[1]?.cleared === true || images[1]?.deviceFrame === '';
      const isClearedFan2 = images[2]?.cleared === true || images[2]?.deviceFrame === '';
      return (
        <Box style={{ height: '100%', perspective: '2000px', perspectiveOrigin: 'center center' }}>
          <Center style={{ height: '100%', position: 'relative' }}>
            <Box style={{ position: 'relative', width: 600, height: 500 }}>
            <DraggableFrame
              frameX={fanOffset0.frameX}
              frameY={fanOffset0.frameY}
              baseStyle={{
                position: 'absolute',
                top: '50%',
                left: '20%',
                transform: 'translate(-50%, -50%) rotate(-8deg)',
                zIndex: 1,
              }}
              viewportScale={viewportScale}
              frameScale={ft0.frameScale}
              tiltX={ft0.tiltX}
              tiltY={ft0.tiltY}
              rotateZ={ft0.rotateZ}
              isSelected={selectedFrameIndex === 0 && !isClearedFan0}
              onResizeScale={isClearedFan0 ? undefined : (next, _handle) => onFrameScaleChange?.(0, next)}
              onRotate={isClearedFan0 ? undefined : (next) => onFrameRotateChange?.(0, next)}
              gestureOwnerKey={`frame:${screen.id}:0`}
            >
              {isClearedFan0 ? null : <DeviceFrame {...getFrameProps(0, 0.7, -8)} />}
            </DraggableFrame>
            <DraggableFrame
              frameX={fanOffset1.frameX}
              frameY={fanOffset1.frameY}
              baseStyle={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 3,
              }}
              viewportScale={viewportScale}
              frameScale={ft1.frameScale}
              tiltX={ft1.tiltX}
              tiltY={ft1.tiltY}
              rotateZ={ft1.rotateZ}
              isSelected={selectedFrameIndex === 1 && !isClearedFan1}
              onResizeScale={isClearedFan1 ? undefined : (next, _handle) => onFrameScaleChange?.(1, next)}
              onRotate={isClearedFan1 ? undefined : (next) => onFrameRotateChange?.(1, next)}
              gestureOwnerKey={`frame:${screen.id}:1`}
            >
              {isClearedFan1 ? null : <DeviceFrame {...getFrameProps(1, 0.7, 0)} />}
            </DraggableFrame>
            <DraggableFrame
              frameX={fanOffset2.frameX}
              frameY={fanOffset2.frameY}
              baseStyle={{
                position: 'absolute',
                top: '50%',
                left: '80%',
                transform: 'translate(-50%, -50%) rotate(8deg)',
                zIndex: 2,
              }}
              viewportScale={viewportScale}
              frameScale={ft2.frameScale}
              tiltX={ft2.tiltX}
              tiltY={ft2.tiltY}
              rotateZ={ft2.rotateZ}
              isSelected={selectedFrameIndex === 2 && !isClearedFan2}
              onResizeScale={isClearedFan2 ? undefined : (next, _handle) => onFrameScaleChange?.(2, next)}
              onRotate={isClearedFan2 ? undefined : (next) => onFrameRotateChange?.(2, next)}
              gestureOwnerKey={`frame:${screen.id}:2`}
            >
              {isClearedFan2 ? null : <DeviceFrame {...getFrameProps(2, 0.7, 8)} />}
            </DraggableFrame>
            </Box>
          </Center>
        </Box>
      );

    default:
      return null;
  }
}
