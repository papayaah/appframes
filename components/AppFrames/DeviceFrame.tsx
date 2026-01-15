'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Box, Text, ActionIcon, Popover } from '@mantine/core';
import { IconUpload, IconPhoto, IconGripVertical } from '@tabler/icons-react';
import { useMediaImage } from '../../hooks/useMediaImage';
import { QuickMediaPicker } from './QuickMediaPicker';
import { useInteractionLock } from './InteractionLockContext';

interface DeviceFrameProps {
  deviceType?: string;
  image?: string;
  mediaId?: number;
  scale: number;
  // Scale applied by the outer canvas (e.g. zoom). Used to normalize drag deltas.
  viewportScale?: number;
  /** Rotation around Z (degrees) applied by the parent wrapper. Used to keep drag direction intuitive when rotated. */
  dragRotateZ?: number;
  /** Total scale applied by the parent wrapper. Used to keep drag distance 1:1 when scaled. */
  dragScale?: number;
  /** Unique key for global interaction locking (prevents other indicators while manipulating). */
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
  frameY?: number; // The frame's Y position percentage (0-100)
}

const isInteractiveTarget = (target: EventTarget | null): boolean => {
  if (!target || !(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return !!target.closest('button, [role="button"], a, input, textarea, select, [data-no-frame-drag="true"]');
};

interface DeviceConfig {
  width: number;
  height: number;
  radius: number;
  frameColor: string;
  screenRadius: number;
  type: 'notch' | 'punch-hole' | 'tablet' | 'laptop' | 'monitor' | 'home-button' | 'dynamic-island';
  notchWidth?: number;
  bezelWidth?: number;
}

const getDeviceConfig = (deviceId: string = 'iphone-14-pro'): DeviceConfig => {
  // iPhone 14 Pro (Dynamic Island)
  if (deviceId === 'iphone-14-pro') {
    return {
      width: 280,
      height: 575,
      radius: 45,
      frameColor: '#2a2a2a',
      screenRadius: 40,
      type: 'dynamic-island',
      bezelWidth: 10,
    };
  }

  // Phones - Apple
  if (deviceId.includes('iphone-14') || deviceId.includes('iphone-13')) {
    return {
      width: 280,
      height: 570,
      radius: 40,
      frameColor: '#2a2a2a',
      screenRadius: 32,
      type: 'notch',
      notchWidth: 100,
      bezelWidth: 12,
    };
  }
  if (deviceId === 'iphone-se') {
    return {
      width: 280,
      height: 500,
      radius: 36,
      frameColor: '#1a1a1a',
      screenRadius: 2,
      type: 'home-button',
      bezelWidth: 15, // Thicker top/bottom bezel simulated in render
    };
  }

  // Phones - Android
  if (deviceId.includes('pixel') || deviceId.includes('samsung') || deviceId.includes('galaxy')) {
    return {
      width: 270,
      height: 580,
      radius: 32,
      frameColor: '#1a1a1a',
      screenRadius: 28,
      type: 'punch-hole',
      bezelWidth: 10,
    };
  }

  // Tablets
  if (deviceId.includes('ipad') || deviceId.includes('tablet') || deviceId.includes('tab-s9')) {
    return {
      width: 440,
      height: 580,
      radius: 24,
      frameColor: '#2a2a2a',
      screenRadius: 16,
      type: 'tablet',
      bezelWidth: 16,
    };
  }

  // Laptops
  if (deviceId.includes('macbook') || deviceId.includes('laptop') || deviceId.includes('surface')) {
    return {
      width: 600,
      height: 380, // Screen height (excluding base)
      radius: 16,
      frameColor: '#2a2a2a',
      screenRadius: 8,
      type: 'laptop',
      bezelWidth: 12,
    };
  }

  // Monitors
  if (deviceId.includes('imac') || deviceId.includes('display')) {
    return {
      width: 640,
      height: 360,
      radius: 12,
      frameColor: deviceId.includes('imac') ? '#e0e0e0' : '#1a1a1a',
      screenRadius: 8,
      type: 'monitor',
      bezelWidth: 16,
    };
  }

  // Default fallback
  return {
    width: 280,
    height: 570,
    radius: 40,
    frameColor: '#2a2a2a',
    screenRadius: 32,
    type: 'notch',
    notchWidth: 100,
    bezelWidth: 12,
  };
};

export function DeviceFrame({
  deviceType,
  image,
  mediaId,
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
  frameY = 50
}: DeviceFrameProps) {
  const isExporting =
    typeof document !== 'undefined' && document.body?.dataset?.appframesExporting === 'true';
  const effectiveSelected = isExporting ? false : isSelected;
  const effectiveHighlighted = isExporting ? false : isHighlighted;
  const { isLocked, isOwnerActive, begin, end } = useInteractionLock();
  const { imageUrl } = useMediaImage(mediaId);
  const displayImage = imageUrl || image;
  const [isDragging, setIsDragging] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFrameDragging, setIsFrameDragging] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);
  const imageLayerRef = useRef<HTMLDivElement>(null);
  const panRafRef = useRef<number | null>(null);
  const pendingPanRef = useRef<{ x: number; y: number } | null>(null);
  const isPanningRef = useRef(false);

  // Local frame-drag visual transform (avoid rerendering whole canvas during drag)
  const frameWrapperRef = useRef<HTMLDivElement>(null);
  const frameDragRafRef = useRef<number | null>(null);
  // Commit delta (screen-space px) and visual delta (local-space px inside rotated/scaled wrapper)
  const pendingFrameOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const pendingFrameVisualOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const isFrameDraggingRef = useRef(false);
  const moveModifierPressedRef = useRef(false);
  const gestureTokenRef = useRef<string | null>(null);

  const config = getDeviceConfig(deviceType);

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

  // Keep visual pan in sync when props change (but don't fight the user mid-drag)
  useEffect(() => {
    if (isPanningRef.current) return;
    if (!displayImage) return;
    applyPanVisual(panX, panY);
  }, [panX, panY, displayImage, applyPanVisual]);

  // Cleanup any pending RAFs on unmount
  useEffect(() => {
    return () => {
      if (panRafRef.current != null) cancelAnimationFrame(panRafRef.current);
      if (frameDragRafRef.current != null) cancelAnimationFrame(frameDragRafRef.current);
    };
  }, []);

  // Hold Space to drag the whole frame (even when starting on the screen).
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

  const handleMouseDown = (e: React.MouseEvent) => {
    // Space = always move frame (like a “hand tool”).
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

    // If we have an image and pan handler, handle panning
    if (displayImage && onPanChange && screenRef.current) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      isPanningRef.current = true;
      setIsHovered(false); // Hide icons immediately when drag starts
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

        // Update visuals locally to avoid rerendering parents during drag
        pendingPanRef.current = { x: newPanX, y: newPanY };
        schedulePanVisual();
      };

      const handleEnd = () => {
        setIsDragging(false);
        isPanningRef.current = false;

        // Commit final pan to React state once (reduces flicker)
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
      // Also trigger selection
      onClick?.();
      return;
    }

    // No pan available -> dragging the screen should move the frame (easier UX).
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

    // Fallback selection
    onClick?.();
  };

  // Frame drag handle handlers
  const handleFrameDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onFramePositionChange || onFrameMove) {
      // Notify parent wrapper (CompositionRenderer) to hide resize/rotate handles during frame drag.
      // This avoids “ghost” handles while the DOM is being moved imperatively.
      frameWrapperRef.current?.dispatchEvent(new CustomEvent('appframes:framedragstart', { bubbles: true }));

      if (gestureOwnerKey && !gestureTokenRef.current) {
        gestureTokenRef.current = begin(gestureOwnerKey, 'frame-move');
      }

      setIsFrameDragging(true);
      isFrameDraggingRef.current = true;
      setIsHovered(false); // Hide icons immediately when drag starts
      const startX = e.clientX;
      const startY = e.clientY;
      let totalDeltaX = 0;
      let totalDeltaY = 0;

      const handleMove = (moveEvent: MouseEvent) => {
        // Normalize by viewportScale so drag feels 1:1 regardless of zoom
        totalDeltaX = (moveEvent.clientX - startX) / viewportScale;
        totalDeltaY = (moveEvent.clientY - startY) / viewportScale;
        // Commit delta in screen-space
        pendingFrameOffsetRef.current = { x: totalDeltaX, y: totalDeltaY };

        // Visual delta is applied inside a rotated/scaled wrapper, so compensate to keep cursor motion intuitive.
        const scaleFactor = typeof dragScale === 'number' && isFinite(dragScale) && dragScale !== 0 ? dragScale : 1;
        const theta = (typeof dragRotateZ === 'number' && isFinite(dragRotateZ) ? dragRotateZ : 0) * (Math.PI / 180);
        const dx = totalDeltaX / scaleFactor;
        const dy = totalDeltaY / scaleFactor;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        // local = R^-1 * screen, where R is rotate(theta)
        const localX = dx * cos + dy * sin;
        const localY = -dx * sin + dy * cos;
        pendingFrameVisualOffsetRef.current = { x: localX, y: localY };
        scheduleFrameDragVisual();
      };

      const handleEnd = () => {
        setIsFrameDragging(false);
        isFrameDraggingRef.current = false;

        // Commit final delta once to React state, then reset local transform
        const pending = pendingFrameOffsetRef.current;
        if (pending) {
          if (onFrameMove) {
            onFrameMove(pending.x, pending.y);
          } else if (onFramePositionChange) {
            onFramePositionChange(pending.x, pending.y);
          }
        }
        pendingFrameOffsetRef.current = null;
        pendingFrameVisualOffsetRef.current = null;
        applyFrameDragVisual(0, 0);

        if (onFrameMoveEnd) {
          onFrameMoveEnd();
        }

        frameWrapperRef.current?.dispatchEvent(new CustomEvent('appframes:framedragend', { bubbles: true }));

        if (gestureTokenRef.current) {
          end(gestureTokenRef.current);
          gestureTokenRef.current = null;
        }

        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
    }
  };

  const width = config.width * scale;
  const height = config.height * scale;
  const padding = (config.bezelWidth || 12) * scale;

  // Adjust padding for Home Button devices (top/bottom larger)
  const topPadding = config.type === 'home-button' ? 60 * scale : padding;
  const bottomPadding = config.type === 'home-button' ? 60 * scale : padding;
  const sidePadding = padding;

  // Adjust padding for iMac (chin)
  const imacChin = config.type === 'monitor' && deviceType?.includes('imac') ? 40 * scale : 0;

  const renderDecorations = () => {
    switch (config.type) {
      case 'notch':
        return (
          <Box
            style={{
              position: 'absolute',
              top: padding,
              left: '50%',
              transform: 'translateX(-50%)',
              width: (config.notchWidth || 100) * scale,
              height: 25 * scale,
              background: config.frameColor,
              borderBottomLeftRadius: 16 * scale,
              borderBottomRightRadius: 16 * scale,
              zIndex: 10,
            }}
          />
        );
      case 'dynamic-island':
        return (
          <Box
            style={{
              position: 'absolute',
              top: padding + 10 * scale,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 80 * scale,
              height: 24 * scale,
              background: '#000',
              borderRadius: 12 * scale,
              zIndex: 10,
            }}
          />
        );
      case 'punch-hole':
        return (
          <Box
            style={{
              position: 'absolute',
              top: padding + 8 * scale,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 12 * scale,
              height: 12 * scale,
              borderRadius: '50%',
              background: '#000',
              zIndex: 10,
            }}
          />
        );
      case 'home-button':
        return (
          <Box
            style={{
              position: 'absolute',
              bottom: 10 * scale,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 40 * scale,
              height: 40 * scale,
              borderRadius: '50%',
              border: `${2 * scale}px solid #333`,
              zIndex: 10,
            }}
          />
        );
      case 'laptop':
        // Camera dot
        return (
          <Box
            style={{
              position: 'absolute',
              top: padding / 2,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 6 * scale,
              height: 6 * scale,
              borderRadius: '50%',
              background: '#444',
              zIndex: 10,
            }}
          />
        );
      case 'monitor':
        // Nothing special on screen, but maybe base?
        return null;
      default:
        return null;
    }
  };

  const renderBase = () => {
    if (config.type === 'laptop') {
      return (
        <Box
          style={{
            position: 'absolute',
            bottom: -20 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            width: width + 40 * scale,
            height: 20 * scale,
            background: '#3a3a3a',
            borderBottomLeftRadius: 10 * scale,
            borderBottomRightRadius: 10 * scale,
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
          }}
        >
          {/* Groove */}
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 80 * scale,
              height: 4 * scale,
              background: '#2a2a2a',
              borderBottomLeftRadius: 4 * scale,
              borderBottomRightRadius: 4 * scale,
            }}
          />
        </Box>
      );
    }
    if (config.type === 'monitor') {
      return (
        <Box
          style={{
            position: 'absolute',
            bottom: -40 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120 * scale,
            height: 60 * scale, // Stand height + base
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <Box
            style={{
              width: 40 * scale,
              height: '100%',
              background: '#d1d1d1',
            }}
          />
          <Box
            style={{
              position: 'absolute',
              bottom: 0,
              width: 140 * scale,
              height: 10 * scale,
              background: '#d1d1d1',
              borderRadius: 4 * scale,
            }}
          />
        </Box>
      )
    }
    return null;
  };

  return (
    <Box
      style={{ position: 'relative' }}
      onMouseEnter={() => {
        if (isLocked && gestureOwnerKey && !isOwnerActive(gestureOwnerKey)) return;
        if (!isDragging && !isFrameDragging) setIsHovered(true);
      }}
      onMouseLeave={() => !isDragging && !isFrameDragging && setIsHovered(false)}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDragOver?.();
      }}
      onDragLeave={(e) => {
        // Only trigger if actually leaving the frame (not entering a child)
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          onDragLeave?.();
        }
      }}
    >
      <Box
        ref={frameWrapperRef}
        style={{
          width,
          height: height + imacChin, // Add chin height if iMac
          borderRadius: config.radius * scale,
          background: `linear-gradient(145deg, ${config.frameColor}, ${config.frameColor})`,
          paddingTop: topPadding,
          paddingBottom: bottomPadding + imacChin,
          paddingLeft: sidePadding,
          paddingRight: sidePadding,
          boxShadow: effectiveHighlighted
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 3px rgba(102, 126, 234, 0.8), 0 0 20px rgba(102, 126, 234, 0.5)'
            : effectiveSelected
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 3px #667eea'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          transition: (isDragging || isFrameDragging) ? 'none' : 'box-shadow 0.2s ease',
          cursor: onClick ? 'pointer' : undefined,
          willChange: isFrameDragging ? 'transform' : undefined,
        }}
        onMouseDown={(e) => {
          // Dragging the bezel/background moves the frame (like dragging a text element).
          // If the user started inside the screen, let the screen handler decide (pan vs move),
          // unless Space is held (Space always moves frame).
          if (!moveModifierPressedRef.current && screenRef.current?.contains(e.target as Node)) return;
          if (isDragging || isFrameDragging) return;
          if (isInteractiveTarget(e.target)) return;
          if (!(onFramePositionChange || onFrameMove)) return;
          e.preventDefault();
          e.stopPropagation();
          onClick?.();
          handleFrameDragStart(e);
        }}
        onClick={onClick ? (e) => {
          e.stopPropagation();
          onClick();
        } : undefined}
      >
        {renderDecorations()}

        {/* Screen */}
        <Box
          ref={screenRef}
          style={{
            flex: 1,
            width: '100%',
            borderRadius: config.screenRadius * scale,
            backgroundColor: '#000',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.05) inset',
            cursor: displayImage && onPanChange ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
          }}
          onMouseDown={handleMouseDown}
        >
          {displayImage ? (
            <Box
              ref={imageLayerRef}
              style={{
                width: '100%',
                height: '100%',
                backgroundImage: `url(${displayImage})`,
                backgroundSize: `${screenScale}%`,
                backgroundPosition: `${panX}% ${panY}%`,
                backgroundRepeat: 'no-repeat',
                pointerEvents: 'none',
                willChange: isDragging ? 'background-position' : undefined,
              }}
            />
          ) : showInstructions ? (
            <Box
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 12 * scale,
                padding: 20 * scale,
              }}
            >
              <IconUpload size={32 * scale} color={isSelected ? "#667eea" : "#4a5568"} />
              <Text
                size="sm"
                c="dimmed"
                style={{
                  fontSize: 12 * scale,
                  textAlign: 'center',
                  lineHeight: 1.4,
                  color: isSelected ? "#667eea" : undefined
                }}
              >
                {isSelected ? "Selected" : "Drop screenshot"}
              </Text>
            </Box>
          ) : (
            <Box
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 8 * scale,
              }}
            >
              {/* Empty State Minimal */}
            </Box>
          )}
        </Box>

        {/* Buttons (only for phones/tablets) */}
        {['notch', 'punch-hole', 'tablet', 'home-button', 'dynamic-island'].includes(config.type) && (
          <>
            <Box
              style={{
                position: 'absolute',
                right: -2 * scale,
                top: '25%',
                width: 3 * scale,
                height: 50 * scale,
                backgroundColor: config.frameColor,
                borderRadius: `0 ${2 * scale}px ${2 * scale}px 0`,
                opacity: 0.8,
              }}
            />
            <Box
              style={{
                position: 'absolute',
                left: -2 * scale,
                top: '20%',
                width: 3 * scale,
                height: 30 * scale,
                backgroundColor: config.frameColor,
                borderRadius: `${2 * scale}px 0 0 ${2 * scale}px`,
                opacity: 0.8,
              }}
            />
          </>
        )}

        {/* Frame Drag Handle - hide during any drag operation */}
        {/* When frame is near the top (frameY < 20%), show handle at bottom instead */}
        {onFramePositionChange && !isExporting && (isHovered || isFrameDragging) && !isDragging && (
          <Box
            data-export-hide="true"
            onMouseDown={handleFrameDragStart}
            data-no-frame-drag="true"
            style={{
              position: 'absolute',
              ...(frameY < 20
                ? { bottom: bottomPadding + 8 * scale }
                : { top: topPadding + 8 * scale }),
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 20,
              cursor: isFrameDragging ? 'grabbing' : 'grab',
              padding: 4,
              borderRadius: 4,
              backgroundColor: 'rgba(102, 126, 234, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isFrameDragging ? 1 : 0.8,
              transition: 'opacity 0.15s',
            }}
          >
            <IconGripVertical size={14} color="white" />
          </Box>
        )}

        {/* Quick Media Picker Button - hide during any drag operation */}
        {(onMediaSelect || onPexelsSelect) && !isExporting && (isHovered || pickerOpen) && !isDragging && !isFrameDragging && (
          <Popover
            opened={pickerOpen}
            onChange={setPickerOpen}
            position="bottom"
            withArrow
            shadow="lg"
            withinPortal
          >
            <Popover.Target>
              <ActionIcon
                data-export-hide="true"
                size="md"
                variant="filled"
                color="violet"
                style={{
                  position: 'absolute',
                  bottom: bottomPadding + 8 * scale,
                  right: sidePadding + 8 * scale,
                  zIndex: 20,
                  opacity: pickerOpen ? 1 : 0.9,
                  transition: 'opacity 0.15s',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setPickerOpen(!pickerOpen);
                }}
              >
                <IconPhoto size={16} />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown p={0}>
              <QuickMediaPicker
                onSelectMedia={(id) => onMediaSelect?.(id)}
                onSelectPexels={(url) => onPexelsSelect?.(url)}
                onClose={() => setPickerOpen(false)}
              />
            </Popover.Dropdown>
          </Popover>
        )}

      </Box>
      {renderBase()}
    </Box>
  );
}
