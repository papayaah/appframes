import { Box, Text, Slider, ColorInput, Button, Group, Stack, Switch } from '@mantine/core';
import type { FrameEffects } from './types';
import { DEFAULT_FRAME_EFFECTS } from './types';

interface FrameEffectsPanelProps {
  effects: FrameEffects;
  onChange: (effects: FrameEffects) => void;
}

export function FrameEffectsPanel({ effects, onChange }: FrameEffectsPanelProps) {
  const update = (key: keyof FrameEffects, value: number | string | boolean) => {
    onChange({ ...effects, [key]: value });
  };

  const hasAnyEffect =
    effects.shadowEnabled ||
    effects.glowEnabled ||
    effects.outlineEnabled ||
    effects.opacity < 100;

  return (
    <Stack gap="sm">
      {/* Drop Shadow */}
      <Box>
        <Group justify="space-between" mb={4}>
          <Text size="xs" c="dimmed">Drop Shadow</Text>
          <Switch
            size="xs"
            checked={effects.shadowEnabled}
            onChange={(e) => update('shadowEnabled', e.currentTarget.checked)}
          />
        </Group>
        {effects.shadowEnabled && (
          <Stack gap="xs" mt={4}>
            <Box>
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="dimmed">Blur</Text>
                <Text size="xs" c="dimmed">{effects.shadowBlur}px</Text>
              </Group>
              <Slider
                value={effects.shadowBlur}
                onChange={(v) => update('shadowBlur', v)}
                min={0}
                max={50}
                step={1}
                size="sm"
              />
            </Box>
            <Box>
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="dimmed">Offset X</Text>
                <Text size="xs" c="dimmed">{effects.shadowOffsetX}px</Text>
              </Group>
              <Slider
                value={effects.shadowOffsetX}
                onChange={(v) => update('shadowOffsetX', v)}
                min={-50}
                max={50}
                step={1}
                size="sm"
              />
            </Box>
            <Box>
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="dimmed">Offset Y</Text>
                <Text size="xs" c="dimmed">{effects.shadowOffsetY}px</Text>
              </Group>
              <Slider
                value={effects.shadowOffsetY}
                onChange={(v) => update('shadowOffsetY', v)}
                min={-50}
                max={50}
                step={1}
                size="sm"
              />
            </Box>
            <Box>
              <Text size="xs" c="dimmed" mb={4}>Color</Text>
              <ColorInput
                value={effects.shadowColor}
                onChange={(v) => update('shadowColor', v)}
                size="xs"
                withEyeDropper={false}
              />
            </Box>
            <Box>
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="dimmed">Opacity</Text>
                <Text size="xs" c="dimmed">{effects.shadowOpacity}%</Text>
              </Group>
              <Slider
                value={effects.shadowOpacity}
                onChange={(v) => update('shadowOpacity', v)}
                min={0}
                max={100}
                step={1}
                size="sm"
              />
            </Box>
          </Stack>
        )}
      </Box>

      {/* Glow */}
      <Box>
        <Group justify="space-between" mb={4}>
          <Text size="xs" c="dimmed">Glow</Text>
          <Switch
            size="xs"
            checked={effects.glowEnabled}
            onChange={(e) => update('glowEnabled', e.currentTarget.checked)}
          />
        </Group>
        {effects.glowEnabled && (
          <Stack gap="xs" mt={4}>
            <Box>
              <Text size="xs" c="dimmed" mb={4}>Color</Text>
              <ColorInput
                value={effects.glowColor}
                onChange={(v) => update('glowColor', v)}
                size="xs"
                withEyeDropper={false}
              />
            </Box>
            <Box>
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="dimmed">Blur</Text>
                <Text size="xs" c="dimmed">{effects.glowBlur}px</Text>
              </Group>
              <Slider
                value={effects.glowBlur}
                onChange={(v) => update('glowBlur', v)}
                min={0}
                max={60}
                step={1}
                size="sm"
              />
            </Box>
            <Box>
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="dimmed">Intensity</Text>
                <Text size="xs" c="dimmed">{effects.glowIntensity}%</Text>
              </Group>
              <Slider
                value={effects.glowIntensity}
                onChange={(v) => update('glowIntensity', v)}
                min={0}
                max={100}
                step={1}
                size="sm"
              />
            </Box>
          </Stack>
        )}
      </Box>

      {/* Outline/Stroke */}
      <Box>
        <Group justify="space-between" mb={4}>
          <Text size="xs" c="dimmed">Outline</Text>
          <Switch
            size="xs"
            checked={effects.outlineEnabled}
            onChange={(e) => update('outlineEnabled', e.currentTarget.checked)}
          />
        </Group>
        {effects.outlineEnabled && (
          <Stack gap="xs" mt={4}>
            <Box>
              <Text size="xs" c="dimmed" mb={4}>Color</Text>
              <ColorInput
                value={effects.outlineColor}
                onChange={(v) => update('outlineColor', v)}
                size="xs"
                withEyeDropper={false}
              />
            </Box>
            <Box>
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="dimmed">Width</Text>
                <Text size="xs" c="dimmed">{effects.outlineWidth}px</Text>
              </Group>
              <Slider
                value={effects.outlineWidth}
                onChange={(v) => update('outlineWidth', v)}
                min={1}
                max={10}
                step={1}
                size="sm"
              />
            </Box>
            <Box>
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="dimmed">Offset</Text>
                <Text size="xs" c="dimmed">{effects.outlineOffset}px</Text>
              </Group>
              <Slider
                value={effects.outlineOffset}
                onChange={(v) => update('outlineOffset', v)}
                min={0}
                max={20}
                step={1}
                size="sm"
              />
            </Box>
          </Stack>
        )}
      </Box>

      {/* Opacity */}
      <Box>
        <Group justify="space-between" mb={4}>
          <Text size="xs" c="dimmed">Opacity</Text>
          <Text size="xs" c="dimmed">{effects.opacity}%</Text>
        </Group>
        <Slider
          value={effects.opacity}
          onChange={(v) => update('opacity', v)}
          min={0}
          max={100}
          step={1}
          size="sm"
        />
      </Box>

      {/* Reset */}
      {hasAnyEffect && (
        <Button
          variant="subtle"
          size="xs"
          onClick={() => onChange(DEFAULT_FRAME_EFFECTS)}
        >
          Reset Effects
        </Button>
      )}
    </Stack>
  );
}
