import { Box, Text, Slider, ColorInput, Button, Group, Stack } from '@mantine/core';
import type { BackgroundEffects } from './types';
import { DEFAULT_BACKGROUND_EFFECTS } from './types';

interface BackgroundEffectsPanelProps {
  effects: BackgroundEffects;
  onChange: (effects: BackgroundEffects) => void;
  onApplyToAll?: () => void;
}

export function BackgroundEffectsPanel({ effects, onChange, onApplyToAll }: BackgroundEffectsPanelProps) {
  const update = (key: keyof BackgroundEffects, value: number | string) => {
    onChange({ ...effects, [key]: value });
  };

  const hasAnyEffect =
    effects.blur > 0 ||
    effects.overlayOpacity > 0 ||
    effects.vignetteIntensity > 0 ||
    effects.noiseIntensity > 0;

  return (
    <Stack gap="sm">
      {/* Blur */}
      <Box>
        <Group justify="space-between" mb={4}>
          <Text size="xs" c="dimmed">Blur</Text>
          <Text size="xs" c="dimmed">{effects.blur}px</Text>
        </Group>
        <Slider
          value={effects.blur}
          onChange={(v) => update('blur', v)}
          min={0}
          max={50}
          step={1}
          size="sm"
        />
      </Box>

      {/* Color Overlay */}
      <Box>
        <Text size="xs" c="dimmed" mb={4}>Color Overlay</Text>
        <Group gap="xs" align="flex-end">
          <ColorInput
            value={effects.overlayColor}
            onChange={(v) => update('overlayColor', v)}
            size="xs"
            style={{ flex: 1 }}
            withEyeDropper={false}
          />
        </Group>
        <Group justify="space-between" mt={4} mb={4}>
          <Text size="xs" c="dimmed">Opacity</Text>
          <Text size="xs" c="dimmed">{effects.overlayOpacity}%</Text>
        </Group>
        <Slider
          value={effects.overlayOpacity}
          onChange={(v) => update('overlayOpacity', v)}
          min={0}
          max={100}
          step={1}
          size="sm"
        />
      </Box>

      {/* Vignette */}
      <Box>
        <Group justify="space-between" mb={4}>
          <Text size="xs" c="dimmed">Vignette</Text>
          <Text size="xs" c="dimmed">{effects.vignetteIntensity}%</Text>
        </Group>
        <Slider
          value={effects.vignetteIntensity}
          onChange={(v) => update('vignetteIntensity', v)}
          min={0}
          max={100}
          step={1}
          size="sm"
        />
      </Box>

      {/* Noise / Grain */}
      <Box>
        <Group justify="space-between" mb={4}>
          <Text size="xs" c="dimmed">Noise</Text>
          <Text size="xs" c="dimmed">{effects.noiseIntensity}%</Text>
        </Group>
        <Slider
          value={effects.noiseIntensity}
          onChange={(v) => update('noiseIntensity', v)}
          min={0}
          max={100}
          step={1}
          size="sm"
        />
      </Box>

      {/* Actions */}
      <Group gap="xs">
        {hasAnyEffect && (
          <Button
            variant="subtle"
            size="xs"
            onClick={() => onChange(DEFAULT_BACKGROUND_EFFECTS)}
          >
            Reset
          </Button>
        )}
        {onApplyToAll && (
          <Button
            variant="light"
            size="xs"
            onClick={onApplyToAll}
          >
            Apply to all screens
          </Button>
        )}
      </Group>
    </Stack>
  );
}
