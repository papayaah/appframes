'use client';

import { Switch, Group, Text } from '@mantine/core';

interface AllInOneToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function AllInOneToggle({ value, onChange }: AllInOneToggleProps) {
  return (
    <Group justify="space-between">
      <Text size="xs" c="dimmed" tt="uppercase">All-in-One</Text>
      <Switch
        size="xs"
        checked={value}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
    </Group>
  );
}
