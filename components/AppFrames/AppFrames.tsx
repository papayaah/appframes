'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Header } from './Header';
import { SidebarTabs } from './SidebarTabs';
import { Canvas } from './Canvas';
import { ScreensPanel } from './ScreensPanel';
import { HistorySidebar } from './HistorySidebar';
import { useFrames, getCanvasDimensions, getCompositionFrameCount } from './FramesContext';
import { Screen, CanvasSettings, ScreenImage, AppFramesActions, clampFrameTransform } from './types';
import { CrossCanvasDragProvider } from './CrossCanvasDragContext';
import { InteractionLockProvider } from './InteractionLockContext';
import { exportService } from '@/lib/ExportService';
import { useUndoRedoHotkeys } from '@/hooks/useUndoRedoHotkeys';

// Re-export types for compatibility
export type { Screen, CanvasSettings, ScreenImage, AppFramesActions };

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!target || !(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return !!target.closest('input, textarea, [contenteditable="true"], [role="textbox"]');
};

export function AppFrames() {
  const router = useRouter();
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
    updateTextElement,
    deleteTextElement,
    selectTextElement,
    reorderScreens,
    mediaCache,
    undo,
    redo,
    canUndo,
    canRedo,
    historyEntries,
    historyPosition,
    goToHistory,
    setCanvasBackgroundMedia,
    clearFrameSlot,
    setFrameDevice,
    setFramePan,
    addFramePositionDelta,
    setFrameScale,
    setFrameRotate,
    downloadFormat,
    downloadJpegQuality,
    setDownloadFormat,
    setDownloadJpegQuality,
  } = useFrames();

  const [navWidth, setNavWidth] = useState(360); // Rail (80) + Panel (~280)
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const historyWidth = historyPanelOpen ? 320 : 16;

  useUndoRedoHotkeys({
    undo,
    redo,
    canUndo,
    canRedo,
    isEditableTarget,
  });

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

  const handleMediaUpload = useCallback(async (file: File): Promise<number | null> => {
    try {
      const { saveFileToOpfs, addAssetToDB, getAssetType } = await import('@reactkits.dev/react-media-library');

      const handleName = await saveFileToOpfs(file);
      const id = await addAssetToDB({
        handleName,
        fileName: file.name,
        fileType: getAssetType(file.type),
        mimeType: file.type,
        size: file.size,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return typeof id === 'number' ? id : Number(id);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error uploading media:', error);
      return null;
    }
  }, []);

  // Paste clipboard screenshots/images into the currently selected frame
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      try {
        // Don't hijack paste when user is typing into an input/textarea/contenteditable
        if (isEditableTarget(e.target)) return;

        const clipboard = e.clipboardData;
        if (!clipboard?.items?.length) return;

        const items = Array.from(clipboard.items);
        const imageItem = items.find(item => item.type?.startsWith('image/'));
        if (!imageItem) return;

        const pastedFile = imageItem.getAsFile();
        if (!pastedFile) return;

        // We are handling the paste ourselves (avoid browser default behavior)
        e.preventDefault();

        const normalizedFile = pastedFile.name && pastedFile.name.trim().length > 0
          ? pastedFile
          : new File([pastedFile], `clipboard-${Date.now()}.png`, { type: pastedFile.type || 'image/png' });

        const mediaId = await handleMediaUpload(normalizedFile);
        if (!mediaId) {
          notifications.show({
            title: 'Paste failed',
            message: 'Could not import the image from your clipboard.',
            color: 'red',
          });
          return;
        }

        // If no screens exist, create one with the pasted media
        if (screens.length === 0) {
          addScreen(mediaId);
          return;
        }

        // Paste into the currently selected frame slot of the primary selected screen
        const targetScreen = screens[primarySelectedIndex];
        const frameCount = targetScreen ? getCompositionFrameCount(targetScreen.settings.composition) : 1;
        const safeFrameIndex = Math.max(0, Math.min(selectedFrameIndex, frameCount - 1));
        replaceScreen(primarySelectedIndex, mediaId, safeFrameIndex);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error handling paste:', error);
      }
    };

    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addScreen, handleMediaUpload, primarySelectedIndex, replaceScreen, screens, selectedFrameIndex]);

  // Delete selected text element (Delete/Backspace) when not editing
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (isEditableTarget(e.target)) return;

      const screen = screens[primarySelectedIndex];
      const selectedTextId = screen?.settings?.selectedTextId;
      if (!screen) return;

      if (selectedTextId) {
        e.preventDefault();
        deleteTextElement(screen.id, selectedTextId);
        return;
      }

      // No text selected: treat Delete/Backspace as "delete the frame slot" (blank canvas).
      // This clears the frame choice and removes any image from that slot.
      e.preventDefault();
      clearFrameSlot(primarySelectedIndex, selectedFrameIndex);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteTextElement, primarySelectedIndex, screens, selectedFrameIndex, setScreens]);

  // Handle device frame change for a specific frame
  const handleFrameDeviceChange = (frameIndex: number, deviceFrame: string) => {
    setFrameDevice(primarySelectedIndex, frameIndex, deviceFrame);
  };

  // Helper to convert canvas element to PNG blob
  // Download currently visible/selected screens individually
  const handleDownload = async () => {
    try {
      const canvasSize = settings.canvasSize;
      const { toPng } = await import('html-to-image');
      const { initDB, getFileFromOpfs } = await import('@reactkits.dev/react-media-library');
      const mediaDb = await initDB();

      const fileToDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

      const extractCssUrls = (cssValue: string): string[] => {
        if (!cssValue || cssValue === 'none') return [];
        const out: string[] = [];
        const re = /url\(["']?(.*?)["']?\)/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(cssValue)) != null) {
          const u = (m[1] || '').trim();
          if (u) out.push(u);
        }
        return out;
      };

      const replaceBlobUrlsWithDataUrls = async (root: HTMLElement) => {
        const reverse = new Map<string, number>();
        Object.entries(mediaCache || {}).forEach(([id, url]) => {
          if (url) reverse.set(url, Number(id));
        });

        const blobToData = new Map<string, string>();
        const ensureDataUrl = async (blobUrl: string): Promise<string | null> => {
          if (blobToData.has(blobUrl)) return blobToData.get(blobUrl)!;

          const mediaId = reverse.get(blobUrl);
          if (typeof mediaId === 'number' && Number.isFinite(mediaId)) {
            const asset = await mediaDb.get('assets', mediaId);
            if (asset) {
              const file = await getFileFromOpfs(asset.handleName);
              if (file) {
                const dataUrl = await fileToDataUrl(file);
                blobToData.set(blobUrl, dataUrl);
                return dataUrl;
              }
            }
          }

          // Fallback: try fetch(blob:) → data URL (may fail on some browsers)
          try {
            const resp = await fetch(blobUrl);
            const blob = await resp.blob();
            const file = new File([blob], 'image', { type: blob.type || 'image/png' });
            const dataUrl = await fileToDataUrl(file);
            blobToData.set(blobUrl, dataUrl);
            return dataUrl;
          } catch {
            return null;
          }
        };

        const restoreFns: Array<() => void> = [];
        const nodes: HTMLElement[] = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];
        for (const el of nodes) {
          const prevBgImg = el.style.backgroundImage;
          const prevBg = el.style.background;
          const urls = [
            ...extractCssUrls(prevBgImg),
            ...extractCssUrls(prevBg),
          ].filter((u) => u.startsWith('blob:'));
          if (urls.length === 0) continue;

          let nextBgImg = prevBgImg;
          let nextBg = prevBg;
          for (const u of urls) {
            const dataUrl = await ensureDataUrl(u);
            if (!dataUrl) continue;
            if (nextBgImg) nextBgImg = nextBgImg.split(u).join(dataUrl);
            if (nextBg) nextBg = nextBg.split(u).join(dataUrl);
          }

          if (nextBgImg !== prevBgImg) {
            restoreFns.push(() => { el.style.backgroundImage = prevBgImg; });
            el.style.backgroundImage = nextBgImg;
          }
          if (nextBg !== prevBg) {
            restoreFns.push(() => { el.style.background = prevBg; });
            el.style.background = nextBg;
          }
        }

        return () => restoreFns.forEach((fn) => fn());
      };

      // Download each currently visible screen
      for (const screenIndex of selectedScreenIndices) {
        const screen = screens[screenIndex];
        if (!screen) {
          continue;
        }
        const canvasElement = document.getElementById(`canvas-${screen.id}`) as HTMLElement | null;
        if (!canvasElement) continue;

        // Export at exact store pixels while preserving the on-screen layout.
        const dims = getCanvasDimensions(canvasSize, screen.settings.orientation ?? 'portrait');
        const rect = canvasElement.getBoundingClientRect();

        // Hide interactive UI (handles/buttons) and replace blob: background urls with data: URLs for export.
        document.body.dataset.appframesExporting = 'true';
        const restoreBg = await replaceBlobUrlsWithDataUrls(canvasElement);
        try {
          // 1) Capture what you see at a higher pixel ratio.
          const ratioX = rect.width > 0 ? dims.width / rect.width : 1;
          const ratioY = rect.height > 0 ? dims.height / rect.height : 1;
          const captureRatio = Math.max(2, Math.min(4, Math.ceil(Math.max(ratioX, ratioY))));

          const dataUrl = await toPng(canvasElement, {
            cacheBust: true,
            pixelRatio: captureRatio,
            backgroundColor: screen.settings.backgroundColor === 'transparent' ? 'transparent' : undefined,
            filter: (node) => {
              if (!(node instanceof HTMLElement)) return true;
              return node.dataset.exportHide !== 'true';
            },
          });

          // 2) Resample onto an exact-size output canvas, centered.
          const img = new Image();
          img.decoding = 'async';
          img.src = dataUrl;
          try {
            // @ts-ignore
            await img.decode?.();
          } catch {
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error('Failed to load export image'));
            });
          }

          const out = document.createElement('canvas');
          out.width = dims.width;
          out.height = dims.height;
          const ctx = out.getContext('2d');
          if (!ctx) throw new Error('Canvas 2D context unavailable');

          const bg = screen.settings.backgroundColor;
          // JPG can't have alpha; PNG optionally can. If exporting JPG (or PNG with a solid bg),
          // ensure we paint a background so the store upload won't reject alpha.
          if (downloadFormat === 'jpg') {
            ctx.fillStyle = bg && bg !== 'transparent' ? bg : '#ffffff';
            ctx.fillRect(0, 0, out.width, out.height);
          } else if (bg && bg !== 'transparent') {
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, out.width, out.height);
          }

          // Fit (no crop) and center.
          const s = Math.min(out.width / img.width, out.height / img.height);
          const dw = Math.round(img.width * s);
          const dh = Math.round(img.height * s);
          const dx = Math.round((out.width - dw) / 2);
          const dy = Math.round((out.height - dh) / 2);
          ctx.drawImage(img, dx, dy, dw, dh);

          const outMime = downloadFormat === 'jpg' ? 'image/jpeg' : 'image/png';
          const outExt = downloadFormat === 'jpg' ? 'jpg' : 'png';
          const blob = await new Promise<Blob>((resolve, reject) => {
            out.toBlob(
              (b) => (b ? resolve(b) : reject(new Error(`Failed to encode ${outExt.toUpperCase()}`))),
              outMime,
              downloadFormat === 'jpg' ? Math.max(0, Math.min(1, downloadJpegQuality / 100)) : undefined,
            );
          });
          exportService.downloadBlob(blob, `${screen.name || `screen-${screenIndex + 1}`}-${Date.now()}.${outExt}`);
        } finally {
          restoreBg?.();
          delete document.body.dataset.appframesExporting;
        }

        // Small delay between downloads to prevent browser blocking
        if (selectedScreenIndices.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Download failed:', error);
      const msg = error instanceof Error ? error.message : String(error);
      notifications.show({
        title: 'Download failed',
        message: msg || 'Please try again.',
        color: 'red',
      });
    }
  };

  return (
    <CrossCanvasDragProvider>
    <InteractionLockProvider>
      <AppShell
      header={{ height: 45 }}
      navbar={{ width: navWidth, breakpoint: 'sm' }}
      aside={{ width: historyWidth, breakpoint: 'sm' }}
      padding={0}
      styles={{
        main: { backgroundColor: '#F9FAFB' },
        navbar: { overflow: 'visible' }, // Allow notch to protrude
        aside: { overflow: 'visible' }, // Allow notch to protrude
      }}
    >
      <AppShell.Header>
        <Header
          onDownload={handleDownload}
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
          historyOpen={historyPanelOpen}
          onToggleHistory={() => setHistoryPanelOpen((v) => !v)}
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
          downloadFormat={downloadFormat}
          onDownloadFormatChange={setDownloadFormat}
          downloadJpegQuality={downloadJpegQuality}
          onDownloadJpegQualityChange={setDownloadJpegQuality}
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
            onSelectFrame={(frameIndex) => {
              setSelectedFrameIndex(frameIndex);
              // Frame interactions stop propagation (for smooth drag/pan), so make sure
              // selecting a frame explicitly clears any selected text element.
              selectTextElement(null);
            }}
            onSelectScreen={handleScreenSelect}
            zoom={zoom}
            onZoomChange={setZoom}
            onSelectTextElement={(screenIndex, textId) => {
              // Only allow text selection on primary selected screen
              if (screenIndex !== primarySelectedIndex) return;
              selectTextElement(textId);
              if (textId) {
                router.push('/text', { scroll: false });
              }
            }}
            onUpdateTextElement={(screenIndex, textId, updates) => {
              const screen = screens[screenIndex];
              if (!screen) return;
              updateTextElement(screen.id, textId, updates);
            }}
            onDeleteTextElement={(screenIndex, textId) => {
              const screen = screens[screenIndex];
              if (!screen) return;
              deleteTextElement(screen.id, textId);
            }}
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

                const validMediaIds = mediaIds.filter((id): id is number => typeof id === 'number');

                // Dropped outside any device frame -> set full canvas background
                if (targetFrameIndex === undefined) {
                  const backgroundMediaId = validMediaIds[0];
                  if (!backgroundMediaId) return;

                  setCanvasBackgroundMedia(screenIndex, backgroundMediaId);

                  return;
                }

                // Limit to number of frames in composition
                const filesToProcess = Math.min(validMediaIds.length, layoutFrameCount);

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
                    const mediaId = validMediaIds[i];

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
              setFramePan(screenIndex, frameIndex, panX, panY);
            }}
            onFramePositionChange={(screenIndex, frameIndex, frameX, frameY) => {
              addFramePositionDelta(screenIndex, frameIndex, frameX, frameY);
            }}
            onFrameScaleChange={(screenIndex, frameIndex, frameScale) => {
              setFrameScale(screenIndex, frameIndex, clampFrameTransform(frameScale, 'frameScale'));
            }}
            onFrameRotateChange={(screenIndex, frameIndex, rotateZ) => {
              setFrameRotate(screenIndex, frameIndex, clampFrameTransform(rotateZ, 'rotateZ'));
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
          />
          <ScreensPanel
            screens={screens}
            addScreen={addScreen}
            removeScreen={removeScreen}
            selectedIndices={selectedScreenIndices}
            onSelectScreen={handleScreenSelect}
            onReorderScreens={reorderScreens}
            onMediaUpload={handleMediaUpload}
          />
        </Box>
      </AppShell.Main>

      <AppShell.Aside p={0} style={{ borderLeft: '1px solid #E5E7EB' }}>
        <HistorySidebar
          open={historyPanelOpen}
          onToggleOpen={() => setHistoryPanelOpen((v) => !v)}
          entries={historyEntries}
          position={historyPosition}
          goTo={goToHistory}
          canUndo={canUndo}
          canRedo={canRedo}
          undo={undo}
          redo={redo}
        />
      </AppShell.Aside>
      </AppShell>
    </InteractionLockProvider>
  </CrossCanvasDragProvider>
  );
}
