'use client';

import { useCallback, useRef, useState } from 'react';
import { Box, Text, Group, Tooltip, ActionIcon } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';

interface FramePositionControlProps {
  frameX: number; // pixels, 0 = centered
  frameY: number; // pixels, 0 = centered
  onPositionChange: (frameX: number, frameY: number) => void;
  onReset?: () => void;
}

const PAD_SIZE = 100;
const INDICATOR_SIZE = 14;
const MAX_OFFSET = 200; // pixels - range will be -200 to +200

export function FramePositionControl({
  frameX,
  frameY,
  onPositionChange,
  onReset,
}: FramePositionControlProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const hasChanges = Math.round(frameX) !== 0 || Math.round(frameY) !== 0;

  // Convert frame position (pixels) to indicator position on pad
  // frameX/frameY of 0 = center of pad
  const getIndicatorPosition = () => {
    const clampedX = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, frameX));
    const clampedY = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, frameY));
    const x = ((clampedX + MAX_OFFSET) / (MAX_OFFSET * 2)) * PAD_SIZE;
    const y = ((clampedY + MAX_OFFSET) / (MAX_OFFSET * 2)) * PAD_SIZE;
    return { x, y };
  };

  // Convert mouse position to frame position (pixels)
  const getPositionFromMouse = (clientX: number, clientY: number) => {
    if (!padRef.current) return { frameX, frameY };
    const rect = padRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    // Clamp to pad bounds
    const clampedX = Math.max(0, Math.min(PAD_SIZE, relX));
    const clampedY = Math.max(0, Math.min(PAD_SIZE, relY));

    // Convert to frame position (pixels, -MAX_OFFSET to +MAX_OFFSET)
    const newFrameX = Math.round((clampedX / PAD_SIZE) * MAX_OFFSET * 2 - MAX_OFFSET);
    const newFrameY = Math.round((clampedY / PAD_SIZE) * MAX_OFFSET * 2 - MAX_OFFSET);

    return { frameX: newFrameX, frameY: newFrameY };
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const { frameX: newX, frameY: newY } = getPositionFromMouse(e.clientX, e.clientY);
    onPositionChange(newX, newY);
  }, [onPositionChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const { frameX: newX, frameY: newY } = getPositionFromMouse(e.clientX, e.clientY);
    onPositionChange(newX, newY);
  }, [isDragging, onPositionChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const indicatorPos = getIndicatorPosition();

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
                transform: `translate(calc(-50% + ${(frameX / MAX_OFFSET) * 25}px), calc(-50% + ${(frameY / MAX_OFFSET) * 25}px))`,
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

          {/* Value display */}
          <Group gap={8} justify="center" mt={4}>
            <Text size="xs" c="dimmed">
              X: {Math.round(frameX)}px
            </Text>
            <Text size="xs" c="dimmed">
              Y: {Math.round(frameY)}px
            </Text>
          </Group>
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
