'use client';

import { SegmentedControl, Stack, Text } from '@mantine/core';
import type { FoldableState } from '../types';

interface StateSelectorProps {
  value: FoldableState;
  onChange: (value: FoldableState) => void;
}

export function StateSelector({ value, onChange }: StateSelectorProps) {
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" tt="uppercase">State</Text>
      <SegmentedControl
        size="xs"
        fullWidth
        value={value}
        onChange={(v) => onChange(v as FoldableState)}
        data={[
          { value: 'folded', label: 'Folded' },
          { value: 'unfolded', label: 'Unfolded' },
        ]}
      />
    </Stack>
  );
}
