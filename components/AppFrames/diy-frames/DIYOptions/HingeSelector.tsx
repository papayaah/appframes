'use client';

import { SegmentedControl, Stack, Text } from '@mantine/core';
import type { LaptopHinge } from '../types';

interface HingeSelectorProps {
  value: LaptopHinge;
  onChange: (value: LaptopHinge) => void;
}

export function HingeSelector({ value, onChange }: HingeSelectorProps) {
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" tt="uppercase">Hinge</Text>
      <SegmentedControl
        size="xs"
        fullWidth
        value={value}
        onChange={(v) => onChange(v as LaptopHinge)}
        data={[
          { value: 'hidden', label: 'Hidden' },
          { value: 'visible', label: 'Visible' },
        ]}
      />
    </Stack>
  );
}
