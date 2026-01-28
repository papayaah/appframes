'use client';

import { SegmentedControl, Stack, Text } from '@mantine/core';
import type { LaptopBaseStyle } from '../types';

interface BaseStyleSelectorProps {
  value: LaptopBaseStyle;
  onChange: (value: LaptopBaseStyle) => void;
}

export function BaseStyleSelector({ value, onChange }: BaseStyleSelectorProps) {
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" tt="uppercase">Base Style</Text>
      <SegmentedControl
        size="xs"
        fullWidth
        value={value}
        onChange={(v) => onChange(v as LaptopBaseStyle)}
        data={[
          { value: 'standard', label: 'Standard' },
          { value: 'fabric', label: 'Fabric' },
        ]}
      />
    </Stack>
  );
}
