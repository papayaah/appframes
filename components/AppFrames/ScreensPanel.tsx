'use client';

import { memo, useState } from 'react';
import { Box, Group, Text, ActionIcon } from '@mantine/core';
import { IconPlus, IconX, IconCheck } from '@tabler/icons-react';
import { Screen, CanvasSettings } from './AppFrames';
import { CompositionRenderer } from './CompositionRenderer';
import { getCanvasSizeLabel } from './FramesContext';

interface ScreensPanelProps {
  screens: Screen[];
  addScreen: (imageOrMediaId: string | number) => void;
  removeScreen: (id: string) => void;
  selectedIndices: number[];
  onSelectScreen: (index: number, multi: boolean) => void;
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
        backgroundColor: screen.settings.backgroundColor,
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
  const screenChanged =
    prevProps.screen.id !== nextProps.screen.id ||
    JSON.stringify(prevProps.screen.images) !== JSON.stringify(nextProps.screen.images);

  // Check if this screen's settings changed
  const settingsChanged =
    prevProps.screen.settings.composition !== nextProps.screen.settings.composition ||
    prevProps.screen.settings.deviceFrame !== nextProps.screen.settings.deviceFrame ||
    prevProps.screen.settings.compositionScale !== nextProps.screen.settings.compositionScale ||
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
  selectedIndices,
  onSelectScreen,
  onMediaUpload,
}: ScreensPanelProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
      style={{
        borderTop: '1px solid #E5E7EB',
        padding: '16px 20px',
        backgroundColor: 'white',
        height: 140,
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
                  border: isSelected ? '2px solid #667eea' : '1px solid #dee2e6',
                  borderRadius: 8,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  backgroundColor: '#f8f9fa',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none',
                }}
                onClick={(e) => onSelectScreen(index, e.metaKey || e.ctrlKey || e.shiftKey)}
                onMouseEnter={(e) => {
                  if (deleteConfirmId !== screen.id) {
                    const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                    if (deleteBtn) deleteBtn.style.opacity = '1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (deleteConfirmId !== screen.id) {
                    const deleteBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                    if (deleteBtn) deleteBtn.style.opacity = '0';
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
                  // Show delete button
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
                )}
              </Box>
              <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Text
                  size="xs"
                  style={{
                    marginTop: 4,
                    color: '#666',
                    textAlign: 'center',
                    fontSize: 10,
                    maxWidth: 60,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {screen.name}
                </Text>
                <Text
                  size="xs"
                  style={{
                    color: '#999',
                    textAlign: 'center',
                    fontSize: 9,
                    maxWidth: 60,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getCanvasSizeLabel(screen.settings.canvasSize)}
                </Text>
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
