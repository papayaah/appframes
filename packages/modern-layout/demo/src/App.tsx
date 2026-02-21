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
    Skeleton,
} from '@mantine/core';
import {
    IconPlus,
    IconArrowRight,
    IconDeviceFloppy,
    IconShare,
    IconChevronRight,
    IconDots,
    IconLayoutDashboard,
    IconFileCode,
    IconBox,
    IconDatabase,
    IconSettings,
    IconSearch,
    IconBell,
    IconHelp,
    IconLayout2
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
    ProBadge,
    UpgradeCTA,
    PricingCard,
    MobileBottomNav,
    MobileDrawer,
} from '../../src/index';

import { mantinePreset } from '../../src/presets/mantine';

const theme = createTheme({
    primaryColor: 'violet',
    fontFamily: 'Inter, sans-serif',
});

function DesignerWorkspace() {
    const [activeId, setActiveId] = useState<string | null>('dashboard');
    const [isPinned, setIsPinned] = useState(false);
    const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
    const [isTipOpen, setIsTipOpen] = useState(false);
    const [showSkeleton, setShowSkeleton] = useState(true);
    const [inspectingId, setInspectingId] = useState<string | null>(null);
    const [showPricing, setShowPricing] = useState(false);

    const tipAnchorRef = useRef<HTMLDivElement>(null);
    const { startTour } = useTour();
    const { preset, isMobile } = useLayout();
    const { AppShell, IconButton } = preset as any;

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
        return (
            <LayoutSkeleton
                showFooter={!isMobile}
                showSidebar={!isMobile}
            >
                <Box style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 20, height: '100%', boxSizing: 'border-box' }}>
                    <Skeleton width="40%" height={32} />
                    <Box style={{ flex: 1, backgroundColor: '#f8f9fa', borderRadius: 20, opacity: 0.5, border: '2px dashed #dee2e6' }} />
                </Box>
            </LayoutSkeleton>
        );
    }

    const sideTabs = [
        { id: 'dashboard', icon: <IconLayoutDashboard size={22} />, label: 'Dashboard' },
        { id: 'explorer', icon: <IconFileCode size={22} />, label: 'Explorer' },
        { id: 'assets', icon: <IconBox size={22} />, label: 'Assets' },
        { id: 'database', icon: <IconDatabase size={22} />, label: 'Resources' },
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
                                <IconBox size={24} color="white" />
                            </Box>
                            <Box>
                                <Group gap={4} align="center">
                                    <Text fw={800} size="sm" style={{ letterSpacing: -0.5, lineHeight: 1, color: '#333' }}>LAYOUT SHELL</Text>
                                    <ProBadge variant="purple" size="xs" />
                                </Group>
                                <Text size="xs" color="dimmed" style={{ lineHeight: 1 }}>Framework v1.0.0</Text>
                            </Box>
                        </Group>
                    }
                    secondary={
                        <Group gap="xs">
                            <Text size="sm">Workspace</Text>
                            <IconChevronRight size={14} color="#ccc" />
                            <Text size="sm" fw={600}>Default Project</Text>
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
                        <Group gap={isMobile ? "xs" : "md"}>
                            {!isMobile && (
                                <>
                                    <ActionIcon variant="subtle" color="gray" radius="xl">
                                        <Indicator color="red" size={6} offset={3}>
                                            <IconBell size={20} />
                                        </Indicator>
                                    </ActionIcon>
                                    <Button.Group>
                                        <Button size="xs" variant="outline" leftSection={<IconDeviceFloppy size={14} />}>Save</Button>
                                        <Button size="xs" variant="filled" leftSection={<IconShare size={14} />}>Share</Button>
                                    </Button.Group>
                                </>
                            )}
                            <Avatar src="https://i.pravatar.cc/300" size="sm" radius="xl" />
                        </Group>
                    }
                />
            }
            navbar={!isMobile && (
                <SidebarRail
                    tabs={sideTabs}
                    activeTabId={activeId}
                    onTabClick={handleTabClick}
                    isPinned={isPinned}
                >
                    <Stack gap={8} style={{ paddingBottom: 8, alignItems: 'center' }}>
                        <IconButton
                            icon={<IconPlus size={20} style={{ color: '#f6d365' }} />}
                            tooltip="Upgrade to Pro"
                            onClick={() => setShowPricing(true)}
                            style={{
                                background: 'linear-gradient(135deg, #2c3e50 0%, #000 100%)',
                                border: '1px solid #f6d365'
                            }}
                        />
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            radius="md"
                            size="lg"
                            onClick={() => setIsWelcomeOpen(true)}
                        >
                            <IconHelp size={22} />
                        </ActionIcon>
                    </Stack>
                </SidebarRail>
            )}
            footer={
                isMobile ? (
                    <MobileBottomNav
                        tabs={sideTabs}
                        activeTabId={isPinned ? activeId : null}
                        onTabClick={handleTabClick}
                    />
                ) : (
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
                )
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
                            onClick={() => setInspectingId(inspectingId === 'item-1' ? null : 'item-1')}
                            style={{
                                width: '80%',
                                height: '70%',
                                backgroundColor: 'white',
                                borderRadius: 20,
                                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                                border: inspectingId === 'item-1' ? '2px solid #667eea' : '1px solid #eee',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                transform: inspectingId === 'item-1' ? 'scale(1.01)' : 'scale(1)'
                            }}
                        >
                            <Text color="dimmed" size="sm">Generic Content Area</Text>
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

                {/* Pricing Overlay */}
                {showPricing && (
                    <Box
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            backdropFilter: 'blur(10px)',
                            zIndex: 30000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: 'fadeIn 0.2s ease-out'
                        }}
                        onClick={() => setShowPricing(false)}
                    >
                        <Box
                            style={{ maxWidth: 450, width: '100%', padding: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <PricingCard
                                onSelect={() => {
                                    alert('Redirecting to HitPay...');
                                    setShowPricing(false);
                                }}
                            />
                            <Button
                                variant="subtle"
                                color="gray"
                                fullWidth
                                mt="md"
                                style={{ color: 'white' }}
                                onClick={() => setShowPricing(false)}
                            >
                                Maybe Later
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* Properties Panel (Desktop) */}
                {!isMobile && (
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
                )}

                {/* Mobile Tab Content (Bottom Sheet) */}
                <MobileDrawer
                    isOpen={isMobile && isPinned && !!activeId}
                    onClose={() => setIsPinned(false)}
                    title={sideTabs.find(t => t.id === activeId)?.label}
                >
                    <Stack>
                        <TextInput placeholder="Search..." size="md" radius="md" />
                        <Box h={200} style={{ backgroundColor: '#f8f9fa', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Text color="dimmed">Content for {activeId}</Text>
                        </Box>
                        <Button fullWidth size="md">Add to Canvas</Button>
                    </Stack>
                </MobileDrawer>

                {/* Mobile Properties (Bottom Sheet) */}
                <MobileDrawer
                    isOpen={isMobile && !!inspectingId}
                    onClose={() => setInspectingId(null)}
                    title="Edit Item"
                >
                    <Stack gap="xl">
                        <Box>
                            <Text fw={600} mb="sm">Appearance</Text>
                            <Group gap="xs">
                                {['#667eea', '#764ba2', '#2dd4bf', '#f59e0b'].map(c => (
                                    <Box key={c} w={48} h={48} style={{ backgroundColor: c, borderRadius: 12, cursor: 'pointer' }} />
                                ))}
                            </Group>
                        </Box>
                        <Button fullWidth size="lg">Save Changes</Button>
                    </Stack>
                </MobileDrawer>

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
