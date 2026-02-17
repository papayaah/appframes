'use client';

import { useMemo, useState, useEffect } from 'react';
import { ActionIcon, Badge, Box, Divider, Group, ScrollArea, Stack, Text, TextInput } from '@mantine/core';
import { IconCopy, IconEye, IconEyeOff, IconTrash } from '@tabler/icons-react';
import { useFrames, getCompositionFrameCount } from './FramesContext';
import type { DIYOptions } from './diy-frames/types';
import { getTemplateById } from './diy-frames/templates';

// Get display name for a DIY frame
const getFrameDisplayName = (diyOptions?: DIYOptions, templateId?: string): string => {
  if (!diyOptions) return 'No frame';

  // If using a template, show the template name
  if (templateId) {
    const template = getTemplateById(templateId);
    if (template) return template.name;
  }

  // Otherwise show the base type with capitalized name
  const typeNames: Record<string, string> = {
    phone: 'Phone',
    flip: 'Flip Phone',
    foldable: 'Foldable',
    tablet: 'Tablet',
    laptop: 'Laptop',
    desktop: 'Desktop',
  };

  return typeNames[diyOptions.type] || diyOptions.type;
};

export function LayersTab() {
  const {
    screens,
    primarySelectedIndex,
    selectedFrameIndex,
    setSelectedFrameIndex,
    setFrameSelectionVisible,
    selectTextElement,
    updateTextElement,
    deleteTextElement,
    reorderTextElements,
    duplicateTextElement,
    clearFrameSlot,
  } = useFrames();

  const screen = screens[primarySelectedIndex];
  const selectedTextId = screen?.settings?.selectedTextId;
  const frameCount = screen ? getCompositionFrameCount(screen.settings.composition) : 0;

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);

  // Text layers sorted by zIndex (top-most first)
  const textLayers = useMemo(() => {
    const list = [...(screen?.textElements ?? [])];
    return list.sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));
  }, [screen?.textElements]);

  const startRename = (id: string, current: string) => {
    setRenamingId(id);
    setRenameValue(current);
  };

  const commitRename = () => {
    if (!screen || !renamingId) return;
    const next = renameValue.trim();
    updateTextElement(screen.id, renamingId, { name: next });
    setRenamingId(null);
  };

  const mapUiIndexToAscIndex = (uiIndex: number) => {
    // UI is descending zIndex; context reorder expects ascending list indices
    return Math.max(0, Math.min(textLayers.length - 1, (textLayers.length - 1) - uiIndex));
  };

  // Track if background is explicitly selected (local UI state, not persisted)
  const [backgroundSelected, setBackgroundSelected] = useState(false);

  // Clear background selection when frame is selected from outside (e.g., canvas click)
  useEffect(() => {
    if (selectedFrameIndex >= 0 && selectedFrameIndex !== undefined) {
      setBackgroundSelected(false);
    }
  }, [selectedFrameIndex]);

  // Clear background selection when text is selected from outside
  useEffect(() => {
    if (selectedTextId) {
      setBackgroundSelected(false);
    }
  }, [selectedTextId]);

  const handleBackgroundSelect = () => {
    selectTextElement(null);
    setFrameSelectionVisible(false);
    // Don't change selectedFrameIndex to avoid breaking other code
    // Just track that background is selected locally
    setBackgroundSelected(true);
  };

  const handleFrameSelect = (frameIndex: number) => {
    selectTextElement(null);
    setSelectedFrameIndex(frameIndex);
    setFrameSelectionVisible(true);
    setBackgroundSelected(false); // Clear background selection when frame is selected
  };

  const handleTextSelect = (textId: string) => {
    selectTextElement(textId);
    setBackgroundSelected(false); // Clear background selection when text is selected
    // Text selection: keep frame selection as-is (per spec)
  };

  // Background is selected when explicitly selected and no text/frame is selected
  const isBackgroundSelected = backgroundSelected && !selectedTextId;
  const isFrameSelected = (frameIndex: number) => !selectedTextId && selectedFrameIndex === frameIndex && !backgroundSelected;
  const isTextSelected = (textId: string) => selectedTextId === textId;

  return (
    <ScrollArea h="100%" offsetScrollbars>
      <Stack p="md" gap="md">
        <Group justify="space-between" align="center">
          <Text fw={700}>Layers</Text>
          {screen && (
            <Badge variant="light" color="blue" size="sm" style={{ textTransform: 'none' }}>
              {screen.name}
            </Badge>
          )}
        </Group>

        {/* Background Section */}
        <Box>
          <Divider label="Background" labelPosition="left" mb="xs" />
          <Box
            onClick={handleBackgroundSelect}
            style={{
              border: isBackgroundSelected ? '1px solid #7950f2' : '1px solid #E5E7EB',
              backgroundColor: isBackgroundSelected ? 'rgba(121, 80, 242, 0.06)' : 'white',
              borderRadius: 8,
              padding: '8px 10px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <Group justify="space-between" align="center" gap="xs">
              <Text size="sm" fw={500}>
                Background
              </Text>
              {screen && (
                <Box
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    backgroundColor: screen.settings.backgroundColor === 'transparent'
                      ? 'transparent'
                      : screen.settings.backgroundColor,
                    border: screen.settings.backgroundColor === 'transparent'
                      ? '1px solid #E5E7EB'
                      : 'none',
                    backgroundImage: screen.settings.backgroundColor === 'transparent'
                      ? 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)'
                      : 'none',
                    backgroundSize: screen.settings.backgroundColor === 'transparent' ? '8px 8px' : 'auto',
                    backgroundPosition: screen.settings.backgroundColor === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto',
                  }}
                />
              )}
            </Group>
          </Box>
        </Box>

        {/* Frames Section */}
        <Box>
          <Divider label="Frames" labelPosition="left" mb="xs" />
          {frameCount === 0 ? (
            <Text size="sm" c="dimmed">
              No frames
            </Text>
          ) : (
            <Stack gap={6}>
              {Array.from({ length: frameCount }).map((_, frameIndex) => {
                const frame = screen?.images?.[frameIndex];
                const hasMedia = !!(frame?.image || frame?.mediaId);
                const deviceFrameName = getFrameDisplayName(frame?.diyOptions, frame?.diyTemplateId);
                const isSelected = isFrameSelected(frameIndex);

                return (
                  <Box
                    key={frameIndex}
                    onClick={() => handleFrameSelect(frameIndex)}
                    style={{
                      border: isSelected ? '1px solid #7950f2' : '1px solid #E5E7EB',
                      backgroundColor: isSelected ? 'rgba(121, 80, 242, 0.06)' : 'white',
                      borderRadius: 8,
                      padding: '8px 10px',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <Group justify="space-between" align="center" gap="xs">
                      <Group gap="xs" align="center" style={{ minWidth: 0, flex: 1 }}>
                        <Text size="sm" fw={500} truncate>
                          Frame {frameIndex + 1}
                        </Text>
                        <Text size="xs" c="dimmed" truncate>
                          {deviceFrameName}
                        </Text>
                        {hasMedia && (
                          <Box
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              backgroundColor: '#667eea',
                            }}
                          />
                        )}
                      </Group>
                      <Group gap={4}>
                        {isSelected && (
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!screen) return;
                              clearFrameSlot(primarySelectedIndex, frameIndex);
                            }}
                            aria-label="Delete frame"
                            title="Delete frame (removes media and device frame)"
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Group>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>

        {/* Text Section */}
        <Box>
          <Divider label="Text" labelPosition="left" mb="xs" />
          {textLayers.length === 0 ? (
            <Text size="sm" c="dimmed">
              No text layers
            </Text>
          ) : (
            <Stack gap={6}>
              {textLayers.map((t, uiIndex) => {
                const isSelected = isTextSelected(t.id);
                const isRenaming = renamingId === t.id;

                return (
                  <Box
                    key={t.id}
                    draggable
                    onDragStart={() => setDragFromIndex(uiIndex)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (!screen) return;
                      if (dragFromIndex == null) return;
                      const fromAsc = mapUiIndexToAscIndex(dragFromIndex);
                      const toAsc = mapUiIndexToAscIndex(uiIndex);
                      reorderTextElements(screen.id, fromAsc, toAsc);
                      setDragFromIndex(null);
                    }}
                    onDragEnd={() => setDragFromIndex(null)}
                    onClick={() => handleTextSelect(t.id)}
                    style={{
                      border: isSelected ? '1px solid #7950f2' : '1px solid #E5E7EB',
                      backgroundColor: isSelected ? 'rgba(121, 80, 242, 0.06)' : 'white',
                      borderRadius: 8,
                      padding: '8px 10px',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <Group justify="space-between" align="center" gap="xs">
                      <Group gap="xs" align="center" style={{ minWidth: 0, flex: 1 }}>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!screen) return;
                            updateTextElement(screen.id, t.id, { visible: !t.visible });
                          }}
                          aria-label={t.visible ? 'Hide' : 'Show'}
                          title={t.visible ? 'Hide' : 'Show'}
                        >
                          {t.visible ? <IconEye size={14} /> : <IconEyeOff size={14} />}
                        </ActionIcon>

                        <Box style={{ minWidth: 0, flex: 1 }}>
                          {isRenaming ? (
                            <TextInput
                              size="xs"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.currentTarget.value)}
                              onBlur={commitRename}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRename();
                                if (e.key === 'Escape') setRenamingId(null);
                              }}
                              autoFocus
                            />
                          ) : (
                            <Text
                              size="sm"
                              fw={600}
                              truncate
                              onDoubleClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                startRename(t.id, t.name);
                              }}
                              title="Double-click to rename"
                            >
                              {t.name}
                            </Text>
                          )}
                        </Box>
                      </Group>

                      <Group gap={4}>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!screen) return;
                            duplicateTextElement(screen.id, t.id);
                          }}
                          aria-label="Duplicate"
                          title="Duplicate"
                        >
                          <IconCopy size={14} />
                        </ActionIcon>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!screen) return;
                            deleteTextElement(screen.id, t.id);
                          }}
                          aria-label="Delete"
                          title="Delete"
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </Group>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </Stack>
    </ScrollArea>
  );
}
