'use client';

import { Box, Text, Select, Slider, ColorInput, Switch, SegmentedControl, Divider, NumberInput, Collapse, Group, ActionIcon } from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconItalic, IconLetterCase, IconAlignLeft, IconAlignCenter, IconAlignRight } from '@tabler/icons-react';
import { useState } from 'react';
import { TextStyle } from './types';

interface TextStylePanelProps {
  style: TextStyle;
  onStyleChange: (updates: Partial<TextStyle>) => void;
}

// Available fonts (web-safe + Google Fonts commonly available)
const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'system-ui', label: 'System UI' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
];

// Font weight options
const WEIGHT_OPTIONS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
  { value: '900', label: 'Black' },
];

// Preset color palettes
const COLOR_PRESETS = [
  '#1a1a1a', '#ffffff', '#667eea', '#764ba2', '#f093fb',
  '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#fa709a',
  '#fee140', '#ff0844', '#6a11cb', '#2575fc', '#000000',
];

export function TextStylePanel({ style, onStyleChange }: TextStylePanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showShadow, setShowShadow] = useState(false);
  const [showBackground, setShowBackground] = useState(false);

  return (
    <Box>
      {/* Font Family */}
      <Text size="xs" fw={500} c="dimmed" mb={4}>Font Family</Text>
      <Select
        size="xs"
        data={FONT_OPTIONS}
        value={style.fontFamily}
        onChange={(value) => value && onStyleChange({ fontFamily: value })}
        mb="md"
      />

      {/* Font Size */}
      <Text size="xs" fw={500} c="dimmed" mb={4}>Font Size</Text>
      <Group gap="xs" mb="md">
        <Slider
          value={style.fontSize}
          onChange={(value) => onStyleChange({ fontSize: value })}
          min={12}
          max={120}
          style={{ flex: 1 }}
          size="sm"
        />
        <NumberInput
          value={style.fontSize}
          onChange={(value) => typeof value === 'number' && onStyleChange({ fontSize: value })}
          min={12}
          max={120}
          size="xs"
          w={60}
        />
      </Group>

      {/* Font Weight & Style */}
      <Text size="xs" fw={500} c="dimmed" mb={4}>Font Style</Text>
      <Group gap="xs" mb="md">
        <Select
          size="xs"
          data={WEIGHT_OPTIONS}
          value={String(style.fontWeight)}
          onChange={(value) => value && onStyleChange({ fontWeight: parseInt(value) })}
          style={{ flex: 1 }}
        />
        <ActionIcon
          variant={style.italic ? 'filled' : 'light'}
          color={style.italic ? 'violet' : 'gray'}
          onClick={() => onStyleChange({ italic: !style.italic })}
          title="Italic"
        >
          <IconItalic size={16} />
        </ActionIcon>
        <ActionIcon
          variant={style.uppercase ? 'filled' : 'light'}
          color={style.uppercase ? 'violet' : 'gray'}
          onClick={() => onStyleChange({ uppercase: !style.uppercase })}
          title="Uppercase"
        >
          <IconLetterCase size={16} />
        </ActionIcon>
      </Group>

      {/* Text Color */}
      <Text size="xs" fw={500} c="dimmed" mb={4}>Text Color</Text>
      <ColorInput
        value={style.color}
        onChange={(value) => onStyleChange({ color: value })}
        swatches={COLOR_PRESETS}
        size="xs"
        mb="md"
      />

      {/* Text Alignment */}
      <Text size="xs" fw={500} c="dimmed" mb={4}>Alignment</Text>
      <SegmentedControl
        value={style.textAlign}
        onChange={(value: 'left' | 'center' | 'right') => onStyleChange({ textAlign: value })}
        data={[
          { value: 'left', label: <IconAlignLeft size={14} /> },
          { value: 'center', label: <IconAlignCenter size={14} /> },
          { value: 'right', label: <IconAlignRight size={14} /> },
        ]}
        size="xs"
        fullWidth
        mb="md"
      />

      <Divider my="sm" />

      {/* Background Section */}
      <Group
        gap="xs"
        mb="xs"
        style={{ cursor: 'pointer' }}
        onClick={() => setShowBackground(!showBackground)}
      >
        {showBackground ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        <Text size="xs" fw={600}>Background</Text>
      </Group>
      <Collapse in={showBackground}>
        <Box pl="md" mb="md">
          <Text size="xs" fw={500} c="dimmed" mb={4}>Background Color</Text>
          <ColorInput
            value={style.backgroundColor === 'transparent' ? '' : style.backgroundColor}
            onChange={(value) => onStyleChange({ backgroundColor: value || 'transparent' })}
            swatches={['transparent', ...COLOR_PRESETS]}
            size="xs"
            placeholder="transparent"
            mb="sm"
          />

          {style.backgroundColor !== 'transparent' && (
            <>
              <Text size="xs" fw={500} c="dimmed" mb={4}>Opacity</Text>
              <Slider
                value={style.backgroundOpacity}
                onChange={(value) => onStyleChange({ backgroundOpacity: value })}
                min={0}
                max={100}
                label={(v) => `${v}%`}
                size="sm"
                mb="sm"
              />

              <Text size="xs" fw={500} c="dimmed" mb={4}>Padding</Text>
              <Slider
                value={style.backgroundPadding}
                onChange={(value) => onStyleChange({ backgroundPadding: value })}
                min={0}
                max={48}
                size="sm"
                mb="sm"
              />

              <Text size="xs" fw={500} c="dimmed" mb={4}>Border Radius</Text>
              <Slider
                value={style.backgroundRadius}
                onChange={(value) => onStyleChange({ backgroundRadius: value })}
                min={0}
                max={32}
                size="sm"
                mb="sm"
              />
            </>
          )}
        </Box>
      </Collapse>

      {/* Shadow Section */}
      <Group
        gap="xs"
        mb="xs"
        style={{ cursor: 'pointer' }}
        onClick={() => setShowShadow(!showShadow)}
      >
        {showShadow ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        <Text size="xs" fw={600}>Text Shadow</Text>
      </Group>
      <Collapse in={showShadow}>
        <Box pl="md" mb="md">
          <Switch
            label="Enable Shadow"
            checked={style.textShadow}
            onChange={(e) => onStyleChange({ textShadow: e.currentTarget.checked })}
            size="xs"
            mb="sm"
          />

          {style.textShadow && (
            <>
              <Text size="xs" fw={500} c="dimmed" mb={4}>Shadow Color</Text>
              <ColorInput
                value={style.textShadowColor}
                onChange={(value) => onStyleChange({ textShadowColor: value })}
                swatches={COLOR_PRESETS}
                size="xs"
                mb="sm"
              />

              <Text size="xs" fw={500} c="dimmed" mb={4}>Blur</Text>
              <Slider
                value={style.textShadowBlur}
                onChange={(value) => onStyleChange({ textShadowBlur: value })}
                min={0}
                max={20}
                size="sm"
                mb="sm"
              />

              <Group gap="xs">
                <Box style={{ flex: 1 }}>
                  <Text size="xs" fw={500} c="dimmed" mb={4}>Offset X</Text>
                  <Slider
                    value={style.textShadowOffsetX}
                    onChange={(value) => onStyleChange({ textShadowOffsetX: value })}
                    min={-10}
                    max={10}
                    size="sm"
                  />
                </Box>
                <Box style={{ flex: 1 }}>
                  <Text size="xs" fw={500} c="dimmed" mb={4}>Offset Y</Text>
                  <Slider
                    value={style.textShadowOffsetY}
                    onChange={(value) => onStyleChange({ textShadowOffsetY: value })}
                    min={-10}
                    max={10}
                    size="sm"
                  />
                </Box>
              </Group>
            </>
          )}
        </Box>
      </Collapse>

      {/* Advanced Section */}
      <Group
        gap="xs"
        mb="xs"
        style={{ cursor: 'pointer' }}
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        <Text size="xs" fw={600}>Advanced</Text>
      </Group>
      <Collapse in={showAdvanced}>
        <Box pl="md">
          <Text size="xs" fw={500} c="dimmed" mb={4}>Letter Spacing</Text>
          <Slider
            value={style.letterSpacing}
            onChange={(value) => onStyleChange({ letterSpacing: value })}
            min={-5}
            max={20}
            step={0.5}
            size="sm"
            mb="sm"
          />

          <Text size="xs" fw={500} c="dimmed" mb={4}>Line Height</Text>
          <Slider
            value={style.lineHeight}
            onChange={(value) => onStyleChange({ lineHeight: value })}
            min={0.8}
            max={3}
            step={0.1}
            size="sm"
            mb="sm"
          />

          <Text size="xs" fw={500} c="dimmed" mb={4}>Max Width (%)</Text>
          <Slider
            value={style.maxWidth}
            onChange={(value) => onStyleChange({ maxWidth: value })}
            min={20}
            max={100}
            label={(v) => `${v}%`}
            size="sm"
          />
        </Box>
      </Collapse>
    </Box>
  );
}
