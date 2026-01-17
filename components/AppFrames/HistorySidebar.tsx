'use client';

import { ActionIcon, Box, Divider, Group, ScrollArea, Stack, Text, Tooltip } from '@mantine/core';
import { IconArrowBackUp, IconArrowForwardUp, IconChevronLeft, IconChevronRight, IconHistory } from '@tabler/icons-react';
import type { PatchHistoryEntry } from '@/hooks/usePatchHistory';

export function HistorySidebar(props: {
  open: boolean;
  onToggleOpen: () => void;
  entries: PatchHistoryEntry[]; // transitions (past + future)
  position: number; // 0..entries.length
  goTo: (position: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}) {
  const { open, onToggleOpen, entries, position, goTo, canUndo, canRedo, undo, redo } = props;

  const rowStyle = (active: boolean): React.CSSProperties => ({
    border: active ? '1px solid #7950f2' : '1px solid #E5E7EB',
    backgroundColor: active ? 'rgba(121, 80, 242, 0.06)' : 'white',
    borderRadius: 8,
    padding: '8px 10px',
    cursor: 'pointer',
    userSelect: 'none',
  });

  return (
    <Box style={{ position: 'relative', height: '100%', background: 'white' }}>
      {/* Notch / Pullout Handle (mirrors left sidebar notch) */}
      <Box
        onClick={onToggleOpen}
        style={{
          position: 'absolute',
          left: -16,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 16,
          height: 48,
          borderTopLeftRadius: 8,
          borderBottomLeftRadius: 8,
          border: '1px solid #E5E7EB',
          borderRight: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 100,
          boxShadow: '-2px 0 4px rgba(0,0,0,0.05)',
          background: 'white',
        }}
        aria-label={open ? 'Collapse history panel' : 'Expand history panel'}
        title={open ? 'Collapse' : 'Expand'}
      >
        {open ? <IconChevronRight size={12} /> : <IconChevronLeft size={12} />}
      </Box>

      {open ? (
        <Stack gap="xs" p="md" style={{ height: '100%' }}>
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconHistory size={16} />
              <Text fw={700}>History</Text>
            </Group>
            <Group gap={6}>
              <Tooltip label="Undo">
                <ActionIcon size="lg" variant="light" disabled={!canUndo} onClick={undo} aria-label="Undo">
                  <IconArrowBackUp size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Redo">
                <ActionIcon size="lg" variant="light" disabled={!canRedo} onClick={redo} aria-label="Redo">
                  <IconArrowForwardUp size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          <Divider />

          <ScrollArea h="100%" offsetScrollbars>
            <Stack gap={6}>
              {/* Newest-first */}
              {[...entries].reverse().map((e, displayIndex) => {
                const originalIndex = entries.length - 1 - displayIndex;
                const rowPos = originalIndex + 1; // state after this transition
                const active = position === rowPos;
                const when = new Date(e.at);
                return (
                  <Box
                    key={`${e.at}-${originalIndex}`}
                    onClick={() => goTo(rowPos)}
                    style={rowStyle(active)}
                    title={`Jump to this step • ${when.toLocaleString()}`}
                  >
                    <Text size="sm" fw={600} truncate>
                      {e.label || 'Edit'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {when.toLocaleTimeString()}
                    </Text>
                  </Box>
                );
              })}

              {/* Position 0 = start (at bottom) */}
              <Box onClick={() => goTo(0)} style={rowStyle(position === 0)} title="Jump to start">
                <Text size="sm" fw={600}>
                  Start
                </Text>
                <Text size="xs" c="dimmed">
                  Initial state
                </Text>
              </Box>
            </Stack>
          </ScrollArea>
        </Stack>
      ) : (
        // Closed: keep a clean rail so the notch can be used.
        <Box style={{ height: '100%', width: '100%', background: 'transparent' }} />
      )}
    </Box>
  );
}

