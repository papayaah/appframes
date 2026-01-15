'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box } from '@mantine/core';
import { useInteractionLock } from './InteractionLockContext';

export type ResizeHandle =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

interface ResizeHandlesProps {
  viewportScale: number;
  value: number; // frameScale percent
  onScalePreview: (next: number) => void;
  onScaleCommit: (next: number) => void;
  rotateZ: number;
  onRotatePreview?: (nextRotateZ: number) => void;
  onRotateCommit?: (nextRotateZ: number) => void;
  frameRef: React.RefObject<HTMLElement | null>;
  gestureOwnerKey: string;
  min?: number;
  max?: number;
}

const HANDLE_SIZE = 10;
const HANDLE_OFFSET = -6;
const SCALE_SENSITIVITY = 0.25; // percent per px (after viewportScale normalization)

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const getCursor = (handle: ResizeHandle): string => {
  switch (handle) {
    case 'top-left':
    case 'bottom-right':
      return 'nwse-resize';
    case 'top-right':
    case 'bottom-left':
      return 'nesw-resize';
    default:
      return 'pointer';
  }
};

const getHandleStyle = (handle: ResizeHandle): React.CSSProperties => {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: 999,
    background: 'white',
    border: '2px solid #667eea',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    zIndex: 50,
  };

  switch (handle) {
    case 'top-left':
      return { ...base, top: HANDLE_OFFSET, left: HANDLE_OFFSET };
    case 'top-right':
      return { ...base, top: HANDLE_OFFSET, right: HANDLE_OFFSET };
    case 'bottom-left':
      return { ...base, bottom: HANDLE_OFFSET, left: HANDLE_OFFSET };
    case 'bottom-right':
      return { ...base, bottom: HANDLE_OFFSET, right: HANDLE_OFFSET };
    default:
      return base;
  }
};

const computeCornerDelta = (handle: ResizeHandle, dx: number, dy: number): number => {
  // "Outward" drag should increase scale.
  const x = handle.includes('right') ? dx : -dx;
  const y = handle.includes('bottom') ? dy : -dy;
  const outward = (x + y) / 2;
  return Math.sign(outward) * Math.max(Math.abs(x), Math.abs(y));
};

export function ResizeHandles({
  viewportScale,
  value,
  onScalePreview,
  onScaleCommit,
  rotateZ,
  onRotatePreview,
  onRotateCommit,
  frameRef,
  gestureOwnerKey,
  min = 20,
  max = 200,
}: ResizeHandlesProps) {
  const { begin, end } = useInteractionLock();
  const [active, setActive] = useState<ResizeHandle | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const hideHandles = active !== null || isRotating;

  const start = useRef<{ x: number; y: number; value: number; handle: ResizeHandle } | null>(null);
  const rotateStart = useRef<{ angle: number; rotateZ: number } | null>(null);
  const lastScale = useRef<number>(value);
  const lastRotate = useRef<number>(rotateZ);
  const gestureTokenRef = useRef<string | null>(null);

  const onMouseDown = useCallback(
    (handle: ResizeHandle) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!gestureTokenRef.current) {
        gestureTokenRef.current = begin(gestureOwnerKey, 'frame-scale');
      }
      start.current = { x: e.clientX, y: e.clientY, value, handle };
      setActive(handle);
    },
    [begin, gestureOwnerKey, value]
  );

  const onRotateMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!onRotatePreview || !onRotateCommit) return;
      e.preventDefault();
      e.stopPropagation();
      if (!gestureTokenRef.current) {
        gestureTokenRef.current = begin(gestureOwnerKey, 'frame-rotate');
      }
      const el = frameRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
      rotateStart.current = { angle, rotateZ };
      lastRotate.current = rotateZ;
      setIsRotating(true);
    },
    [begin, frameRef, gestureOwnerKey, onRotateCommit, onRotatePreview, rotateZ]
  );

  useEffect(() => {
    if ((!active || !start.current) && !isRotating) return;

    const handleMove = (e: MouseEvent) => {
      if (isRotating && onRotatePreview) {
        const rs = rotateStart.current;
        const el = frameRef.current;
        if (!rs || !el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
        const delta = angle - rs.angle;
        const next = rs.rotateZ + delta;
        lastRotate.current = next;
        onRotatePreview(next);
        return;
      }

      const s = start.current;
      if (!s) return;
      const dx = (e.clientX - s.x) / (viewportScale || 1);
      const dy = (e.clientY - s.y) / (viewportScale || 1);
      const delta = computeCornerDelta(s.handle, dx, dy);
      const next = clamp(s.value + delta * SCALE_SENSITIVITY, min, max);
      lastScale.current = next;
      onScalePreview(next);
    };

    const handleUp = () => {
      if (active) {
        onScaleCommit(lastScale.current);
      }
      if (isRotating && onRotateCommit) {
        onRotateCommit(lastRotate.current);
      }
      if (gestureTokenRef.current) {
        end(gestureTokenRef.current);
        gestureTokenRef.current = null;
      }
      start.current = null;
      setActive(null);
      rotateStart.current = null;
      setIsRotating(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [
    active,
    frameRef,
    isRotating,
    max,
    min,
    onRotateCommit,
    onRotatePreview,
    onScaleCommit,
    onScalePreview,
    viewportScale,
  ]);

  const handles: ResizeHandle[] = [
    'top-left',
    'top-right',
    'bottom-right',
    'bottom-left',
  ];

  return (
    <Box
      data-export-hide="true"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 49 }}
    >
      {onRotatePreview && onRotateCommit && (
        <>
          <Box
            style={{
              position: 'absolute',
              top: -26,
              left: '50%',
              width: 2,
              height: 18,
              transform: 'translateX(-50%)',
              background: '#667eea',
              opacity: 0.9,
              visibility: hideHandles ? 'hidden' : 'visible',
              pointerEvents: 'none',
            }}
          />
          <Box
            onMouseDown={onRotateMouseDown}
            style={{
              position: 'absolute',
              top: -36,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 12,
              height: 12,
              borderRadius: 999,
              background: isRotating ? '#667eea' : 'white',
              border: '2px solid #667eea',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              cursor: 'grab',
              pointerEvents: 'auto',
              zIndex: 51,
              visibility: hideHandles ? 'hidden' : 'visible',
            }}
          />
        </>
      )}
      {handles.map((h) => (
        <Box
          key={h}
          onMouseDown={onMouseDown(h)}
          style={{
            ...getHandleStyle(h),
            cursor: getCursor(h),
            pointerEvents: 'auto',
            background: active === h ? '#667eea' : 'white',
            borderColor: '#667eea',
            visibility: hideHandles ? 'hidden' : 'visible',
          }}
        />
      ))}
    </Box>
  );
}


