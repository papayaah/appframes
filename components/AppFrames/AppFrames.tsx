'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, Box, Center, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';
import { IconFileImport } from '@tabler/icons-react';
import { Header } from './Header';
import { SidebarTabs } from './SidebarTabs';
import { MobileBottomNav, MOBILE_NAV_HEIGHT } from './MobileBottomNav';
import { Canvas } from './Canvas';
import { ScreensPanel } from './ScreensPanel';
import { HistorySidebar } from './HistorySidebar';
import { OnboardingTour } from './OnboardingTour';
import { useFrames, getCanvasDimensions, getCanvasSizeLabel, getCompositionFrameCount } from './FramesContext';
import { Screen, CanvasSettings, ScreenImage, AppFramesActions, clampFrameTransform, SharedBackground, TextElement } from './types';
import { CrossCanvasDragProvider } from './CrossCanvasDragContext';
import { InteractionLockProvider } from './InteractionLockContext';
import { useUndoRedoHotkeys } from '@/hooks/useUndoRedoHotkeys';
import { SettingsSidebar } from './SettingsSidebar';
import { getDefaultDIYOptions, type DIYOptions } from './diy-frames/types';

import { useProjectImportDrop } from './hooks/useProjectImportDrop';
import { useAppFramesPaste } from './hooks/useAppFramesPaste';
import { useAppFramesKeyboardShortcuts } from './hooks/useAppFramesKeyboardShortcuts';
import { useAppFramesDownload } from './hooks/useAppFramesDownload';
import { useAppFramesEvents } from './hooks/useAppFramesEvents';
import { useAppFramesCanvasDrop } from './hooks/useAppFramesCanvasDrop';
import { handleMediaUpload, isEditableTarget } from './mediaUtils';

// Re-export types for compatibility
export type { Screen, CanvasSettings, ScreenImage, AppFramesActions, SharedBackground } from './types';

