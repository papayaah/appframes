'use client';

import { useState, useRef } from 'react';
import { Box, Text } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { useMediaImage } from '../../hooks/useMediaImage';

interface DeviceFrameProps {
  deviceType?: string;
  image?: string;
  mediaId?: number;
  scale: number;
  screenScale: number;
  panX: number;
  panY: number;
  showInstructions?: boolean;
  onPanChange?: (panX: number, panY: number) => void;
  frameIndex?: number;
  isHighlighted?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onDragOver?: () => void;
  onDragLeave?: () => void;
}

interface DeviceConfig {
  width: number;
  height: number;
  radius: number;
  frameColor: string;
  screenRadius: number;
  type: 'notch' | 'punch-hole' | 'tablet' | 'laptop' | 'monitor' | 'home-button' | 'dynamic-island';
  notchWidth?: number;
  bezelWidth?: number;
}

const getDeviceConfig = (deviceId: string = 'iphone-14-pro'): DeviceConfig => {
  // iPhone 14 Pro (Dynamic Island)
  if (deviceId === 'iphone-14-pro') {
    return {
      width: 280,
      height: 575,
      radius: 45,
      frameColor: '#2a2a2a',
      screenRadius: 40,
      type: 'dynamic-island',
      bezelWidth: 10,
    };
  }

  // Phones - Apple
  if (deviceId.includes('iphone-14') || deviceId.includes('iphone-13')) {
    return {
      width: 280,
      height: 570,
      radius: 40,
      frameColor: '#2a2a2a',
      screenRadius: 32,
      type: 'notch',
      notchWidth: 100,
      bezelWidth: 12,
    };
  }
  if (deviceId === 'iphone-se') {
    return {
      width: 280,
      height: 500,
      radius: 36,
      frameColor: '#1a1a1a',
      screenRadius: 2,
      type: 'home-button',
      bezelWidth: 15, // Thicker top/bottom bezel simulated in render
    };
  }

  // Phones - Android
  if (deviceId.includes('pixel') || deviceId.includes('samsung') || deviceId.includes('galaxy')) {
    return {
      width: 270,
      height: 580,
      radius: 32,
      frameColor: '#1a1a1a',
      screenRadius: 28,
      type: 'punch-hole',
      bezelWidth: 10,
    };
  }

  // Tablets
  if (deviceId.includes('ipad') || deviceId.includes('tablet') || deviceId.includes('tab-s9')) {
    return {
      width: 440,
      height: 580,
      radius: 24,
      frameColor: '#2a2a2a',
      screenRadius: 16,
      type: 'tablet',
      bezelWidth: 16,
    };
  }

  // Laptops
  if (deviceId.includes('macbook') || deviceId.includes('laptop') || deviceId.includes('surface')) {
    return {
      width: 600,
      height: 380, // Screen height (excluding base)
      radius: 16,
      frameColor: '#2a2a2a',
      screenRadius: 8,
      type: 'laptop',
      bezelWidth: 12,
    };
  }

  // Monitors
  if (deviceId.includes('imac') || deviceId.includes('display')) {
    return {
      width: 640,
      height: 360,
      radius: 12,
      frameColor: deviceId.includes('imac') ? '#e0e0e0' : '#1a1a1a',
      screenRadius: 8,
      type: 'monitor',
      bezelWidth: 16,
    };
  }

  // Default fallback
  return {
    width: 280,
    height: 570,
    radius: 40,
    frameColor: '#2a2a2a',
    screenRadius: 32,
    type: 'notch',
    notchWidth: 100,
    bezelWidth: 12,
  };
};

