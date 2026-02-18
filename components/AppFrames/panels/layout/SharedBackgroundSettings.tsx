
import { useState, useMemo } from 'react';
import { Box, Stack, Text, Group, Button, SegmentedControl, Select, Popover, Badge, Card, Image, Loader, Center, Skeleton, SimpleGrid } from '@mantine/core';
import { CanvasSettings, SharedBackground, Screen } from '../../types';
import { getRecommendedImageDimensions } from '../../sharedBackgroundUtils';
import { GradientEditor } from '../../GradientEditor';
import { useMediaImage } from '../../../../hooks/useMediaImage';
import { QuickMediaPicker, MediaLibraryProvider, ComponentPreset } from '@reactkits.dev/react-media-library';
import { AlignmentControl } from './AlignmentControl';

interface SharedBackgroundSettingsProps {
    settings: CanvasSettings;
    screens: Screen[];
    sharedBackground?: SharedBackground;
    onSharedBackgroundChange?: (sharedBg: SharedBackground | undefined) => void;
    onToggleScreenInSharedBg?: (screenId: string) => void;
}

// Minimal Mantine preset for QuickMediaPicker (shared background image selection)
const quickPickerPreset: ComponentPreset = {
    Card: ({ children, onClick, selected, style }) => (
        <Card shadow="none" padding={0} radius="sm" withBorder onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default', borderColor: selected ? 'var(--mantine-color-violet-6)' : undefined, borderWidth: selected ? 2 : 1, ...style }}>
            {children}
        </Card>
    ),
    Button: ({ children, onClick, variant = 'primary', disabled, loading, size = 'md', fullWidth, leftIcon, ...rest }) => (
        <Button onClick={onClick} variant={variant === 'primary' ? 'filled' : variant === 'danger' ? 'filled' : 'light'}
            color={variant === 'danger' ? 'red' : 'violet'} disabled={disabled} loading={loading} size={size} fullWidth={fullWidth} leftSection={leftIcon} {...rest}>
            {children}
        </Button>
    ),
    TextInput: () => null, Select: () => null, Checkbox: () => null,
    Badge: ({ children }) => <Badge size="xs">{children}</Badge>,
    Image: ({ src, alt, style, onLoad }) => <Image src={src} alt={alt} style={style} fit="cover" w="100%" h="100%" onLoad={onLoad} />,
    Modal: () => null,
    Loader: ({ size = 'md' }) => <Loader size={size} />,
    EmptyState: ({ icon, message }) => (<Center p="md"><Stack align="center" gap="xs">{icon}<Text size="xs" c="dimmed">{message}</Text></Stack></Center>),
    FileButton: () => null,
    Grid: ({ children, columns = 3, gap = '6px' }) => (<div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap }}>{children}</div>),
    Skeleton: () => <Skeleton height={60} />,
    UploadCard: () => null, Viewer: () => null, ViewerThumbnail: () => null,
};

// Shared background gradient preview
function SharedGradientPreview({ gradient }: { gradient: NonNullable<SharedBackground['gradient']> }) {
    const directionMap: Record<string, string> = {
        'horizontal': 'to right', 'vertical': 'to bottom', 'diagonal-down': '135deg', 'diagonal-up': '45deg',
    };
    const direction = directionMap[gradient.direction] || 'to right';
    const stops = gradient.stops.map(s => `${s.color} ${s.position}%`).join(', ');
    return (
        <Box style={{ width: '100%', height: 40, borderRadius: 8, background: `linear-gradient(${direction}, ${stops})`, border: '1px solid #dee2e6' }} />
    );
}

