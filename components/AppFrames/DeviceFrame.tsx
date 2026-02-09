'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Box } from '@mantine/core';
import { useMediaImage } from '../../hooks/useMediaImage';
import { useInteractionLock } from './InteractionLockContext';
import type { DIYOptions } from './diy-frames/types';
import { getDefaultDIYOptions, BEZEL_WIDTHS, CORNER_RADII, BASE_DIMENSIONS } from './diy-frames/types';
import {
  PhoneRenderer,
  TabletRenderer,
  FlipRenderer,
  FoldableRenderer,
  LaptopRenderer,
  DesktopRenderer,
} from './diy-frames/DeviceRenderers';

interface DeviceFrameProps {
  diyOptions?: DIYOptions;
  image?: string;
  mediaId?: number;
  serverMediaPath?: string; // Server-side media path (for cross-device sync)
  screenIndex?: number;
  scale: number;
  viewportScale?: number;
  dragRotateZ?: number;
  dragScale?: number;
  gestureOwnerKey?: string;
  screenScale: number;
  panX: number;
  panY: number;
  showInstructions?: boolean;
  onPanChange?: (panX: number, panY: number) => void;
  frameIndex?: number;
  isHighlighted?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onDragOver?: () => void;
  onDragLeave?: () => void;
  onMediaSelect?: (mediaId: number) => void;
  onPexelsSelect?: (url: string) => void;
  onFramePositionChange?: (frameX: number, frameY: number) => void;
  onFrameMove?: (deltaX: number, deltaY: number) => void;
  onFrameMoveEnd?: () => void;
  frameY?: number;
  frameColor?: string;
  imageRotation?: number;
}

