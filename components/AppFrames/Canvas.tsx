'use client';

import React, { useState } from 'react';
import { Box } from '@mantine/core';
import { CanvasSettings, Screen } from './AppFrames';
import { CompositionRenderer } from './CompositionRenderer';

interface CanvasProps {
  settings: CanvasSettings;
  screens: Screen[];
  selectedScreenIndices: number[];
  selectedFrameIndex?: number;
  onSelectFrame?: (index: number) => void;
  onReplaceScreen?: (files: File[], targetFrameIndex?: number, screenIndex?: number) => void;
  onPanChange?: (screenIndex: number, frameIndex: number, panX: number, panY: number) => void;
  onFramePositionChange?: (screenIndex: number, frameIndex: number, frameX: number, frameY: number) => void;
  onMediaSelect?: (screenIndex: number, frameIndex: number, mediaId: number) => void;
  onPexelsSelect?: (screenIndex: number, frameIndex: number, url: string) => void;
  zoom?: number;
}

// Canvas dimensions based on canvas size (App Store requirements)
const getCanvasDimensions = (canvasSize: string, _orientation: string) => {
  const dimensions: Record<string, { width: number; height: number }> = {
    // iPhone 6.5" Display
    'iphone-6.5-1': { width: 1242, height: 2688 },
    'iphone-6.5-2': { width: 2688, height: 1242 },
    'iphone-6.5-3': { width: 1284, height: 2778 },
    'iphone-6.5-4': { width: 2778, height: 1284 },
    // iPad 13" Display
    'ipad-13-1': { width: 2064, height: 2752 },
    'ipad-13-2': { width: 2752, height: 2064 },
    'ipad-13-3': { width: 2048, height: 2732 },
    'ipad-13-4': { width: 2732, height: 2048 },
    // Apple Watch Ultra 3
    'watch-ultra-3-1': { width: 422, height: 514 },
    'watch-ultra-3-2': { width: 410, height: 502 },
    // Apple Watch Series 11
    'watch-s11': { width: 416, height: 496 },
    // Apple Watch Series 9
    'watch-s9': { width: 396, height: 484 },
    // Apple Watch Series 6
    'watch-s6': { width: 368, height: 448 },
    // Apple Watch Series 3
    'watch-s3': { width: 312, height: 390 },
    // Google Play - Phone
    'google-phone-1': { width: 1080, height: 1920 },
    'google-phone-2': { width: 1920, height: 1080 },
    'google-phone-3': { width: 1440, height: 2560 },
    'google-phone-4': { width: 2560, height: 1440 },
    // Google Play - Tablet
    'google-tablet-1': { width: 1600, height: 2560 },
    'google-tablet-2': { width: 2560, height: 1600 },
    'google-tablet-3': { width: 2048, height: 2732 },
    'google-tablet-4': { width: 2732, height: 2048 },
  };

  const dim = dimensions[canvasSize] || { width: 1242, height: 2688 };

  // Don't apply orientation transform since dimensions already include orientation
  return dim;
};

