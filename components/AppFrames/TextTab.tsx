'use client';

import { useMemo, useState } from 'react';
import { ActionIcon, Badge, Box, Button, Divider, Group, ScrollArea, Stack, Text, TextInput } from '@mantine/core';
import { IconArrowBarDown, IconArrowBarUp, IconCopy, IconEye, IconEyeOff, IconPlus, IconTrash } from '@tabler/icons-react';
import { useFrames } from './FramesContext';

export function TextTab() {
  const {
    screens,
    primarySelectedIndex,
    addTextElement,
    updateTextElement,
    deleteTextElement,
    reorderTextElements,
    selectTextElement,
    duplicateTextElement,
  } = useFrames();

  const screen = screens[primarySelectedIndex];
  const selectedTextId = screen?.settings?.selectedTextId;

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);

  const layers = useMemo(() => {
    const list = [...(screen?.textElements ?? [])];
    // Render top-most first
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
    return Math.max(0, Math.min(layers.length - 1, (layers.length - 1) - uiIndex));
  };

  return (
    <ScrollArea h="100%" offsetScrollbars>
      <Stack p="md" gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <Text fw={700}>Text</Text>
            {screen && (
              <Badge variant="light" color="blue" size="sm" style={{ textTransform: 'none' }}>
                {screen.name}
              </Badge>
            )}
          </Group>
          <Group gap="xs">
            <Button
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={() => {
                if (!screen) return;
                addTextElement(screen.id);
              }}
            >
              Add Text
            </Button>
            <ActionIcon
              size="lg"
              variant="light"
              disabled={!screen || !selectedTextId || layers.length < 2}
              onClick={() => {
                if (!screen || !selectedTextId) return;
                const asc = [...(screen.textElements ?? [])].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
                const from = asc.findIndex(t => t.id === selectedTextId);
                if (from === -1) return;
                reorderTextElements(screen.id, from, asc.length - 1);
              }}
              aria-label="Bring to front"
              title="Bring to front"
            >
              <IconArrowBarUp size={16} />
            </ActionIcon>
            <ActionIcon
              size="lg"
              variant="light"
              disabled={!screen || !selectedTextId || layers.length < 2}
              onClick={() => {
                if (!screen || !selectedTextId) return;
                const asc = [...(screen.textElements ?? [])].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
                const from = asc.findIndex(t => t.id === selectedTextId);
                if (from === -1) return;
                reorderTextElements(screen.id, from, 0);
              }}
              aria-label="Send to back"
              title="Send to back"
            >
              <IconArrowBarDown size={16} />
            </ActionIcon>
            <ActionIcon
              size="lg"
              variant="light"
              color="red"
              disabled={!screen || !selectedTextId}
              onClick={() => {
                if (!screen || !selectedTextId) return;
                deleteTextElement(screen.id, selectedTextId);
              }}
              aria-label="Delete"
              title="Delete"
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        </Group>

        <Divider label="Layers" labelPosition="center" />

        {layers.length === 0 ? (
          <Text size="sm" c="dimmed">
            No text yet. Click “Add Text”.
          </Text>
        ) : (
          <Stack gap={6}>
            {layers.map((t, uiIndex) => {
              const isSelected = !!selectedTextId && selectedTextId === t.id;
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
                  onClick={() => {
                    if (!screen) return;
                    selectTextElement(t.id);
                  }}
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
                    </Group>
                  </Group>
                </Box>
              );
            })}
          </Stack>
        )}

      </Stack>
    </ScrollArea>
  );
}
