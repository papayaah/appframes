'use client';

import { SegmentedControl, Stack, Text } from '@mantine/core';
import type { BezelStyle } from '../types';

interface BezelSelectorProps {
  value: BezelStyle;
  onChange: (value: BezelStyle) => void;
  options?: BezelStyle[];
}

const LABELS: Record<BezelStyle, string> = {
  none: 'None',
  thin: 'Thin',
  standard: 'Standard',
  thick: 'Thick',
};

export function BezelSelector({
  value,
  onChange,
  options = ['none', 'thin', 'standard', 'thick'],
}: BezelSelectorProps) {
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" tt="uppercase">Bezel</Text>
      <SegmentedControl
        size="xs"
        fullWidth
        value={value}
        onChange={(v) => onChange(v as BezelStyle)}
        data={options.map((opt) => ({ value: opt, label: LABELS[opt] }))}
      />
    </Stack>
  );
}
