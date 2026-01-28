'use client';

import { Select, Stack, Text } from '@mantine/core';
import type { DesktopStand } from '../types';

interface StandSelectorProps {
  value: DesktopStand;
  onChange: (value: DesktopStand) => void;
}

const OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'simple', label: 'Simple' },
  { value: 'apple-style', label: 'Apple Style' },
  { value: 'vesa-mount', label: 'VESA Mount' },
];

export function StandSelector({ value, onChange }: StandSelectorProps) {
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" tt="uppercase">Stand</Text>
      <Select
        size="xs"
        value={value}
        onChange={(v) => v && onChange(v as DesktopStand)}
        data={OPTIONS}
      />
    </Stack>
  );
}
