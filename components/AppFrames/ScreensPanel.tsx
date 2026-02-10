'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { Box, Group, Text, ActionIcon } from '@mantine/core';
import { IconPlus, IconX, IconCheck, IconCopy } from '@tabler/icons-react';
import { Screen, CanvasSettings } from './AppFrames';
import { CompositionRenderer } from './CompositionRenderer';
import { getCanvasSizeLabel } from './FramesContext';
import { getBackgroundStyle } from './Sidebar';

interface ScreensPanelProps {
  screens: Screen[];
  addScreen: (imageOrMediaId: string | number) => void;
  removeScreen: (id: string) => void;
  duplicateScreen?: (screenIndex: number) => void;
  selectedIndices: number[];
  onSelectScreen: (index: number, multi: boolean) => void;
  onReorderScreens?: (fromIndex: number, toIndex: number) => void;
  onMediaUpload?: (file: File) => Promise<number | null>;
}

// Component to render mini composition preview for a specific screen
// Each thumbnail shows its OWN screen's composition using the shared renderer
// Memoized to only re-render when THIS screen's data or settings change
const ScreenThumbnail = memo(function ScreenThumbnail({
  screen,
  allScreens,
  screenIndex
}: {
  screen: Screen;
  allScreens: Screen[]; // All screens needed for multi-screen compositions
  screenIndex: number; // Index of this screen
}) {
  // Create full settings object with selectedScreenIndex (not used in thumbnails but required by type)
  const settings: CanvasSettings = {
    ...screen.settings,
    selectedScreenIndex: screenIndex, // Use this screen's index
  };

  return (
    <Box
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...getBackgroundStyle(screen.settings.backgroundColor),
        padding: 2,
        overflow: 'hidden',
        position: 'relative',
        pointerEvents: 'none', // Disable pointer events for the content to allow the parent to be clickable
      }}
    >
      <Box
        style={{
          transform: 'scale(0.12)',
          transformOrigin: 'center center',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Use the same renderer as main canvas, showing this screen's composition */}
        {/* Each screen uses its own images array */}
        {/* Disable cross-canvas drag for thumbnails to prevent unnecessary re-renders */}
        <CompositionRenderer
          settings={settings}
          screen={screen}
          disableCrossCanvasDrag={true}
        />
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
  
  const screenChanged =
    prevProps.screen.id !== nextProps.screen.id ||
    imagesChanged();

  // Check if this screen's settings changed
  const settingsChanged =
    prevProps.screen.settings.composition !== nextProps.screen.settings.composition ||
    prevProps.screen.settings.backgroundColor !== nextProps.screen.settings.backgroundColor ||
    prevProps.screen.settings.screenScale !== nextProps.screen.settings.screenScale ||
    prevProps.screen.settings.screenPanX !== nextProps.screen.settings.screenPanX ||
    prevProps.screen.settings.screenPanY !== nextProps.screen.settings.screenPanY;

  // Return true if nothing changed (skip re-render), false if something changed (re-render)
  return !screenChanged && !settingsChanged;
});

export function ScreensPanel({
  screens,
  addScreen,
  removeScreen,
  duplicateScreen,
  selectedIndices,
  onSelectScreen,
  onReorderScreens,
  onMediaUpload,
}: ScreensPanelProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTimeRef = useRef(0);
  const dragFromIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
      style={{
        borderTop: '1px solid #E5E7EB',
        padding: '12px 20px',
        backgroundColor: 'white',
        height: 104,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
        overflowX: 'auto', // Allow horizontal scrolling if many screens
      }}
    >
      <Group gap="md" align="flex-start" wrap="nowrap">
        {screens.map((screen, index) => {
          const isSelected = selectedIndices.includes(index);
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
                style={{
                  position: 'relative',
                  width: 60,
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
                onClick={(e) => onSelectScreen(index, e.metaKey || e.ctrlKey || e.shiftKey)}
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
                <ScreenThumbnail screen={screen} allScreens={screens} screenIndex={index} />
                
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