export function Canvas({
  settings,
  screens,
  selectedScreenIndices,
  selectedFrameIndex,
  onSelectFrame,
  onReplaceScreen,
  onPanChange,
  onFramePositionChange,
  onMediaSelect,
  onPexelsSelect,
  zoom = 100
}: CanvasProps) {
  const [hoveredFrameIndex, setHoveredFrameIndex] = useState<number | null>(null);
  const [hoveredScreenIndex, setHoveredScreenIndex] = useState<number | null>(null);
  const [dragFileCount, setDragFileCount] = useState<number>(0);

  const handleDrop = (files: File[], targetFrameIndex?: number, screenIndex?: number) => {
    if (!onReplaceScreen || files.length === 0) {
      return;
    }
    setHoveredFrameIndex(null);
    setHoveredScreenIndex(null);
    setDragFileCount(0);
    onReplaceScreen(files, targetFrameIndex, screenIndex);
  };

  return (
    <Box
      style={{
        flex: 1,
        backgroundColor: '#F9FAFB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start', // Start from left to allow scrolling
        padding: 40,
        overflowX: 'auto', // Enable horizontal scrolling
        overflowY: 'hidden',
        position: 'relative',
      }}
      onDragOver={(e) => {
        e.preventDefault();
        // Count files being dragged
        if (e.dataTransfer.types.includes('Files')) {
          const fileCount = e.dataTransfer.items.length;
          setDragFileCount(fileCount);
        }
      }}
      onDragLeave={(e) => {
        // Only clear if leaving the entire canvas area
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setHoveredFrameIndex(null);
          setHoveredScreenIndex(null);
          setDragFileCount(0);
        }
      }}
    >
      <Box
        style={{
          display: 'flex',
          gap: 5, // Space between canvases (will be overridden by individual gaps)
          height: '100%',
          alignItems: 'center',
          margin: '0 auto', // Center if content is smaller than viewport
          minWidth: 'min-content', // Ensure container grows with content
        }}
      >
        {selectedScreenIndices.map((screenIndex) => {
          const screen = screens[screenIndex];
          if (!screen) return null;

          const isSplitPair = screen.splitPairId;
          if (isSplitPair) {
            const pairScreens = screens
              .map((s, idx) => ({ screen: s, index: idx }))
              .filter(({ screen: s }) => s.splitPairId === screen.splitPairId)
              .sort((a, b) => a.index - b.index);

            const pairIndices = pairScreens.map(p => p.index);
            
            const firstPairIndex = pairScreens[0]?.index;
            const secondPairIndex = pairScreens[1]?.index;
            
            // Check if both screens in the pair are selected
            const bothSelected = pairIndices.every(idx => selectedScreenIndices.includes(idx));
            
            if (bothSelected) {
              // Only render once for the first screen in the pair when both are selected
              if (screenIndex !== firstPairIndex) {
                return null;
              }

              const leftScreen = pairScreens[0]?.screen || screen;
              const rightScreen = pairScreens[1]?.screen || screen;
              const leftIndex = pairScreens[0]?.index || screenIndex;
              const rightIndex = pairScreens[1]?.index || screenIndex;

              const leftSettings = {
                ...leftScreen.settings,
                selectedScreenIndex: leftIndex,
              };

              const rightSettings = {
                ...rightScreen.settings,
                selectedScreenIndex: rightIndex,
              };

              const canvasDimensions = getCanvasDimensions(leftSettings.canvasSize, leftSettings.orientation);
              const aspectRatio = canvasDimensions.width / canvasDimensions.height;

              const primarySelectedIndex = selectedScreenIndices[selectedScreenIndices.length - 1];

              // Render split composition: each canvas shows half of a single device
              const halfAspectRatio = aspectRatio / 2; // Half width for split view

              return (
                <React.Fragment key={`split-pair-${screen.splitPairId}`}>
                  {/* Left Half Canvas */}
                  <Box
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: 'right center', // Scale from right edge to keep gap constant
                      height: '100%',
                      width: aspectRatio > 1 ? '45vw' : '35vh',
                      flexShrink: 0,
                      marginRight: 2.5, // Half of 5px gap for split composition
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = Array.from(e.dataTransfer.files);
                      handleDrop(files, 0, leftIndex);
                    }}
                    onDragOver={(e) => {
                      setHoveredScreenIndex(leftIndex);
                    }}
                  >
                    <Box
                      id={`canvas-${leftScreen.id}`}
                      data-canvas="true"
                      style={{
                        width: '100%',
                        maxWidth: aspectRatio > 1 ? '90%' : 300,
                        aspectRatio: `${halfAspectRatio}`,
                        backgroundColor: leftSettings.backgroundColor,
                        position: 'relative',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        borderRadius: '8px 0 0 8px',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '200%',
                          height: '100%',
                        }}
                      >
                        <Box
                          style={{
                            width: '100%',
                            height: '100%',
                            clipPath: 'inset(0 50% 0 0)',
                          }}
                        >
                          <CompositionRenderer
                            settings={{ ...leftSettings, composition: 'single' }}
                            screen={leftScreen}
                            onPanChange={(x, y) => onPanChange?.(x, y, leftIndex)}
                            hoveredFrameIndex={hoveredScreenIndex === leftIndex ? hoveredFrameIndex : null}
                            onFrameHover={setHoveredFrameIndex}
                            dragFileCount={dragFileCount}
                            selectedFrameIndex={primarySelectedIndex === leftIndex ? selectedFrameIndex : undefined}
                            onSelectFrame={primarySelectedIndex === leftIndex ? onSelectFrame : undefined}
                            splitSide="left"
                            isScreenSelected={selectedScreenIndices.includes(leftIndex)}
                          />
                        </Box>
                      </Box>
                      {leftSettings.showCaption && leftSettings.captionText && leftScreen.images && leftScreen.images.some(img => img.image || img.mediaId) && (
                        <Box
                          style={{
                            position: 'absolute',
                            top: `${leftSettings.captionVertical}%`,
                            left: `${leftSettings.captionHorizontal}%`,
                            transform: 'translate(-50%, -50%)',
                            color: '#1a1a1a',
                            fontSize: 32,
                            fontWeight: 700,
                            textAlign: 'center',
                            maxWidth: '80%',
                            pointerEvents: 'none',
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          }}
                        >
                          {leftSettings.captionText}
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Right Half Canvas */}
                  <Box
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: 'left center', // Scale from left edge to keep gap constant
                      height: '100%',
                      width: aspectRatio > 1 ? '45vw' : '35vh',
                      flexShrink: 0,
                      marginLeft: 2.5, // Half of 5px gap for split composition
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = Array.from(e.dataTransfer.files);
                      handleDrop(files, 0, rightIndex);
                    }}
                    onDragOver={(e) => {
                      setHoveredScreenIndex(rightIndex);
                    }}
                  >
                    <Box
                      id={`canvas-${rightScreen.id}`}
                      data-canvas="true"
                      style={{
                        width: '100%',
                        maxWidth: aspectRatio > 1 ? '90%' : 300,
                        aspectRatio: `${halfAspectRatio}`,
                        backgroundColor: rightSettings.backgroundColor,
                        position: 'relative',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        borderRadius: '0 8px 8px 0',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '200%',
                          height: '100%',
                        }}
                      >
                        <Box
                          style={{
                            width: '100%',
                            height: '100%',
                            clipPath: 'inset(0 0 0 50%)',
                          }}
                        >
                          <CompositionRenderer
                            settings={{ ...rightSettings, composition: 'single' }}
                            screen={rightScreen}
                            onPanChange={(x, y) => onPanChange?.(x, y, rightIndex)}
                            hoveredFrameIndex={hoveredScreenIndex === rightIndex ? hoveredFrameIndex : null}
                            onFrameHover={setHoveredFrameIndex}
                            dragFileCount={dragFileCount}
                            selectedFrameIndex={primarySelectedIndex === rightIndex ? selectedFrameIndex : undefined}
                            onSelectFrame={primarySelectedIndex === rightIndex ? onSelectFrame : undefined}
                            splitSide="right"
                            isScreenSelected={selectedScreenIndices.includes(rightIndex)}
                          />
                        </Box>
                      </Box>
                      {rightSettings.showCaption && rightSettings.captionText && rightScreen.images && rightScreen.images.some(img => img.image || img.mediaId) && (
                        <Box
                          style={{
                            position: 'absolute',
                            top: `${rightSettings.captionVertical}%`,
                            left: `${rightSettings.captionHorizontal}%`,
                            transform: 'translate(-50%, -50%)',
                            color: '#1a1a1a',
                            fontSize: 32,
                            fontWeight: 700,
                            textAlign: 'center',
                            maxWidth: '80%',
                            pointerEvents: 'none',
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          }}
                        >
                          {rightSettings.captionText}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </React.Fragment>
              );
            }
            
            // If only one screen from the pair is selected, render it with the correct crop
            // Determine which side this screen is (left or right)
            const isLeftScreen = pairScreens[0]?.index === screenIndex;
            const splitSide = isLeftScreen ? 'left' : 'right';
            
            const screenSettings = {
              ...screen.settings,
              selectedScreenIndex: screenIndex,
            };

            const canvasDimensions = getCanvasDimensions(screenSettings.canvasSize, screenSettings.orientation);
            const aspectRatio = canvasDimensions.width / canvasDimensions.height;
            const halfAspectRatio = aspectRatio / 2;

            const isPrimaryScreen = screenIndex === selectedScreenIndices[selectedScreenIndices.length - 1];

            // Render single screen from split pair with cropping
            return (
              <Box
                key={screen.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: splitSide === 'left' ? 'right center' : 'left center', // Scale from edge to maintain position
                  height: '100%',
                  width: aspectRatio > 1 ? '45vw' : '35vh',
                  flexShrink: 0,
                  marginLeft: 30,
                  marginRight: 30,
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const files = Array.from(e.dataTransfer.files);
                  handleDrop(files, 0, screenIndex);
                }}
                onDragOver={(e) => {
                  setHoveredScreenIndex(screenIndex);
                }}
              >
                <Box
                  id={`canvas-${screen.id}`}
                  data-canvas="true"
                  style={{
                    width: '100%',
                    maxWidth: aspectRatio > 1 ? '90%' : 300,
                    aspectRatio: `${halfAspectRatio}`,
                    backgroundColor: screenSettings.backgroundColor,
                    position: 'relative',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    borderRadius: splitSide === 'left' ? '8px 0 0 8px' : '0 8px 8px 0',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: splitSide === 'left' ? 0 : '-100%',
                      width: '200%',
                      height: '100%',
                    }}
                  >
                    <Box
                      style={{
                        width: '100%',
                        height: '100%',
                        clipPath: splitSide === 'left' ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)',
                      }}
                    >
                      <CompositionRenderer
                        settings={{ ...screenSettings, composition: 'single' }}
                        screen={screen}
                        onPanChange={(x, y) => onPanChange?.(x, y, screenIndex)}
                        hoveredFrameIndex={hoveredScreenIndex === screenIndex ? hoveredFrameIndex : null}
                        onFrameHover={setHoveredFrameIndex}
                        dragFileCount={dragFileCount}
                        selectedFrameIndex={isPrimaryScreen ? selectedFrameIndex : undefined}
                        onSelectFrame={isPrimaryScreen ? onSelectFrame : undefined}
                        splitSide={splitSide}
                        isScreenSelected={selectedScreenIndices.includes(screenIndex)}
                      />
                    </Box>
                  </Box>
                  {screenSettings.showCaption && screenSettings.captionText && screen.images && screen.images.some(img => img.image || img.mediaId) && (
                    <Box
                      style={{
                        position: 'absolute',
                        top: `${screenSettings.captionVertical}%`,
                        left: `${screenSettings.captionHorizontal}%`,
                        transform: 'translate(-50%, -50%)',
                        color: '#1a1a1a',
                        fontSize: 32,
                        fontWeight: 700,
                        textAlign: 'center',
                        maxWidth: '80%',
                        pointerEvents: 'none',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      {screenSettings.captionText}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          }

          // Regular screen rendering (non-split)
          const screenSettings = {
            ...screen.settings,
            selectedScreenIndex: screenIndex,
          };

          const canvasDimensions = getCanvasDimensions(screenSettings.canvasSize, screenSettings.orientation);
          const aspectRatio = canvasDimensions.width / canvasDimensions.height;

          // Only show selection for the primary selected screen (last one)
          const isPrimaryScreen = screenIndex === selectedScreenIndices[selectedScreenIndices.length - 1];

          return (
            <Box
              key={screen.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center',
                height: '100%',
                width: aspectRatio > 1 ? '60vw' : '40vh',
                flexShrink: 0,
                marginLeft: 30, // Half of 60px gap for regular screens
                marginRight: 30, // Half of 60px gap for regular screens
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation(); // Stop propagation to parent
                const files = Array.from(e.dataTransfer.files);
                handleDrop(files, hoveredFrameIndex ?? undefined, screenIndex);
              }}
              onDragOver={(e) => {
                setHoveredScreenIndex(screenIndex);
              }}
            >
              <Box
                id={`canvas-${screen.id}`}
                data-canvas="true"
                style={{
                  width: '100%',
                  maxWidth: aspectRatio > 1 ? '90%' : 600,
                  aspectRatio: `${aspectRatio}`,
                  backgroundColor: screenSettings.backgroundColor,
                  position: 'relative',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <CompositionRenderer
                  settings={screenSettings}
                  screen={screen}
                  onPanChange={(frameIndex, x, y) => onPanChange?.(screenIndex, frameIndex, x, y)}
                  onFramePositionChange={(frameIndex, x, y) => onFramePositionChange?.(screenIndex, frameIndex, x, y)}
                  hoveredFrameIndex={hoveredScreenIndex === screenIndex ? hoveredFrameIndex : null}
                  onFrameHover={setHoveredFrameIndex}
                  dragFileCount={dragFileCount}
                  selectedFrameIndex={isPrimaryScreen ? selectedFrameIndex : undefined}
                  onSelectFrame={isPrimaryScreen ? onSelectFrame : undefined}
                  onMediaSelect={(frameIndex, mediaId) => onMediaSelect?.(screenIndex, frameIndex, mediaId)}
                  onPexelsSelect={(frameIndex, url) => onPexelsSelect?.(screenIndex, frameIndex, url)}
                />
                {screenSettings.showCaption && screenSettings.captionText && screen.images && screen.images.some(img => img.image || img.mediaId) && (
                  <Box
                    style={{
                      position: 'absolute',
                      top: `${screenSettings.captionVertical}%`,
                      left: `${screenSettings.captionHorizontal}%`,
                      transform: 'translate(-50%, -50%)',
                      color: '#1a1a1a',
                      fontSize: 32,
                      fontWeight: 700,
                      textAlign: 'center',
                      maxWidth: '80%',
                      pointerEvents: 'none',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {screenSettings.captionText}
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
