'use client';

import { Box, Group, Text, ActionIcon, Center } from '@mantine/core';
import { IconPlus, IconX } from '@tabler/icons-react';
import { Screen } from './AppFrames';

interface ScreensPanelProps {
  screens: Screen[];
  addScreen: (imageOrMediaId: string | number) => void;
  removeScreen: (id: string) => void;
  selectedIndices: number[];
  onSelectScreen: (indices: number[]) => void;
  onMediaUpload?: (file: File) => Promise<number | null>;
}

export function ScreensPanel({
  screens,
  addScreen,
  removeScreen,
  selectedIndices,
  onSelectScreen,
}: ScreensPanelProps) {

  return (
    <Box
      style={{
        borderTop: '1px solid #E5E7EB',
        padding: '16px 20px',
        backgroundColor: 'white',
        height: 140,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <Group gap="xs" mb="xs">
        <Box
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconPlus size={14} color="white" />
        </Box>
        <Text size="sm" fw={600} c="dark">
          SCREENS ({screens.length})
        </Text>
      </Group>

      <Group gap="md" style={{ height: 80 }}>
        {screens.map((screen, index) => (
          <Box
            key={screen.id}
            style={{
              position: 'relative',
              width: 60,
              height: 80,
              border: selectedIndices.includes(index) ? '2px solid #667eea' : '1px solid #dee2e6',
              borderRadius: 8,
              overflow: 'hidden',
              cursor: 'pointer',
              backgroundColor: '#f8f9fa',
              transition: 'all 0.2s',
              boxShadow: selectedIndices.includes(index)
                ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                : 'none',
            }}
            onClick={(e) => {
              const isSelected = selectedIndices.includes(index);

              // Cmd/Ctrl click toggles selection
              if (e.metaKey || e.ctrlKey) {
                if (isSelected) {
                  const next = selectedIndices.filter((i) => i !== index);
                  onSelectScreen(next.length ? next : [index]);
                } else {
                  onSelectScreen([...selectedIndices, index].sort((a, b) => a - b));
                }
              } else {
                // Regular click: single select
                onSelectScreen([index]);
              }
            }}
          >
            {screen.image && (
              <img
                src={screen.image}
                alt={screen.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            )}
            <ActionIcon
              size="xs"
              color="red"
              variant="filled"
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
              }}
              onClick={(e) => {
                e.stopPropagation();
                removeScreen(screen.id);
              }}
            >
              <IconX size={12} />
            </ActionIcon>
            <Text
              size="xs"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '2px 4px',
                textAlign: 'center',
              }}
            >
              {screen.name}
            </Text>
          </Box>
        ))}

        {/* New Screen: create a blank screen (no image) without opening file dialog */}
        <Box
          onClick={() => addScreen('')}
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
        >
          <Center style={{ height: '100%' }}>
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
          </Center>
        </Box>
      </Group>
    </Box>
  );
}
