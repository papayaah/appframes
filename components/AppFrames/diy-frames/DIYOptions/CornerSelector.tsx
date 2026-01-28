'use client';

import { SegmentedControl, Stack, Text } from '@mantine/core';
import type { CornerStyle } from '../types';

interface CornerSelectorProps {
  value: CornerStyle;
  onChange: (value: CornerStyle) => void;
  options?: CornerStyle[];
}

const LABELS: Record<CornerStyle, string> = {
  sharp: 'Sharp',
  rounded: 'Rounded',
  'very-rounded': 'Very Rounded',
};

export function CornerSelector({
  value,
  onChange,
  options = ['sharp', 'rounded', 'very-rounded'],
}: CornerSelectorProps) {
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" tt="uppercase">Corners</Text>
      <SegmentedControl
        size="xs"
        fullWidth
        value={value}
        onChange={(v) => onChange(v as CornerStyle)}
        data={options.map((opt) => ({ value: opt, label: LABELS[opt] }))}
      />
    </Stack>
  );
}
