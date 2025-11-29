'use client';

import { Stack, TextInput, Switch, Divider, ScrollArea } from '@mantine/core';
import { CanvasSettings } from './AppFrames';
import { TextStylePanel } from './TextStylePanel';
import { TextStyle, DEFAULT_TEXT_STYLE } from './types';

interface TextTabProps {
  settings: CanvasSettings;
  setSettings: (settings: CanvasSettings) => void;
}

export function TextTab({ settings, setSettings }: TextTabProps) {
  // Ensure captionStyle exists with defaults
  const captionStyle: TextStyle = settings.captionStyle
    ? { ...DEFAULT_TEXT_STYLE, ...settings.captionStyle }
    : DEFAULT_TEXT_STYLE;

  const handleStyleChange = (updates: Partial<TextStyle>) => {
    setSettings({
      ...settings,
      captionStyle: {
        ...captionStyle,
        ...updates,
      },
    });
  };

  return (
    <ScrollArea h="100%" offsetScrollbars>
      <Stack p="md" gap="md">
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
              placeholder="Enter your caption..."
            />

            <Divider label="Style" labelPosition="center" />

            <TextStylePanel
              style={captionStyle}
              onStyleChange={handleStyleChange}
            />
          </>
        )}
      </Stack>
    </ScrollArea>
  );
}
