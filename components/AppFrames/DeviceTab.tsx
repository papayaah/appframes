'use client';

import { Stack, Text, Box, ScrollArea, Group, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useFrames, getCompositionFrameCount } from './FramesContext';
import { DIY_TEMPLATES, getTemplatesByCategory } from './diy-frames/templates';
import { DIYDeviceType, getDefaultDIYOptions } from './diy-frames/types';

// Base type configurations with icons
interface BaseTypeConfig {
  id: DIYDeviceType;
  label: string;
  shortLabel?: string;
}

const BASE_TYPE_CONFIGS: BaseTypeConfig[] = [
  { id: 'phone', label: 'Phone' },
  { id: 'flip', label: 'Flip' },
  { id: 'foldable', label: 'Foldable', shortLabel: 'Fold' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'laptop', label: 'Laptop' },
  { id: 'desktop', label: 'Desktop' },
];

// Device Icons for base types
function BaseTypeIcon({ type, size = 36 }: { type: DIYDeviceType; size?: number }) {
  const s = size;
  const strokeWidth = 2;
  const color = 'currentColor';

  // Phone - tall rectangle with notch
  if (type === 'phone') {
    return (
      <Box style={{ width: s * 0.5, height: s * 0.85, position: 'relative' }}>
        <Box
          style={{
            width: '100%',
            height: '100%',
            border: `${strokeWidth}px solid ${color}`,
            borderRadius: s * 0.1,
          }}
        />
        <Box
          style={{
            position: 'absolute',
            top: s * 0.04,
            left: '50%',
            transform: 'translateX(-50%)',
            width: s * 0.15,
            height: s * 0.04,
            backgroundColor: color,
            borderRadius: 2,
          }}
        />
      </Box>
    );
  }

  // Flip - two stacked rectangles with gap
  if (type === 'flip') {
    return (
      <Box style={{ width: s * 0.5, height: s * 0.85, position: 'relative' }}>
        {/* Top half */}
        <Box
          style={{
            width: '100%',
            height: '42%',
            border: `${strokeWidth}px solid ${color}`,
            borderRadius: `${s * 0.08}px ${s * 0.08}px 0 0`,
          }}
        />
        {/* Hinge */}
        <Box
          style={{
            width: '100%',
            height: '4%',
            backgroundColor: color,
            opacity: 0.4,
          }}
        />
        {/* Bottom half */}
        <Box
          style={{
            width: '100%',
            height: '42%',
            border: `${strokeWidth}px solid ${color}`,
            borderRadius: `0 0 ${s * 0.08}px ${s * 0.08}px`,
          }}
        />
      </Box>
    );
  }

  // Foldable - wide rectangle with vertical fold line
  if (type === 'foldable') {
    return (
      <Box style={{ width: s * 0.85, height: s * 0.6, position: 'relative' }}>
        <Box
          style={{
            width: '100%',
            height: '100%',
            border: `${strokeWidth}px solid ${color}`,
            borderRadius: s * 0.06,
          }}
        />
        {/* Fold line */}
        <Box
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 2,
            height: '80%',
            backgroundColor: color,
            opacity: 0.4,
          }}
        />
      </Box>
    );
  }

  // Tablet - wide rectangle
  if (type === 'tablet') {
    return (
      <Box style={{ width: s * 0.7, height: s * 0.85, position: 'relative' }}>
        <Box
          style={{
            width: '100%',
            height: '100%',
            border: `${strokeWidth}px solid ${color}`,
            borderRadius: s * 0.06,
          }}
        />
        {/* Camera dot */}
        <Box
          style={{
            position: 'absolute',
            top: s * 0.05,
            left: '50%',
            transform: 'translateX(-50%)',
            width: s * 0.05,
            height: s * 0.05,
            backgroundColor: color,
            borderRadius: '50%',
          }}
        />
      </Box>
    );
  }

  // Laptop - screen with keyboard base
  if (type === 'laptop') {
    return (
      <Box style={{ width: s * 0.9, height: s * 0.7, position: 'relative' }}>
        {/* Screen */}
        <Box
          style={{
            width: '85%',
            height: '65%',
            margin: '0 auto',
            border: `${strokeWidth}px solid ${color}`,
            borderRadius: `${s * 0.04}px ${s * 0.04}px 0 0`,
          }}
        />
        {/* Keyboard base */}
        <Box
          style={{
            width: '100%',
            height: '25%',
            backgroundColor: color,
            opacity: 0.3,
            borderRadius: `0 0 ${s * 0.04}px ${s * 0.04}px`,
          }}
        />
      </Box>
    );
  }

  // Desktop - monitor with stand
  if (type === 'desktop') {
    return (
      <Box style={{ width: s * 0.9, height: s * 0.75, position: 'relative' }}>
        {/* Monitor */}
        <Box
          style={{
            width: '100%',
            height: '70%',
            border: `${strokeWidth}px solid ${color}`,
            borderRadius: s * 0.04,
          }}
        />
        {/* Stand neck */}
        <Box
          style={{
            width: s * 0.12,
            height: '12%',
            backgroundColor: color,
            opacity: 0.5,
            margin: '0 auto',
          }}
        />
        {/* Stand base */}
        <Box
          style={{
            width: '40%',
            height: s * 0.04,
            backgroundColor: color,
            opacity: 0.5,
            margin: '0 auto',
            borderRadius: s * 0.02,
          }}
        />
      </Box>
    );
  }

  // Default fallback
  return (
    <Box
      style={{
        width: s * 0.5,
        height: s * 0.85,
        border: `${strokeWidth}px solid ${color}`,
        borderRadius: s * 0.08,
      }}
    />
  );
}

