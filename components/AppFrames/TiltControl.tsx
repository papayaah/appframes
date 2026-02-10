'use client';

import { useCallback, useRef, useState } from 'react';
import { Box, Text, Group, Tooltip, ActionIcon } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';

interface TiltControlProps {
  tiltX: number;
  tiltY: number;
  onTiltChange: (tiltX: number, tiltY: number) => void;
  onReset?: () => void;
}

const PAD_SIZE = 100;
const INDICATOR_SIZE = 14;
const MAX_TILT = 60;

export function TiltControl({
  tiltX,
  tiltY,
  onTiltChange,
  onReset,
}: TiltControlProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const hasChanges = tiltX !== 0 || tiltY !== 0;

  // Convert tilt values (-60 to 60) to position on pad (0 to PAD_SIZE)
  const getIndicatorPosition = () => {
    const x = ((tiltY + MAX_TILT) / (MAX_TILT * 2)) * PAD_SIZE;
    const y = ((-tiltX + MAX_TILT) / (MAX_TILT * 2)) * PAD_SIZE;
    return { x, y };
  };

  // Convert mouse position to tilt values
  const getTiltFromPosition = (clientX: number, clientY: number) => {
    if (!padRef.current) return { tiltX, tiltY };
    const rect = padRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    // Clamp to pad bounds
    const clampedX = Math.max(0, Math.min(PAD_SIZE, relX));
    const clampedY = Math.max(0, Math.min(PAD_SIZE, relY));

    // Convert to tilt values
    // X position -> tiltY (left = negative, right = positive)
    // Y position -> tiltX (top = positive, bottom = negative)
    const newTiltY = Math.round((clampedX / PAD_SIZE) * MAX_TILT * 2 - MAX_TILT);
    const newTiltX = Math.round(MAX_TILT - (clampedY / PAD_SIZE) * MAX_TILT * 2);

    return { tiltX: newTiltX, tiltY: newTiltY };
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const { tiltX: newTiltX, tiltY: newTiltY } = getTiltFromPosition(e.clientX, e.clientY);
    onTiltChange(newTiltX, newTiltY);
  }, [onTiltChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const { tiltX: newTiltX, tiltY: newTiltY } = getTiltFromPosition(e.clientX, e.clientY);
    onTiltChange(newTiltX, newTiltY);
  }, [isDragging, onTiltChange]);

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
            3D Tilt
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
            {/* 3D tilted plane visualization */}
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 60,
                height: 40,
                transform: `translate(-50%, -50%) perspective(200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
                backgroundColor: '#228be6',
                borderRadius: 4,
                opacity: 0.3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
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
              }}
            />

            {/* Corner tick marks for orientation */}
            {[
              { x: 0, y: 0, label: 'Back-Left' },
              { x: PAD_SIZE, y: 0, label: 'Back-Right' },
              { x: 0, y: PAD_SIZE, label: 'Front-Left' },
              { x: PAD_SIZE, y: PAD_SIZE, label: 'Front-Right' },
            ].map(({ x, y }, i) => (
              <Box
                key={i}
                style={{
                  position: 'absolute',
                  left: x - 3,
                  top: y - 3,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#dee2e6',
                }}
              />
            ))}

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
              X: {Math.round(tiltX)}°
            </Text>
            <Text size="xs" c="dimmed">
              Y: {Math.round(tiltY)}°
            </Text>
          </Group>
        </Box>

        {/* Reset Button */}
        {onReset && (
          <Tooltip label="Reset tilt" position="top">
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
