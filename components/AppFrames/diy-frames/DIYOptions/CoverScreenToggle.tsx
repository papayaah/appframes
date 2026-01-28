'use client';

import { Switch, Group, Text } from '@mantine/core';

interface CoverScreenToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function CoverScreenToggle({ value, onChange }: CoverScreenToggleProps) {
  return (
    <Group justify="space-between">
      <Text size="xs" c="dimmed" tt="uppercase">Cover Screen</Text>
      <Switch
        size="xs"
        checked={value}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
    </Group>
  );
}
