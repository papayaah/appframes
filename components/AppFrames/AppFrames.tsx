'use client';

import { useState } from 'react';
import { AppShell, Box } from '@mantine/core';
import { Header } from './Header';
import { SidebarTabs } from './SidebarTabs';
import { Canvas } from './Canvas';
import { ScreensPanel } from './ScreensPanel';

export interface ScreenImage {
  image?: string; // Base64 image (legacy support)
  mediaId?: number; // Reference to media library
}

export interface Screen {
  id: string;
  images: ScreenImage[]; // Array of images for this screen's composition (1 for single, 2 for dual/stack, 3 for triple/fan)
  name: string;
  settings: Omit<CanvasSettings, 'selectedScreenIndex'>; // Each screen has its own settings
}

export interface CanvasSettings {
  canvasSize: string; // Export dimensions (App Store requirements)
  deviceFrame: string; // Visual frame type
  composition: 'single' | 'dual' | 'stack' | 'triple' | 'fan';
  compositionScale: number;
  captionVertical: number;
  captionHorizontal: number;
  selectedScreenIndex: number;
  screenScale: number;
  screenPanX: number;
  screenPanY: number;
  orientation: 'portrait' | 'landscape';
  backgroundColor: string;
  captionText: string;
  showCaption: boolean;
}

export interface ScreensStudioActions {
  addScreen: (image: string) => void;
  replaceScreen: (index: number, image: string) => void;
  removeScreen: (id: string) => void;
}

// Canvas dimensions helper (App Store requirements)
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

// Helper function to determine how many device frames a composition uses
const getCompositionFrameCount = (composition: string): number => {
  switch (composition) {
    case 'single': return 1;
    case 'dual': return 2;
    case 'stack': return 2;
    case 'triple': return 3;
    case 'fan': return 3;
    default: return 1;
  }
};

// Helper function to get default settings for a new screen
const getDefaultScreenSettings = (): Omit<CanvasSettings, 'selectedScreenIndex'> => {
  return {
    canvasSize: 'iphone-6.5-1',
    deviceFrame: 'iphone-14-pro',
    composition: 'single',
    compositionScale: 85,
    captionVertical: 10,
    captionHorizontal: 50,
    screenScale: 100,
    screenPanX: 50,
    screenPanY: 50,
    orientation: 'portrait',
    backgroundColor: '#E5E7EB',
    captionText: 'Powerful tools for your workflow',
    showCaption: true,
  };
};

