'use client';

import { useState, useMemo } from 'react';
import {
  Stack,
  Text,
  SimpleGrid,
  Box,
  Group,
  Button,
  Popover,
  ColorPicker,
  Tabs,
  SegmentedControl,
  Select,
  Badge,
  Card,
  Image,
  Loader,
  Center,
  Skeleton,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { CanvasSettings, SharedBackground, Screen } from './AppFrames';
import { GradientEditor } from './GradientEditor';
import { isGradient, getBackgroundStyle, BACKGROUND_PRESETS } from './Sidebar';
import { getRecommendedImageDimensions } from './sharedBackgroundUtils';
import { useMediaImage } from '../../hooks/useMediaImage';
import { QuickMediaPicker, MediaLibraryProvider } from '@reactkits.dev/react-media-library';
import type { ComponentPreset } from '@reactkits.dev/react-media-library';

// Minimal Mantine preset for QuickMediaPicker
const quickPickerPreset: ComponentPreset = {
  Card: ({ children, onClick, selected, style }) => (
    <Card
      shadow="none"
      padding={0}
      radius="sm"
      withBorder
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderColor: selected ? 'var(--mantine-color-violet-6)' : undefined,
        borderWidth: selected ? 2 : 1,
        ...style,
      }}
    >
      {children}
    </Card>
  ),
  Button: ({ children, onClick, variant = 'primary', disabled, loading, size = 'md', fullWidth, leftIcon, ...rest }) => (
    <Button
      onClick={onClick}
      variant={variant === 'primary' ? 'filled' : variant === 'danger' ? 'filled' : 'light'}
      color={variant === 'danger' ? 'red' : 'violet'}
      disabled={disabled}
      loading={loading}
      size={size}
      fullWidth={fullWidth}
      leftSection={leftIcon}
      {...rest}
    >
      {children}
    </Button>
  ),
  TextInput: () => null,
  Select: () => null,
  Checkbox: () => null,
  Badge: ({ children }) => <Badge size="xs">{children}</Badge>,
  Image: ({ src, alt, style, onLoad }) => (
    <Image src={src} alt={alt} style={style} fit="cover" w="100%" h="100%" onLoad={onLoad} />
  ),
  Modal: () => null,
  Loader: ({ size = 'md' }) => <Loader size={size} />,
  EmptyState: ({ icon, message }) => (
    <Center p="md">
      <Stack align="center" gap="xs">
        {icon}
        <Text size="xs" c="dimmed">{message}</Text>
      </Stack>
    </Center>
  ),
  FileButton: () => null,
  Grid: ({ children, columns = 3, gap = '6px' }) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>
      {children}
    </div>
  ),
  Skeleton: () => <Skeleton height={60} />,
  UploadCard: () => null,
  Viewer: () => null,
  ViewerThumbnail: () => null,
};

export interface CanvasSettingsPanelProps {
  settings: CanvasSettings;
  setSettings: (settings: CanvasSettings) => void;
  hasBackgroundMedia?: boolean;
  onClearBackgroundMedia?: () => void;
  // Shared background props
  screens?: Screen[];
  sharedBackground?: SharedBackground;
  onSharedBackgroundChange?: (sharedBg: SharedBackground | undefined) => void;
  onToggleScreenInSharedBg?: (screenId: string) => void;
}

// Shared background gradient preview
function SharedGradientPreview({ gradient }: { gradient: NonNullable<SharedBackground['gradient']> }) {
  const directionMap: Record<string, string> = {
    'horizontal': 'to right',
    'vertical': 'to bottom',
    'diagonal-down': '135deg',
    'diagonal-up': '45deg',
  };
  const direction = directionMap[gradient.direction] || 'to right';
  const stops = gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ');

  return (
    <Box
      style={{
        width: '100%',
        height: 40,
        borderRadius: 8,
        background: `linear-gradient(${direction}, ${stops})`,
        border: '1px solid #dee2e6',
      }}
    />
  );
}