export function DeviceFrame({
  deviceType,
  image,
  mediaId,
  scale,
  screenScale,
  panX,
  panY,
  showInstructions = false,
  onPanChange,
  frameIndex,
  isHighlighted = false,
  isSelected = false,
  onClick,
  onDragOver,
  onDragLeave
}: DeviceFrameProps) {
  const { imageUrl } = useMediaImage(mediaId);
  const displayImage = imageUrl || image;
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, panX, panY });
  const screenRef = useRef<HTMLDivElement>(null);

  const config = getDeviceConfig(deviceType);

  const handleMouseDown = (e: React.MouseEvent) => {
    // If we have an image and pan handler, handle panning
    if (displayImage && onPanChange) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        panX,
        panY,
      });
    }

    // Also trigger selection
    onClick?.();
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

  const width = config.width * scale;
  const height = config.height * scale;
  const padding = (config.bezelWidth || 12) * scale;

  // Adjust padding for Home Button devices (top/bottom larger)
  const topPadding = config.type === 'home-button' ? 60 * scale : padding;
  const bottomPadding = config.type === 'home-button' ? 60 * scale : padding;
  const sidePadding = padding;

  // Adjust padding for iMac (chin)
  const imacChin = config.type === 'monitor' && deviceType?.includes('imac') ? 40 * scale : 0;

  const renderDecorations = () => {
    switch (config.type) {
      case 'notch':
        return (
          <Box
            style={{
              position: 'absolute',
              top: padding,
              left: '50%',
              transform: 'translateX(-50%)',
              width: (config.notchWidth || 100) * scale,
              height: 25 * scale,
              background: config.frameColor,
              borderBottomLeftRadius: 16 * scale,
              borderBottomRightRadius: 16 * scale,
              zIndex: 10,
            }}
          />
        );
      case 'dynamic-island':
        return (
          <Box
            style={{
              position: 'absolute',
              top: padding + 10 * scale,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 80 * scale,
              height: 24 * scale,
              background: '#000',
              borderRadius: 12 * scale,
              zIndex: 10,
            }}
          />
        );
      case 'punch-hole':
        return (
          <Box
            style={{
              position: 'absolute',
              top: padding + 8 * scale,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 12 * scale,
              height: 12 * scale,
              borderRadius: '50%',
              background: '#000',
              zIndex: 10,
            }}
          />
        );
      case 'home-button':
        return (
          <Box
            style={{
              position: 'absolute',
              bottom: 10 * scale,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 40 * scale,
              height: 40 * scale,
              borderRadius: '50%',
              border: `${2 * scale}px solid #333`,
              zIndex: 10,
            }}
          />
        );
      case 'laptop':
        // Camera dot
        return (
          <Box
            style={{
              position: 'absolute',
              top: padding / 2,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 6 * scale,
              height: 6 * scale,
              borderRadius: '50%',
              background: '#444',
              zIndex: 10,
            }}
          />
        );
      case 'monitor':
        // Nothing special on screen, but maybe base?
        return null;
      default:
        return null;
    }
  };

  const renderBase = () => {
    if (config.type === 'laptop') {
      return (
        <Box
          style={{
            position: 'absolute',
            bottom: -20 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            width: width + 40 * scale,
            height: 20 * scale,
            background: '#3a3a3a',
            borderBottomLeftRadius: 10 * scale,
            borderBottomRightRadius: 10 * scale,
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
          }}
        >
          {/* Groove */}
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 80 * scale,
              height: 4 * scale,
              background: '#2a2a2a',
              borderBottomLeftRadius: 4 * scale,
              borderBottomRightRadius: 4 * scale,
            }}
          />
        </Box>
      );
    }
    if (config.type === 'monitor') {
      return (
        <Box
          style={{
            position: 'absolute',
            bottom: -40 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120 * scale,
            height: 60 * scale, // Stand height + base
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <Box
            style={{
              width: 40 * scale,
              height: '100%',
              background: '#d1d1d1',
            }}
          />
          <Box
            style={{
              position: 'absolute',
              bottom: 0,
              width: 140 * scale,
              height: 10 * scale,
              background: '#d1d1d1',
              borderRadius: 4 * scale,
            }}
          />
        </Box>
      )
      }
    return null;
    };

    return (
      <Box
        style={{ position: 'relative' }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDragOver?.();
        }}
        onDragLeave={(e) => {
          // Only trigger if actually leaving the frame (not entering a child)
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            onDragLeave?.();
          }
        }}
      >
        <Box
          style={{
            width,
            height: height + imacChin, // Add chin height if iMac
            borderRadius: config.radius * scale,
            background: `linear-gradient(145deg, ${config.frameColor}, ${config.frameColor})`,
            paddingTop: topPadding,
            paddingBottom: bottomPadding + imacChin,
            paddingLeft: sidePadding,
            paddingRight: sidePadding,
            boxShadow: isHighlighted
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 3px rgba(102, 126, 234, 0.8), 0 0 20px rgba(102, 126, 234, 0.5)'
              : isSelected
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 3px #667eea'
                : '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            transition: 'box-shadow 0.2s ease',
            cursor: onClick ? 'pointer' : undefined,
          }}
          onClick={onClick ? (e) => {
            e.stopPropagation();
            onClick();
          } : undefined}
        >
          {renderDecorations()}

          {/* Screen */}
          <Box
            ref={screenRef}
            style={{
              flex: 1,
              width: '100%',
              borderRadius: config.screenRadius * scale,
              backgroundColor: '#000',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.05) inset',
              cursor: displayImage && onPanChange ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
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
                <IconUpload size={32 * scale} color={isSelected ? "#667eea" : "#4a5568"} />
                <Text
                  size="sm"
                  c="dimmed"
                  style={{
                    fontSize: 12 * scale,
                    textAlign: 'center',
                    lineHeight: 1.4,
                    color: isSelected ? "#667eea" : undefined
                  }}
                >
                  {isSelected ? "Selected" : "Drop screenshot"}
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
                {/* Empty State Minimal */}
              </Box>
            )}
          </Box>

          {/* Buttons (only for phones/tablets) */}
          {['notch', 'punch-hole', 'tablet', 'home-button', 'dynamic-island'].includes(config.type) && (
            <>
              <Box
                style={{
                  position: 'absolute',
                  right: -2 * scale,
                  top: '25%',
                  width: 3 * scale,
                  height: 50 * scale,
                  backgroundColor: config.frameColor,
                  borderRadius: `0 ${2 * scale}px ${2 * scale}px 0`,
                  opacity: 0.8,
                }}
              />
              <Box
                style={{
                  position: 'absolute',
                  left: -2 * scale,
                  top: '20%',
                  width: 3 * scale,
                  height: 30 * scale,
                  backgroundColor: config.frameColor,
                  borderRadius: `${2 * scale}px 0 0 ${2 * scale}px`,
                  opacity: 0.8,
                }}
              />
            </>
          )}

        </Box>
        {renderBase()}
      </Box>
    );
  }