export function AppFrames() {
  // Initialize with one empty screen with default settings
  const [screens, setScreens] = useState<Screen[]>([
    {
      id: `screen-${Date.now()}`,
      name: 'Screen 1',
      images: [], // Empty images array - will be populated based on composition
      settings: getDefaultScreenSettings(),
    },
  ]);
  const [zoom, setZoom] = useState<number>(100);
  // Support multi-selection
  const [selectedScreenIndices, setSelectedScreenIndices] = useState<number[]>([0]);

  // Primary selected screen is the last one in the selection list (most recently selected)
  const primarySelectedIndex = selectedScreenIndices.length > 0
    ? selectedScreenIndices[selectedScreenIndices.length - 1]
    : 0;

  // Get current screen's settings (computed from primary selected screen)
  const currentScreen = screens[primarySelectedIndex];
  const settings: CanvasSettings = currentScreen
    ? { ...currentScreen.settings, selectedScreenIndex: primarySelectedIndex }
    : { ...getDefaultScreenSettings(), selectedScreenIndex: 0 };

  const handleScreenSelect = (index: number, multi: boolean) => {
    if (multi) {
      setSelectedScreenIndices(prev => {
        if (prev.includes(index)) {
          // Deselect if already selected, unless it's the only one
          const newIndices = prev.filter(i => i !== index);
          return newIndices.length > 0 ? newIndices : [index];
        } else {
          return [...prev, index];
        }
      });
    } else {
      setSelectedScreenIndices([index]);
    }
  };

  const addScreen = (imageOrMediaId?: string | number) => {
    const defaultSettings = getDefaultScreenSettings();
    const frameCount = getCompositionFrameCount(defaultSettings.composition);

    // Initialize images array based on composition type
    const images: ScreenImage[] = Array(frameCount).fill(null).map(() => ({}));

    // If an image was provided, add it to the first slot
    if (imageOrMediaId) {
      if (typeof imageOrMediaId === 'number') {
        images[0] = { mediaId: imageOrMediaId };
      } else {
        images[0] = { image: imageOrMediaId };
      }
    }

    const newScreen: Screen = {
      id: `screen-${Date.now()}-${Math.random()}`, // More unique ID
      images,
      name: `Screen ${screens.length + 1}`,
      settings: defaultSettings, // Each screen gets its own default settings
    };
    setScreens((prevScreens) => [...prevScreens, newScreen]);
    // Select the newly added screen (exclusive selection)
    setSelectedScreenIndices([screens.length]);
  };

  // Update settings for the currently selected screen(s)
  // Currently we only update the primary selected screen to avoid complexity,
  // but we could potentially update all selected screens here.
  const updateSelectedScreenSettings = (updates: Partial<Omit<CanvasSettings, 'selectedScreenIndex'>>) => {
    setScreens((prevScreens) => {
      const updated = [...prevScreens];
      // Only update the primary selected screen for now
      if (updated[primarySelectedIndex]) {
        const screen = updated[primarySelectedIndex];
        const newSettings = {
          ...screen.settings,
          ...updates,
        };

        // If composition changed, resize images array to match new composition
        let newImages = [...(screen.images || [])];
        if (updates.composition && updates.composition !== screen.settings.composition) {
          const oldFrameCount = getCompositionFrameCount(screen.settings.composition);
          const newFrameCount = getCompositionFrameCount(updates.composition);

          if (newFrameCount > oldFrameCount) {
            // Add empty slots
            while (newImages.length < newFrameCount) {
              newImages.push({});
            }
          } else if (newFrameCount < oldFrameCount) {
            // Remove extra slots (keep first N)
            newImages = newImages.slice(0, newFrameCount);
          }
        }

        updated[primarySelectedIndex] = {
          ...screen,
          settings: newSettings,
          images: newImages,
        };
      }
      return updated;
    });
  };

  // Set settings (for backward compatibility, updates selected screen)
  const setSettings = (newSettings: CanvasSettings | ((prev: CanvasSettings) => CanvasSettings)) => {
    const settingsToApply = typeof newSettings === 'function'
      ? newSettings(settings)
      : newSettings;

    // Update selected screen index if it changed (via sidebar navigation or something?)
    // This part is tricky with multi-selection. If the sidebar tries to change the index,
    // we assume it means "select this screen exclusively".
    if (settingsToApply.selectedScreenIndex !== primarySelectedIndex) {
      setSelectedScreenIndices([settingsToApply.selectedScreenIndex]);
    }

    // Update the selected screen's settings (excluding selectedScreenIndex)
    const { selectedScreenIndex: _, ...screenSettings } = settingsToApply;
    updateSelectedScreenSettings(screenSettings);
  };

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

  const removeScreen = (id: string) => {
    // Find index of screen to remove
    const indexToRemove = screens.findIndex(s => s.id === id);
    if (indexToRemove === -1) return;

    const newScreens = screens.filter((s) => s.id !== id);
    setScreens(newScreens);

    // Adjust selected indices
    setSelectedScreenIndices(prev => {
      // Remove the removed index
      let newIndices = prev.filter(i => i !== indexToRemove);

      // Shift indices greater than the removed index
      newIndices = newIndices.map(i => i > indexToRemove ? i - 1 : i);

      // If no screens left, select 0 (but screens array is empty, so handle that)
      if (newScreens.length === 0) return [0];

      // If selection is empty (because we removed the only selected one), select the last one or 0
      if (newIndices.length === 0) {
        return [Math.max(0, Math.min(indexToRemove, newScreens.length - 1))];
      }

      return newIndices;
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

      // If multiple canvases, we might need to export them individually or as a zip?
      // For now, let's just export the first one or the primary one.
      // Or maybe the user wants to export all of them?
      // The current implementation finds the first one.
      // Let's try to export the primary one for now, or loop through them.

      // If we want to export what's visible, we should probably export the container?
      // But the container has scrollbars.

      // Let's stick to the current behavior which finds the first one, but maybe we should find the primary one?
      // The primary one corresponds to primarySelectedIndex.
      // We can add IDs to canvases.

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

  const replaceScreen = (index: number, imageOrMediaId: string | number, imageSlotIndex: number = 0) => {
    setScreens(prevScreens => {
      const updatedScreens = [...prevScreens];
      if (updatedScreens[index]) {
        const screen = updatedScreens[index];
        const newImages = [...(screen.images || [])];

        // Ensure the images array has enough slots
        const frameCount = getCompositionFrameCount(screen.settings.composition);
        while (newImages.length < frameCount) {
          newImages.push({});
        }

        // Update the specified image slot (default to first slot)
        if (imageSlotIndex < newImages.length) {
          newImages[imageSlotIndex] = typeof imageOrMediaId === 'number'
            ? { mediaId: imageOrMediaId, image: undefined }
            : { image: imageOrMediaId, mediaId: undefined };
        }

        updatedScreens[index] = {
          ...screen,
          images: newImages,
        };
      }
      return updatedScreens;
    });
  };


  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: 'sm' }}
      padding={0}
      styles={{
        main: { backgroundColor: '#F9FAFB' },
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
          onMediaSelect={(mediaId) => {
            // If no screens exist, create one
            if (screens.length === 0) {
              addScreen(mediaId);
            } else {
              replaceScreen(primarySelectedIndex, mediaId);
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
