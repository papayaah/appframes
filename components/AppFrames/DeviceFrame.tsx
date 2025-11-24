'use client';

import { useState, useRef } from 'react';
import { Box, Text } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { useMediaImage } from '../../hooks/useMediaImage';

interface DeviceFrameProps {
  image?: string;
  mediaId?: number;
  scale: number;
  screenScale: number;
  panX: number;
  panY: number;
  showInstructions?: boolean;
  onPanChange?: (panX: number, panY: number) => void;
}

export function DeviceFrame({ 
  image, 
  mediaId,
  scale, 
  screenScale, 
  panX, 
  panY, 
  showInstructions = false,
  onPanChange 
}: DeviceFrameProps) {
  const { imageUrl } = useMediaImage(mediaId);
  const displayImage = imageUrl || image;
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, panX, panY });
  const screenRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!displayImage || !onPanChange) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      panX,
      panY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !onPanChange || !screenRef.current) return;

    const rect = screenRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    const newPanX = Math.max(0, Math.min(100, dragStart.panX + deltaX));
    const newPanY = Math.max(0, Math.min(100, dragStart.panY + deltaY));

    onPanChange(newPanX, newPanY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  const baseWidth = 280;
  const baseHeight = 570;
  const width = baseWidth * scale;
  const height = baseHeight * scale;

  return (
    <Box
      style={{
        width,
        height,
        borderRadius: 40 * scale,
        background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
        padding: 12 * scale,
        boxShadow:
          '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
        position: 'relative',
      }}
    >
      {/* Notch */}
      <Box
        style={{
          position: 'absolute',
          top: 12 * scale,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 100 * scale,
          height: 25 * scale,
          background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
          borderRadius: 20 * scale,
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Camera */}
        <Box
          style={{
            position: 'absolute',
            top: '50%',
            left: '25%',
            transform: 'translate(-50%, -50%)',
            width: 8 * scale,
            height: 8 * scale,
            borderRadius: '50%',
            backgroundColor: '#0a0a0a',
            border: `${0.5 * scale}px solid #333`,
          }}
        />
        {/* Speaker */}
        <Box
          style={{
            position: 'absolute',
            top: '50%',
            left: '60%',
            transform: 'translate(-50%, -50%)',
            width: 30 * scale,
            height: 5 * scale,
            borderRadius: 3 * scale,
            backgroundColor: '#0a0a0a',
          }}
        />
      </Box>

      {/* Screen */}
      <Box
        ref={screenRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 32 * scale,
          backgroundColor: '#000',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          cursor: displayImage && onPanChange ? (isDragging ? 'grabbing' : 'grab') : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {displayImage ? (
          <Box
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${displayImage})`,
              backgroundSize: `${screenScale}%`,
              backgroundPosition: `${panX}% ${panY}%`,
              backgroundRepeat: 'no-repeat',
              pointerEvents: 'none',
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
            <IconUpload size={32 * scale} color="#667eea" />
            <Text 
              size="sm" 
              c="dimmed" 
              style={{ 
                fontSize: 12 * scale, 
                textAlign: 'center',
                lineHeight: 1.4 
              }}
            >
              Drop your screenshot here
            </Text>
            <Text 
              size="xs" 
              c="dimmed" 
              style={{ 
                fontSize: 10 * scale, 
                textAlign: 'center',
                opacity: 0.7 
              }}
            >
              or use the NEW SCREEN button below
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
            <Text size="sm" c="dimmed" style={{ fontSize: 11 * scale }}>
              Powerful tools
            </Text>
            <Text size="sm" c="dimmed" style={{ fontSize: 11 * scale }}>
              for
            </Text>
            <Text size="sm" c="dimmed" style={{ fontSize: 11 * scale }}>
              your workflow
            </Text>
          </Box>
        )}
      </Box>

      {/* Power button */}
      <Box
        style={{
          position: 'absolute',
          right: -2 * scale,
          top: '25%',
          width: 3 * scale,
          height: 50 * scale,
          backgroundColor: '#2a2a2a',
          borderRadius: `0 ${2 * scale}px ${2 * scale}px 0`,
        }}
      />

      {/* Volume buttons */}
      <Box
        style={{
          position: 'absolute',
          left: -2 * scale,
          top: '20%',
          width: 3 * scale,
          height: 30 * scale,
          backgroundColor: '#2a2a2a',
          borderRadius: `${2 * scale}px 0 0 ${2 * scale}px`,
        }}
      />
      <Box
        style={{
          position: 'absolute',
          left: -2 * scale,
          top: '30%',
          width: 3 * scale,
          height: 30 * scale,
          backgroundColor: '#2a2a2a',
          borderRadius: `${2 * scale}px 0 0 ${2 * scale}px`,
        }}
      />
    </Box>
  );
}
