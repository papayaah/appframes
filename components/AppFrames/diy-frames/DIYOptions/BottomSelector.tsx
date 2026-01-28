'use client';

import { SegmentedControl, Stack, Text } from '@mantine/core';
import type { PhoneBottom, TabletBottom } from '../types';

type BottomType = PhoneBottom | TabletBottom;

interface BottomSelectorProps {
  value: BottomType;
  onChange: (value: BottomType) => void;
  deviceType: 'phone' | 'tablet';
}

const PHONE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'home-button', label: 'Home Button' },
  { value: 'gesture-bar', label: 'Gesture Bar' },
];

const TABLET_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'home-button', label: 'Home Button' },
];

export function BottomSelector({ value, onChange, deviceType }: BottomSelectorProps) {
  const options = deviceType === 'phone' ? PHONE_OPTIONS : TABLET_OPTIONS;

  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" tt="uppercase">Bottom</Text>
      <SegmentedControl
        size="xs"
        fullWidth
        value={value}
        onChange={(v) => onChange(v as BottomType)}
        data={options}
      />
    </Stack>
  );
}
