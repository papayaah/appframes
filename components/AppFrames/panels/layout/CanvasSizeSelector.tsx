
import { useState } from 'react';
import { Box, Group, Text, Badge, SimpleGrid, Stack } from '@mantine/core';
import { IconBrandApple, IconBrandGooglePlay, IconChevronDown } from '@tabler/icons-react';
import { getCanvasDimensions } from '../../FramesContext';
import { CanvasSettings, Screen } from '../../types';
import { STORES, findStoreAndDevice, getSizeLabel, DeviceConfig } from './LayoutConstants';
import { DeviceIcon } from './DeviceIcon';

interface CanvasSizeSelectorProps {
    settings: CanvasSettings;
    setSettings: (settings: CanvasSettings) => void;
    currentScreen?: Screen;
}

export function CanvasSizeSelector({ settings, setSettings, currentScreen }: CanvasSizeSelectorProps) {
    // Find current store and device based on selected canvas size
    const current = findStoreAndDevice(settings.canvasSize);
    const currentStore = current?.store || STORES[0];
    const currentDevice = current?.device || STORES[0].devices[0];

    // State for UI
    const [activeStoreId, setActiveStoreId] = useState<string>(currentStore.id);
    const [showSizeDropdown, setShowSizeDropdown] = useState(false);

    const activeStore = STORES.find((s) => s.id === activeStoreId) || STORES[0];

    const handleSizeSelect = (value: string) => {
        const dims = getCanvasDimensions(value, 'portrait');
        const orientation = dims.width > dims.height ? 'landscape' : 'portrait';
        setSettings({ ...settings, canvasSize: value, orientation });
        setShowSizeDropdown(false);
    };

    const handleDeviceSelect = (device: DeviceConfig) => {
        // Select the default size for this device
        handleSizeSelect(device.defaultSize);
    };

    // Check if a device is currently selected
    const isDeviceSelected = (device: DeviceConfig) => {
        return device.sizes.some((s) => s.value === settings.canvasSize);
    };

    return (
        <Box>
            <Group justify="space-between" align="center" mb="xs">
                <Text size="xs" c="dimmed" tt="uppercase">
                    Canvas Size
                </Text>
                {currentScreen && (
                    <Badge variant="light" color="blue" size="sm" style={{ textTransform: 'none' }}>
                        {currentScreen.name}
                    </Badge>
                )}
            </Group>

            {/* Store Tabs */}
            <Group gap={8} mb="sm">
                {STORES.map((store) => {
                    const isActive = activeStoreId === store.id;
                    return (
                        <Box
                            key={store.id}
                            onClick={() => setActiveStoreId(store.id)}
                            style={{
                                padding: '10px 16px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                border: '2px solid',
                                borderColor: isActive ? '#228be6' : '#dee2e6',
                                backgroundColor: isActive ? '#e7f5ff' : 'white',
                                color: isActive ? '#228be6' : '#868e96',
                                transition: 'all 0.15s ease',
                                textAlign: 'center',
                                flex: 1,
                            }}
                        >
                            {store.id === 'apple' ? (
                                <IconBrandApple size={24} style={{ marginBottom: 4 }} />
                            ) : (
                                <IconBrandGooglePlay size={24} style={{ marginBottom: 4 }} />
                            )}
                            <Text size="xs" fw={isActive ? 600 : 500}>
                                {store.id === 'apple' ? 'Apple' : 'Google'}
                            </Text>
                        </Box>
                    );
                })}
            </Group>

            {/* Device Cards Grid */}
            <SimpleGrid cols={3} spacing={8}>
                {activeStore.devices.map((device) => {
                    const isSelected = isDeviceSelected(device);
                    return (
                        <Box
                            key={device.id}
                            onClick={() => handleDeviceSelect(device)}
                            style={{
                                padding: '10px 4px',
                                borderRadius: 8,
                                border: '2px solid',
                                borderColor: isSelected ? '#228be6' : '#dee2e6',
                                backgroundColor: isSelected ? '#e7f5ff' : 'white',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <Box
                                style={{
                                    height: 40,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: isSelected ? '#228be6' : '#868e96',
                                    marginBottom: 4,
                                }}
                            >
                                <DeviceIcon deviceId={device.id} size={40} />
                            </Box>
                            <Text size="xs" fw={isSelected ? 600 : 400} c={isSelected ? '#228be6' : undefined}>
                                {device.shortLabel || device.label}
                            </Text>
                        </Box>
                    );
                })}
            </SimpleGrid>

            {/* Current Size Display & Dropdown */}
            <Box mt="sm">
                <Box
                    onClick={() => currentDevice.sizes.length > 1 && setShowSizeDropdown(!showSizeDropdown)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 6,
                        backgroundColor: '#f8f9fa',
                        cursor: currentDevice.sizes.length > 1 ? 'pointer' : 'default',
                    }}
                >
                    <Text size="xs" c="dimmed">
                        {getSizeLabel(settings.canvasSize)}
                    </Text>
                    {currentDevice.sizes.length > 1 && (
                        <IconChevronDown
                            size={14}
                            color="#868e96"
                            style={{
                                transition: 'transform 0.2s ease',
                                transform: showSizeDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                            }}
                        />
                    )}
                </Box>

                {/* Size Dropdown */}
                {showSizeDropdown && currentDevice.sizes.length > 1 && (
                    <Box
                        style={{
                            marginTop: 4,
                            padding: '4px',
                            borderRadius: 6,
                            border: '1px solid #dee2e6',
                            backgroundColor: 'white',
                        }}
                    >
                        <Stack gap={1}>
                            {currentDevice.sizes.map((size) => {
                                const isSelected = settings.canvasSize === size.value;
                                return (
                                    <Box
                                        key={size.value}
                                        onClick={() => handleSizeSelect(size.value)}
                                        style={{
                                            padding: '6px 8px',
                                            borderRadius: 4,
                                            cursor: 'pointer',
                                            backgroundColor: isSelected ? '#e7f5ff' : 'transparent',
                                        }}
                                    >
                                        <Text size="xs" fw={isSelected ? 600 : 400} c={isSelected ? '#228be6' : undefined}>
                                            {size.label}
                                        </Text>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
