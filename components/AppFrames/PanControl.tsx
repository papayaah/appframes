'use client';

import { useCallback, useRef, useState } from 'react';
import { Box, Text, Group, Tooltip, ActionIcon } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';

interface PanControlProps {
  panX: number; // 0-100, 50 = centered
  panY: number; // 0-100, 50 = centered
  onPanChange: (panX: number, panY: number) => void;
  onReset?: () => void;
}

const PAD_SIZE = 100;
const INDICATOR_SIZE = 14;
const FRAME_WIDTH = 40;
const FRAME_HEIGHT = 60;

export function PanControl({
  panX,
  panY,
  onPanChange,
  onReset,
}: PanControlProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const hasChanges = Math.round(panX) !== 50 || Math.round(panY) !== 50;

  // Convert pan values (0-100) to indicator position on pad
  const getIndicatorPosition = () => {
    const x = (panX / 100) * PAD_SIZE;
    const y = (panY / 100) * PAD_SIZE;
    return { x, y };
  };

  // Convert mouse position to pan values
  const getPanFromPosition = (clientX: number, clientY: number) => {
    if (!padRef.current) return { panX, panY };
    const rect = padRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    // Clamp to pad bounds
    const clampedX = Math.max(0, Math.min(PAD_SIZE, relX));
    const clampedY = Math.max(0, Math.min(PAD_SIZE, relY));

    // Convert to pan values (0-100)
    const newPanX = Math.round((clampedX / PAD_SIZE) * 100);
    const newPanY = Math.round((clampedY / PAD_SIZE) * 100);

    return { panX: newPanX, panY: newPanY };
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const { panX: newPanX, panY: newPanY } = getPanFromPosition(e.clientX, e.clientY);
    onPanChange(newPanX, newPanY);
  }, [onPanChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const { panX: newPanX, panY: newPanY } = getPanFromPosition(e.clientX, e.clientY);
    onPanChange(newPanX, newPanY);
  }, [isDragging, onPanChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const indicatorPos = getIndicatorPosition();

  // Calculate the visual offset for the "image" representation
  // When panX=0, image is shifted right (showing left edge)
  // When panX=100, image is shifted left (showing right edge)
  // When panX=50, image is centered
  const imageOffsetX = (50 - panX) * 0.4; // Scale down for visual
  const imageOffsetY = (50 - panY) * 0.4;

  return (
    <Box>
      <Text size="xs" c="dimmed" mb={4} tt="uppercase" ta="center">
        Pan
      </Text>
      <Group justify={onReset ? "space-between" : "center"} align="flex-start">
        <Box>

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
            {/* Device frame outline (static) */}
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: FRAME_WIDTH,
                height: FRAME_HEIGHT,
                border: '2px solid #adb5bd',
                borderRadius: 4,
                backgroundColor: 'transparent',
                pointerEvents: 'none',
              }}
            />

            {/* Image representation (moves based on pan) */}
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${imageOffsetX}px), calc(-50% + ${imageOffsetY}px))`,
                width: FRAME_WIDTH + 20,
                height: FRAME_HEIGHT + 20,
                backgroundColor: '#228be6',
                borderRadius: 2,
                opacity: 0.25,
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
              X: {Math.round(panX)}
            </Text>
            <Text size="xs" c="dimmed">
              Y: {Math.round(panY)}
            </Text>
          </Group>
        </Box>

        {/* Reset Button */}
        {onReset && (
          <Tooltip label="Center image" position="top">
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