export function DeviceTab() {
  const {
    screens,
    primarySelectedIndex,
    selectedFrameIndex,
    setSelectedFrameIndex,
    setFrameSelectionVisible,
    setFrameDIYOptions,
    addFrameSlot,
    selectTextElement,
  } = useFrames();

  const currentScreen = screens[primarySelectedIndex];
  const currentImages = currentScreen?.images || [];
  const currentFrame = currentImages[selectedFrameIndex];
  const currentDIYOptions = currentFrame?.diyOptions;
  const currentTemplateId = currentFrame?.diyTemplateId;
  const currentType = currentDIYOptions?.type;

  const currentFrameCount = getCompositionFrameCount(currentScreen?.settings?.composition ?? 'single');
  const canAddFrame = currentFrameCount < 3;

  const handleBaseTypeSelect = (deviceType: DIYDeviceType) => {
    const options = getDefaultDIYOptions(deviceType);
    setFrameDIYOptions(primarySelectedIndex, selectedFrameIndex, options);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = DIY_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setFrameDIYOptions(primarySelectedIndex, selectedFrameIndex, template.options, templateId);
    }
  };

  // Get templates for current type
  const currentTypeTemplates = currentType ? getTemplatesByCategory(currentType) : [];

  return (
    <ScrollArea style={{ height: '100%' }}>
      <Stack gap="lg" p="md">
        <Group justify="space-between" align="center">
          <Text fw={700}>Frame</Text>
          <Button
            size="xs"
            leftSection={<IconPlus size={14} />}
            disabled={!currentScreen || !canAddFrame}
            onClick={() => {
              if (!currentScreen) return;
              selectTextElement(null);
              addFrameSlot();
            }}
          >
            Add Frame
          </Button>
        </Group>

        {currentScreen && currentFrameCount > 1 && (
          <Group gap="xs">
            {Array.from({ length: currentFrameCount }).map((_, i) => (
              <Button
                key={i}
                size="xs"
                variant={selectedFrameIndex === i ? 'filled' : 'light'}
                onClick={() => {
                  selectTextElement(null);
                  setSelectedFrameIndex(i);
                  setFrameSelectionVisible(true);
                }}
              >
                Frame {i + 1}
              </Button>
            ))}
          </Group>
        )}

        {currentScreen && (
          <Box p="xs" style={{ backgroundColor: '#f8f9ff', borderRadius: 8 }}>
            <Text size="xs" c="dimmed" fw={500}>
              Editing Frame {selectedFrameIndex + 1} of {currentFrameCount}
            </Text>
          </Box>
        )}

        {/* Base Types - Card Grid */}
        <Box>
          <Text size="xs" c="dimmed" mb="xs" tt="uppercase">
            Base Type
          </Text>
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}
          >
            {BASE_TYPE_CONFIGS.map((config) => {
              const isSelected = currentType === config.id && !currentTemplateId;
              return (
                <Box
                  key={config.id}
                  onClick={() => handleBaseTypeSelect(config.id)}
                  style={{
                    padding: '10px 4px',
                    borderRadius: 8,
                    border: isSelected ? '2px solid #667eea' : '1px solid #dee2e6',
                    backgroundColor: isSelected ? '#f8f9ff' : 'white',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Box
                    style={{
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSelected ? '#667eea' : '#868e96',
                      marginBottom: 4,
                    }}
                  >
                    <BaseTypeIcon type={config.id} size={36} />
                  </Box>
                  <Text size="xs" fw={isSelected ? 600 : 400} c={isSelected ? '#667eea' : undefined}>
                    {config.shortLabel || config.label}
                  </Text>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Templates - Show directly when base type is selected */}
        {currentTypeTemplates.length > 0 && (
          <Box>
            <Text size="xs" c="dimmed" mb="xs" tt="uppercase">
              Templates
            </Text>
            <Stack gap={4}>
              {currentTypeTemplates.map((template) => {
                const isSelected = currentTemplateId === template.id;
                return (
                  <Box
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #667eea' : '1px solid #dee2e6',
                      backgroundColor: isSelected ? '#f8f9ff' : 'white',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Text size="xs" fw={isSelected ? 600 : 500} c={isSelected ? '#667eea' : undefined}>
                      {template.name}
                    </Text>
                    {template.description && (
                      <Text size="xs" c="dimmed">
                        {template.description}
                      </Text>
                    )}
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}
      </Stack>
    </ScrollArea>
  );
}
