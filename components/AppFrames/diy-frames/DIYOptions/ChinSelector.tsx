'use client';

import { SegmentedControl, Stack, Text } from '@mantine/core';
import type { DesktopChin } from '../types';

interface ChinSelectorProps {
  value: DesktopChin;
  onChange: (value: DesktopChin) => void;
}

export function ChinSelector({ value, onChange }: ChinSelectorProps) {
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" tt="uppercase">Chin</Text>
      <SegmentedControl
        size="xs"
        fullWidth
        value={value}
        onChange={(v) => onChange(v as DesktopChin)}
        data={[
          { value: 'none', label: 'None' },
          { value: 'standard', label: 'Standard' },
          { value: 'large', label: 'Large' },
        ]}
      />
    </Stack>
  );
}
