'use client';

import { Stack, TextInput, Switch, NumberInput, Text, Box } from '@mantine/core';
import { CanvasSettings } from './AppFrames';

interface TextTabProps {
  settings: CanvasSettings;
  setSettings: (settings: CanvasSettings) => void;
}

export function TextTab({ settings, setSettings }: TextTabProps) {
  return (
    <Stack p="md" gap="lg">
      <Switch
        label="Show Caption"
        checked={settings.showCaption}
        onChange={(e) => setSettings({ ...settings, showCaption: e.currentTarget.checked })}
      />

      {settings.showCaption && (
        <>
          <TextInput
            label="Caption Text"
            value={settings.captionText}
            onChange={(e) => setSettings({ ...settings, captionText: e.currentTarget.value })}
          />

          <Box>
             <Text size="sm" fw={500} mb={4}>Position</Text>
             <Stack gap="xs">
                <NumberInput
                    label="Vertical %"
                    value={settings.captionVertical}
                    onChange={(val) => setSettings({ ...settings, captionVertical: Number(val) })}
                    min={0}
                    max={100}
                />
                <NumberInput
                    label="Horizontal %"
                    value={settings.captionHorizontal}
                    onChange={(val) => setSettings({ ...settings, captionHorizontal: Number(val) })}
                    min={0}
                    max={100}
                />
             </Stack>
          </Box>
        </>
      )}
    </Stack>
  );
}
