'use client';

import { useState } from 'react';
import {
  Stack,
  Text,
  SimpleGrid,
  Box,
  Group,
  Button,
  Popover,
  ColorPicker,
  Tabs,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { CanvasSettings } from './AppFrames';
import { GradientEditor } from './GradientEditor';
import { isGradient, getBackgroundStyle, BACKGROUND_PRESETS } from './Sidebar';

export interface CanvasSettingsPanelProps {
  settings: CanvasSettings;
  setSettings: (settings: CanvasSettings) => void;
}

export function CanvasSettingsPanel({ settings, setSettings }: CanvasSettingsPanelProps) {
  const [customColorOpen, setCustomColorOpen] = useState(false);
  const [customColor, setCustomColor] = useState('#ffffff');

  return (
    <Stack gap="lg">
      <Box>
        <Text size="sm" fw={700} mb="xs">
          Canvas Orientation
        </Text>
        <Group grow>
          <Button
            size="xs"
            variant={settings.orientation === 'portrait' ? 'filled' : 'light'}
            onClick={() => setSettings({ ...settings, orientation: 'portrait' })}
          >
            Portrait
          </Button>
          <Button
            size="xs"
            variant={settings.orientation === 'landscape' ? 'filled' : 'light'}
            onClick={() => setSettings({ ...settings, orientation: 'landscape' })}
          >
            Landscape
          </Button>
        </Group>
      </Box>

      <Box>
        <Text size="sm" fw={700} mb="xs">
          Background Color
        </Text>
        <SimpleGrid cols={4} spacing="xs">
          {BACKGROUND_PRESETS.map((color) => (
            <Box
              key={color}
              onClick={() => setSettings({ ...settings, backgroundColor: color })}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                ...(color === 'transparent'
                  ? {
                      backgroundImage:
                        'linear-gradient(45deg, #e9ecef 25%, transparent 25%), linear-gradient(-45deg, #e9ecef 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e9ecef 75%), linear-gradient(-45deg, transparent 75%, #e9ecef 75%)',
                      backgroundSize: '10px 10px',
                      backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                    }
                  : getBackgroundStyle(color)),
                cursor: 'pointer',
                border:
                  settings.backgroundColor === color ? '3px solid #228be6' : '1px solid #dee2e6',
              }}
            />
          ))}
          <Popover opened={customColorOpen} onChange={setCustomColorOpen} position="bottom" withArrow>
            <Popover.Target>
              <Box
                onClick={() => setCustomColorOpen(true)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '2px dashed #dee2e6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#fff',
                }}
              >
                <IconPlus size={16} color="#868e96" />
              </Box>
            </Popover.Target>
            <Popover.Dropdown>
              <Tabs defaultValue="solid">
                <Tabs.List>
                  <Tabs.Tab value="solid" size="xs">
                    Solid
                  </Tabs.Tab>
                  <Tabs.Tab value="gradient" size="xs">
                    Gradient
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="solid" pt="xs">
                  <Stack gap="xs">
                    <ColorPicker
                      format="hex"
                      value={customColor}
                      onChange={setCustomColor}
                      swatches={['#E5E7EB', '#F3F4F6', '#DBEAFE', '#E0E7FF', '#FCE7F3', '#FEF3C7', '#D1FAE5', '#000000', '#FFFFFF']}
                    />
                    <Button
                      size="xs"
                      onClick={() => {
                        setSettings({ ...settings, backgroundColor: customColor });
                        setCustomColorOpen(false);
                      }}
                    >
                      Apply
                    </Button>
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="gradient" pt="xs">
                  <GradientEditor
                    initialGradient={isGradient(settings.backgroundColor) ? settings.backgroundColor : undefined}
                    onApply={(gradient) => {
                      setSettings({ ...settings, backgroundColor: gradient });
                      setCustomColorOpen(false);
                    }}
                    onCancel={() => setCustomColorOpen(false)}
                  />
                </Tabs.Panel>
              </Tabs>
            </Popover.Dropdown>
          </Popover>
        </SimpleGrid>
      </Box>
    </Stack>
  );
}
