'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Stack,
  Group,
  Box,
  Text,
  Button,
  Slider,
  SegmentedControl,
  ActionIcon,
  ColorPicker,
  Popover,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';

export interface ColorStop {
  id: string;
  color: string;
  position: number; // 0-100 percentage
}

export interface GradientState {
  type: 'linear' | 'radial';
  angle: number; // 0-360 for linear
  stops: ColorStop[];
}

// Parse a CSS gradient string into GradientState
export function parseGradient(gradient: string): GradientState | null {
  if (!gradient) return null;

  const isLinear = gradient.startsWith('linear-gradient');
  const isRadial = gradient.startsWith('radial-gradient');

  if (!isLinear && !isRadial) return null;

  // Default state
  const state: GradientState = {
    type: isLinear ? 'linear' : 'radial',
    angle: 90,
    stops: [],
  };

  // Extract content inside parentheses
  const match = gradient.match(/\(([^)]*(?:\([^)]*\)[^)]*)*)\)/);
  if (!match) return null;

  const content = match[1].trim();

  if (isLinear) {
    // Parse angle or direction
    // Formats: "90deg, ...", "to right, ...", "135deg, ..."
    const angleMatch = content.match(/^(\d+)deg/);
    if (angleMatch) {
      state.angle = parseInt(angleMatch[1], 10);
    } else if (content.startsWith('to right')) {
      state.angle = 90;
    } else if (content.startsWith('to left')) {
      state.angle = 270;
    } else if (content.startsWith('to bottom')) {
      state.angle = 180;
    } else if (content.startsWith('to top')) {
      state.angle = 0;
    } else if (content.startsWith('to bottom right') || content.startsWith('to right bottom')) {
      state.angle = 135;
    } else if (content.startsWith('to top right') || content.startsWith('to right top')) {
      state.angle = 45;
    } else if (content.startsWith('to bottom left') || content.startsWith('to left bottom')) {
      state.angle = 225;
    } else if (content.startsWith('to top left') || content.startsWith('to left top')) {
      state.angle = 315;
    }
  }

  // Parse color stops
  // Match colors with optional positions: #hex, rgb(), rgba(), hsl(), named colors
  // Followed by optional percentage
  const colorStopRegex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-zA-Z]+)(?:\s+(\d+)%)?/g;

  let stopMatch;
  const stops: ColorStop[] = [];
  let index = 0;

  // Skip the direction/angle part for linear gradients
  const colorsPart = isLinear
    ? content.replace(/^(to\s+\w+(\s+\w+)?|\d+deg)\s*,\s*/, '')
    : content.replace(/^circle\s*,\s*/, '');

  while ((stopMatch = colorStopRegex.exec(colorsPart)) !== null) {
    const color = stopMatch[1];
    // Skip direction keywords
    if (['to', 'right', 'left', 'top', 'bottom', 'circle'].includes(color.toLowerCase())) {
      continue;
    }
    const position = stopMatch[2] ? parseInt(stopMatch[2], 10) : null;
    stops.push({
      id: `stop-${index}-${Date.now()}`,
      color,
      position: position ?? (index === 0 ? 0 : 100),
    });
    index++;
  }

  // If we found at least 2 stops, use them
  if (stops.length >= 2) {
    // Distribute positions if not specified
    const hasPositions = stops.some((s, i) => i > 0 && s.position !== 100);
    if (!hasPositions && stops.length > 2) {
      stops.forEach((stop, i) => {
        stop.position = Math.round((i / (stops.length - 1)) * 100);
      });
    }
    state.stops = stops;
  } else {
    // Default stops
    state.stops = [
      { id: 'stop-0', color: '#667eea', position: 0 },
      { id: 'stop-1', color: '#764ba2', position: 100 },
    ];
  }

  return state;
}

// Generate a CSS gradient string from GradientState
export function generateGradientString(state: GradientState): string {
  const sortedStops = [...state.stops].sort((a, b) => a.position - b.position);
  const stopsStr = sortedStops.map((stop) => `${stop.color} ${stop.position}%`).join(', ');

  if (state.type === 'linear') {
    return `linear-gradient(${state.angle}deg, ${stopsStr})`;
  } else {
    return `radial-gradient(circle, ${stopsStr})`;
  }
}

interface GradientEditorProps {
  initialGradient?: string;
  onApply: (gradient: string) => void;
  onCancel: () => void;
}

