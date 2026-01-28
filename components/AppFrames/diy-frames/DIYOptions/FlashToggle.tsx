'use client';

import { Switch, Group, Text } from '@mantine/core';

interface FlashToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function FlashToggle({ value, onChange }: FlashToggleProps) {
  return (
    <Group justify="space-between">
      <Text size="xs" c="dimmed" tt="uppercase">Flash</Text>
      <Switch
        size="xs"
        checked={value}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
    </Group>
  );
}
