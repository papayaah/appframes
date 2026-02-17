'use client';

import { useCallback, useRef, useState } from 'react';
import { Box, Text, Button, SimpleGrid } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import { PanControl } from './PanControl';
import { ScaleControl } from './ScaleControl';

export interface ImageSettingsPanelProps {
  /** Current scale value (0-100) */
  screenScale: number;
  /** Current pan X value (0-100) */
  screenPanX: number;
  /** Current pan Y value (0-100) */
  screenPanY: number;
  /** Current image rotation (0-360) */
  imageRotation: number;
  /** Callback when scale changes */
  onScaleChange: (value: number) => void;
  /** Callback when pan X changes */
  onPanXChange: (value: number, persistent?: boolean) => void;
  /** Callback when pan Y changes */
  onPanYChange: (value: number, persistent?: boolean) => void;
  /** Callback when image rotation changes */
  onRotationChange: (value: number) => void;
  /** Callback to reset all values to defaults */
  onReset: () => void;
}

const DIAL_SIZE = 64;
const KNOB_SIZE = 12;

export function ImageSettingsPanel({
  screenScale,
  screenPanX,
  screenPanY,
  imageRotation,
  onScaleChange,
  onPanXChange,
  onPanYChange,
  onRotationChange,
  onReset,
}: ImageSettingsPanelProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const hasChanges = imageRotation !== 0 || screenScale !== 0 || Math.round(screenPanX) !== 50 || Math.round(screenPanY) !== 50;

  const getKnobPosition = (angle: number) => {
    const radians = ((angle - 90) * Math.PI) / 180;
    const radius = (DIAL_SIZE - KNOB_SIZE) / 2;
    return {
      x: Math.cos(radians) * radius + DIAL_SIZE / 2 - KNOB_SIZE / 2,
      y: Math.sin(radians) * radius + DIAL_SIZE / 2 - KNOB_SIZE / 2,
    };
  };

  const getAngleFromPosition = (clientX: number, clientY: number) => {
    if (!dialRef.current) return imageRotation;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    return Math.round(angle) % 360;
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onRotationChange(getAngleFromPosition(e.clientX, e.clientY));
  }, [onRotationChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    onRotationChange(getAngleFromPosition(e.clientX, e.clientY));
  }, [isDragging, onRotationChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const knobPos = getKnobPosition(imageRotation);

  return (
    <Box>
      {/* Reset Button - Full Width at Top */}
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
              {/* Tick marks at 0, 90, 180, 270 */}
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
              {Math.round(imageRotation)}°
            </Text>
          </Box>
        </Box>

        {/* 2. Zoom Control */}
        <Box style={{ display: 'flex', justifyContent: 'center' }}>
          <ScaleControl
            scale={screenScale}
            min={0}
            max={100}
            defaultValue={0}
            label="Zoom"
            onScaleChange={onScaleChange}
          />
        </Box>

        {/* 3. Pan Control - spans to center if odd */}
        <Box style={{ display: 'flex', justifyContent: 'center', gridColumn: 'span 2' }}>
          <PanControl
            panX={screenPanX}
            panY={screenPanY}
            onPanChange={(newPanX: number, newPanY: number, p?: boolean) => {
              onPanXChange(newPanX, p);
              onPanYChange(newPanY, p);
            }}
          />
        </Box>
      </SimpleGrid>
    </Box>
  );
}
