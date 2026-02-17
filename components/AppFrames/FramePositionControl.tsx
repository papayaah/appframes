'use client';

import { useCallback, useRef, useState } from 'react';
import { Box, Text, Group, Tooltip, ActionIcon } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';

interface FramePositionControlProps {
  frameX: number; // pixels, 0 = centered
  frameY: number; // pixels, 0 = centered
  onPositionChange: (frameX: number, frameY: number, persistent?: boolean) => void;
  onReset?: () => void;
}

const PAD_SIZE = 100;
const INDICATOR_SIZE = 14;
const MAX_OFFSET = 2000; // pixels - range will be -2000 to +2000

export function FramePositionControl({
  frameX,
  frameY,
  onPositionChange,
  onReset,
}: FramePositionControlProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localDragPos, setLocalDragPos] = useState<{ x: number; y: number; frameX: number; frameY: number } | null>(null);
  const padRectRef = useRef<DOMRect | null>(null);

  const hasChanges = Math.round(frameX) !== 0 || Math.round(frameY) !== 0;

  // Convert frame position (pixels) to indicator position on pad
  // frameX/frameY of 0 = center of pad
  const getIndicatorPosition = () => {
    // While dragging, use the local position for visual smoothness
    if (localDragPos) return { x: localDragPos.x, y: localDragPos.y };

    const clampedX = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, frameX));
    const clampedY = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, frameY));
    const x = ((clampedX + MAX_OFFSET) / (MAX_OFFSET * 2)) * PAD_SIZE;
    const y = ((clampedY + MAX_OFFSET) / (MAX_OFFSET * 2)) * PAD_SIZE;
    return { x, y };
  };

  // Convert mouse position to frame position (pixels)
  const getPositionFromMouse = (clientX: number, clientY: number, rect: DOMRect) => {
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    // Clamp to pad bounds
    const clampedX = Math.max(0, Math.min(PAD_SIZE, relX));
    const clampedY = Math.max(0, Math.min(PAD_SIZE, relY));

    // Convert to frame position (pixels, -MAX_OFFSET to +MAX_OFFSET, fractional for smoothness)
    const newFrameX = (clampedX / PAD_SIZE) * MAX_OFFSET * 2 - MAX_OFFSET;
    const newFrameY = (clampedY / PAD_SIZE) * MAX_OFFSET * 2 - MAX_OFFSET;

    return { frameX: newFrameX, frameY: newFrameY, padX: clampedX, padY: clampedY };
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only left click
    if (!padRef.current) return;

    e.preventDefault();
    setIsDragging(true);
    const rect = padRef.current.getBoundingClientRect();
    padRectRef.current = rect;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const { frameX: newX, frameY: newY, padX, padY } = getPositionFromMouse(e.clientX, e.clientY, rect);
    setLocalDragPos({ x: padX, y: padY, frameX: newX, frameY: newY });
    onPositionChange(newX, newY, false);
  }, [onPositionChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !padRectRef.current) return;
    const { frameX: newX, frameY: newY, padX, padY } = getPositionFromMouse(e.clientX, e.clientY, padRectRef.current);
    setLocalDragPos({ x: padX, y: padY, frameX: newX, frameY: newY });
    onPositionChange(newX, newY, false);
  }, [isDragging, onPositionChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isDragging && padRectRef.current) {
      const { frameX: newX, frameY: newY } = getPositionFromMouse(e.clientX, e.clientY, padRectRef.current);
      onPositionChange(newX, newY, true);
    }
    setIsDragging(false);
    setLocalDragPos(null);
    padRectRef.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, [isDragging, onPositionChange]);

  const indicatorPos = getIndicatorPosition();
  const displayFrameX = localDragPos ? localDragPos.frameX : frameX;
  const displayFrameY = localDragPos ? localDragPos.frameY : frameY;

  return (
    <Box>
      <Group justify="space-between" align="flex-start">
        <Box>
          <Text size="xs" c="dimmed" mb={4} tt="uppercase" ta="center">
            Frame Position
          </Text>

          {/* Trackpad container */}
          <Box
            ref={padRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              width: PAD_SIZE,
              height: PAD_SIZE,
              borderRadius: 8,
              border: '2px solid #e9ecef',
              backgroundColor: '#f8f9fa',
              position: 'relative',
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none',
              overflow: 'hidden',
            }}
          >
            {/* Canvas outline (static rectangle) */}
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 70,
                height: 70,
                border: '1px dashed #adb5bd',
                borderRadius: 4,
                backgroundColor: 'transparent',
                pointerEvents: 'none',
              }}
            />

            {/* Frame representation (moves based on position) */}
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${(displayFrameX / MAX_OFFSET) * 25}px), calc(-50% + ${(displayFrameY / MAX_OFFSET) * 25}px))`,
                width: 24,
                height: 36,
                backgroundColor: '#228be6',
                borderRadius: 3,
                opacity: 0.3,
                border: '2px solid #228be6',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                pointerEvents: 'none',
              }}
            />

            {/* Grid lines */}
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: '#dee2e6',
                pointerEvents: 'none',
              }}
            />
            <Box
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: 1,
                backgroundColor: '#dee2e6',
                pointerEvents: 'none',
              }}
            />

            {/* Position indicator (draggable dot) */}
            <Box
              style={{
                position: 'absolute',
                left: indicatorPos.x - INDICATOR_SIZE / 2,
                top: indicatorPos.y - INDICATOR_SIZE / 2,
                width: INDICATOR_SIZE,
                height: INDICATOR_SIZE,
                borderRadius: '50%',
                backgroundColor: '#228be6',
                boxShadow: '0 2px 6px rgba(34, 139, 230, 0.4)',
                cursor: isDragging ? 'grabbing' : 'grab',
                transition: isDragging ? 'none' : 'all 0.1s ease-out',
              }}
            />
          </Box>

          {/* Value display - fixed height and width to prevent wiggling */}
          <Box style={{ height: 20, marginTop: 4 }}>
            <Group gap={4} justify="center" wrap="nowrap">
              <Text size="xs" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums', width: 65, textAlign: 'right' }}>
                X: {Math.round(displayFrameX)}
              </Text>
              <Text size="xs" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums', width: 65, textAlign: 'left' }}>
                Y: {Math.round(displayFrameY)}
              </Text>
            </Group>
          </Box>
        </Box>

        {/* Reset Button */}
        {onReset && (
          <Tooltip label="Center frame" position="top">
            <ActionIcon
              variant="light"
              color="gray"
              size="sm"
              onClick={onReset}
              disabled={!hasChanges}
              style={{ marginTop: 20 }}
            >
              <IconRefresh size={14} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    </Box>
  );
}
