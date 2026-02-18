
import { Box, Group, SimpleGrid, Text } from '@mantine/core';
import { CanvasSettings, Screen } from '../../types';

interface CompositionSelectorProps {
    settings: CanvasSettings;
    setSettings: (settings: CanvasSettings) => void;
    currentScreen?: Screen;
}

const CompositionButton = ({
    type,
    label,
    selected,
    onClick,
}: {
    type: string;
    label: string;
    selected: boolean;
    onClick: () => void;
}) => (
    <Box
        onClick={onClick}
        style={{
            border: '2px solid',
            borderColor: selected ? '#228be6' : '#dee2e6',
            borderRadius: 8,
            padding: '12px 8px',
            cursor: 'pointer',
            textAlign: 'center',
            backgroundColor: selected ? '#e7f5ff' : 'white',
            transition: 'all 0.2s',
        }}
    >
        <Box style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', height: 40 }}>
            {type === 'single' && <Box style={{ width: 20, height: 35, border: '2px solid #495057', borderRadius: 4 }} />}
            {type === 'dual' && (
                <Group gap={4}>
                    <Box style={{ width: 18, height: 35, border: '2px solid #495057', borderRadius: 4 }} />
                    <Box style={{ width: 18, height: 35, border: '2px solid #495057', borderRadius: 4 }} />
                </Group>
            )}
            {type === 'stack' && (
                <Box style={{ position: 'relative', width: 30, height: 40 }}>
                    <Box
                        style={{
                            position: 'absolute',
                            width: 20,
                            height: 30,
                            border: '2px solid #495057',
                            borderRadius: 4,
                            top: 0,
                            left: 0,
                        }}
                    />
                    <Box
                        style={{
                            position: 'absolute',
                            width: 20,
                            height: 30,
                            border: '2px solid #495057',
                            borderRadius: 4,
                            top: 8,
                            left: 8,
                        }}
                    />
                </Box>
            )}
            {type === 'triple' && (
                <Group gap={3}>
                    <Box style={{ width: 14, height: 30, border: '2px solid #495057', borderRadius: 3 }} />
                    <Box style={{ width: 14, height: 30, border: '2px solid #495057', borderRadius: 3 }} />
                    <Box style={{ width: 14, height: 30, border: '2px solid #495057', borderRadius: 3 }} />
                </Group>
            )}
            {type === 'fan' && (
                <Box style={{ position: 'relative', width: 35, height: 40 }}>
                    <Box
                        style={{
                            position: 'absolute',
                            width: 18,
                            height: 28,
                            border: '2px solid #495057',
                            borderRadius: 3,
                            top: 5,
                            left: 0,
                            transform: 'rotate(-10deg)',
                        }}
                    />
                    <Box
                        style={{
                            position: 'absolute',
                            width: 18,
                            height: 28,
                            border: '2px solid #495057',
                            borderRadius: 3,
                            top: 0,
                            left: 8,
                        }}
                    />
                    <Box
                        style={{
                            position: 'absolute',
                            width: 18,
                            height: 28,
                            border: '2px solid #495057',
                            borderRadius: 3,
                            top: 5,
                            left: 16,
                            transform: 'rotate(10deg)',
                        }}
                    />
                </Box>
            )}
        </Box>
        <Text size="xs" fw={500}>
            {label}
        </Text>
    </Box>
);

export function CompositionSelector({ settings, setSettings, currentScreen }: CompositionSelectorProps) {
    const hasAnyFrames = (currentScreen?.images ?? []).some((img) => !(img?.cleared === true) && img?.diyOptions);
    const effectiveComposition = hasAnyFrames ? settings.composition : undefined;

    return (
        <Box>
            <Text size="xs" c="dimmed" mb="xs" tt="uppercase">
                Composition
            </Text>
            <SimpleGrid cols={2} spacing="xs">
                <CompositionButton
                    type="single"
                    label="Single"
                    selected={effectiveComposition === 'single'}
                    onClick={() => setSettings({ ...settings, composition: 'single' })}
                />
                <CompositionButton
                    type="dual"
                    label="Dual"
                    selected={effectiveComposition === 'dual'}
                    onClick={() => setSettings({ ...settings, composition: 'dual' })}
                />
                <CompositionButton
                    type="stack"
                    label="Stack"
                    selected={effectiveComposition === 'stack'}
                    onClick={() => setSettings({ ...settings, composition: 'stack' })}
                />
                <CompositionButton
                    type="triple"
                    label="Triple"
                    selected={effectiveComposition === 'triple'}
                    onClick={() => setSettings({ ...settings, composition: 'triple' })}
                />
            </SimpleGrid>
            <Box mt="xs">
                <CompositionButton
                    type="fan"
                    label="Fan"
                    selected={effectiveComposition === 'fan'}
                    onClick={() => setSettings({ ...settings, composition: 'fan' })}
                />
            </Box>
        </Box>
    );
}
