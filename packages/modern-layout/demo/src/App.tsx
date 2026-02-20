import { useState, useEffect, useRef } from 'react';
import {
    MantineProvider,
    createTheme,
    Box,
    Text,
    Button,
    ActionIcon,
    Group,
    Avatar,
    Indicator,
    Stack,
    TextInput,
} from '@mantine/core';
import {
    IconLayout2,
    IconSettings,
    IconLayersSubtract,
    IconTypography,
    IconPhoto,
    IconHelp,
    IconBell,
    IconSearch,
    IconPlus,
    IconArrowRight,
    IconDeviceFloppy,
    IconShare,
    IconChevronRight,
    IconDots
} from '@tabler/icons-react';

// Use relative imports to bypass any workspace/alias resolution issues during development
import {
    LayoutProvider,
    LayoutSkeleton,
    FeatureTip,
    TourProvider,
    useTour,
    Tour,
    WelcomeModal,
    AppHeader,
    AppFooter,
    SidebarRail,
    FloatingPanel,
    FloatingToolbar,
    useLayout,
} from '../../src/index';

import { mantinePreset } from '../../src/presets/mantine';

const theme = createTheme({
    primaryColor: 'violet',
    fontFamily: 'Inter, sans-serif',
});

function DesignerWorkspace() {
    const [activeId, setActiveId] = useState<string | null>('layers');
    const [isPinned, setIsPinned] = useState(false);
    const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
    const [isTipOpen, setIsTipOpen] = useState(false);
    const [showSkeleton, setShowSkeleton] = useState(true);
    const [inspectingId, setInspectingId] = useState<string | null>(null);

    const tipAnchorRef = useRef<HTMLDivElement>(null);
    const { startTour } = useTour();
    const { preset } = useLayout();
    const { AppShell } = preset as any;

    // Simulate initial load
    useEffect(() => {
        const timer = setTimeout(() => setShowSkeleton(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    const tourSteps = [
        { targetId: 'main-header', title: 'Smart Header', content: 'Quick access to project settings and export options.', position: 'bottom' as const },
        { targetId: 'side-rail', title: 'Asset Explorer', content: 'Switch between layers, images, and typography.', position: 'right' as const },
        { targetId: 'canvas-area', title: 'Creative Canvas', content: 'This is where your magic happens. Drag and drop assets here.', position: 'right' as const },
        { targetId: 'floating-tools', title: 'Contextual Tools', content: 'A pill-shaped toolbar that follows your focus.', position: 'top' as const },
        { targetId: 'help-trigger', title: 'Feature Tips', content: 'Found a new feature? Click here for context-aware tips.', position: 'left' as const },
    ];

    if (showSkeleton) {
        return <LayoutSkeleton />;
    }

    const sideTabs = [
        { id: 'layers', icon: <IconLayersSubtract size={22} />, label: 'Layers' },
        { id: 'typography', icon: <IconTypography size={22} />, label: 'Text' },
        { id: 'images', icon: <IconPhoto size={22} />, label: 'Photos' },
        { id: 'settings', icon: <IconSettings size={22} />, label: 'Settings' },
    ];

    const handleTabClick = (id: string) => {
        if (activeId === id) {
            setIsPinned(!isPinned);
        } else {
            setActiveId(id);
            setIsPinned(true);
        }
    };

    return (
        <AppShell
            header={
                <AppHeader
                    id="main-header"
                    primary={
                        <Group gap="xs">
                            <Box style={{ padding: 6, backgroundColor: '#667eea', borderRadius: 8 }}>
                                <IconLayout2 size={24} color="white" />
                            </Box>
                            <Box>
                                <Text fw={800} size="sm" style={{ letterSpacing: -0.5, lineHeight: 1, color: '#333' }}>APPFRAMES</Text>
                                <Text size="xs" color="dimmed" style={{ lineHeight: 1 }}>v2.0 Beta</Text>
                            </Box>
                        </Group>
                    }
                    secondary={
                        <Group gap="xs">
                            <Text size="sm">Projects</Text>
                            <IconChevronRight size={14} color="#ccc" />
                            <Text size="sm" fw={600}>Untitled Artwork</Text>
                        </Group>
                    }
                    center={
                        <Box style={{ width: 300 }}>
                            <TextInput
                                placeholder="Search assets or commands..."
                                leftSection={<IconSearch size={16} />}
                                size="xs"
                                radius="md"
                                variant="filled"
                            />
                        </Box>
                    }
                    actions={
                        <Group gap="md">
                            <ActionIcon variant="subtle" color="gray" radius="xl">
                                <Indicator color="red" size={6} offset={3}>
                                    <IconBell size={20} />
                                </Indicator>
                            </ActionIcon>
                            <Button.Group>
                                <Button size="xs" variant="outline" leftSection={<IconDeviceFloppy size={14} />}>Save</Button>
                                <Button size="xs" variant="filled" leftSection={<IconShare size={14} />}>Share</Button>
                            </Button.Group>
                            <Avatar src="https://i.pravatar.cc/300" size="sm" radius="xl" />
                        </Group>
                    }
                />
            }
            navbar={
                <SidebarRail
                    tabs={sideTabs}
                    activeTabId={activeId}
                    onTabClick={handleTabClick}
                    isPinned={isPinned}
                >
                    <Box style={{ paddingBottom: 8 }}>
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            radius="md"
                            size="lg"
                            onClick={() => setIsWelcomeOpen(true)}
                        >
                            <IconHelp size={22} />
                        </ActionIcon>
                    </Box>
                </SidebarRail>
            }
            footer={
                <AppFooter
                    left={
                        <Group gap="xs">
                            <Box w={8} h={8} style={{ backgroundColor: '#2dd4bf', borderRadius: '50%' }} />
                            <Text size="xs">Syncing to cloud...</Text>
                        </Group>
                    }
                    center={<Text size="xs">375 x 667 | iPhone 14</Text>}
                    right={
                        <Group gap="md">
                            <Text size="xs" style={{ cursor: 'pointer' }}>Release Notes</Text>
                            <Text size="xs" fw={700}>BETA</Text>
                        </Group>
                    }
                />
            }
        >
            <Box style={{ flex: 1, position: 'relative', overflow: 'hidden', height: '100%' }}>
                {/* Main Canvas Area */}
                <Box
                    id="canvas-area"
                    style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'radial-gradient(#ddd 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}
                >
                    <Stack align="center" gap="xl">
                        <Box
                            onClick={() => setInspectingId(inspectingId === 'frame-1' ? null : 'frame-1')}
                            style={{
                                width: 375,
                                height: 667,
                                backgroundColor: 'white',
                                borderRadius: 24,
                                boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                                border: inspectingId === 'frame-1' ? '2px solid #667eea' : '1px solid #eee',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                transform: inspectingId === 'frame-1' ? 'scale(1.02)' : 'scale(1)'
                            }}
                        >
                            <Text color="dimmed" size="xs">Empty Frame</Text>
                        </Box>

                        <FloatingToolbar
                            id="floating-tools"
                            visible={true}
                            items={[
                                { id: 'add', icon: <IconPlus size={20} />, label: 'Add Item' },
                                { id: 'tour', icon: <IconArrowRight size={20} />, label: 'Take Tour', onClick: () => startTour(tourSteps) },
                                { id: 'dots', icon: <IconDots size={20} />, label: 'More' },
                            ]}
                        />
                    </Stack>
                </Box>

                {/* Side Panel for Config */}
                <FloatingPanel
                    id="properties-panel"
                    title="Properties"
                    isOpen={!!inspectingId}
                    onClose={() => setInspectingId(null)}
                    initialSize={{ width: 320, height: 480 }}
                    initialPosition={{ x: window.innerWidth - 340, y: 80 }}
                >
                    <Stack p="md">
                        <Box>
                            <Text size="xs" fw={700} color="dimmed" mb={4}>GEOMETRY</Text>
                            <Group grow>
                                <TextInput label="X" value="120" size="xs" readOnly />
                                <TextInput label="Y" value="450" size="xs" readOnly />
                            </Group>
                        </Box>
                        <Box>
                            <Text size="xs" fw={700} color="dimmed" mb={4}>STYLING</Text>
                            <Stack gap="xs">
                                <Box h={40} style={{ backgroundColor: '#667eea', borderRadius: 8, cursor: 'pointer' }} />
                                <Text size="xs">Primary Brand Violet</Text>
                            </Stack>
                        </Box>
                    </Stack>
                </FloatingPanel>

                {/* Help Overlay Trigger */}
                <Box
                    id="help-trigger"
                    ref={tipAnchorRef}
                    style={{ position: 'absolute', bottom: 20, right: inspectingId ? 340 : 20, transition: 'right 0.3s ease' }}
                >
                    <ActionIcon
                        size="lg"
                        radius="xl"
                        variant="filled"
                        onClick={() => setIsTipOpen(true)}
                        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    >
                        <IconHelp size={20} />
                    </ActionIcon>
                </Box>
            </Box>

            <WelcomeModal
                isOpen={isWelcomeOpen}
                onClose={() => setIsWelcomeOpen(false)}
                title="Ready to Build Better Layouts?"
                message="Modern Layout is a headless library that gives you the power of professional design tools directly in your React apps."
                primaryActionLabel="Start Design Now"
                image="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop"
            />

            <Tour />

            <FeatureTip
                isOpen={isTipOpen}
                onClose={() => setIsTipOpen(false)}
                anchorRef={tipAnchorRef}
                tips={[
                    { id: '1', title: 'Smart Shortcuts', description: 'Double click any frame to quickly open its property inspector.' },
                    { id: '2', title: 'Asset Library', description: 'Drag and drop images directly from your desktop into the canvas.' },
                    { id: '3', title: 'Performance Modes', description: 'The LayoutShell is optimized for 60fps even with thousands of active elements.' }
                ]}
            />
        </AppShell>
    );
}

export default function App() {
    return (
        <MantineProvider theme={theme}>
            <LayoutProvider preset={mantinePreset}>
                <TourProvider>
                    <DesignerWorkspace />
                </TourProvider>
            </LayoutProvider>
        </MantineProvider>
    );
}
