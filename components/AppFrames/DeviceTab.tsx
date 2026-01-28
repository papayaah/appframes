'use client';

import { Stack, Text, Box, ScrollArea, Group, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useFrames, getCompositionFrameCount } from './FramesContext';
import { BASE_TYPES, DIY_TEMPLATES, getTemplatesByCategory } from './diy-frames/templates';
import { DIYDeviceType, getDefaultDIYOptions } from './diy-frames/types';

const BaseTypeButton = ({
  type,
  selected,
  onClick,
}: {
  type: { id: DIYDeviceType; name: string; description: string };
  selected: boolean;
  onClick: () => void;
}) => (
  <Box
    onClick={onClick}
    style={{
      padding: '12px 16px',
      border: selected ? '2px solid #667eea' : '1px solid #dee2e6',
      borderRadius: 8,
      cursor: 'pointer',
      backgroundColor: selected ? '#f8f9ff' : 'white',
      transition: 'all 0.2s',
    }}
  >
    <Text size="sm" fw={500} c={selected ? 'dark' : 'dimmed'}>
      {type.name}
    </Text>
    <Text size="xs" c="dimmed">
      {type.description}
    </Text>
  </Box>
);

const TemplateButton = ({
  template,
  selected,
  onClick,
}: {
  template: typeof DIY_TEMPLATES[0];
  selected: boolean;
  onClick: () => void;
}) => (
  <Box
    onClick={onClick}
    style={{
      padding: '10px 14px',
      border: selected ? '2px solid #667eea' : '1px solid #dee2e6',
      borderRadius: 8,
      cursor: 'pointer',
      backgroundColor: selected ? '#f8f9ff' : 'white',
      transition: 'all 0.2s',
    }}
  >
    <Text size="sm" fw={500} c={selected ? 'dark' : 'dimmed'}>
      {template.name}
    </Text>
  </Box>
);

export function DeviceTab() {
  const {
    screens,
    primarySelectedIndex,
    selectedFrameIndex,
    setSelectedFrameIndex,
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

  const templateCategories: DIYDeviceType[] = ['phone', 'flip', 'foldable', 'tablet', 'laptop', 'desktop'];

  return (
    <ScrollArea style={{ height: '100%' }}>
      <Stack gap="xl" p="md">
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

        {/* Base Types */}
        <Box>
          <Text size="sm" fw={700} c="dark" mb="md">
            Base Type
          </Text>
          <Stack gap="xs">
            {BASE_TYPES.map((type) => (
              <BaseTypeButton
                key={type.id}
                type={type}
                selected={currentType === type.id && !currentTemplateId}
                onClick={() => handleBaseTypeSelect(type.id)}
              />
            ))}
          </Stack>
        </Box>

        {/* Templates by Category */}
        <Box>
          <Text size="sm" fw={700} c="dark" mb="md">
            Templates
          </Text>
          <Stack gap="lg">
            {templateCategories.map((category) => {
              const templates = getTemplatesByCategory(category);
              if (templates.length === 0) return null;

              return (
                <Box key={category}>
                  <Text size="xs" fw={600} c="dimmed" mb="xs" pl="xs" tt="capitalize">
                    {category}
                  </Text>
                  <Stack gap="xs">
                    {templates.map((template) => (
                      <TemplateButton
                        key={template.id}
                        template={template}
                        selected={currentTemplateId === template.id}
                        onClick={() => handleTemplateSelect(template.id)}
                      />
                    ))}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Stack>
    </ScrollArea>
  );
}
