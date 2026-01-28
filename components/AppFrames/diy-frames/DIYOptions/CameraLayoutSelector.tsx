'use client';

import { Select, Stack, Text } from '@mantine/core';
import type { CameraLayout } from '../types';

interface CameraLayoutSelectorProps {
  value: CameraLayout;
  onChange: (value: CameraLayout) => void;
}

const OPTIONS = [
  { value: 'single', label: 'Single Lens' },
  { group: 'Dual Camera', items: [
    { value: 'dual-vertical', label: 'Dual - Vertical' },
    { value: 'dual-horizontal', label: 'Dual - Horizontal' },
  ]},
  { group: 'Triple Camera', items: [
    { value: 'triple-triangle', label: 'Triple - Triangle' },
    { value: 'triple-vertical', label: 'Triple - Vertical Line' },
    { value: 'triple-horizontal', label: 'Triple - Horizontal Line' },
  ]},
  { group: 'Quad Camera', items: [
    { value: 'quad-square', label: 'Quad - 2x2 Grid' },
    { value: 'quad-vertical', label: 'Quad - Vertical Line' },
  ]},
  { group: 'Special', items: [
    { value: 'penta', label: 'Penta (5 Cameras)' },
    { value: 'island-square', label: 'Island - Square (iPhone)' },
    { value: 'island-circle', label: 'Island - Circle (Pixel)' },
  ]},
];

export function CameraLayoutSelector({ value, onChange }: CameraLayoutSelectorProps) {
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed" tt="uppercase">Camera Layout</Text>
      <Select
        size="xs"
        value={value}
        onChange={(v) => v && onChange(v as CameraLayout)}
        data={OPTIONS}
        comboboxProps={{ zIndex: 1100 }}
      />
    </Stack>
  );
}
