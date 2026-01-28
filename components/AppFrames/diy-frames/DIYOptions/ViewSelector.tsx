'use client';

import { SegmentedControl, Stack, Text } from '@mantine/core';
import type { ViewSide } from '../types';

interface ViewSelectorProps {
  value: ViewSide;
  onChange: (value: ViewSide) => void;
}

export function ViewSelector({ value, onChange }: ViewSelectorProps) {
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" tt="uppercase">View</Text>
      <SegmentedControl
        size="xs"
        fullWidth
        value={value}
        onChange={(v) => onChange(v as ViewSide)}
        data={[
          { value: 'front', label: 'Front' },
          { value: 'back', label: 'Back' },
        ]}
      />
    </Stack>
  );
}
