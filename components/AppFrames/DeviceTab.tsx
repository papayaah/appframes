'use client';

import { Stack, Text, Box, ScrollArea } from '@mantine/core';
import { CanvasSettings } from './AppFrames';

interface DeviceTabProps {
  settings: CanvasSettings;
  setSettings: (settings: CanvasSettings) => void;
}

interface DeviceOption {
  id: string;
  name: string;
  dimensions: string;
  category: string;
}

const devices: DeviceOption[] = [
  // PHONES
  { id: 'iphone-14-pro', name: 'iPhone 14 Pro', dimensions: 'Notch', category: 'PHONES' },
  { id: 'iphone-14', name: 'iPhone 14', dimensions: 'Notch', category: 'PHONES' },
  { id: 'iphone-13', name: 'iPhone 13', dimensions: 'Notch', category: 'PHONES' },
  { id: 'iphone-se', name: 'iPhone SE', dimensions: 'Home Button', category: 'PHONES' },
  { id: 'pixel-7', name: 'Pixel 7', dimensions: 'Punch Hole', category: 'PHONES' },
  { id: 'samsung-s23', name: 'Samsung S23', dimensions: 'Punch Hole', category: 'PHONES' },
  { id: 'galaxy-z-flip-5', name: 'Galaxy Z Flip 5', dimensions: 'Foldable', category: 'PHONES' },
  { id: 'galaxy-z-fold-5', name: 'Galaxy Z Fold 5', dimensions: 'Foldable', category: 'PHONES' },
  
  // TABLETS
  { id: 'ipad-pro', name: 'iPad Pro', dimensions: 'Rounded', category: 'TABLETS' },
  { id: 'ipad-air', name: 'iPad Air', dimensions: 'Rounded', category: 'TABLETS' },
  { id: 'ipad-mini', name: 'iPad Mini', dimensions: 'Rounded', category: 'TABLETS' },
  { id: 'galaxy-tab-s9', name: 'Galaxy Tab S9', dimensions: 'Rounded', category: 'TABLETS' },
  
  // LAPTOPS
  { id: 'macbook-pro-16', name: 'MacBook Pro 16"', dimensions: 'Notch', category: 'LAPTOPS' },
  { id: 'macbook-pro-14', name: 'MacBook Pro 14"', dimensions: 'Notch', category: 'LAPTOPS' },
  { id: 'macbook-air', name: 'MacBook Air', dimensions: 'No Notch', category: 'LAPTOPS' },
  { id: 'surface-laptop', name: 'Surface Laptop', dimensions: 'Windows', category: 'LAPTOPS' },
  
  // DESKTOPS
  { id: 'imac-24', name: 'iMac 24"', dimensions: 'All-in-One', category: 'DESKTOPS' },
  { id: 'studio-display', name: 'Studio Display', dimensions: 'Monitor', category: 'DESKTOPS' },
  { id: 'pro-display-xdr', name: 'Pro Display XDR', dimensions: 'Monitor', category: 'DESKTOPS' },
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

export function DeviceTab({ settings, setSettings }: DeviceTabProps) {
  const categories = ['PHONES', 'TABLETS', 'LAPTOPS', 'DESKTOPS', 'TVS'];

  return (
    <ScrollArea style={{ height: '100%' }}>
      <Stack gap="lg" p="md">
        {categories.map((category) => {
          const categoryDevices = devices.filter((d) => d.category === category);
          if (categoryDevices.length === 0) return null;

          return (
            <Box key={category}>
              <Text size="xs" fw={700} c="dimmed" mb="xs" tt="uppercase">
                {category}
              </Text>
              <Stack gap="xs">
                {categoryDevices.map((device) => (
                  <DeviceButton
                    key={device.id}
                    device={device}
                    selected={settings.deviceFrame === device.id}
                    onClick={() => setSettings({ ...settings, deviceFrame: device.id })}
                  />
                ))}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </ScrollArea>
  );
}
