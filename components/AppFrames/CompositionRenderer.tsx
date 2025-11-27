'use client';

import { Box, Center } from '@mantine/core';
import { CanvasSettings, Screen } from './AppFrames';
import { DeviceFrame } from './DeviceFrame';

export interface CompositionRendererProps {
  settings: CanvasSettings;
  screen: Screen;
  onPanChange?: (panX: number, panY: number) => void;
  hoveredFrameIndex?: number | null;
  onFrameHover?: (index: number | null) => void;
  dragFileCount?: number;
  selectedFrameIndex?: number;
  onSelectFrame?: (index: number) => void;
  splitSide?: 'left' | 'right';
  isScreenSelected?: boolean;
}

const getCompositionFrameCount = (composition: string): number => {
  switch (composition) {
    case 'single': return 1;
    case 'dual': return 2;
    case 'stack': return 2;
    case 'triple': return 3;
    case 'fan': return 3;
    case 'split': return 2;
    default: return 1;
  }
};

export function CompositionRenderer({
  settings,
  screen,
  onPanChange,
  hoveredFrameIndex,
  onFrameHover,
  dragFileCount = 0,
  selectedFrameIndex,
  onSelectFrame,
  splitSide,
  isScreenSelected
}: CompositionRendererProps) {
  const scale = settings.compositionScale / 100;
  const images = screen.images || [];

  // Determine which frames should be highlighted based on drag
  const getHighlightedFrames = (): number[] => {
    if (hoveredFrameIndex === null || hoveredFrameIndex === undefined) return [];
    const frameCount = getCompositionFrameCount(settings.composition);

    if (dragFileCount > 1) {
      // Multi-file drag: highlight frames starting from hovered index
      const frames: number[] = [];
      for (let i = 0; i < Math.min(dragFileCount, frameCount); i++) {
        const frameIndex = (hoveredFrameIndex + i) % frameCount;
        if (!frames.includes(frameIndex)) {
          frames.push(frameIndex);
        }
      }
      return frames;
    } else {
      // Single file: highlight only the hovered frame
      return [hoveredFrameIndex];
    }
  };

  const highlightedFrames = getHighlightedFrames();

  const getTiltTransform = () => {
    if (settings.tilt === 'left') return 'rotateY(-40deg)';
    if (settings.tilt === 'right') return 'rotateY(40deg)';
    return 'none';
  };

  const tiltStyle = settings.tilt !== 'none' ? {
    perspective: '1000px',
  } : {};

  const frameWrapperStyle = settings.tilt !== 'none' ? {
    transform: getTiltTransform(),
    transformStyle: 'preserve-3d' as const,
  } : {};

  switch (settings.composition) {
    case 'single':
      return (
        <Center style={{ height: '100%', ...tiltStyle }}>
          <Box style={frameWrapperStyle}>
            <DeviceFrame
              deviceType={settings.deviceFrame}
              image={images[0]?.image}
              mediaId={images[0]?.mediaId}
              scale={scale}
              screenScale={settings.screenScale}
              panX={settings.screenPanX}
              panY={settings.screenPanY}
              showInstructions={images.length === 0 || (!images[0]?.image && !images[0]?.mediaId)}
              onPanChange={onPanChange}
              frameIndex={0}
              isHighlighted={highlightedFrames.includes(0)}
              isSelected={isScreenSelected || selectedFrameIndex === 0}
              onClick={() => onSelectFrame?.(0)}
              onDragOver={() => onFrameHover?.(0)}
              onDragLeave={() => onFrameHover?.(null)}
              splitSide={splitSide}
            />
          </Box>
        </Center>
      );

    case 'dual':
      return (
        <Center style={{ height: '100%', gap: 20 }}>
          <DeviceFrame
            deviceType={settings.deviceFrame}
            image={images[0]?.image}
            mediaId={images[0]?.mediaId}
            scale={scale * 0.9}
            screenScale={settings.screenScale}
            panX={settings.screenPanX}
            panY={settings.screenPanY}
            frameIndex={0}
            isHighlighted={highlightedFrames.includes(0)}
            isSelected={selectedFrameIndex === 0}
            onClick={() => onSelectFrame?.(0)}
            onDragOver={() => onFrameHover?.(0)}
            onDragLeave={() => onFrameHover?.(null)}
          />
          <DeviceFrame
            deviceType={settings.deviceFrame}
            image={images[1]?.image}
            mediaId={images[1]?.mediaId}
            scale={scale * 0.9}
            screenScale={settings.screenScale}
            panX={settings.screenPanX}
            panY={settings.screenPanY}
            frameIndex={1}
            isHighlighted={highlightedFrames.includes(1)}
            isSelected={selectedFrameIndex === 1}
            onClick={() => onSelectFrame?.(1)}
            onDragOver={() => onFrameHover?.(1)}
            onDragLeave={() => onFrameHover?.(null)}
          />
        </Center>
      );

    case 'stack':
      return (
        <Center style={{ height: '100%', position: 'relative' }}>
          <Box style={{ position: 'relative' }}>
            <Box style={{ position: 'absolute', top: -20, left: -20, zIndex: 1 }}>
              <DeviceFrame
                deviceType={settings.deviceFrame}
                image={images[0]?.image}
                mediaId={images[0]?.mediaId}
                scale={scale * 0.85}
                screenScale={settings.screenScale}
                panX={settings.screenPanX}
                panY={settings.screenPanY}
                frameIndex={0}
                isHighlighted={highlightedFrames.includes(0)}
                isSelected={selectedFrameIndex === 0}
                onClick={() => onSelectFrame?.(0)}
                onDragOver={() => onFrameHover?.(0)}
                onDragLeave={() => onFrameHover?.(null)}
              />
            </Box>
            <Box style={{ position: 'relative', zIndex: 2 }}>
              <DeviceFrame
                deviceType={settings.deviceFrame}
                image={images[1]?.image}
                mediaId={images[1]?.mediaId}
                scale={scale * 0.85}
                screenScale={settings.screenScale}
                panX={settings.screenPanX}
                panY={settings.screenPanY}
                frameIndex={1}
                isHighlighted={highlightedFrames.includes(1)}
                isSelected={selectedFrameIndex === 1}
                onClick={() => onSelectFrame?.(1)}
                onDragOver={() => onFrameHover?.(1)}
                onDragLeave={() => onFrameHover?.(null)}
              />
            </Box>
          </Box>
        </Center>
      );

    case 'triple':
      return (
        <Center style={{ height: '100%', gap: 15 }}>
          <DeviceFrame
            deviceType={settings.deviceFrame}
            image={images[0]?.image}
            mediaId={images[0]?.mediaId}
            scale={scale * 0.75}
            screenScale={settings.screenScale}
            panX={settings.screenPanX}
            panY={settings.screenPanY}
            frameIndex={0}
            isHighlighted={highlightedFrames.includes(0)}
            isSelected={selectedFrameIndex === 0}
            onClick={() => onSelectFrame?.(0)}
            onDragOver={() => onFrameHover?.(0)}
            onDragLeave={() => onFrameHover?.(null)}
          />
          <DeviceFrame
            deviceType={settings.deviceFrame}
            image={images[1]?.image}
            mediaId={images[1]?.mediaId}
            scale={scale * 0.75}
            screenScale={settings.screenScale}
            panX={settings.screenPanX}
            panY={settings.screenPanY}
            frameIndex={1}
            isHighlighted={highlightedFrames.includes(1)}
            isSelected={selectedFrameIndex === 1}
            onClick={() => onSelectFrame?.(1)}
            onDragOver={() => onFrameHover?.(1)}
            onDragLeave={() => onFrameHover?.(null)}
          />
          <DeviceFrame
            deviceType={settings.deviceFrame}
            image={images[2]?.image}
            mediaId={images[2]?.mediaId}
            scale={scale * 0.75}
            screenScale={settings.screenScale}
            panX={settings.screenPanX}
            panY={settings.screenPanY}
            frameIndex={2}
            isHighlighted={highlightedFrames.includes(2)}
            isSelected={selectedFrameIndex === 2}
            onClick={() => onSelectFrame?.(2)}
            onDragOver={() => onFrameHover?.(2)}
            onDragLeave={() => onFrameHover?.(null)}
          />
        </Center>
      );

    case 'fan':
      return (
        <Center style={{ height: '100%', position: 'relative' }}>
          <Box style={{ position: 'relative', width: 600, height: 500 }}>
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: '20%',
                transform: 'translate(-50%, -50%) rotate(-8deg)',
                zIndex: 1,
              }}
            >
              <DeviceFrame
                deviceType={settings.deviceFrame}
                image={images[0]?.image}
                mediaId={images[0]?.mediaId}
                scale={scale * 0.7}
                screenScale={settings.screenScale}
                panX={settings.screenPanX}
                panY={settings.screenPanY}
                frameIndex={0}
                isHighlighted={highlightedFrames.includes(0)}
                isSelected={selectedFrameIndex === 0}
                onClick={() => onSelectFrame?.(0)}
                onDragOver={() => onFrameHover?.(0)}
                onDragLeave={() => onFrameHover?.(null)}
              />
            </Box>
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 3,
              }}
            >
              <DeviceFrame
                deviceType={settings.deviceFrame}
                image={images[1]?.image}
                mediaId={images[1]?.mediaId}
                scale={scale * 0.7}
                screenScale={settings.screenScale}
                panX={settings.screenPanX}
                panY={settings.screenPanY}
                frameIndex={1}
                isHighlighted={highlightedFrames.includes(1)}
                isSelected={selectedFrameIndex === 1}
                onClick={() => onSelectFrame?.(1)}
                onDragOver={() => onFrameHover?.(1)}
                onDragLeave={() => onFrameHover?.(null)}
              />
            </Box>
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: '80%',
                transform: 'translate(-50%, -50%) rotate(8deg)',
                zIndex: 2,
              }}
            >
              <DeviceFrame
                deviceType={settings.deviceFrame}
                image={images[2]?.image}
                mediaId={images[2]?.mediaId}
                scale={scale * 0.7}
                screenScale={settings.screenScale}
                panX={settings.screenPanX}
                panY={settings.screenPanY}
                frameIndex={2}
                isHighlighted={highlightedFrames.includes(2)}
                isSelected={selectedFrameIndex === 2}
                onClick={() => onSelectFrame?.(2)}
                onDragOver={() => onFrameHover?.(2)}
                onDragLeave={() => onFrameHover?.(null)}
              />
            </Box>
          </Box>
        </Center>
      );

    case 'split':
      return (
        <Center style={{ height: '100%', width: '100%' }}>
          <Box style={{ display: 'flex', gap: 5, alignItems: 'center', justifyContent: 'center' }}>
            <DeviceFrame
              deviceType={settings.deviceFrame}
              image={images[0]?.image}
              mediaId={images[0]?.mediaId}
              scale={scale * 0.85}
              screenScale={settings.screenScale}
              panX={settings.screenPanX}
              panY={settings.screenPanY}
              frameIndex={0}
              isHighlighted={highlightedFrames.includes(0)}
              isSelected={selectedFrameIndex === 0}
              onClick={() => onSelectFrame?.(0)}
              onDragOver={() => onFrameHover?.(0)}
              onDragLeave={() => onFrameHover?.(null)}
            />
            <DeviceFrame
              deviceType={settings.deviceFrame}
              image={images[1]?.image}
              mediaId={images[1]?.mediaId}
              scale={scale * 0.85}
              screenScale={settings.screenScale}
              panX={settings.screenPanX}
              panY={settings.screenPanY}
              frameIndex={1}
              isHighlighted={highlightedFrames.includes(1)}
              isSelected={selectedFrameIndex === 1}
              onClick={() => onSelectFrame?.(1)}
              onDragOver={() => onFrameHover?.(1)}
              onDragLeave={() => onFrameHover?.(null)}
            />
          </Box>
        </Center>
      );

    default:
      return null;
  }
}
