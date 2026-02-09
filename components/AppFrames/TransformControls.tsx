'use client';

import { useCallback, useRef, useState } from 'react';
import { Box, Text, ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconMinus, IconPlus, IconRefresh } from '@tabler/icons-react';

interface TransformControlsProps {
  rotation: number;
  scale: number;
  onRotationChange: (rotation: number) => void;
  onScaleChange: (scale: number) => void;
  onReset?: () => void;
}

const DIAL_SIZE = 64;
const KNOB_SIZE = 12;

export function TransformControls({
  rotation,
  scale,
  onRotationChange,
  onScaleChange,
  onReset,
}: TransformControlsProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const hasChanges = rotation !== 0 || scale !== 100;

  // Convert angle to position on dial circumference
  const getKnobPosition = (angle: number) => {
    const radians = ((angle - 90) * Math.PI) / 180;
    const radius = (DIAL_SIZE - KNOB_SIZE) / 2;
    return {
      x: Math.cos(radians) * radius + DIAL_SIZE / 2 - KNOB_SIZE / 2,
      y: Math.sin(radians) * radius + DIAL_SIZE / 2 - KNOB_SIZE / 2,
    };
  };

  // Calculate angle from mouse position relative to dial center
  const getAngleFromPosition = (clientX: number, clientY: number) => {
    if (!dialRef.current) return rotation;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    // Normalize to -180 to 180
    if (angle > 180) angle -= 360;
    return Math.round(angle);
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const newAngle = getAngleFromPosition(e.clientX, e.clientY);
    onRotationChange(Math.max(-180, Math.min(180, newAngle)));
  }, [onRotationChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const newAngle = getAngleFromPosition(e.clientX, e.clientY);
    onRotationChange(Math.max(-180, Math.min(180, newAngle)));
  }, [isDragging, onRotationChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const knobPos = getKnobPosition(rotation);

  const handleScaleStep = (delta: number) => {
    const newScale = Math.max(20, Math.min(200, Math.round(scale) + delta));
    onScaleChange(newScale);
  };

  return (
    <Box>
      <Group justify="space-between" align="flex-start" gap="md">
        {/* Rotation Dial */}
        <Box>
          <Text size="xs" c="dimmed" mb={4} tt="uppercase" ta="center">
            Rotation
          </Text>
          <Box
            ref={dialRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              width: DIAL_SIZE,
              height: DIAL_SIZE,
              borderRadius: '50%',
              border: '2px solid #e9ecef',
              backgroundColor: '#f8f9fa',
              position: 'relative',
              cursor: 'grab',
              touchAction: 'none',
            }}
          >
            {/* Center dot */}
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: '#adb5bd',
              }}
            />
            {/* Tick marks */}
            {[0, 90, 180, 270].map((angle) => {
              const rad = ((angle - 90) * Math.PI) / 180;
              const innerR = DIAL_SIZE / 2 - 8;
              const outerR = DIAL_SIZE / 2 - 4;
              return (
                <Box
                  key={angle}
                  style={{
                    position: 'absolute',
                    left: Math.cos(rad) * innerR + DIAL_SIZE / 2,
                    top: Math.sin(rad) * innerR + DIAL_SIZE / 2,
                    width: outerR - innerR,
                    height: 2,
                    backgroundColor: '#dee2e6',
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: 'left center',
                  }}
                />
              );
            })}
            {/* Knob */}
            <Box
              style={{
                position: 'absolute',
                left: knobPos.x,
                top: knobPos.y,
                width: KNOB_SIZE,
                height: KNOB_SIZE,
                borderRadius: '50%',
                backgroundColor: '#228be6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
            />
          </Box>
          <Text size="xs" c="dimmed" ta="center" mt={4}>
            {Math.round(rotation)}°
          </Text>
        </Box>

        {/* Scale Control */}
        <Box style={{ flex: 1 }}>
          <Text size="xs" c="dimmed" mb={4} tt="uppercase" ta="center">
            Scale
          </Text>
          <Group gap={4} justify="center">
            <ActionIcon
              variant="light"
              size="sm"
              onClick={() => handleScaleStep(-10)}
              disabled={scale <= 20}
            >
              <IconMinus size={14} />
            </ActionIcon>
            <Box
              style={{
                width: 52,
                height: 28,
                borderRadius: 6,
                border: '1px solid #dee2e6',
                backgroundColor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text size="sm" fw={400}>
                {Math.round(scale)}%
              </Text>
            </Box>
            <ActionIcon
              variant="light"
              size="sm"
              onClick={() => handleScaleStep(10)}
              disabled={scale >= 200}
            >
              <IconPlus size={14} />
            </ActionIcon>
          </Group>
          {/* Quick scale buttons */}
          <Group gap={4} justify="center" mt={8}>
            {[50, 100, 150].map((s) => (
              <Box
                key={s}
                onClick={() => onScaleChange(s)}
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  backgroundColor: scale === s ? '#228be6' : '#e9ecef',
                  color: scale === s ? 'white' : '#495057',
                  fontSize: 10,
                  cursor: 'pointer',
                  fontWeight: scale === s ? 600 : 400,
                }}
              >
                {s}%
              </Box>
            ))}
          </Group>
        </Box>

        {/* Reset Button */}
        {onReset && (
          <Tooltip label="Reset" position="top">
            <ActionIcon
              variant="light"
              color="gray"
              size="sm"
              onClick={onReset}
              disabled={!hasChanges}
              style={{ alignSelf: 'center', marginTop: 16 }}
            >
              <IconRefresh size={14} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    </Box>
  );
}
