'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Box, Group, Text, ActionIcon } from '@mantine/core';
import { IconPlus, IconX, IconCheck, IconCopy } from '@tabler/icons-react';
import { Screen, CanvasSettings, SharedBackground } from './AppFrames';
import { CompositionRenderer } from './CompositionRenderer';
import { getCanvasSizeLabel, getCanvasDimensions } from './FramesContext';
import { getBackgroundStyle } from './Sidebar';
import { useMediaImage } from '../../hooks/useMediaImage';
import { SharedCanvasBackground } from './SharedCanvasBackground';
import { BackgroundEffectsOverlay } from './BackgroundEffectsOverlay';
import { TextElement } from './TextElement';

function ThumbnailCanvasBackground({ mediaId }: { mediaId?: number }) {
  const { imageUrl } = useMediaImage(mediaId);
  if (!imageUrl) return null;
  return (
    <Box
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

interface ScreensPanelProps {
  screens: Screen[];
  addScreen: (imageOrMediaId: string | number) => void;
  removeScreen: (id: string) => void;
  duplicateScreen?: (screenIndex: number) => void;
  selectedIndices: number[];
  onSelectScreen: (index: number, toggle: boolean, shift?: boolean) => void;
  onSetScreenSelection?: (indices: number[]) => void;
  onReorderScreens?: (fromIndex: number, toIndex: number) => void;
  onMediaUpload?: (file: File) => Promise<number | null>;
  sharedBackground?: SharedBackground;
}

// Component to render mini composition preview for a specific screen
// Each thumbnail shows its OWN screen's composition using the shared renderer
// Memoized to only re-render when THIS screen's data or settings change
const ScreenThumbnail = memo(function ScreenThumbnail({
  screen,
  allScreens,
  screenIndex,
  sharedBackground,
}: {
  screen: Screen;
  allScreens: Screen[]; // All screens needed for multi-screen compositions
  screenIndex: number; // Index of this screen
  sharedBackground?: SharedBackground;
}) {
  // Create full settings object with selectedScreenIndex (not used in thumbnails but required by type)
  const settings: CanvasSettings = {
    ...screen.settings,
    selectedScreenIndex: screenIndex, // Use this screen's index
  };

  // Check if this screen is part of a shared background
  const isInSharedBg = sharedBackground?.screenIds.includes(screen.id) ?? false;
  const canvasDims = getCanvasDimensions(screen.settings.canvasSize || 'iphone-6.5', screen.settings.orientation || 'portrait');

  return (
    <Box
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(screen.settings.backgroundColor === 'transparent'
          ? { backgroundColor: '#f1f3f5' } // Subtle gray for transparency in thumbs
          : getBackgroundStyle(screen.settings.backgroundColor)),
        padding: 2,
        overflow: 'hidden',
        position: 'relative',
        pointerEvents: 'none', // Disable pointer events for the content to allow the parent to be clickable
      }}
    >
      {/* Canvas background — shared or per-screen */}
      {isInSharedBg && sharedBackground ? (
        <SharedCanvasBackground
          screenId={screen.id}
          allScreens={allScreens}
          sharedBackground={sharedBackground}
          screenWidth={canvasDims.width}
          screenHeight={canvasDims.height}
        />
      ) : (
        <ThumbnailCanvasBackground mediaId={screen.settings.canvasBackgroundMediaId} />
      )}
      <BackgroundEffectsOverlay effects={screen.settings.backgroundEffects} screenId={screen.id} />
      <Box
        style={{
          width: canvasDims.width,
          height: canvasDims.height,
          flexShrink: 0,
          transformOrigin: 'center center',
          transform: `scale(${Math.min(60 / canvasDims.width, 80 / canvasDims.height)})`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Use the same renderer as main canvas, showing this screen's composition */}
        {/* Each screen uses its own images array */}
        {/* Disable cross-canvas drag for thumbnails to prevent unnecessary re-renders */}
        <Box style={{ position: 'absolute', inset: 0 }}>
          <CompositionRenderer
            settings={settings}
            screen={screen}
            disableCrossCanvasDrag={true}
          />
        </Box>

        {/* Render text elements in thumbnail */}
        {(screen.textElements || [])
          .filter(t => t.visible)
          .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
          .map((t) => (
            <TextElement
              key={t.id}
              element={t}
              selected={false}
              onSelect={() => { }}
              onUpdate={() => { }}
              onDelete={() => { }}
            />
          ))}
      </Box>
    </Box>
  );
}, (prevProps, nextProps) => {
  // Re-render if screenIndex changed
  if (prevProps.screenIndex !== nextProps.screenIndex) {
    return false;
  }

  // Only re-render if THIS screen's data or settings changed
  // For images, include transform + position fields so thumbnails reflect edits.
  const imagesChanged = () => {
    const prevImages = prevProps.screen.images || [];
    const nextImages = nextProps.screen.images || [];

    if (prevImages.length !== nextImages.length) return true;

    return prevImages.some((prevImg, idx) => {
      const nextImg = nextImages[idx];
      return (
        prevImg?.image !== nextImg?.image ||
        prevImg?.mediaId !== nextImg?.mediaId ||
        prevImg?.diyOptions !== nextImg?.diyOptions ||
        prevImg?.cleared !== nextImg?.cleared ||
        prevImg?.panX !== nextImg?.panX ||
        prevImg?.panY !== nextImg?.panY ||
        prevImg?.frameX !== nextImg?.frameX ||
        prevImg?.frameY !== nextImg?.frameY ||
        prevImg?.frameScale !== nextImg?.frameScale ||
        prevImg?.rotateZ !== nextImg?.rotateZ ||
        prevImg?.tiltX !== nextImg?.tiltX ||
        prevImg?.tiltY !== nextImg?.tiltY
      );
    });
  };

  const textElementsChanged = () => {
    const prevText = prevProps.screen.textElements || [];
    const nextText = nextProps.screen.textElements || [];

    if (prevText.length !== nextText.length) return true;

    return prevText.some((prevEl, idx) => {
      const nextEl = nextText[idx];
      return (
        prevEl?.content !== nextEl?.content ||
        prevEl?.visible !== nextEl?.visible ||
        JSON.stringify(prevEl?.style) !== JSON.stringify(nextEl?.style)
      );
    });
  };

  const screenChanged =
    prevProps.screen.id !== nextProps.screen.id ||
    imagesChanged() ||
    textElementsChanged();

  // Check if this screen's settings changed
  const settingsChanged =
    prevProps.screen.settings.composition !== nextProps.screen.settings.composition ||
    prevProps.screen.settings.backgroundColor !== nextProps.screen.settings.backgroundColor ||
    prevProps.screen.settings.canvasBackgroundMediaId !== nextProps.screen.settings.canvasBackgroundMediaId ||
    prevProps.screen.settings.screenScale !== nextProps.screen.settings.screenScale ||
    prevProps.screen.settings.screenPanX !== nextProps.screen.settings.screenPanX ||
    prevProps.screen.settings.screenPanY !== nextProps.screen.settings.screenPanY ||
    prevProps.screen.settings.backgroundEffects !== nextProps.screen.settings.backgroundEffects;

  // Check if shared background changed
  const sharedBgChanged = prevProps.sharedBackground !== nextProps.sharedBackground;

  // Return true if nothing changed (skip re-render), false if something changed (re-render)
  return !screenChanged && !settingsChanged && !sharedBgChanged;
});

export function ScreensPanel({
  screens,
  addScreen,
  removeScreen,
  duplicateScreen,
  selectedIndices,
  onSelectScreen,
  onSetScreenSelection,
  onReorderScreens,
  onMediaUpload,
  sharedBackground,
}: ScreensPanelProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTimeRef = useRef(0);
  const dragFromIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Drag-to-select: click on panel background and drag across thumbnails
  const isDragSelectingRef = useRef(false);
  const dragSelectStartXRef = useRef<number | null>(null);
  const dragSelectAdditive = useRef(false); // Cmd/Ctrl held = add to existing selection
  const dragSelectBaseIndices = useRef<number[]>([]); // Pre-existing selection when additive

  const handlePanelMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start drag-select from the panel background, not from a screen thumbnail
    const target = e.target as HTMLElement;
    if (target.closest('[data-screen-index]')) return;
    if (!onSetScreenSelection) return;

    isDragSelectingRef.current = true;
    dragSelectStartXRef.current = e.clientX;
    dragSelectAdditive.current = e.metaKey || e.ctrlKey;
    dragSelectBaseIndices.current = dragSelectAdditive.current ? [...selectedIndices] : [];
  }, [onSetScreenSelection, selectedIndices]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragSelectingRef.current || dragSelectStartXRef.current == null) return;
      if (!onSetScreenSelection) return;

      const panel = panelRef.current;
      if (!panel) return;

      const startX = dragSelectStartXRef.current;
      const currentX = e.clientX;
      const minX = Math.min(startX, currentX);
      const maxX = Math.max(startX, currentX);

      const screenEls = panel.querySelectorAll('[data-screen-index]');
      const swept: number[] = [];

      screenEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Select if the thumbnail overlaps with the drag range
        if (rect.right >= minX && rect.left <= maxX) {
          const idx = parseInt(el.getAttribute('data-screen-index')!, 10);
          swept.push(idx);
        }
      });

      // Merge with base selection when additive (Cmd/Ctrl held)
      const base = dragSelectBaseIndices.current;
      const merged = dragSelectAdditive.current
        ? Array.from(new Set([...base, ...swept]))
        : swept;

      if (merged.length > 0) {
        onSetScreenSelection(merged);
      }
    };

    const handleMouseUp = () => {
      isDragSelectingRef.current = false;
      dragSelectStartXRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onSetScreenSelection]);

  // Mouse wheel should only switch screens when hovering this panel.
  // Keep horizontal scrolling for the thumbnail strip (trackpads / shift+wheel).
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      // If the intent is horizontal scrolling (or shift-scroll), don't hijack it.
      if (e.shiftKey || absX > absY) return;

      // Don't allow page zoom / canvas zoom when pointer is over the panel.
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (!onSelectScreen || screens.length === 0) return;

      // Keep multi-selection stable; wheel navigation would collapse it.
      if (selectedIndices.length > 1) return;

      // Debounce to prevent too rapid navigation.
      const now = Date.now();
      if (now - lastScrollTimeRef.current < 200) return;
      lastScrollTimeRef.current = now;

      e.preventDefault();
      e.stopPropagation();

      const currentIndex =
        selectedIndices.length > 0 ? selectedIndices[selectedIndices.length - 1] : 0;
      const dir = e.deltaY > 0 ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(screens.length - 1, currentIndex + dir));

      if (nextIndex !== currentIndex) {
        onSelectScreen(nextIndex, false);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [onSelectScreen, screens.length, selectedIndices]);

  const handleDrop = async (files: File[]) => {
    for (const file of files) {
      if (onMediaUpload) {
        // Upload to media library
        const mediaId = await onMediaUpload(file);
        if (mediaId) {
          addScreen(mediaId);
        }
      } else {
        // Fallback to base64
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            addScreen(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <Box
      ref={panelRef}
      onMouseDown={handlePanelMouseDown}
      style={{
        borderTop: '1px solid #E5E7EB',
        padding: '12px 20px',
        backgroundColor: 'white',
        height: 104,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
        overflowX: 'auto', // Allow horizontal scrolling if many screens
        userSelect: isDragSelectingRef.current ? 'none' : undefined,
      }}
    >
      <Group gap="md" align="flex-start" wrap="nowrap">
        {screens.map((screen, index) => {
          const isSelected = selectedIndices.includes(index);
          const canvasDims = getCanvasDimensions(screen.settings.canvasSize || 'iphone-6.5', screen.settings.orientation || 'portrait');
          const thumbAspectRatio = canvasDims.width / canvasDims.height;
          const thumbWidth = Math.max(32, Math.min(100, 80 * thumbAspectRatio));

          return (
            <Box
              key={screen.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <Box
                data-screen-index={index}
                style={{
                  position: 'relative',
                  width: thumbWidth,
                  height: 80,
                  border: '2px solid',
                  borderColor: isSelected ? '#667eea' : '#dee2e6',
                  borderRadius: 8,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  backgroundColor: '#f8f9fa',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none',
                  outline:
                    dragOverIndex === index
                      ? '2px dashed rgba(102, 126, 234, 0.9)'
                      : 'none',
                  outlineOffset: 2,
                }}
                onClick={(e) => onSelectScreen(index, e.metaKey || e.ctrlKey, e.shiftKey)}
                draggable={true}
                onDragStart={(e) => {
                  dragFromIndexRef.current = index;
                  setDragOverIndex(null);
                  try {
                    e.dataTransfer.effectAllowed = 'move';
                    // Required in Safari to start drag.
                    e.dataTransfer.setData('text/plain', String(index));
                  } catch {
                    // ignore
                  }
                }}
                onDragOver={(e) => {
                  if (!onReorderScreens) return;
                  const from = dragFromIndexRef.current;
                  if (from == null) return;
                  if (from === index) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverIndex(index);
                }}
                onDragLeave={() => {
                  setDragOverIndex((prev) => (prev === index ? null : prev));
                }}
                onDrop={(e) => {
                  // Let .appframes/.zip files bubble up to the global import handler
                  const droppedFile = e.dataTransfer?.files[0];
                  if (droppedFile) {
                    const name = droppedFile.name.toLowerCase();
                    if (name.endsWith('.appframes') || name.endsWith('.zip')) return;
                  }
                  if (!onReorderScreens) return;
                  e.preventDefault();
                  e.stopPropagation();
                  const from =
                    dragFromIndexRef.current ??
                    (() => {
                      const v = Number(e.dataTransfer.getData('text/plain'));
                      return Number.isFinite(v) ? v : null;
                    })();
                  const to = index;
                  dragFromIndexRef.current = null;
                  setDragOverIndex(null);
                  if (from == null || from === to) return;
                  onReorderScreens(from, to);
                }}
                onDragEnd={() => {
                  dragFromIndexRef.current = null;
                  setDragOverIndex(null);
                }}
                onMouseEnter={(e) => {
                  if (deleteConfirmId !== screen.id) {
                    const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                    if (deleteBtn) deleteBtn.style.opacity = '1';
                    const cloneBtn = e.currentTarget.querySelector('.clone-btn') as HTMLElement;
                    if (cloneBtn) cloneBtn.style.opacity = '1';
                    const screenNumber = e.currentTarget.querySelector('.screen-number') as HTMLElement;
                    if (screenNumber) screenNumber.style.opacity = '1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (deleteConfirmId !== screen.id) {
                    const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                    if (deleteBtn) deleteBtn.style.opacity = '0';
                    const cloneBtn = e.currentTarget.querySelector('.clone-btn') as HTMLElement;
                    if (cloneBtn) cloneBtn.style.opacity = '0';
                    const screenNumber = e.currentTarget.querySelector('.screen-number') as HTMLElement;
                    if (screenNumber) screenNumber.style.opacity = '0';
                  }
                }}
              >
                <ScreenThumbnail screen={screen} allScreens={screens} screenIndex={index} sharedBackground={sharedBackground} />

                {deleteConfirmId === screen.id ? (
                  // Show confirmation buttons
                  <Box
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      display: 'flex',
                      gap: 4,
                      pointerEvents: 'auto',
                    }}
                  >
                    <ActionIcon
                      size="xs"
                      color="green"
                      variant="filled"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeScreen(screen.id);
                        setDeleteConfirmId(null);
                      }}
                    >
                      <IconCheck size={12} />
                    </ActionIcon>
                    <ActionIcon
                      size="xs"
                      color="gray"
                      variant="filled"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(null);
                      }}
                    >
                      <IconX size={12} />
                    </ActionIcon>
                  </Box>
                ) : (
                  // Show clone and delete buttons
                  <>
                    {duplicateScreen && (
                      <ActionIcon
                        className="clone-btn"
                        size="xs"
                        color="blue"
                        variant="filled"
                        style={{
                          position: 'absolute',
                          top: 4,
                          left: 4,
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          pointerEvents: 'auto',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateScreen(index);
                        }}
                      >
                        <IconCopy size={12} />
                      </ActionIcon>
                    )}
                    <ActionIcon
                      className="delete-btn"
                      size="xs"
                      color="red"
                      variant="filled"
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        pointerEvents: 'auto',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(screen.id);
                      }}
                    >
                      <IconX size={12} />
                    </ActionIcon>
                  </>
                )}

                {/* Floating number on hover */}
                <Box
                  className="screen-number"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: 32,
                    fontWeight: 700,
                    color: 'rgba(255, 255, 255, 0.9)',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    pointerEvents: 'none',
                  }}
                >
                  {index + 1}
                </Box>
              </Box>
            </Box>
          );
        })}

        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <Box
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addScreen('');
            }}
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent any default file picker behavior
            }}
            style={{
              width: 100,
              height: 80,
              border: '2px dashed #dee2e6',
              borderRadius: 8,
              padding: 0,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.backgroundColor = '#f8f9ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#dee2e6';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Box style={{ textAlign: 'center' }}>
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#f1f3f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                }}
              >
                <IconPlus size={18} color="#667eea" />
              </Box>
              <Text size="xs" fw={500} c="dimmed">
                NEW SCREEN
              </Text>
            </Box>
          </Box>
        </Box>
      </Group>
    </Box>
  );
}
