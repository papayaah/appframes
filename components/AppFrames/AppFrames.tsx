'use client';

import { useState } from 'react';
import { AppShell, Box } from '@mantine/core';
import { Header } from './Header';
import { SidebarTabs } from './SidebarTabs';
import { Canvas } from './Canvas';
import { ScreensPanel } from './ScreensPanel';
import { useFrames, getCanvasDimensions, getCompositionFrameCount } from './FramesContext';
import { Screen, CanvasSettings, ScreenImage, ScreensStudioActions } from './types';

// Re-export types for compatibility
export type { Screen, CanvasSettings, ScreenImage, ScreensStudioActions };

export function AppFrames() {
  const {
    screens,
    setScreens,
    zoom,
    setZoom,
    selectedScreenIndices,
    primarySelectedIndex,
    selectedFrameIndex,
    setSelectedFrameIndex,
    settings,
    setSettings,
    addScreen,
    removeScreen,
    handleScreenSelect,
    replaceScreen,
  } = useFrames();

  const [navWidth, setNavWidth] = useState(360); // Rail (80) + Panel (~280)

  const handleMediaUpload = async (file: File): Promise<number | null> => {
    try {
      const { db } = await import('../../lib/db');
      const { OPFSManager } = await import('../../lib/opfs');

      // Save to OPFS
      const fileName = `${Date.now()}-${file.name}`;
      await OPFSManager.saveFile(fileName, file);

      // Create thumbnail
      const thumbnail = await createThumbnail(file);

      // Get image dimensions
      const img = await createImageBitmap(file);
      const width = img.width;
      const height = img.height;

      // Save metadata to IndexedDB
      const id = await db.mediaFiles.add({
        name: file.name,
        fileHandle: fileName,
        thumbnail,
        width,
        height,
        size: file.size,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return id as number;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error uploading media:', error);
      return null;
    }
  };

  const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 200;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height >= width && height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleExport = async () => {
    try {
      const { toPng } = await import('html-to-image');
      // Export all visible canvases
      const canvasElements = document.querySelectorAll('[data-canvas="true"]');

      if (canvasElements.length === 0) {
        // eslint-disable-next-line no-alert
        alert('Canvas not found');
        return;
      }

      // For now, let's just export the primary selected screen's canvas.
      const primaryCanvas = document.getElementById(`canvas-${screens[primarySelectedIndex].id}`);
      const elementToExport = primaryCanvas || canvasElements[0] as HTMLElement;

      const dataUrl = await toPng(elementToExport, {
        quality: 1.0,
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `screenshot-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Export failed:', error);
      // eslint-disable-next-line no-alert
      alert('Export failed. Please try again.');
    }
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: navWidth, breakpoint: 'sm' }}
      padding={0}
      styles={{
        main: { backgroundColor: '#F9FAFB' },
        navbar: { overflow: 'visible' }, // Allow notch to protrude
      }}
    >
      <AppShell.Header>
        <Header
          onExport={handleExport}
          outputDimensions={`${getCanvasDimensions(settings.canvasSize, settings.orientation).width} × ${getCanvasDimensions(settings.canvasSize, settings.orientation).height}px`}
          zoom={zoom}
          onZoomChange={setZoom}
        />
      </AppShell.Header>

      <AppShell.Navbar p={0} style={{ borderRight: '1px solid #E5E7EB' }}>
        <SidebarTabs
          settings={settings}
          setSettings={setSettings}
          screens={screens}
          onPanelToggle={(isOpen) => setNavWidth(isOpen ? 360 : 80)}
          onMediaSelect={(mediaId) => {
            // If no screens exist, create one
            if (screens.length === 0) {
              addScreen(mediaId);
            } else {
              // Use selectedFrameIndex to determine which slot to fill
              replaceScreen(primarySelectedIndex, mediaId, selectedFrameIndex);
            }
          }}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Box style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
          <Canvas
            settings={settings}
            screens={screens}
            selectedScreenIndices={selectedScreenIndices}
            selectedFrameIndex={selectedFrameIndex}
            onSelectFrame={setSelectedFrameIndex}
            zoom={zoom}
            onReplaceScreen={async (files, targetFrameIndex, targetScreenIndex) => {
              try {
                // Use targetScreenIndex if provided, otherwise primarySelectedIndex
                const screenIndex = targetScreenIndex !== undefined ? targetScreenIndex : primarySelectedIndex;
                const targetScreen = screens[screenIndex];

                if (!targetScreen) return;

                const layoutFrameCount = getCompositionFrameCount(targetScreen.settings.composition);

                // Pre-process uploads
                const uploadPromises = files.map(file => handleMediaUpload(file));
                const mediaIds = await Promise.all(uploadPromises);

                // Limit to number of frames in composition
                const filesToProcess = Math.min(mediaIds.length, layoutFrameCount);

                // Update the target screen's images array
                setScreens(prevScreens => {
                  const updated = [...prevScreens];

                  if (!updated[screenIndex]) return prevScreens;

                  const screen = updated[screenIndex];
                  const newImages = [...screen.images];

                  // Ensure images array has enough slots for the composition
                  while (newImages.length < layoutFrameCount) {
                    newImages.push({});
                  }

                  // Add images to the current screen's images array
                  for (let i = 0; i < filesToProcess; i++) {
                    const mediaId = mediaIds[i];
                    if (!mediaId) continue;

                    let targetImageIndex = -1;

                    if (files.length > 1) {
                      // Multi-drop: fill image slots starting from targetFrameIndex (or 0 if not specified)
                      const startIndex = targetFrameIndex !== undefined ? targetFrameIndex : 0;
                      targetImageIndex = (startIndex + i) % layoutFrameCount;
                    } else {
                      // Single drop: use targetFrameIndex if specified, otherwise find first empty or use 0
                      if (targetFrameIndex !== undefined) {
                        targetImageIndex = targetFrameIndex;
                      } else {
                        targetImageIndex = newImages.findIndex(img => !img.image && !img.mediaId);
                        if (targetImageIndex === -1) {
                          targetImageIndex = 0; // Replace first image if all slots filled
                        }
                      }
                    }

                    if (targetImageIndex >= 0 && targetImageIndex < layoutFrameCount) {
                      newImages[targetImageIndex] = {
                        mediaId: mediaId,
                        image: undefined
                      };
                    }
                  }

                  updated[screenIndex] = {
                    ...screen,
                    images: newImages,
                  };

                  return updated;
                });

              } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Error processing dropped files:', error);
                // eslint-disable-next-line no-alert
                alert('Failed to process images. Please try again.');
              }
            }}
            onPanChange={(panX, panY, screenIndex) => {
              setScreens(prevScreens => {
                const updated = [...prevScreens];
                if (updated[screenIndex]) {
                  updated[screenIndex] = {
                    ...updated[screenIndex],
                    settings: {
                      ...updated[screenIndex].settings,
                      screenPanX: panX,
                      screenPanY: panY,
                    }
                  };
                }
                return updated;
              });
            }}
          />
          <ScreensPanel
            screens={screens}
            addScreen={addScreen}
            removeScreen={removeScreen}
            selectedIndices={selectedScreenIndices}
            onSelectScreen={handleScreenSelect}
            onMediaUpload={handleMediaUpload}
          />
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