export function AppFrames() {
  const router = useRouter();
  const {
    screens,
    setScreens,
    zoom,
    setZoom,
    selectedScreenIndices,
    setSelectedScreenIndices,
    primarySelectedIndex,
    selectedFrameIndex,
    setSelectedFrameIndex,
    frameSelectionVisible,
    setFrameSelectionVisible,
    settings,
    setSettings,
    addScreen,
    removeScreen,
    duplicateScreen,
    handleScreenSelect,
    replaceScreen,
    currentProjectId,
    currentProjectName,
    createNewProject,
    switchProject,
    deleteProject,
    renameProject,
    getAllProjects,
    exportProject,
    importProject,
    isSignedIn,
    saveStatus,
    syncStatus,
    updateTextElement,
    deleteTextElement,
    selectTextElement,
    selectTextElementOnScreen,
    pasteTextElement,
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
    setFrameDIYOptions,
    setFramePan,
    setBackgroundPan,
    setBackgroundRotation,
    setBackgroundScale,
    setFramePosition,
    setFrameScale,
    setFrameRotate,
    setFrameTilt,
    setFrameColor,
    setFrameEffects,
    setImageRotation,
    downloadFormat,
    downloadJpegQuality,
    setDownloadFormat,
    setDownloadJpegQuality,
    isInitializing,
    screensByCanvasSize,
    currentCanvasSize,
    switchCanvasSize,
    copyScreensToCanvasSize,
    currentSharedBackground,
    setSharedBackground,
    toggleScreenInSharedBackground,
    applyBackgroundEffectsToAll,
    removeAllScreens,
  } = useFrames();

  const isMobile = useMediaQuery('(max-width: 48em)');

  const [navWidth, setNavWidth] = useState(80); // Start collapsed, expands to 360 when panel opens
  const [animateNav, setAnimateNav] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [canvasSelected, setCanvasSelected] = useState(false);

  const { importDragOver } = useProjectImportDrop({ onImportProject: importProject });

  useAppFramesPaste({
    screens,
    addScreen,
    replaceScreen,
    setCanvasBackgroundMedia,
    primarySelectedIndex,
    selectedFrameIndex,
    frameSelectionVisible,
  });

  useAppFramesKeyboardShortcuts({
    screens,
    primarySelectedIndex,
    selectedFrameIndex,
    deleteTextElement,
    clearFrameSlot,
    pasteTextElement,
  });

  const { handleDownload } = useAppFramesDownload({
    screens,
    selectedScreenIndices,
    settings,
    mediaCache,
    downloadFormat,
    downloadJpegQuality,
  });

  useAppFramesEvents({
    setAiSidebarOpen,
    setNavWidth,
  });

  const { handleReplaceScreen } = useAppFramesCanvasDrop({
    screens,
    setScreens,
    primarySelectedIndex,
    setCanvasBackgroundMedia,
  });

  // Track which screen the currently selected frame belongs to (for settings sidebar)
  // This is separate from primarySelectedIndex to avoid reordering canvases when clicking frames
  const [activeFrameScreenIndex, setActiveFrameScreenIndex] = useState<number>(primarySelectedIndex);

  // Keep activeFrameScreenIndex in sync with primarySelectedIndex when selection changes via other means
  useEffect(() => {
    setActiveFrameScreenIndex(primarySelectedIndex);
  }, [primarySelectedIndex]);

  // Get current screen and frame data for settings sidebar (use activeFrameScreenIndex, not primarySelectedIndex)
  const currentScreen = screens[activeFrameScreenIndex];
  const currentFrameData = currentScreen?.images?.[selectedFrameIndex ?? 0];

  // Check if a text element is selected on ANY selected screen (hide frame panels when text is selected)
  const textSelectionInfo = (() => {
    for (const idx of selectedScreenIndices) {
      const screen = screens[idx];
      const textId = screen?.settings?.selectedTextId;
      if (textId) {
        const textEl = screen.textElements?.find(t => t.id === textId);
        if (textEl) return { screen, textElement: textEl };
      }
    }
    return null;
  })();
  const hasTextSelected = textSelectionInfo != null;
  const selectedTextElement = textSelectionInfo?.textElement;

  // Check if frame is selected and valid (for settings sidebar)
  // Hide when text is selected or when frame is not explicitly selected (frameSelectionVisible)
  const hasValidFrame = currentScreen &&
    selectedFrameIndex !== null &&
    selectedFrameIndex !== undefined &&
    currentFrameData &&
    !currentFrameData.cleared &&
    !hasTextSelected &&
    frameSelectionVisible;

  // Check if frame has an actual image (for image settings section in sidebar)
  const hasImage = hasValidFrame &&
    (!!currentFrameData?.mediaId || !!currentFrameData?.image);

  // Default diyOptions for frames from older projects that don't have them saved
  const currentDiyOptions = currentFrameData?.diyOptions ?? getDefaultDIYOptions('phone');

  // Right sidebar widths — settings overlays (no push), history pushes
  const historyWidth = historyPanelOpen ? 320 : 0;

  useUndoRedoHotkeys({
    undo,
    redo,
    canUndo,
    canRedo,
    isEditableTarget,
  });
  // No-op for now as we use the handleDownload from hook

  return (
    <CrossCanvasDragProvider>
      <InteractionLockProvider>

        {/* Global drop zone overlay for .appframes import */}
        {importDragOver && (
          <Box
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              pointerEvents: 'none',
            }}
          >
            <Box
              style={{
                padding: '48px 64px',
                borderRadius: 16,
                border: '3px dashed rgba(255, 255, 255, 0.6)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                textAlign: 'center',
              }}
            >
              <IconFileImport size={48} color="white" style={{ marginBottom: 12 }} />
              <div style={{ color: 'white', fontSize: 20, fontWeight: 600 }}>
                Drop to import project
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14, marginTop: 4 }}>
                .appframes file
              </div>
            </Box>
          </Box>
        )}

        <AppShell
          header={{ height: 45 }}
          navbar={isMobile ? undefined : { width: navWidth, breakpoint: 'sm' }}
          aside={isMobile ? undefined : { width: historyWidth, breakpoint: 'sm' }}
          padding={0}
          styles={{
            main: {
              backgroundColor: '#F9FAFB',
              ...(isMobile ? { paddingBottom: MOBILE_NAV_HEIGHT } : {}),
            },
            navbar: { overflow: 'visible' },
            aside: { overflow: 'visible' },
          }}
        >
          <AppShell.Header>
            <Header
              onDownload={handleDownload}
              outputDimensions={(() => {
                const label = getCanvasSizeLabel(settings.canvasSize);
                const { width, height } = getCanvasDimensions(settings.canvasSize, settings.orientation);
                const dims = `${width}×${height}`;
                return label.includes('×') ? label : `${label} (${dims})`;
              })()}
              canvasSizes={Object.entries(screensByCanvasSize)
                .filter(([, s]) => s.length > 0)
                .map(([size, s]) => {
                  const label = getCanvasSizeLabel(size);
                  const { width, height } = getCanvasDimensions(size, 'portrait');
                  const dims = `${width}×${height}`;
                  const frameCount = s.reduce((count, screen) =>
                    count + screen.images.filter(img => !img.cleared && (img.mediaId || img.image || img.serverMediaPath)).length, 0);
                  return {
                    id: size,
                    label: label.includes('×') ? label : `${label} (${dims})`,
                    screenCount: s.length,
                    frameCount,
                  };
                })}
              currentCanvasSize={currentCanvasSize}
              onCanvasSizeSwitch={switchCanvasSize}
              onCopyToCanvasSize={copyScreensToCanvasSize}
              zoom={zoom}
              onZoomChange={setZoom}
              selectedCount={selectedScreenIndices.length}
              totalCount={screens.length}
              currentProjectId={currentProjectId}
              currentProjectName={currentProjectName}
              onCreateProject={createNewProject}
              onSwitchProject={switchProject}
              onRenameProject={renameProject}
              onDeleteProject={deleteProject}
              onGetAllProjects={getAllProjects}
              onExportProject={exportProject}
              onImportProject={importProject}
              isSignedIn={isSignedIn}
              saveStatus={saveStatus}
              syncStatus={syncStatus}
              historyOpen={historyPanelOpen}
              onToggleHistory={() => setHistoryPanelOpen((v) => !v)}
              onDeleteAllScreens={removeAllScreens}
            />
          </AppShell.Header>

          {!isMobile && (
            <AppShell.Navbar p={0} style={{ borderRight: '1px solid #E5E7EB', transition: animateNav ? 'width 0.2s ease' : 'none' }}>
              <SidebarTabs
                settings={settings}
                setSettings={setSettings}
                screens={screens}
                selectedFrameIndex={selectedFrameIndex}
                onPanelToggle={(isOpen, animate = false) => {
                  setAnimateNav(animate);
                  setNavWidth(isOpen ? 360 : 80);
                }}
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
                sharedBackground={currentSharedBackground}
                onSharedBackgroundChange={(sharedBg) => setSharedBackground(currentCanvasSize, sharedBg)}
                onToggleScreenInSharedBg={toggleScreenInSharedBackground}
                onApplyEffectsToAll={applyBackgroundEffectsToAll}
              />
            </AppShell.Navbar>
          )}

          <AppShell.Main style={{
            transition: [
              animateNav ? 'padding-left 0.2s ease, margin-left 0.2s ease' : '',
              'padding-right 0.2s ease, margin-right 0.2s ease',
            ].filter(Boolean).join(', '),
          }}>
            {isInitializing ? (
              <Center style={{ height: 'calc(100vh - 45px)', backgroundColor: '#F9FAFB' }}>
                <Loader size="lg" color="gray" />
              </Center>
            ) : (
              <Box style={{ height: isMobile ? `calc(100vh - 45px - ${MOBILE_NAV_HEIGHT}px)` : 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
                <Canvas
                  settings={settings}
                  screens={screens}
                  selectedScreenIndices={selectedScreenIndices}
                  selectedFrameIndex={selectedFrameIndex}
                  frameSelectionVisible={frameSelectionVisible}
                  sharedBackground={currentSharedBackground}
                  onSelectFrame={(screenIndex, frameIndex, e) => {
                    // Promote screen to primary, or select exclusively if no modifier held
                    const isMulti = e?.shiftKey || e?.metaKey || e?.ctrlKey;
                    if (isMulti) {
                      setSelectedScreenIndices((prev) => {
                        if (prev.includes(screenIndex)) {
                          // Already selected: move to end to make it primary
                          return [...prev.filter((i) => i !== screenIndex), screenIndex];
                        } else {
                          // Add to multi-selection
                          return [...prev, screenIndex];
                        }
                      });
                    } else if (!selectedScreenIndices.includes(screenIndex) || selectedScreenIndices.length > 1) {
                      // Note: if user is just clicking a frame on an already-multi-selected screen without shift,
                      // we keep the multi-selection but promote this screen to primary.
                      // This feels more natural than dropping the whole multi-selection just by clicking a frame.
                      setSelectedScreenIndices((prev) => {
                        if (prev.includes(screenIndex)) {
                          return [...prev.filter((i) => i !== screenIndex), screenIndex];
                        }
                        return [screenIndex];
                      });
                    }

                    // Track which screen the selected frame belongs to (for floating panels)
                    setActiveFrameScreenIndex(screenIndex);
                    setSelectedFrameIndex(frameIndex);
                    setFrameSelectionVisible(true);
                    setCanvasSelected(false);
                    // Frame interactions stop propagation, so clear text selection manually
                    selectTextElement(null);
                  }}
                  onSelectScreen={handleScreenSelect}
                  zoom={zoom}
                  onZoomChange={setZoom}
                  onSelectTextElement={(screenIndex, textId, e) => {
                    // Promote screen to primary when text on it is selected
                    const isMulti = e?.shiftKey || e?.metaKey || e?.ctrlKey;
                    if (isMulti) {
                      setSelectedScreenIndices((prev) => {
                        if (prev.includes(screenIndex)) {
                          return [...prev.filter((i) => i !== screenIndex), screenIndex];
                        }
                        return [...prev, screenIndex];
                      });
                    } else {
                      // Primary interaction: if already selected, just promote; if not, select exclusively
                      setSelectedScreenIndices((prev) => {
                        if (prev.includes(screenIndex)) {
                          return [...prev.filter((i) => i !== screenIndex), screenIndex];
                        }
                        return [screenIndex];
                      });
                    }
                    selectTextElementOnScreen(screenIndex, textId);
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
                  onClickCanvas={(screenIndex) => {
                    setCanvasSelected(true);
                    setFrameSelectionVisible(false);
                    selectTextElement(null);
                  }}
                  onClickOutsideCanvas={() => {
                    selectTextElement(null);
                    setFrameSelectionVisible(false);
                    setCanvasSelected(false);
                  }}
                  onReplaceScreen={handleReplaceScreen}
                  onPanChange={(screenIndex, frameIndex, panX, panY, p) => {
                    setFramePan(screenIndex, frameIndex, panX, panY, p);
                  }}
                  onFramePositionChange={(screenIndex, frameIndex, frameX, frameY, p) => {
                    setFramePosition(screenIndex, frameIndex, frameX, frameY, p);
                  }}
                  onFrameScaleChange={(screenIndex, frameIndex, frameScale, p) => {
                    setFrameScale(screenIndex, frameIndex, clampFrameTransform(frameScale, 'frameScale'), p);
                  }}
                  onFrameRotateChange={(screenIndex, frameIndex, rotateZ, p) => {
                    setFrameRotate(screenIndex, frameIndex, clampFrameTransform(rotateZ, 'rotateZ'), p);
                  }}
                  onBackgroundPanChange={(screenIndex, x, y, p) => {
                    setBackgroundPan(screenIndex, x, y, p);
                  }}
                  onMediaSelect={(screenIndex, frameIndex, mediaId) => {
                    replaceScreen(screenIndex, mediaId, frameIndex);
                  }}
                  onCanvasBackgroundMediaSelect={(screenIndex, mediaId) => {
                    setCanvasBackgroundMedia(screenIndex, mediaId);
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
                  duplicateScreen={duplicateScreen}
                  selectedIndices={selectedScreenIndices}
                  onSelectScreen={handleScreenSelect}
                  onSetScreenSelection={setSelectedScreenIndices}
                  onReorderScreens={reorderScreens}
                  onMediaUpload={handleMediaUpload}
                  sharedBackground={currentSharedBackground}
                  canvasSize={currentCanvasSize}
                />
              </Box>
            )}

            {/* Settings sidebar — overlays canvas, does not push content */}
            <SettingsSidebar
              isOpen={!!hasValidFrame || canvasSelected || hasTextSelected}
              onClose={() => {
                setFrameSelectionVisible(false);
                setCanvasSelected(false);
                if (hasTextSelected) {
                  selectTextElement(null);
                }
              }}
              mode={hasValidFrame ? 'frame' : 'canvas'}
              slotLabel={hasValidFrame ? `Slot ${(selectedFrameIndex ?? 0) + 1}` : undefined}
              hasImage={!!hasImage}
              canvasSettings={{
                settings,
                setSettings,
                hasBackgroundMedia: !!currentScreen?.settings?.canvasBackgroundMediaId,
                onClearBackgroundMedia: () => {
                  if (currentScreen) {
                    setCanvasBackgroundMedia(activeFrameScreenIndex, undefined);
                  }
                },
                onApplyEffectsToAll: applyBackgroundEffectsToAll,
                onBackgroundScaleChange: (value, p) => setBackgroundScale(activeFrameScreenIndex, value, p),
                onBackgroundRotationChange: (value, p) => setBackgroundRotation(activeFrameScreenIndex, value, p),
                onBackgroundPanChange: (x, y, p) => setBackgroundPan(activeFrameScreenIndex, x, y, p),
              }}
              imageSettings={{
                screenScale: currentScreen?.settings?.screenScale ?? 0,
                screenPanX: currentFrameData?.panX ?? 50,
                screenPanY: currentFrameData?.panY ?? 50,
                imageRotation: currentFrameData?.imageRotation ?? 0,
                onScaleChange: (value) => {
                  if (!currentScreen) return;
                  setSettings({ ...settings, screenScale: value });
                },
                onPanXChange: (value, p) => {
                  if (selectedFrameIndex === null || selectedFrameIndex === undefined) return;
                  setFramePan(activeFrameScreenIndex, selectedFrameIndex, value, currentFrameData?.panY ?? 50, p);
                },
                onPanYChange: (value, p) => {
                  if (selectedFrameIndex === null || selectedFrameIndex === undefined) return;
                  setFramePan(activeFrameScreenIndex, selectedFrameIndex, currentFrameData?.panX ?? 50, value, p);
                },
                onRotationChange: (value) => {
                  if (selectedFrameIndex === null || selectedFrameIndex === undefined) return;
                  setImageRotation(activeFrameScreenIndex, selectedFrameIndex, value);
                },
                onReset: () => {
                  if (selectedFrameIndex === null || selectedFrameIndex === undefined) return;
                  setSettings({ ...settings, screenScale: 0 });
                  setFramePan(activeFrameScreenIndex, selectedFrameIndex, 50, 50);
                  setImageRotation(activeFrameScreenIndex, selectedFrameIndex, 0);
                },
              }}
              frameSettings={{
                frameColor: currentFrameData?.frameColor,
                defaultFrameColor: '#1a1a1a',
                onFrameColorChange: (color) => {
                  if (selectedFrameIndex === null || selectedFrameIndex === undefined) return;
                  setFrameColor(activeFrameScreenIndex, selectedFrameIndex, color);
                },
                frameRotation: currentFrameData?.rotateZ ?? 0,
                onFrameRotationChange: (rotation) => {
                  if (selectedFrameIndex === null || selectedFrameIndex === undefined) return;
                  setFrameRotate(activeFrameScreenIndex, selectedFrameIndex, clampFrameTransform(rotation, 'rotateZ'));
                },
                frameScale: currentFrameData?.frameScale ?? 100,
                onFrameScaleChange: (scale) => {
                  if (selectedFrameIndex === null || selectedFrameIndex === undefined) return;
                  setFrameScale(activeFrameScreenIndex, selectedFrameIndex, clampFrameTransform(scale, 'frameScale'));
                },
                frameTiltX: currentFrameData?.tiltX ?? 0,
                frameTiltY: currentFrameData?.tiltY ?? 0,
                onFrameTiltChange: (tiltX, tiltY) => {
                  if (selectedFrameIndex === null || selectedFrameIndex === undefined) return;
                  setFrameTilt(activeFrameScreenIndex, selectedFrameIndex, tiltX, tiltY);
                },
                frameX: currentFrameData?.frameX ?? 0,
                frameY: currentFrameData?.frameY ?? 0,
                onFramePositionChange: (frameX, frameY, p) => {
                  if (selectedFrameIndex === null || selectedFrameIndex === undefined) return;
                  setFramePosition(activeFrameScreenIndex, selectedFrameIndex, frameX, frameY, p);
                },
                onResetTransforms: () => {
                  if (selectedFrameIndex === null || selectedFrameIndex === undefined) return;
                  setFrameRotate(activeFrameScreenIndex, selectedFrameIndex, 0);
                  setFrameScale(activeFrameScreenIndex, selectedFrameIndex, 100);
                  setFrameTilt(activeFrameScreenIndex, selectedFrameIndex, 0, 0);
                  setFramePosition(activeFrameScreenIndex, selectedFrameIndex, 0, 0);
                },
                diyOptions: currentDiyOptions,
                onDIYOptionsChange: (options: DIYOptions) => {
                  if (selectedFrameIndex === null || selectedFrameIndex === undefined) return;
                  setFrameDIYOptions(activeFrameScreenIndex, selectedFrameIndex, options);
                },
                frameEffects: currentFrameData?.frameEffects,
                onFrameEffectsChange: (effects) => {
                  if (selectedFrameIndex === null || selectedFrameIndex === undefined) return;
                  setFrameEffects(activeFrameScreenIndex, selectedFrameIndex, effects);
                },
              }}
              hasTextSelected={hasTextSelected}
              selectedTextStyle={selectedTextElement?.style}
              onTextStyleChange={(updates) => {
                if (!textSelectionInfo) return;
                updateTextElement(textSelectionInfo.screen.id, textSelectionInfo.textElement.id, { style: { ...textSelectionInfo.textElement.style, ...updates } });
              }}
            />
          </AppShell.Main>

          {!isMobile && (
            <AppShell.Aside p={0} style={{ borderLeft: '1px solid #E5E7EB', transition: 'width 0.2s ease' }}>
              <HistorySidebar
                open={historyPanelOpen}
                entries={historyEntries}
                position={historyPosition}
                goTo={goToHistory}
                canUndo={canUndo}
                canRedo={canRedo}
                undo={undo}
                redo={redo}
              />
            </AppShell.Aside>
          )}

          {isMobile && (
            <MobileBottomNav
              settings={settings}
              setSettings={setSettings}
              screens={screens}
              selectedFrameIndex={selectedFrameIndex}
              onMediaSelect={(mediaId) => {
                if (screens.length === 0) {
                  addScreen(mediaId);
                } else {
                  replaceScreen(primarySelectedIndex, mediaId, selectedFrameIndex);
                }
              }}
              downloadFormat={downloadFormat}
              onDownloadFormatChange={setDownloadFormat}
              downloadJpegQuality={downloadJpegQuality}
              onDownloadJpegQualityChange={setDownloadJpegQuality}
            />
          )}

        </AppShell>
        <OnboardingTour />
      </InteractionLockProvider>
    </CrossCanvasDragProvider>
  );
}
