'use client';

import { Select, Stack, Text } from '@mantine/core';
import type { PhoneTopCutout, TabletTopCutout, LaptopTopCutout } from '../types';

type TopCutoutType = PhoneTopCutout | TabletTopCutout | LaptopTopCutout;

interface TopCutoutSelectorProps {
  value: TopCutoutType;
  onChange: (value: TopCutoutType) => void;
  deviceType: 'phone' | 'tablet' | 'laptop';
}

const PHONE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'notch', label: 'Notch' },
  { value: 'dynamic-island', label: 'Dynamic Island' },
  { value: 'punch-hole-center', label: 'Punch Hole (Center)' },
  { value: 'punch-hole-left', label: 'Punch Hole (Left)' },
  { value: 'punch-hole-right', label: 'Punch Hole (Right)' },
];

const TABLET_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'punch-hole', label: 'Punch Hole' },
];

const LAPTOP_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'notch', label: 'Notch' },
];

export function TopCutoutSelector({ value, onChange, deviceType }: TopCutoutSelectorProps) {
  const options = deviceType === 'phone'
    ? PHONE_OPTIONS
    : deviceType === 'tablet'
    ? TABLET_OPTIONS
    : LAPTOP_OPTIONS;

  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" tt="uppercase">Top Cutout</Text>
      <Select
        size="xs"
        value={value}
        onChange={(v) => v && onChange(v as TopCutoutType)}
        data={options}
        comboboxProps={{ zIndex: 1100 }}
      />
    </Stack>
  );
}
