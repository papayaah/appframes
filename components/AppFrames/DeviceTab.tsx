'use client';

import { Stack, Text, Box, ScrollArea, Group, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useFrames, getCompositionFrameCount } from './FramesContext';

interface DeviceOption {
  id: string;
  name: string;
  dimensions: string;
  category: string;
  subcategory?: string;
}

const devices: DeviceOption[] = [
  // PHONES - iOS
  { id: 'iphone-frameless', name: 'Frameless', dimensions: 'No bezel', category: 'PHONES', subcategory: 'iOS' },
  { id: 'iphone-14-pro', name: 'iPhone 14 Pro', dimensions: 'Dynamic Island', category: 'PHONES', subcategory: 'iOS' },
  { id: 'iphone-14', name: 'iPhone 14', dimensions: 'Notch', category: 'PHONES', subcategory: 'iOS' },
  { id: 'iphone-13', name: 'iPhone 13', dimensions: 'Notch', category: 'PHONES', subcategory: 'iOS' },
  { id: 'iphone-se', name: 'iPhone SE', dimensions: 'Home Button', category: 'PHONES', subcategory: 'iOS' },
  
  // PHONES - Android
  { id: 'pixel-7', name: 'Pixel 7', dimensions: 'Punch Hole', category: 'PHONES', subcategory: 'Android' },
  { id: 'samsung-s23', name: 'Samsung S23', dimensions: 'Punch Hole', category: 'PHONES', subcategory: 'Android' },
  { id: 'galaxy-z-flip-5', name: 'Galaxy Z Flip 5', dimensions: 'Foldable', category: 'PHONES', subcategory: 'Android' },
  { id: 'galaxy-z-fold-5', name: 'Galaxy Z Fold 5', dimensions: 'Foldable', category: 'PHONES', subcategory: 'Android' },
  
  // TABLETS - iOS
  { id: 'ipad-pro', name: 'iPad Pro', dimensions: 'Rounded', category: 'TABLETS', subcategory: 'iOS' },
  { id: 'ipad-air', name: 'iPad Air', dimensions: 'Rounded', category: 'TABLETS', subcategory: 'iOS' },
  { id: 'ipad-mini', name: 'iPad Mini', dimensions: 'Rounded', category: 'TABLETS', subcategory: 'iOS' },
  
  // TABLETS - Android
  { id: 'galaxy-tab-s9', name: 'Galaxy Tab S9', dimensions: 'Rounded', category: 'TABLETS', subcategory: 'Android' },
  
  // LAPTOPS - macOS
  { id: 'macbook-pro-16', name: 'MacBook Pro 16"', dimensions: 'Notch', category: 'LAPTOPS', subcategory: 'macOS' },
  { id: 'macbook-pro-14', name: 'MacBook Pro 14"', dimensions: 'Notch', category: 'LAPTOPS', subcategory: 'macOS' },
  { id: 'macbook-air', name: 'MacBook Air', dimensions: 'No Notch', category: 'LAPTOPS', subcategory: 'macOS' },
  
  // LAPTOPS - Windows
  { id: 'surface-laptop', name: 'Surface Laptop', dimensions: 'Windows', category: 'LAPTOPS', subcategory: 'Windows' },
  
  // DESKTOPS - macOS
  { id: 'imac-24', name: 'iMac 24"', dimensions: 'All-in-One', category: 'DESKTOPS', subcategory: 'macOS' },
  { id: 'studio-display', name: 'Studio Display', dimensions: 'Monitor', category: 'DESKTOPS', subcategory: 'macOS' },
  { id: 'pro-display-xdr', name: 'Pro Display XDR', dimensions: 'Monitor', category: 'DESKTOPS', subcategory: 'macOS' },
];

const DeviceButton = ({
  device,
  selected,
  onClick,
}: {
  device: DeviceOption;
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
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}
  >
    <Box
      style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: selected ? '#667eea' : '#e9ecef',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Box
        style={{
          width: 16,
          height: 22,
          border: `2px solid ${selected ? 'white' : '#868e96'}`,
          borderRadius: 3,
        }}
      />
    </Box>
    <Box style={{ flex: 1 }}>
      <Text size="sm" fw={500} c={selected ? 'dark' : 'dimmed'}>
        {device.name}
      </Text>
      <Text size="xs" c="dimmed">
        {device.dimensions}
      </Text>
    </Box>
    {selected && (
      <Box
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          backgroundColor: '#667eea',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text size="xs" c="white">
          ✓
        </Text>
      </Box>
    )}
  </Box>
);

export function DeviceTab({ 
}: {}) {
  const {
    screens,
    primarySelectedIndex,
    selectedFrameIndex,
    setSelectedFrameIndex,
    setFrameDevice,
    addFrameSlot,
    selectTextElement,
  } = useFrames();
  const categories = ['PHONES', 'TABLETS', 'LAPTOPS', 'DESKTOPS'];

  // Get current screen and its images
  const currentScreen = screens[primarySelectedIndex];
  const currentImages = currentScreen?.images || [];
  
  // Get the device frame for the selected frame
  const rawDeviceFrame = currentImages[selectedFrameIndex]?.deviceFrame;
  const isCleared = currentImages[selectedFrameIndex]?.cleared === true || rawDeviceFrame === '';
  const currentDeviceFrame = isCleared ? '' : (rawDeviceFrame || 'iphone-14-pro');

  const currentFrameCount = getCompositionFrameCount(currentScreen?.settings?.composition ?? 'single');
  const canAddFrame = currentFrameCount < 3;

  const handleDeviceSelect = (deviceId: string) => {
    setFrameDevice(primarySelectedIndex, selectedFrameIndex, deviceId);
  };

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
              // Keep selection semantics consistent: frames and text are mutually exclusive.
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
                  // Keep selection semantics consistent: frames and text are mutually exclusive.
                  selectTextElement(null);
                  setSelectedFrameIndex(i);
                }}
              >
                Frame {i + 1}
              </Button>
            ))}
          </Group>
        )}

        {/* Show which frame is being edited */}
        {currentScreen && (
          <Box p="xs" style={{ backgroundColor: '#f8f9ff', borderRadius: 8 }}>
            <Text size="xs" c="dimmed" fw={500}>
              Editing Frame {selectedFrameIndex + 1} of {currentFrameCount}
            </Text>
          </Box>
        )}
        
        {categories.map((category) => {
          const categoryDevices = devices.filter((d) => d.category === category);
          if (categoryDevices.length === 0) return null;

          // Group devices by subcategory
          const subcategories = Array.from(new Set(categoryDevices.map((d) => d.subcategory).filter(Boolean)));

          return (
            <Box key={category}>
              <Text size="sm" fw={700} c="dark" mb="md" tt="capitalize">
                {category.toLowerCase()}
              </Text>
              <Stack gap="lg">
                {subcategories.map((subcategory) => {
                  const subcategoryDevices = categoryDevices.filter((d) => d.subcategory === subcategory);
                  
                  return (
                    <Box key={subcategory}>
                      <Text size="xs" fw={600} c="dimmed" mb="xs" pl="xs">
                        {subcategory}
                      </Text>
                      <Stack gap="xs">
                        {subcategoryDevices.map((device) => (
                          <DeviceButton
                            key={device.id}
                            device={device}
                            selected={currentDeviceFrame === device.id}
                            onClick={() => handleDeviceSelect(device.id)}
                          />
                        ))}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </ScrollArea>
  );
}
