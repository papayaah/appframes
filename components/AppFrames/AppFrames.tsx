'use client';

import { useState } from 'react';
import { AppShell, Box } from '@mantine/core';
import { Header } from './Header';
import { SidebarTabs } from './SidebarTabs';
import { Canvas } from './Canvas';
import { ScreensPanel } from './ScreensPanel';

export interface Screen {
  id: string;
  mediaId?: number; // Optional: Reference to media library
  image?: string; // Optional: Base64 image (legacy support)
  name: string;
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

// Helper function to find the next empty screen index for smart frame filling
// Returns -1 if a new screen needs to be created
const findNextEmptyScreenIndex = (
  screens: Screen[],
  composition: string,
  currentIndex: number
): number => {
  // Handle empty screens array
  if (screens.length === 0) {
    return -1; // Signal to create new screen
  }
  
  // Determine how many frames the composition uses
  const frameCount = getCompositionFrameCount(composition);
  
  // If we don't have enough screens for the composition, signal to create new
  if (screens.length < frameCount) {
    return -1; // Signal to create new screen
  }
  
  // Find first empty frame within composition frame count
  for (let i = 0; i < Math.min(frameCount, screens.length); i++) {
    const screen = screens[i];
    if (!screen.mediaId && !screen.image) {
      return i;
    }
  }
  
  // All frames filled, use current selection
  return currentIndex;
};

export function AppFrames() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [settings, setSettings] = useState<CanvasSettings>({
    canvasSize: 'iphone-6.5-1',
    deviceFrame: 'iphone-14-pro',
    composition: 'single',
    compositionScale: 85,
    captionVertical: 10,
    captionHorizontal: 50,
    selectedScreenIndex: 0,
    screenScale: 100, // Changed from 50 to 100 to fill device frame by default
    screenPanX: 50,
    screenPanY: 50,
    orientation: 'portrait',
    backgroundColor: '#E5E7EB',
    captionText: 'Powerful tools for your workflow',
    showCaption: true,
  });

  const addScreen = (imageOrMediaId: string | number) => {
    const newScreen: Screen = {
      id: `screen-${Date.now()}-${Math.random()}`, // More unique ID
      ...(typeof imageOrMediaId === 'number' 
        ? { mediaId: imageOrMediaId } 
        : { image: imageOrMediaId }),
      name: `Screen ${screens.length + 1}`,
    };
    setScreens((prevScreens) => [...prevScreens, newScreen]);
    // Select the newly added screen
    setSettings((prevSettings) => ({ 
        ...prevSettings, 
        selectedScreenIndex: screens.length // use current length as new index
    }));
  };

  // Separate helper that just returns the new array without setting state immediately if needed, 
  // but since we need sequential updates for the loop, we might need to be careful with state updates.
  // Actually, state updates are batched. 
  // If we call setScreens multiple times in a loop, it might not work as expected if relying on previous state variable.
  // We should accumulate changes.

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
    const newScreens = screens.filter((s) => s.id !== id);
    setScreens(newScreens);
    // Adjust selected index if needed
    if (settings.selectedScreenIndex >= newScreens.length && newScreens.length > 0) {
      setSettings({ ...settings, selectedScreenIndex: newScreens.length - 1 });
    }
  };

  const handleExport = async () => {
    try {
      const { toPng } = await import('html-to-image');
      const canvasElement = document.querySelector('[data-canvas="true"]') as HTMLElement;
      
      if (!canvasElement) {
        // eslint-disable-next-line no-alert
        alert('Canvas not found');
        return;
      }

      const dataUrl = await toPng(canvasElement, {
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

  const replaceScreen = (index: number, imageOrMediaId: string | number) => {
      setScreens(prevScreens => {
          const updatedScreens = [...prevScreens];
          if (updatedScreens[index]) {
              updatedScreens[index] = {
                  ...updatedScreens[index],
                  ...(typeof imageOrMediaId === 'number'
                      ? { mediaId: imageOrMediaId, image: undefined }
                      : { image: imageOrMediaId, mediaId: undefined }),
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
              replaceScreen(settings.selectedScreenIndex, mediaId);
            }
          }}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Box style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
          <Canvas 
            settings={settings} 
            screens={screens} 
            onReplaceScreen={async (files) => {
              try {
                const layoutFrameCount = getCompositionFrameCount(settings.composition);
                
                // Pre-process uploads
                const uploadPromises = files.map(file => handleMediaUpload(file));
                const mediaIds = await Promise.all(uploadPromises);
                
                // We need to work with a snapshot of screens to determine what happens
                // Since setState is async, we can't rely on `screens` updating inside the loop
                let currentScreens = [...screens];
                let newSettings = { ...settings };

                for (let i = 0; i < mediaIds.length; i++) {
                    const mediaId = mediaIds[i];
                    if (!mediaId) continue;

                    let targetIndex = -1;

                    if (files.length > 1) {
                        // Multi-drop: fill 0, 1, 2... regardless of current selection?
                        // Or fill sequential starting from selection?
                        // "dropping 3 images should fill all 3 images" -> implies filling 0, 1, 2 if 3 slots
                        if (i < layoutFrameCount) {
                            targetIndex = i;
                        }
                    } else {
                        // Single drop
                        targetIndex = findNextEmptyScreenIndex(
                            currentScreens, 
                            newSettings.composition, 
                            newSettings.selectedScreenIndex
                        );
                    }

                    // If target is valid
                    if (targetIndex !== -1 && targetIndex < layoutFrameCount) {
                        if (targetIndex < currentScreens.length) {
                            // Update existing screen in our local copy
                            currentScreens[targetIndex] = {
                                ...currentScreens[targetIndex],
                                mediaId: mediaId,
                                image: undefined
                            };
                        } else {
                            // Create new screen
                            const newScreen: Screen = {
                                id: `screen-${Date.now()}-${i}`,
                                mediaId: mediaId,
                                name: `Screen ${currentScreens.length + 1}`,
                            };
                            currentScreens.push(newScreen);
                        }
                        
                        // Update selection index for the last item
                        if (i === mediaIds.length - 1) {
                            newSettings.selectedScreenIndex = targetIndex;
                        }
                    } else if (targetIndex === -1) {
                        // Fallback: add new screen
                        const newScreen: Screen = {
                            id: `screen-${Date.now()}-${i}`,
                            mediaId: mediaId,
                            name: `Screen ${currentScreens.length + 1}`,
                        };
                        currentScreens.push(newScreen);
                        
                        if (i === mediaIds.length - 1) {
                            newSettings.selectedScreenIndex = currentScreens.length - 1;
                        }
                    }
                }

                // Batch update state
                setScreens(currentScreens);
                setSettings(newSettings);

              } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Error processing dropped files:', error);
                // eslint-disable-next-line no-alert
                alert('Failed to process images. Please try again.');
              }
            }}
            onPanChange={(panX, panY) => setSettings({ ...settings, screenPanX: panX, screenPanY: panY })}
          />
          <ScreensPanel
            screens={screens}
            addScreen={addScreen}
            removeScreen={removeScreen}
            selectedIndex={settings.selectedScreenIndex}
            onSelectScreen={(index) => setSettings({ ...settings, selectedScreenIndex: index })}
            onMediaUpload={handleMediaUpload}
          />
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