// Shared background image preview
function SharedImagePreview({ mediaId }: { mediaId: number }) {
    const { imageUrl } = useMediaImage(mediaId);
    if (!imageUrl) return null;
    return (
        <Box style={{ width: '100%', height: 60, borderRadius: 8, backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #dee2e6' }} />
    );
}

export function SharedBackgroundSettings({
    settings,
    screens,
    sharedBackground,
    onSharedBackgroundChange,
    onToggleScreenInSharedBg,
}: SharedBackgroundSettingsProps) {
    const [sharedGradientOpen, setSharedGradientOpen] = useState(false);
    const [imagePickerOpen, setImagePickerOpen] = useState(false);

    const recommendedDimensions = useMemo(() => {
        if (!sharedBackground || sharedBackground.screenIds.length < 2) return null;
        return getRecommendedImageDimensions(sharedBackground.screenIds.length, settings.canvasSize, settings.orientation);
    }, [sharedBackground?.screenIds.length, settings.canvasSize, settings.orientation]);

    const handleSharedTypeChange = (type: 'gradient' | 'image') => {
        if (!sharedBackground) return;
        onSharedBackgroundChange?.({ ...sharedBackground, type });
    };

    const handleSelectMedia = (mediaId: number) => {
        if (!sharedBackground) return;
        onSharedBackgroundChange?.({ ...sharedBackground, mediaId });
        setImagePickerOpen(false);
    };

    const handleGradientApply = (gradientString: string) => {
        if (!sharedBackground) return;
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
            return { color: parts[0], position: parseFloat(parts[1]) };
        });
        if (stops.length >= 2) {
            onSharedBackgroundChange?.({ ...sharedBackground, gradient: { stops, direction } });
        }
        setSharedGradientOpen(false);
    };

    const handleDirectionChange = (direction: string | null) => {
        if (!sharedBackground?.gradient || !direction) return;
        onSharedBackgroundChange?.({ ...sharedBackground, gradient: { ...sharedBackground.gradient, direction: direction as NonNullable<SharedBackground['gradient']>['direction'] } });
    };

    const handleImageFitChange = (fit: string | null) => {
        if (!sharedBackground || !fit) return;
        onSharedBackgroundChange?.({ ...sharedBackground, imageFit: fit as 'fill' | 'fit' });
    };

    const handleVerticalAlignChange = (align: string | null) => {
        if (!sharedBackground || !align) return;
        onSharedBackgroundChange?.({ ...sharedBackground, imageVerticalAlign: align as 'top' | 'center' | 'bottom' });
    };

    const handleHorizontalAlignChange = (align: string | null) => {
        if (!sharedBackground || !align) return;
        onSharedBackgroundChange?.({ ...sharedBackground, imageHorizontalAlign: align as 'left' | 'center' | 'right' });
    };

    return (
        <Box>
            <Text size="xs" c="dimmed" mb="xs" tt="uppercase">
                Shared Background
            </Text>

            <Stack gap="sm">
                {/* Screen Selector */}
                <Box>
                    <Text size="xs" c="dimmed" mb={6}>Select screens to share a background</Text>
                    <Group gap={4}>
                        {screens.map((screen, idx) => {
                            const isInGroup = sharedBackground?.screenIds.includes(screen.id) ?? false;
                            return (
                                <Button key={screen.id} size="xs" variant={isInGroup ? 'filled' : 'light'}
                                    onClick={() => onToggleScreenInSharedBg?.(screen.id)}
                                    style={{ minWidth: 32, padding: '0 8px' }}>
                                    {idx + 1}
                                </Button>
                            );
                        })}
                    </Group>
                </Box>

                {/* Type Selector & Controls — shown once screens are selected */}
                {sharedBackground && sharedBackground.screenIds.length > 0 && (
                    <>
                        <Box>
                            <Text size="sm" fw={600} mb="xs">Background Type</Text>
                            <SegmentedControl fullWidth size="xs"
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
                                <Select size="xs" label="Direction"
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
                                        <Button size="xs" variant="light" fullWidth onClick={() => setSharedGradientOpen(true)}>Edit Colors</Button>
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
                                                    <Button size="xs" variant="light" onClick={() => setImagePickerOpen(true)}>Change Image</Button>
                                                </Popover.Target>
                                                <Popover.Dropdown p={0}>
                                                    <MediaLibraryProvider enableDragDrop={false}>
                                                        <QuickMediaPicker onSelectMedia={handleSelectMedia} onClose={() => setImagePickerOpen(false)}
                                                            preset={quickPickerPreset} width={280} scrollHeight={200} maxItems={9} columns={3} gap="4px" />
                                                    </MediaLibraryProvider>
                                                </Popover.Dropdown>
                                            </Popover>
                                            <Button size="xs" variant="light" color="red"
                                                onClick={() => onSharedBackgroundChange?.({ ...sharedBackground, mediaId: undefined })}>
                                                Remove
                                            </Button>
                                        </Group>
                                    </>
                                ) : (
                                    <Popover opened={imagePickerOpen} onChange={setImagePickerOpen} position="bottom" withArrow width={280}>
                                        <Popover.Target>
                                            <Button size="xs" variant="light" fullWidth onClick={() => setImagePickerOpen(true)}>Select Image</Button>
                                        </Popover.Target>
                                        <Popover.Dropdown p={0}>
                                            <MediaLibraryProvider enableDragDrop={false}>
                                                <QuickMediaPicker onSelectMedia={handleSelectMedia} onClose={() => setImagePickerOpen(false)}
                                                    preset={quickPickerPreset} width={280} scrollHeight={200} maxItems={9} columns={3} gap="4px" />
                                            </MediaLibraryProvider>
                                        </Popover.Dropdown>
                                    </Popover>
                                )}

                                <Group gap="md" align="flex-start" wrap="nowrap">
                                    {/* Fit Mode toggle */}
                                    <Box style={{ flex: 1 }}>
                                        <Text size="xs" c="dimmed" mb={4} tt="uppercase" ta="center">Fit Mode</Text>
                                        <SimpleGrid cols={2} spacing={4}>
                                            {([['fill', 'Fill'], ['fit', 'Fit']] as const).map(([value, label]) => {
                                                const isFill = value === 'fill';
                                                const selected = (sharedBackground.imageFit ?? 'fill') === value;
                                                return (
                                                    <Box
                                                        key={value}
                                                        onClick={() => handleImageFitChange(value)}
                                                        style={{
                                                            border: '2px solid',
                                                            borderColor: selected ? '#228be6' : '#dee2e6',
                                                            borderRadius: 6,
                                                            padding: '6px 2px 4px',
                                                            cursor: 'pointer',
                                                            textAlign: 'center',
                                                            backgroundColor: selected ? '#e7f5ff' : 'white',
                                                            transition: 'all 0.2s',
                                                        }}
                                                    >
                                                        <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 24, marginBottom: 2 }}>
                                                            <Box style={{
                                                                position: 'relative', width: 28, height: 22,
                                                                border: '2px solid #495057', borderRadius: 2,
                                                                overflow: isFill ? 'hidden' : undefined,
                                                                display: isFill ? undefined : 'flex', alignItems: 'center', justifyContent: 'center',
                                                            }}>
                                                                {isFill ? (
                                                                    <Box style={{ position: 'absolute', inset: -3, background: 'linear-gradient(135deg, #a8d8ea 0%, #aa96da 50%, #fcbad3 100%)' }} />
                                                                ) : (
                                                                    <Box style={{ width: 14, height: 16, borderRadius: 1, background: 'linear-gradient(135deg, #a8d8ea 0%, #aa96da 50%, #fcbad3 100%)' }} />
                                                                )}
                                                            </Box>
                                                        </Box>
                                                        <Text size="xs" fw={500}>{label}</Text>
                                                    </Box>
                                                );
                                            })}
                                        </SimpleGrid>
                                    </Box>
                                    {/* Alignment pad */}
                                    <AlignmentControl
                                        vertical={sharedBackground.imageVerticalAlign ?? 'center'}
                                        horizontal={sharedBackground.imageHorizontalAlign ?? 'center'}
                                        onVerticalChange={(v) => handleVerticalAlignChange(v)}
                                        onHorizontalChange={(h) => handleHorizontalAlignChange(h)}
                                    />
                                </Group>
                                {recommendedDimensions && (
                                    <Box style={{ backgroundColor: '#f1f3f5', borderRadius: 8, padding: '8px 12px' }}>
                                        <Text size="xs" c="dimmed">Recommended size: {recommendedDimensions.width} x {recommendedDimensions.height}px</Text>
                                        <Text size="xs" c="dimmed">Aspect ratio: {recommendedDimensions.aspectRatio}</Text>
                                    </Box>
                                )}
                            </Stack>
                        )}
                    </>
                )}

            </Stack>
        </Box>
    );
}