const isInteractiveTarget = (target: EventTarget | null): boolean => {
  if (!target || !(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return !!target.closest('button, [role="button"], a, input, textarea, select, [data-no-frame-drag="true"]');
};

// Default frame color for each device type
const DEFAULT_FRAME_COLORS: Record<string, string> = {
  phone: '#2a2a2a',
  flip: '#1a1a1a',
  foldable: '#1a1a1a',
  tablet: '#2a2a2a',
  laptop: '#2a2a2a',
  desktop: '#1a1a1a',
};

export function DeviceFrame({
  diyOptions,
  image,
  mediaId,
  serverMediaPath,
  screenIndex,
  scale,
  viewportScale = 1,
  dragRotateZ = 0,
  dragScale = 1,
  gestureOwnerKey,
  screenScale,
  panX,
  panY,
  showInstructions = false,
  onPanChange,
  frameIndex,
  isHighlighted = false,
  isSelected = false,
  onClick,
  onDragOver,
  onDragLeave,
  onMediaSelect,
  onPexelsSelect,
  onFramePositionChange,
  onFrameMove,
  onFrameMoveEnd,
  frameY = 50,
  frameColor: customFrameColor,
  imageRotation = 0,
}: DeviceFrameProps) {
  const isExporting = typeof document !== 'undefined' && document.body?.dataset?.appframesExporting === 'true';
  const effectiveSelected = isExporting ? false : isSelected;
  const effectiveHighlighted = isExporting ? false : isHighlighted;
  const { isLocked, isOwnerActive, begin, end } = useInteractionLock();
  const { imageUrl } = useMediaImage(mediaId);
  // Priority: local OPFS (mediaId) > server path > base64 image
  const serverImageUrl = serverMediaPath ? `/api/media/files/${serverMediaPath}` : undefined;
  const displayImage = imageUrl || serverImageUrl || image;
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFrameDragging, setIsFrameDragging] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);
  const imageLayerRef = useRef<HTMLDivElement>(null);
  const panRafRef = useRef<number | null>(null);
  const pendingPanRef = useRef<{ x: number; y: number } | null>(null);
  const isPanningRef = useRef(false);
  const frameWrapperRef = useRef<HTMLDivElement>(null);
  const frameDragRafRef = useRef<number | null>(null);
  const pendingFrameOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const pendingFrameVisualOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const isFrameDraggingRef = useRef(false);
  const moveModifierPressedRef = useRef(false);
  const gestureTokenRef = useRef<string | null>(null);

  // Use default options if not provided
  const options = diyOptions ?? getDefaultDIYOptions('phone');
  const deviceType = options.type;
  const effectiveFrameColor = customFrameColor ?? DEFAULT_FRAME_COLORS[deviceType] ?? '#2a2a2a';

  const applyPanVisual = useCallback((x: number, y: number) => {
    const el = imageLayerRef.current;
    if (!el) return;
    el.style.backgroundPosition = `${x}% ${y}%`;
  }, []);

  const schedulePanVisual = useCallback(() => {
    if (panRafRef.current != null) return;
    panRafRef.current = requestAnimationFrame(() => {
      panRafRef.current = null;
      const pending = pendingPanRef.current;
      if (!pending) return;
      applyPanVisual(pending.x, pending.y);
    });
  }, [applyPanVisual]);

  const applyFrameDragVisual = useCallback((x: number, y: number) => {
    const el = frameWrapperRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const scheduleFrameDragVisual = useCallback(() => {
    if (frameDragRafRef.current != null) return;
    frameDragRafRef.current = requestAnimationFrame(() => {
      frameDragRafRef.current = null;
      const pending = pendingFrameVisualOffsetRef.current;
      if (!pending) return;
      applyFrameDragVisual(pending.x, pending.y);
    });
  }, [applyFrameDragVisual]);

  useEffect(() => {
    if (isPanningRef.current) return;
    if (!displayImage) return;
    applyPanVisual(panX, panY);
  }, [panX, panY, displayImage, applyPanVisual]);

  useEffect(() => {
    return () => {
      if (panRafRef.current != null) cancelAnimationFrame(panRafRef.current);
      if (frameDragRafRef.current != null) cancelAnimationFrame(frameDragRafRef.current);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') moveModifierPressedRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') moveModifierPressedRef.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const handleFrameDragStart = (e: React.MouseEvent) => {
    setIsFrameDragging(true);
    isFrameDraggingRef.current = true;
    pendingFrameOffsetRef.current = { x: 0, y: 0 };
    pendingFrameVisualOffsetRef.current = { x: 0, y: 0 };

    // Dispatch drag start event for parent components (e.g., DraggableFrame)
    frameWrapperRef.current?.dispatchEvent(new CustomEvent('appframes:framedragstart', { bubbles: true }));

    const startX = e.clientX;
    const startY = e.clientY;
    const radians = (dragRotateZ * Math.PI) / 180;
    const cos = Math.cos(-radians);
    const sin = Math.sin(-radians);
    const totalScale = viewportScale * dragScale;

    const handleMove = (moveEvent: MouseEvent) => {
      const rawDx = (moveEvent.clientX - startX) / totalScale;
      const rawDy = (moveEvent.clientY - startY) / totalScale;
      const localDx = rawDx * cos - rawDy * sin;
      const localDy = rawDx * sin + rawDy * cos;
      pendingFrameOffsetRef.current = { x: rawDx, y: rawDy };
      pendingFrameVisualOffsetRef.current = { x: localDx, y: localDy };
      scheduleFrameDragVisual();
      // Dispatch drag move event with offset for parent components
      frameWrapperRef.current?.dispatchEvent(new CustomEvent('appframes:framedragmove', {
        bubbles: true,
        detail: { x: localDx, y: localDy },
      }));
    };

    const handleEnd = () => {
      setIsFrameDragging(false);
      isFrameDraggingRef.current = false;
      const pending = pendingFrameOffsetRef.current;
      if (pending && (pending.x !== 0 || pending.y !== 0)) {
        onFrameMove?.(pending.x, pending.y);
      }
      onFrameMoveEnd?.();
      applyFrameDragVisual(0, 0);
      pendingFrameOffsetRef.current = null;
      pendingFrameVisualOffsetRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      // Dispatch drag end event for parent components
      frameWrapperRef.current?.dispatchEvent(new CustomEvent('appframes:framedragend', { bubbles: true }));
      if (gestureTokenRef.current) {
        end(gestureTokenRef.current);
        gestureTokenRef.current = null;
      }
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    if (moveModifierPressedRef.current) {
      if (isInteractiveTarget(e.target)) return;
      if (!(onFramePositionChange || onFrameMove)) return;
      e.preventDefault();
      e.stopPropagation();
      onClick?.();
      if (gestureOwnerKey && !gestureTokenRef.current) {
        gestureTokenRef.current = begin(gestureOwnerKey, 'frame-move');
      }
      handleFrameDragStart(e);
      return;
    }

    if (displayImage && onPanChange && screenRef.current) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      isPanningRef.current = true;
      setIsHovered(false);
      if (gestureOwnerKey && !gestureTokenRef.current) {
        gestureTokenRef.current = begin(gestureOwnerKey, 'image-pan');
      }

      const startX = e.clientX;
      const startY = e.clientY;
      const startPanX = panX;
      const startPanY = panY;
      const rect = screenRef.current.getBoundingClientRect();

      const handleMove = (moveEvent: MouseEvent) => {
        const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
        const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;
        const newPanX = Math.max(0, Math.min(100, startPanX + deltaX));
        const newPanY = Math.max(0, Math.min(100, startPanY + deltaY));
        pendingPanRef.current = { x: newPanX, y: newPanY };
        schedulePanVisual();
      };

      const handleEnd = () => {
        setIsDragging(false);
        isPanningRef.current = false;
        const pending = pendingPanRef.current;
        if (pending) {
          onPanChange(pending.x, pending.y);
        }
        pendingPanRef.current = null;
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        if (gestureTokenRef.current) {
          end(gestureTokenRef.current);
          gestureTokenRef.current = null;
        }
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      onClick?.();
      return;
    }

    if (onFramePositionChange || onFrameMove) {
      if (isInteractiveTarget(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      onClick?.();
      if (gestureOwnerKey && !gestureTokenRef.current) {
        gestureTokenRef.current = begin(gestureOwnerKey, 'frame-move');
      }
      handleFrameDragStart(e);
      return;
    }

    onClick?.();
  };

  const showGuides = !isLocked || (gestureOwnerKey && isOwnerActive(gestureOwnerKey));

  // Render screen content (image layer)
  const renderScreenContent = () => (
    <Box
      ref={screenRef}
      style={{
        position: 'absolute',
        inset: 0,
        cursor: displayImage && onPanChange ? (isDragging ? 'grabbing' : 'grab') : 'default',
        overflow: 'hidden',
        borderRadius: 'inherit',
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => !isDragging && !isFrameDragging && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image layer */}
      {displayImage && (
        <Box
          ref={imageLayerRef}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${displayImage})`,
            backgroundSize: 'cover',
            backgroundPosition: `${panX}% ${panY}%`,
            backgroundRepeat: 'no-repeat',
            transform: imageRotation !== 0 ? `rotate(${imageRotation}deg)` : undefined,
            transformOrigin: 'center center',
            scale: [90, 270].includes(imageRotation % 360) ? 1.42 : 1,
          }}
        />
      )}

      {/* Highlight overlay for drag-drop targeting */}
      {effectiveHighlighted && !effectiveSelected && (
        <Box
          data-export-hide="true"
          style={{
            position: 'absolute',
            inset: 0,
            border: '2px dashed #667eea',
            borderRadius: 'inherit',
            pointerEvents: 'none',
            zIndex: 15,
          }}
        />
      )}
    </Box>
  );

  // Get the appropriate renderer
  const getRenderer = () => {
    const commonProps = {
      options: options as any,
      scale,
      frameColor: effectiveFrameColor,
      children: renderScreenContent(),
    };

    switch (deviceType) {
      case 'phone':
        return <PhoneRenderer {...commonProps} options={options as any} />;
      case 'tablet':
        return <TabletRenderer {...commonProps} options={options as any} />;
      case 'flip':
        return <FlipRenderer {...commonProps} options={options as any} />;
      case 'foldable':
        return <FoldableRenderer {...commonProps} options={options as any} />;
      case 'laptop':
        return <LaptopRenderer {...commonProps} options={options as any} />;
      case 'desktop':
        return <DesktopRenderer {...commonProps} options={options as any} />;
      default:
        return <PhoneRenderer {...commonProps} options={options as any} />;
    }
  };

  return (
    <Box
      ref={frameWrapperRef}
      data-frame-drop-zone="true"
      data-frame-index={frameIndex}
      style={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.();
      }}
      onDragLeave={onDragLeave}
    >
      {getRenderer()}
    </Box>
  );
}

export default DeviceFrame;