export function GradientEditor({ initialGradient, onApply, onCancel }: GradientEditorProps) {
  const [state, setState] = useState<GradientState>(() => {
    if (initialGradient) {
      const parsed = parseGradient(initialGradient);
      if (parsed) return parsed;
    }
    return {
      type: 'linear',
      angle: 90,
      stops: [
        { id: 'stop-0', color: '#667eea', position: 0 },
        { id: 'stop-1', color: '#764ba2', position: 100 },
      ],
    };
  });

  const [editingStopId, setEditingStopId] = useState<string | null>(null);

  const gradientString = useMemo(() => generateGradientString(state), [state]);

  const updateStop = useCallback((id: string, updates: Partial<ColorStop>) => {
    setState((prev) => ({
      ...prev,
      stops: prev.stops.map((stop) => (stop.id === id ? { ...stop, ...updates } : stop)),
    }));
  }, []);

  const addStop = useCallback(() => {
    setState((prev) => {
      if (prev.stops.length >= 8) return prev;

      // Find middle position
      const sortedStops = [...prev.stops].sort((a, b) => a.position - b.position);
      let newPosition = 50;
      if (sortedStops.length >= 2) {
        // Find largest gap
        let maxGap = 0;
        let gapStart = 0;
        for (let i = 0; i < sortedStops.length - 1; i++) {
          const gap = sortedStops[i + 1].position - sortedStops[i].position;
          if (gap > maxGap) {
            maxGap = gap;
            gapStart = sortedStops[i].position;
          }
        }
        newPosition = Math.round(gapStart + maxGap / 2);
      }

      // Interpolate color
      const newColor = '#888888';

      return {
        ...prev,
        stops: [
          ...prev.stops,
          {
            id: `stop-${Date.now()}`,
            color: newColor,
            position: newPosition,
          },
        ],
      };
    });
  }, []);

  const removeStop = useCallback((id: string) => {
    setState((prev) => {
      if (prev.stops.length <= 2) return prev;
      return {
        ...prev,
        stops: prev.stops.filter((stop) => stop.id !== id),
      };
    });
  }, []);

  const sortedStops = useMemo(
    () => [...state.stops].sort((a, b) => a.position - b.position),
    [state.stops]
  );

  return (
    <Stack gap="md" style={{ width: 280 }}>
      {/* Gradient Type */}
      <Box>
        <Text size="xs" fw={500} mb={4}>
          Type
        </Text>
        <SegmentedControl
          size="xs"
          fullWidth
          value={state.type}
          onChange={(value) => setState((prev) => ({ ...prev, type: value as 'linear' | 'radial' }))}
          data={[
            { label: 'Linear', value: 'linear' },
            { label: 'Radial', value: 'radial' },
          ]}
        />
      </Box>

      {/* Preview */}
      <Box>
        <Text size="xs" fw={500} mb={4}>
          Preview
        </Text>
        <Box
          style={{
            width: '100%',
            height: 80,
            borderRadius: 8,
            backgroundImage: gradientString,
            border: '1px solid #dee2e6',
          }}
        />
      </Box>

      {/* Angle (only for linear) */}
      {state.type === 'linear' && (
        <Box>
          <Group justify="space-between" mb={4}>
            <Text size="xs" fw={500}>
              Angle
            </Text>
            <Text size="xs" c="dimmed">
              {state.angle}°
            </Text>
          </Group>
          <Slider
            value={state.angle}
            onChange={(value) => setState((prev) => ({ ...prev, angle: value }))}
            min={0}
            max={360}
            step={1}
            marks={[
              { value: 0, label: '0°' },
              { value: 90, label: '90°' },
              { value: 180, label: '180°' },
              { value: 270, label: '270°' },
              { value: 360, label: '360°' },
            ]}
          />
        </Box>
      )}

      {/* Color Stops */}
      <Box>
        <Group justify="space-between" mb={4}>
          <Text size="xs" fw={500}>
            Color Stops
          </Text>
          <ActionIcon
            size="xs"
            variant="light"
            onClick={addStop}
            disabled={state.stops.length >= 8}
            title="Add color stop"
          >
            <IconPlus size={12} />
          </ActionIcon>
        </Group>

        <Stack gap="xs">
          {sortedStops.map((stop) => (
            <Group key={stop.id} gap="xs" wrap="nowrap">
              {/* Color swatch with picker */}
              <Popover
                opened={editingStopId === stop.id}
                onChange={(opened) => setEditingStopId(opened ? stop.id : null)}
                position="left"
                withArrow
              >
                <Popover.Target>
                  <Box
                    onClick={() => setEditingStopId(stop.id)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      backgroundColor: stop.color,
                      border: '1px solid #dee2e6',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                </Popover.Target>
                <Popover.Dropdown>
                  <ColorPicker
                    format="hex"
                    value={stop.color}
                    onChange={(color) => updateStop(stop.id, { color })}
                    swatches={[
                      '#667eea',
                      '#764ba2',
                      '#f093fb',
                      '#f5576c',
                      '#4facfe',
                      '#00f2fe',
                      '#43e97b',
                      '#38f9d7',
                      '#fa709a',
                      '#fee140',
                    ]}
                  />
                </Popover.Dropdown>
              </Popover>

              {/* Position slider */}
              <Slider
                value={stop.position}
                onChange={(value) => updateStop(stop.id, { position: value })}
                min={0}
                max={100}
                step={1}
                style={{ flex: 1 }}
                label={(value) => `${value}%`}
              />

              {/* Delete button */}
              <ActionIcon
                size="xs"
                variant="subtle"
                color="red"
                onClick={() => removeStop(stop.id)}
                disabled={state.stops.length <= 2}
                title="Remove color stop"
              >
                <IconTrash size={12} />
              </ActionIcon>
            </Group>
          ))}
        </Stack>
      </Box>

      {/* Actions */}
      <Group justify="flex-end" gap="xs">
        <Button size="xs" variant="subtle" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="xs" onClick={() => onApply(gradientString)}>
          Apply
        </Button>
      </Group>
    </Stack>
  );
}
