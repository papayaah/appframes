'use client';

import { Box, Center } from '@mantine/core';
import { CanvasSettings, Screen } from './AppFrames';
import { DeviceFrame } from './DeviceFrame';

export interface CompositionRendererProps {
  settings: CanvasSettings;
  screen: Screen;
  onPanChange?: (frameIndex: number, panX: number, panY: number) => void;
  onFramePositionChange?: (frameIndex: number, frameX: number, frameY: number) => void;
  hoveredFrameIndex?: number | null;
  onFrameHover?: (index: number | null) => void;
  dragFileCount?: number;
  selectedFrameIndex?: number;
  onSelectFrame?: (index: number) => void;
  onMediaSelect?: (frameIndex: number, mediaId: number) => void;
  onPexelsSelect?: (frameIndex: number, url: string) => void;
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
  onFramePositionChange,
  hoveredFrameIndex,
  onFrameHover,
  dragFileCount = 0,
  selectedFrameIndex,
  onSelectFrame,
  onMediaSelect,
  onPexelsSelect,
  splitSide,
  isScreenSelected = false
}: CompositionRendererProps) {
  const scale = settings.compositionScale / 100;
  const images = screen.images || [];

  // Helper to get per-frame pan values with defaults
  const getFramePan = (index: number) => ({
    panX: images[index]?.panX ?? 50,
    panY: images[index]?.panY ?? 50,
  });

  // Helper to get per-frame position offset
  const getFrameOffset = (index: number) => ({
    frameX: images[index]?.frameX ?? 0,
    frameY: images[index]?.frameY ?? 0,
  });

  // Determine which frames should be highlighted based on drag
  const getHighlightedFrames = (): number[] => {
    if (hoveredFrameIndex === null || hoveredFrameIndex === undefined) return [];
    const frameCount = getCompositionFrameCount(settings.composition);

    if (dragFileCount > 1) {
      const frames: number[] = [];
      for (let i = 0; i < Math.min(dragFileCount, frameCount); i++) {
        const frameIndex = (hoveredFrameIndex + i) % frameCount;
        if (!frames.includes(frameIndex)) {
          frames.push(frameIndex);
        }
      }
      return frames;
    } else {
      return [hoveredFrameIndex];
    }
  };

  const highlightedFrames = getHighlightedFrames();

  // Common props builder for DeviceFrame
  const getFrameProps = (index: number, scaleMultiplier: number = 1) => {
    const { panX, panY } = getFramePan(index);
    return {
      deviceType: settings.deviceFrame,
      image: images[index]?.image,
      mediaId: images[index]?.mediaId,
      scale: scale * scaleMultiplier,
      screenScale: settings.screenScale,
      panX,
      panY,
      frameIndex: index,
      isHighlighted: highlightedFrames.includes(index),
      isSelected: isScreenSelected || selectedFrameIndex === index, // Show selected if screen is selected OR specific frame is selected
      onClick: () => onSelectFrame?.(index),
      onDragOver: () => onFrameHover?.(index),
      onDragLeave: () => onFrameHover?.(null),
      onMediaSelect: (mediaId: number) => onMediaSelect?.(index, mediaId),
      onPexelsSelect: (url: string) => onPexelsSelect?.(index, url),
      onPanChange: (x: number, y: number) => onPanChange?.(index, x, y),
      onFramePositionChange: (x: number, y: number) => onFramePositionChange?.(index, x, y),
      splitSide, // Pass splitSide to DeviceFrame for proper cropping
    };
  };

  // Wrapper for draggable frame positioning
  const DraggableFrame = ({ index, children, baseStyle }: {
    index: number;
    children: React.ReactNode;
    baseStyle?: React.CSSProperties;
  }) => {
    const { frameX, frameY } = getFrameOffset(index);
    return (
      <Box
        style={{
          ...baseStyle,
          transform: `${baseStyle?.transform || ''} translate(${frameX}px, ${frameY}px)`.trim(),
        }}
      >
        {children}
      </Box>
    );
  };

  switch (settings.composition) {
    case 'single':
      return (
        <Center style={{ height: '100%' }}>
          <DraggableFrame index={0}>
            <DeviceFrame
              {...getFrameProps(0, 1)}
              showInstructions={images.length === 0 || (!images[0]?.image && !images[0]?.mediaId)}
            />
          </DraggableFrame>
        </Center>
      );

    case 'dual':
      return (
        <Center style={{ height: '100%', gap: 20 }}>
          <DraggableFrame index={0}>
            <DeviceFrame {...getFrameProps(0, 0.9)} />
          </DraggableFrame>
          <DraggableFrame index={1}>
            <DeviceFrame {...getFrameProps(1, 0.9)} />
          </DraggableFrame>
        </Center>
      );

    case 'stack':
      return (
        <Center style={{ height: '100%', position: 'relative' }}>
          <Box style={{ position: 'relative' }}>
            <DraggableFrame
              index={0}
              baseStyle={{ position: 'absolute', top: -20, left: -20, zIndex: 1 }}
            >
              <DeviceFrame {...getFrameProps(0, 0.85)} />
            </DraggableFrame>
            <DraggableFrame
              index={1}
              baseStyle={{ position: 'relative', zIndex: 2 }}
            >
              <DeviceFrame {...getFrameProps(1, 0.85)} />
            </DraggableFrame>
          </Box>
        </Center>
      );

    case 'triple':
      return (
        <Center style={{ height: '100%', gap: 15 }}>
          <DraggableFrame index={0}>
            <DeviceFrame {...getFrameProps(0, 0.75)} />
          </DraggableFrame>
          <DraggableFrame index={1}>
            <DeviceFrame {...getFrameProps(1, 0.75)} />
          </DraggableFrame>
          <DraggableFrame index={2}>
            <DeviceFrame {...getFrameProps(2, 0.75)} />
          </DraggableFrame>
        </Center>
      );

    case 'fan':
      return (
        <Center style={{ height: '100%', position: 'relative' }}>
          <Box style={{ position: 'relative', width: 600, height: 500 }}>
            <DraggableFrame
              index={0}
              baseStyle={{
                position: 'absolute',
                top: '50%',
                left: '20%',
                transform: 'translate(-50%, -50%) rotate(-8deg)',
                zIndex: 1,
              }}
            >
              <DeviceFrame {...getFrameProps(0, 0.7)} />
            </DraggableFrame>
            <DraggableFrame
              index={1}
              baseStyle={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 3,
              }}
            >
              <DeviceFrame {...getFrameProps(1, 0.7)} />
            </DraggableFrame>
            <DraggableFrame
              index={2}
              baseStyle={{
                position: 'absolute',
                top: '50%',
                left: '80%',
                transform: 'translate(-50%, -50%) rotate(8deg)',
                zIndex: 2,
              }}
            >
              <DeviceFrame {...getFrameProps(2, 0.7)} />
            </DraggableFrame>
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
