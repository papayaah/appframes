'use client';

import { useCallback, useRef, useState } from 'react';
import { Box, Text, Group, Tooltip, ActionIcon } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';

interface ScaleControlProps {
  scale: number; // percentage value
  min?: number;
  max?: number;
  defaultValue?: number;
  label?: string;
  onScaleChange: (scale: number) => void;
  onReset?: () => void;
}

const SIZE = 100;
const TRACK_RADIUS = 40;
const KNOB_SIZE = 14;
const START_ANGLE = 135; // degrees, starting from right (0)
const END_ANGLE = 405; // degrees (135 + 270 = full arc)
const ARC_SPAN = END_ANGLE - START_ANGLE; // 270 degrees

export function ScaleControl({
  scale,
  min = 20,
  max = 200,
  defaultValue = 100,
  label = 'Scale',
  onScaleChange,
  onReset,
}: ScaleControlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const hasChanges = Math.round(scale) !== defaultValue;

  // Convert scale value to angle on the arc
  const getAngleFromScale = (value: number) => {
    const normalized = (value - min) / (max - min);
    return START_ANGLE + normalized * ARC_SPAN;
  };

  // Convert angle to scale value
  const getScaleFromAngle = (angle: number) => {
    // Normalize angle to our arc range
    let normalizedAngle = angle;
    if (normalizedAngle < START_ANGLE) normalizedAngle += 360;

    const normalized = (normalizedAngle - START_ANGLE) / ARC_SPAN;
    const clamped = Math.max(0, Math.min(1, normalized));
    return Math.round(min + clamped * (max - min));
  };

  // Get knob position from angle
  const getKnobPosition = (angle: number) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: Math.cos(radians) * TRACK_RADIUS + SIZE / 2,
      y: Math.sin(radians) * TRACK_RADIUS + SIZE / 2,
    };
  };

  // Get angle from mouse position
  const getAngleFromPosition = (clientX: number, clientY: number) => {
    if (!containerRef.current) return getAngleFromScale(scale);
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + SIZE / 2;
    const centerY = rect.top + SIZE / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    return angle;
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const angle = getAngleFromPosition(e.clientX, e.clientY);
    const newScale = getScaleFromAngle(angle);
    onScaleChange(newScale);
  }, [onScaleChange, min, max]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const angle = getAngleFromPosition(e.clientX, e.clientY);
    const newScale = getScaleFromAngle(angle);
    onScaleChange(newScale);
  }, [isDragging, onScaleChange, min, max]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const currentAngle = getAngleFromScale(scale);
  const knobPos = getKnobPosition(currentAngle);

  // Calculate the visual scale for the device icon (normalized to reasonable visual range)
  const visualScale = 0.5 + ((scale - min) / (max - min)) * 0.8;

  // SVG arc path for the track
  const startPos = getKnobPosition(START_ANGLE);
  const endPos = getKnobPosition(END_ANGLE);
  const activePos = getKnobPosition(currentAngle);

  // Create arc path
  const createArcPath = (startAngle: number, endAngle: number) => {
    const start = getKnobPosition(startAngle);
    const end = getKnobPosition(endAngle);
    const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${TRACK_RADIUS} ${TRACK_RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  return (
    <Box>
      <Text size="xs" c="dimmed" mb={4} tt="uppercase" ta="center">
        {label}
      </Text>
      <Group justify={onReset ? "space-between" : "center"} align="flex-start">
        <Box>

          {/* Radial slider container */}
          <Box
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              width: SIZE,
              height: SIZE,
              position: 'relative',
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none',
            }}
          >
            {/* SVG for arc track */}
            <svg
              width={SIZE}
              height={SIZE}
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            >
              {/* Background track */}
              <path
                d={createArcPath(START_ANGLE, END_ANGLE)}
                fill="none"
                stroke="#e9ecef"
                strokeWidth="6"
                strokeLinecap="round"
              />
              {/* Active track (filled portion) */}
              <path
                d={createArcPath(START_ANGLE, currentAngle)}
                fill="none"
                stroke="#228be6"
                strokeWidth="6"
                strokeLinecap="round"
                style={{
                  transition: isDragging ? 'none' : 'd 0.1s ease-out',
                }}
              />
            </svg>

            {/* Center device icon that scales */}
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${visualScale})`,
                width: 28,
                height: 44,
                backgroundColor: '#228be6',
                borderRadius: 4,
                opacity: 0.25,
                border: '2px solid #228be6',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                pointerEvents: 'none',
              }}
            />

            {/* Knob */}
            <Box
              style={{
                position: 'absolute',
                left: knobPos.x - KNOB_SIZE / 2,
                top: knobPos.y - KNOB_SIZE / 2,
                width: KNOB_SIZE,
                height: KNOB_SIZE,
                borderRadius: '50%',
                backgroundColor: '#228be6',
                boxShadow: '0 2px 6px rgba(34, 139, 230, 0.4)',
                cursor: isDragging ? 'grabbing' : 'grab',
                transition: isDragging ? 'none' : 'all 0.1s ease-out',
              }}
            />
          </Box>

          {/* Value display */}
          <Text size="xs" c="dimmed" ta="center" mt={4}>
            {Math.round(scale)}%
          </Text>
        </Box>

        {/* Reset Button */}
        {onReset && (
          <Tooltip label={`Reset to ${defaultValue}%`} position="top">
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
