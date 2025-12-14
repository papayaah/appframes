'use client';

import { useState, useEffect } from 'react';
import { AppShell, Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Header } from './Header';
import { SidebarTabs } from './SidebarTabs';
import { Canvas } from './Canvas';
import { ScreensPanel } from './ScreensPanel';
import { useFrames, getCanvasDimensions, getCompositionFrameCount } from './FramesContext';
import { Screen, CanvasSettings, ScreenImage, AppFramesActions } from './types';
import { CrossCanvasDragProvider } from './CrossCanvasDragContext';

// Re-export types for compatibility
export type { Screen, CanvasSettings, ScreenImage, AppFramesActions };

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
    currentProjectName,
    createNewProject,
    switchProject,
    deleteProject,
    renameProject,
    getAllProjects,
    saveStatus,
  } = useFrames();

  const [navWidth, setNavWidth] = useState(360); // Rail (80) + Panel (~280)

  // Initialize persistence database and handle errors
  useEffect(() => {
    const initPersistence = async () => {
      try {
        const { persistenceDB } = await import('../../lib/PersistenceDB');
        await persistenceDB.init();
      } catch (error) {
        console.error('Failed to initialize persistence:', error);
        notifications.show({
          title: 'Persistence Unavailable',
          message: 'Your work will not be saved across sessions. The app will continue to work in memory-only mode.',
          color: 'yellow',
          autoClose: 10000,
        });
      }
    };

    initPersistence();
  }, []);

  const handleMediaUpload = async (file: File): Promise<number | null> => {
    try {
      const { persistenceDB } = await import('../../lib/PersistenceDB');
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
      const id = await persistenceDB.addMediaFile({
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

  // Handle device frame change for a specific frame
  const handleFrameDeviceChange = (frameIndex: number, deviceFrame: string) => {
    setScreens((prevScreens) => {
      const updated = [...prevScreens];
      const screen = updated[primarySelectedIndex];
      
      if (screen) {
        const newImages = [...(screen.images || [])];
        
        // Ensure the images array has enough slots
        const frameCount = getCompositionFrameCount(screen.settings.composition);
        while (newImages.length < frameCount) {
          newImages.push({});
        }
        
        // Update the specific frame's device
        if (frameIndex < newImages.length) {
          newImages[frameIndex] = {
            ...newImages[frameIndex],
            deviceFrame,
          };
        }
        
        updated[primarySelectedIndex] = {
          ...screen,
          images: newImages,
        };
      }
      
      return updated;
    });
  };

  // Helper to convert canvas element to PNG blob
  const canvasToBlob = async (element: HTMLElement): Promise<Blob> => {
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(element, {
      quality: 1.0,
      pixelRatio: 2,
    });
    const response = await fetch(dataUrl);
    return response.blob();
  };

  // Download currently visible/selected screens individually
  const handleDownload = async () => {
    try {
      const { toPng } = await import('html-to-image');

      // Download each currently visible screen
      for (const screenIndex of selectedScreenIndices) {
        const screen = screens[screenIndex];
        if (!screen) {
          continue;
        }

        const canvasElement = document.getElementById(`canvas-${screen.id}`);
        if (!canvasElement) {
          continue;
        }

        const dataUrl = await toPng(canvasElement, {
          quality: 1.0,
          pixelRatio: 2,
        });

        const link = document.createElement('a');
        link.download = `${screen.name || `screen-${screenIndex + 1}`}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();

        // Small delay between downloads to prevent browser blocking
        if (selectedScreenIndices.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Download failed:', error);
      // eslint-disable-next-line no-alert
      alert('Download failed. Please try again.');
    }
  };

  // Export all screens from the panel (zip if multiple, single file if one)
  const handleExport = async () => {
    try {
      if (screens.length === 0) {
        // eslint-disable-next-line no-alert
        alert('No screens to export');
        return;
      }

      if (screens.length === 1) {
        // Single screen - just download directly
        const screen = screens[0];
        const canvasElement = document.getElementById(`canvas-${screen.id}`);
        if (!canvasElement) {
          // eslint-disable-next-line no-alert
          alert('Canvas not found');
          return;
        }

        const { toPng } = await import('html-to-image');
        const dataUrl = await toPng(canvasElement, {
          quality: 1.0,
          pixelRatio: 2,
        });

        const link = document.createElement('a');
        link.download = `${screen.name || 'screen'}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        // Multiple screens - create a zip file
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        // We need to render each screen to capture it
        // For screens not currently visible, we'll need to temporarily select them
        for (let i = 0; i < screens.length; i++) {
          const screen = screens[i];

          // Check if canvas is already rendered
          const canvasElement = document.getElementById(`canvas-${screen.id}`);

          if (!canvasElement) {
            // Screen not currently rendered - we need to skip it or handle differently
            // For now, we'll only export screens that are currently visible
            // In a future enhancement, we could temporarily render each screen
            continue;
          }

          try {
            const blob = await canvasToBlob(canvasElement);
            const fileName = `${String(i + 1).padStart(2, '0')}-${screen.name || `screen-${i + 1}`}.png`;
            zip.file(fileName, blob);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error(`Failed to capture screen ${i}:`, err);
          }
        }

        // Check if we captured any screens
        const fileCount = Object.keys(zip.files).length;
        if (fileCount === 0) {
          // eslint-disable-next-line no-alert
          alert('No screens could be captured. Make sure at least one screen is visible.');
          return;
        }

        // Generate and download the zip file
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.download = `appframes-export-${Date.now()}.zip`;
        link.href = URL.createObjectURL(zipBlob);
        link.click();
        URL.revokeObjectURL(link.href);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Export failed:', error);
      // eslint-disable-next-line no-alert
      alert('Export failed. Please try again.');
    }
  };

  return (
    <CrossCanvasDragProvider>
    <AppShell
      header={{ height: 45 }}
      navbar={{ width: navWidth, breakpoint: 'sm' }}
      padding={0}
      styles={{
        main: { backgroundColor: '#F9FAFB' },
        navbar: { overflow: 'visible' }, // Allow notch to protrude
      }}
    >
      <AppShell.Header>
        <Header
          onDownload={handleDownload}
          onExport={handleExport}
          outputDimensions={`${getCanvasDimensions(settings.canvasSize, settings.orientation).width} × ${getCanvasDimensions(settings.canvasSize, settings.orientation).height}px`}
          zoom={zoom}
          onZoomChange={setZoom}
          selectedCount={selectedScreenIndices.length}
          totalCount={screens.length}
          currentProjectName={currentProjectName}
          onCreateProject={createNewProject}
          onSwitchProject={switchProject}
          onRenameProject={renameProject}
          onDeleteProject={deleteProject}
          onGetAllProjects={getAllProjects}
          saveStatus={saveStatus}
        />
      </AppShell.Header>

      <AppShell.Navbar p={0} style={{ borderRight: '1px solid #E5E7EB' }}>
        <SidebarTabs
          settings={settings}
          setSettings={setSettings}
          screens={screens}
          selectedFrameIndex={selectedFrameIndex}
          onFrameDeviceChange={handleFrameDeviceChange}
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
        <Box style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
          <Canvas
            settings={settings}
            screens={screens}
            selectedScreenIndices={selectedScreenIndices}
            selectedFrameIndex={selectedFrameIndex}
            onSelectFrame={setSelectedFrameIndex}
            onSelectScreen={handleScreenSelect}
            zoom={zoom}
            onZoomChange={setZoom}
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
            onPanChange={(screenIndex, frameIndex, panX, panY) => {
              setScreens(prevScreens => {
                const updated = [...prevScreens];
                if (updated[screenIndex]) {
                  const screen = updated[screenIndex];
                  const newImages = [...screen.images];
                  // Ensure the frame slot exists
                  while (newImages.length <= frameIndex) {
                    newImages.push({});
                  }
                  newImages[frameIndex] = {
                    ...newImages[frameIndex],
                    panX,
                    panY,
                  };
                  updated[screenIndex] = {
                    ...screen,
                    images: newImages,
                  };
                }
                return updated;
              });
            }}
            onFramePositionChange={(screenIndex, frameIndex, frameX, frameY) => {
              setScreens(prevScreens => {
                const updated = [...prevScreens];
                if (updated[screenIndex]) {
                  const screen = updated[screenIndex];
                  const newImages = [...screen.images];
                  // Ensure the frame slot exists
                  while (newImages.length <= frameIndex) {
                    newImages.push({});
                  }
                  // Get current position and add delta
                  const currentFrameX = newImages[frameIndex]?.frameX ?? 0;
                  const currentFrameY = newImages[frameIndex]?.frameY ?? 0;
                  newImages[frameIndex] = {
                    ...newImages[frameIndex],
                    frameX: currentFrameX + frameX,
                    frameY: currentFrameY + frameY,
                  };
                  updated[screenIndex] = {
                    ...screen,
                    images: newImages,
                  };
                }
                return updated;
              });
            }}
            onMediaSelect={(screenIndex, frameIndex, mediaId) => {
              replaceScreen(screenIndex, mediaId, frameIndex);
            }}
            onPexelsSelect={async (screenIndex, frameIndex, url) => {
              try {
                // Fetch the pexels image and upload to media library
                const res = await fetch(url);
                const blob = await res.blob();
                const fileName = url.split('/').pop() || 'pexels-image.jpg';
                const file = new File([blob], fileName, { type: blob.type });
                const mediaId = await handleMediaUpload(file);
                if (mediaId) {
                  replaceScreen(screenIndex, mediaId, frameIndex);
                }
              } catch (error) {
                console.error('Error importing pexels image:', error);
              }
            }}
            onCaptionPositionChange={(screenIndex, x, y) => {
              setScreens(prevScreens => {
                const updated = [...prevScreens];
                if (updated[screenIndex]) {
                  updated[screenIndex] = {
                    ...updated[screenIndex],
                    settings: {
                      ...updated[screenIndex].settings,
                      captionHorizontal: x,
                      captionVertical: y,
                    },
                  };
                }
                return updated;
              });
            }}
            onCaptionTextChange={(screenIndex, text) => {
              setScreens(prevScreens => {
                const updated = [...prevScreens];
                if (updated[screenIndex]) {
                  updated[screenIndex] = {
                    ...updated[screenIndex],
                    settings: {
                      ...updated[screenIndex].settings,
                      captionText: text,
                    },
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
    </CrossCanvasDragProvider>
  );
}
