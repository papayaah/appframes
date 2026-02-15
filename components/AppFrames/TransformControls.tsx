'use client';

import { useCallback, useRef, useState } from 'react';
import { Box, Text, Button, SimpleGrid } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { TiltControl } from './TiltControl';
import { ScaleControl } from './ScaleControl';
import { FramePositionControl } from './FramePositionControl';

interface TransformControlsProps {
  rotation: number;
  scale: number;
  tiltX?: number;
  tiltY?: number;
  frameX?: number;
  frameY?: number;
  onRotationChange: (rotation: number) => void;
  onScaleChange: (scale: number) => void;
  onTiltChange?: (tiltX: number, tiltY: number) => void;
  onFramePositionChange?: (frameX: number, frameY: number) => void;
  onReset?: () => void;
}

const DIAL_SIZE = 64;
const KNOB_SIZE = 12;

export function TransformControls({
  rotation,
  scale,
  tiltX = 0,
  tiltY = 0,
  frameX = 0,
  frameY = 0,
  onRotationChange,
  onScaleChange,
  onTiltChange,
  onFramePositionChange,
  onReset,
}: TransformControlsProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const hasChanges = rotation !== 0 || scale !== 100 || tiltX !== 0 || tiltY !== 0 || frameX !== 0 || frameY !== 0;

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

  return (
    <Box>
      {/* Reset Button - Full Width at Top */}
      {onReset && (
        <Button
          variant="light"
          color="gray"
          size="sm"
          onClick={onReset}
          disabled={!hasChanges}
          fullWidth
          leftSection={<IconRefresh size={14} />}
          style={{ marginBottom: 12 }}
        >
          Reset to Default
        </Button>
      )}

      {/* 2x2 Grid Layout */}
      <SimpleGrid cols={2} spacing="sm">
        {/* 1. Rotation Dial */}
        <Box style={{ display: 'flex', justifyContent: 'center' }}>
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
                margin: '0 auto',
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
        </Box>

        {/* 2. Scale Control */}
        <Box style={{ display: 'flex', justifyContent: 'center' }}>
          <ScaleControl
            scale={scale}
            min={20}
            max={500}
            defaultValue={100}
            onScaleChange={onScaleChange}
          />
        </Box>

        {/* 3. 3D Tilt Control */}
        {onTiltChange && (
          <Box style={{ display: 'flex', justifyContent: 'center' }}>
            <TiltControl
              tiltX={tiltX}
              tiltY={tiltY}
              onTiltChange={onTiltChange}
            />
          </Box>
        )}

        {/* 4. Frame Position Control */}
        {onFramePositionChange && (
          <Box style={{ display: 'flex', justifyContent: 'center' }}>
            <FramePositionControl
              frameX={frameX}
              frameY={frameY}
              onPositionChange={onFramePositionChange}
            />
          </Box>
        )}
      </SimpleGrid>
    </Box>
  );
}
