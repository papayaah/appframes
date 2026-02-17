'use client';

import { useState, useEffect } from 'react';
import { Stack, Text, Box, ScrollArea, Group, Button, SimpleGrid, Divider } from '@mantine/core';
import { IconPlus, IconBrandApple, IconDevices } from '@tabler/icons-react';
import { useFrames, getCompositionFrameCount } from './FramesContext';
import { BASE_TYPES, BRANDS, DIY_TEMPLATES, findBrandForTemplate } from './diy-frames/templates';
import { DIYDeviceType, DeviceBrand, getDefaultDIYOptions } from './diy-frames/types';

function BrandIcon({ brandId, size = 24 }: { brandId: DeviceBrand; size?: number }) {
  if (brandId === 'apple') {
    return <IconBrandApple size={size} style={{ marginBottom: 4 }} />;
  }
  if (brandId === 'samsung') {
    return (
      <Text
        fw={700}
        style={{
          fontSize: size * 0.8,
          lineHeight: 1,
          marginBottom: 4,
          fontFamily: 'sans-serif',
        }}
      >
        S
      </Text>
    );
  }
  return <IconDevices size={size} style={{ marginBottom: 4 }} />;
}

const TemplateCard = ({
  template,
  selected,
  onClick,
  id,
}: {
  template: (typeof DIY_TEMPLATES)[0];
  selected: boolean;
  onClick: () => void;
  id?: string;
}) => (
  <Box
    id={id}
    onClick={onClick}
    style={{
      aspectRatio: '1',
      padding: '6px 4px',
      borderRadius: 8,
      border: '2px solid',
      borderColor: selected ? '#667eea' : '#dee2e6',
      backgroundColor: selected ? '#f8f9ff' : 'white',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.15s ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    }}
  >
    <Text style={{ fontSize: 11 }} fw={selected ? 600 : 400} c={selected ? '#667eea' : undefined} lh={1.2}>
      {template.name}
    </Text>
    <Text style={{ fontSize: 9 }} c="dimmed" lh={1.2}>
      {template.description}
    </Text>
  </Box>
);

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
      aspectRatio: '1',
      padding: '6px 4px',
      borderRadius: 8,
      border: '2px solid',
      borderColor: selected ? '#667eea' : '#dee2e6',
      backgroundColor: selected ? '#f8f9ff' : 'white',
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.15s ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    }}
  >
    <Text style={{ fontSize: 11 }} fw={selected ? 600 : 400} c={selected ? '#667eea' : undefined} lh={1.2}>
      {type.name}
    </Text>
    <Text style={{ fontSize: 9 }} c="dimmed" lh={1.2}>
      {type.description}
    </Text>
  </Box>
);

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

  // Initialize brand tab from the current template's brand
  const [activeBrandId, setActiveBrandId] = useState<DeviceBrand>(
    () => (currentTemplateId ? findBrandForTemplate(currentTemplateId) : undefined) ?? 'apple'
  );

  // Sync brand tab when switching frames
  useEffect(() => {
    if (currentTemplateId) {
      const brand = findBrandForTemplate(currentTemplateId);
      if (brand && brand !== activeBrandId) {
        setActiveBrandId(brand);
      }
    }
  }, [currentTemplateId, selectedFrameIndex]);

  const activeBrand = BRANDS.find((b) => b.id === activeBrandId) || BRANDS[0];

  const handleBaseTypeSelect = (deviceType: DIYDeviceType) => {
    const options = getDefaultDIYOptions(deviceType);
    setFrameDIYOptions(primarySelectedIndex, selectedFrameIndex, options);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = DIY_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setFrameDIYOptions(primarySelectedIndex, selectedFrameIndex, template.options, templateId);
      if (template.brand !== activeBrandId) {
        setActiveBrandId(template.brand);
      }
    }
  };

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

        {/* Brand Tabs */}
        <Group gap={8}>
          {BRANDS.map((brand) => {
            const isActive = activeBrandId === brand.id;
            return (
              <Box
                key={brand.id}
                onClick={() => setActiveBrandId(brand.id)}
                style={{
                  aspectRatio: '1',
                  padding: '6px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: isActive ? '#667eea' : '#dee2e6',
                  backgroundColor: isActive ? '#f8f9ff' : 'white',
                  color: isActive ? '#667eea' : '#868e96',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BrandIcon brandId={brand.id} size={24} />
                <Text size="xs" fw={isActive ? 600 : 500}>
                  {brand.label}
                </Text>
              </Box>
            );
          })}
        </Group>

        {/* Templates for active brand, sub-grouped by device category */}
        <Stack gap="md">
          {activeBrand.categories.map(({ category, label, templates }) => (
            <Box key={category}>
              <Text size="xs" fw={600} c="dimmed" mb="xs" pl="xs" tt="capitalize">
                {label}
              </Text>
              <SimpleGrid cols={3} spacing={8}>
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    id={`device-${template.id}`}
                    template={template}
                    selected={currentTemplateId === template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                  />
                ))}
              </SimpleGrid>
            </Box>
          ))}
        </Stack>

        {/* Custom Base Types */}
        <Divider label="Custom" labelPosition="center" />

        <SimpleGrid cols={3} spacing={8}>
          {BASE_TYPES.map((type) => (
            <BaseTypeButton
              key={type.id}
              type={type}
              selected={currentType === type.id && !currentTemplateId}
              onClick={() => handleBaseTypeSelect(type.id)}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </ScrollArea>
  );
}