// Shared background image preview
function SharedImagePreview({ mediaId }: { mediaId: number }) {
  const { imageUrl } = useMediaImage(mediaId);

  if (!imageUrl) return null;

  return (
    <Box
      style={{
        width: '100%',
        height: 60,
        borderRadius: 8,
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: '1px solid #dee2e6',
      }}
    />
  );
}

export function CanvasSettingsPanel({
  settings,
  setSettings,
  hasBackgroundMedia,
  onClearBackgroundMedia,
  screens = [],
  sharedBackground,
  onSharedBackgroundChange,
  onToggleScreenInSharedBg,
}: CanvasSettingsPanelProps) {
  const [customColorOpen, setCustomColorOpen] = useState(false);
  const [customColor, setCustomColor] = useState('#ffffff');
  const [sharedGradientOpen, setSharedGradientOpen] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  // Handle selecting media from the picker
  const handleSelectMedia = (mediaId: number) => {
    if (!sharedBackground) return;
    onSharedBackgroundChange?.({
      ...sharedBackground,
      mediaId,
    });
    setImagePickerOpen(false);
  };

  const isSharedMode = sharedBackground?.enabled && sharedBackground.screenIds.length >= 2;
  const hasSharedBackgroundSupport = !!onSharedBackgroundChange && screens.length >= 2;

  // Get recommended image dimensions for shared background
  const recommendedDimensions = useMemo(() => {
    if (!sharedBackground || sharedBackground.screenIds.length < 2) return null;
    return getRecommendedImageDimensions(
      sharedBackground.screenIds.length,
      settings.canvasSize,
      settings.orientation
    );
  }, [sharedBackground?.screenIds.length, settings.canvasSize, settings.orientation]);

  const handleBackgroundModeChange = (mode: string) => {
    if (mode === 'shared' && !sharedBackground?.enabled) {
      // Enable shared background with all screens
      const allScreenIds = screens.map(s => s.id);
      onSharedBackgroundChange?.({
        enabled: true,
        screenIds: allScreenIds,
        type: 'gradient',
        gradient: {
          stops: [
            { color: '#667eea', position: 0 },
            { color: '#764ba2', position: 100 },
          ],
          direction: 'horizontal',
        },
      });
    } else if (mode === 'per-screen' && sharedBackground?.enabled) {
      // Disable shared background
      onSharedBackgroundChange?.(undefined);
    }
  };

  const handleSharedTypeChange = (type: 'gradient' | 'image') => {
    if (!sharedBackground) return;
    onSharedBackgroundChange?.({
      ...sharedBackground,
      type,
    });
  };

  const handleGradientApply = (gradientString: string) => {
    if (!sharedBackground) return;

    // Parse the gradient string back into stops and direction
    // This is a simplified parser - the GradientEditor returns CSS gradient strings
    const dirMatch = gradientString.match(/linear-gradient\(([^,]+)/);
    const colorStops = gradientString.match(/#[a-fA-F0-9]{6}\s+[\d.]+%/g) || [];

    let direction: NonNullable<SharedBackground['gradient']>['direction'] = 'horizontal';
    if (dirMatch) {
      const dir = dirMatch[1].trim();
      if (dir === 'to bottom' || dir === '180deg') direction = 'vertical';
      else if (dir === '135deg') direction = 'diagonal-down';
      else if (dir === '45deg') direction = 'diagonal-up';
    }

    const stops = colorStops.map(s => {
      const parts = s.trim().split(/\s+/);
      return {
        color: parts[0],
        position: parseFloat(parts[1]),
      };
    });

    if (stops.length >= 2) {
      onSharedBackgroundChange?.({
        ...sharedBackground,
        gradient: { stops, direction },
      });
    }
    setSharedGradientOpen(false);
  };

  const handleDirectionChange = (direction: string | null) => {
    if (!sharedBackground?.gradient || !direction) return;
    const currentGradient = sharedBackground.gradient;
    onSharedBackgroundChange?.({
      ...sharedBackground,
      gradient: {
        ...currentGradient,
        direction: direction as NonNullable<SharedBackground['gradient']>['direction'],
      },
    });
  };

  const handleImageFitChange = (fit: string | null) => {
    if (!sharedBackground || !fit) return;
    onSharedBackgroundChange?.({
      ...sharedBackground,
      imageFit: fit as 'fill' | 'fit',
    });
  };

  const handleVerticalAlignChange = (align: string | null) => {
    if (!sharedBackground || !align) return;
    onSharedBackgroundChange?.({
      ...sharedBackground,
      imageVerticalAlign: align as 'top' | 'center' | 'bottom',
    });
  };

  const handleHorizontalAlignChange = (align: string | null) => {
    if (!sharedBackground || !align) return;
    onSharedBackgroundChange?.({
      ...sharedBackground,
      imageHorizontalAlign: align as 'left' | 'center' | 'right',
    });
  };

  return (
    <Stack gap="md">
      <Box>
        <Text size="sm" fw={700} mb="xs">
          Canvas Orientation
        </Text>
        <Group grow>
          <Button
            size="xs"
            variant={settings.orientation === 'portrait' ? 'filled' : 'light'}
            onClick={() => setSettings({ ...settings, orientation: 'portrait' })}
          >
            Portrait
          </Button>
          <Button
            size="xs"
            variant={settings.orientation === 'landscape' ? 'filled' : 'light'}
            onClick={() => setSettings({ ...settings, orientation: 'landscape' })}
          >
            Landscape
          </Button>
        </Group>
      </Box>

      {/* Background Mode Toggle */}
      {hasSharedBackgroundSupport && (
        <Box>
          <Text size="sm" fw={700} mb="xs">
            Background Mode
          </Text>
          <SegmentedControl
            fullWidth
            size="xs"
            value={isSharedMode ? 'shared' : 'per-screen'}
            onChange={handleBackgroundModeChange}
            data={[
              { label: 'Per Screen', value: 'per-screen' },
              { label: 'Shared', value: 'shared' },
            ]}
          />
        </Box>
      )}

      {/* Shared Background Controls */}
      {isSharedMode && sharedBackground && (
        <Stack gap="sm">
          {/* Screen Selector */}
          <Box>
            <Text size="sm" fw={600} mb="xs">
              Screens in Group
            </Text>
            <Group gap={4}>
              {screens.map((screen, idx) => {
                const isInGroup = sharedBackground.screenIds.includes(screen.id);
                return (
                  <Button
                    key={screen.id}
                    size="xs"
                    variant={isInGroup ? 'filled' : 'light'}
                    onClick={() => onToggleScreenInSharedBg?.(screen.id)}
                    style={{ minWidth: 32, padding: '0 8px' }}
                  >
                    {idx + 1}
                  </Button>
                );
              })}
            </Group>
            {sharedBackground.screenIds.length < 2 && (
              <Text size="xs" c="red" mt={4}>
                Select at least 2 screens
              </Text>
            )}
          </Box>

          {/* Shared Type Selector */}
          <Box>
            <Text size="sm" fw={600} mb="xs">
              Background Type
            </Text>
            <SegmentedControl
              fullWidth
              size="xs"
              value={sharedBackground.type}
              onChange={(v) => handleSharedTypeChange(v as 'gradient' | 'image')}
              data={[
                { label: 'Gradient', value: 'gradient' },
                { label: 'Image', value: 'image' },
              ]}
            />
          </Box>

          {/* Gradient Controls */}
          {sharedBackground.type === 'gradient' && sharedBackground.gradient && (
            <Stack gap="xs">
              <SharedGradientPreview gradient={sharedBackground.gradient} />

              <Select
                size="xs"
                label="Direction"
                value={sharedBackground.gradient.direction}
                onChange={handleDirectionChange}
                data={[
                  { value: 'horizontal', label: 'Horizontal (Left to Right)' },
                  { value: 'vertical', label: 'Vertical (Top to Bottom)' },
                  { value: 'diagonal-down', label: 'Diagonal (Top-Left to Bottom-Right)' },
                  { value: 'diagonal-up', label: 'Diagonal (Bottom-Left to Top-Right)' },
                ]}
              />

              <Popover opened={sharedGradientOpen} onChange={setSharedGradientOpen} position="bottom" withArrow>
                <Popover.Target>
                  <Button size="xs" variant="light" fullWidth onClick={() => setSharedGradientOpen(true)}>
                    Edit Colors
                  </Button>
                </Popover.Target>
                <Popover.Dropdown>
                  <GradientEditor
                    initialGradient={
                      sharedBackground.gradient
                        ? `linear-gradient(to right, ${sharedBackground.gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ')})`
                        : undefined
                    }
                    onApply={handleGradientApply}
                    onCancel={() => setSharedGradientOpen(false)}
                  />
                </Popover.Dropdown>
              </Popover>
            </Stack>
          )}

          {/* Image Controls */}
          {sharedBackground.type === 'image' && (
            <Stack gap="xs">
              {sharedBackground.mediaId ? (
                <>
                  <SharedImagePreview mediaId={sharedBackground.mediaId} />
                  <Group grow>
                    <Popover opened={imagePickerOpen} onChange={setImagePickerOpen} position="bottom" withArrow width={280}>
                      <Popover.Target>
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => setImagePickerOpen(true)}
                        >
                          Change Image
                        </Button>
                      </Popover.Target>
                      <Popover.Dropdown p={0}>
                        <MediaLibraryProvider enableDragDrop={false}>
                          <QuickMediaPicker
                            onSelectMedia={handleSelectMedia}
                            onClose={() => setImagePickerOpen(false)}
                            preset={quickPickerPreset}
                            width={280}
                            scrollHeight={200}
                            maxItems={9}
                            columns={3}
                            gap="4px"
                          />
                        </MediaLibraryProvider>
                      </Popover.Dropdown>
                    </Popover>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      onClick={() => onSharedBackgroundChange?.({
                        ...sharedBackground,
                        mediaId: undefined,
                      })}
                    >
                      Remove
                    </Button>
                  </Group>
                </>
              ) : (
                <Popover opened={imagePickerOpen} onChange={setImagePickerOpen} position="bottom" withArrow width={280}>
                  <Popover.Target>
                    <Button
                      size="xs"
                      variant="light"
                      fullWidth
                      onClick={() => setImagePickerOpen(true)}
                    >
                      Select Image
                    </Button>
                  </Popover.Target>
                  <Popover.Dropdown p={0}>
                    <MediaLibraryProvider enableDragDrop={false}>
                      <QuickMediaPicker
                        onSelectMedia={handleSelectMedia}
                        onClose={() => setImagePickerOpen(false)}
                        preset={quickPickerPreset}
                        width={280}
                        scrollHeight={200}
                        maxItems={9}
                        columns={3}
                        gap="4px"
                      />
                    </MediaLibraryProvider>
                  </Popover.Dropdown>
                </Popover>
              )}

              <Select
                size="xs"
                label="Fit Mode"
                value={sharedBackground.imageFit ?? 'fill'}
                onChange={handleImageFitChange}
                data={[
                  { value: 'fill', label: 'Fill (Cover)' },
                  { value: 'fit', label: 'Fit (Contain)' },
                ]}
              />

              <Group grow>
                <Select
                  size="xs"
                  label="Vertical"
                  value={sharedBackground.imageVerticalAlign ?? 'center'}
                  onChange={handleVerticalAlignChange}
                  data={[
                    { value: 'top', label: 'Top' },
                    { value: 'center', label: 'Center' },
                    { value: 'bottom', label: 'Bottom' },
                  ]}
                />
                <Select
                  size="xs"
                  label="Horizontal"
                  value={sharedBackground.imageHorizontalAlign ?? 'center'}
                  onChange={handleHorizontalAlignChange}
                  data={[
                    { value: 'left', label: 'Left' },
                    { value: 'center', label: 'Center' },
                    { value: 'right', label: 'Right' },
                  ]}
                />
              </Group>

              {recommendedDimensions && (
                <Box
                  style={{
                    backgroundColor: '#f1f3f5',
                    borderRadius: 8,
                    padding: '8px 12px',
                  }}
                >
                  <Text size="xs" c="dimmed">
                    Recommended size: {recommendedDimensions.width} x {recommendedDimensions.height}px
                  </Text>
                  <Text size="xs" c="dimmed">
                    Aspect ratio: {recommendedDimensions.aspectRatio}
                  </Text>
                </Box>
              )}
            </Stack>
          )}
        </Stack>
      )}

      {/* Per-screen background controls - only show when NOT in shared mode */}
      {!isSharedMode && (
        <>
          <Box>
            <Text size="sm" fw={700} mb="xs">
              Background Color
            </Text>
            <SimpleGrid cols={6} spacing={4}>
              {BACKGROUND_PRESETS.map((color) => (
                <Box
                  key={color}
                  onClick={() => setSettings({ ...settings, backgroundColor: color })}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    ...(color === 'transparent'
                      ? {
                          backgroundImage:
                            'linear-gradient(45deg, #e9ecef 25%, transparent 25%), linear-gradient(-45deg, #e9ecef 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e9ecef 75%), linear-gradient(-45deg, transparent 75%, #e9ecef 75%)',
                          backgroundSize: '10px 10px',
                          backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                        }
                      : getBackgroundStyle(color)),
                    cursor: 'pointer',
                    border:
                      settings.backgroundColor === color ? '3px solid #228be6' : '1px solid #dee2e6',
                  }}
                />
              ))}
              <Popover opened={customColorOpen} onChange={setCustomColorOpen} position="bottom" withArrow>
                <Popover.Target>
                  <Box
                    onClick={() => setCustomColorOpen(true)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: '2px dashed #dee2e6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backgroundColor: '#fff',
                    }}
                  >
                    <IconPlus size={16} color="#868e96" />
                  </Box>
                </Popover.Target>
                <Popover.Dropdown>
                  <Tabs defaultValue="solid">
                    <Tabs.List>
                      <Tabs.Tab value="solid" size="xs">
                        Solid
                      </Tabs.Tab>
                      <Tabs.Tab value="gradient" size="xs">
                        Gradient
                      </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="solid" pt="xs">
                      <Stack gap="xs">
                        <ColorPicker
                          format="hex"
                          value={customColor}
                          onChange={setCustomColor}
                          swatches={['#E5E7EB', '#F3F4F6', '#DBEAFE', '#E0E7FF', '#FCE7F3', '#FEF3C7', '#D1FAE5', '#000000', '#FFFFFF']}
                        />
                        <Button
                          size="xs"
                          onClick={() => {
                            setSettings({ ...settings, backgroundColor: customColor });
                            setCustomColorOpen(false);
                          }}
                        >
                          Apply
                        </Button>
                      </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="gradient" pt="xs">
                      <GradientEditor
                        initialGradient={isGradient(settings.backgroundColor) ? settings.backgroundColor : undefined}
                        onApply={(gradient) => {
                          setSettings({ ...settings, backgroundColor: gradient });
                          setCustomColorOpen(false);
                        }}
                        onCancel={() => setCustomColorOpen(false)}
                      />
                    </Tabs.Panel>
                  </Tabs>
                </Popover.Dropdown>
              </Popover>
            </SimpleGrid>
          </Box>

          {hasBackgroundMedia && onClearBackgroundMedia && (
            <Box>
              <Text size="sm" fw={700} mb="xs">
                Background Image
              </Text>
              <Button
                size="xs"
                variant="light"
                color="red"
                fullWidth
                onClick={onClearBackgroundMedia}
              >
                Remove Background Image
              </Button>
            </Box>
          )}
        </>
      )}
    </Stack>
  );
}
