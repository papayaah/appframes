import { useState, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { LayoutProvider, LayoutSkeleton, FeatureTip, TourProvider, useTour, Tour, WelcomeModal, AppHeader, AppFooter, useLayout } from '../index';
import { mantinePreset } from '../presets/mantine'; // Direct import
import { MantineProvider, Box, Text, Button } from '@mantine/core';

const meta: Meta<typeof LayoutSkeleton> = {
    title: 'Layout/Components',
    component: LayoutSkeleton,
    decorators: [
        (Story) => (
            <MantineProvider>
                <LayoutProvider preset={mantinePreset}>
                    <TourProvider>
                        <Box style={{ height: '600px', backgroundColor: '#f8f9fa' }}>
                            <Story />
                        </Box>
                    </TourProvider>
                </LayoutProvider>
            </MantineProvider>
        ),
    ],
};

export default meta;

export const Skeleton: StoryObj = {
    render: () => <LayoutSkeleton />,
};

export const DashboardMockup: StoryObj = {
    render: () => {
        const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
        const [isTipOpen, setIsTipOpen] = useState(false);
        const tipAnchorRef = useRef<HTMLDivElement>(null);

        const { startTour } = useTour();
        const { preset } = useLayout();
        const { AppShell } = preset as any; // Cast to avoid undefined lint errors in story

        const demoSteps = [
            { targetId: 'demo-header', title: 'The Header', content: 'This is where your brand and primary actions live.', position: 'bottom' as const },
            { targetId: 'demo-search', title: 'Search Everywhere', content: 'Quickly find what you need across the workspace.', position: 'bottom' as const },
            { targetId: 'demo-tip-trigger', title: 'Helpful Tips', content: 'Contextual tips can be anchored to any UI element.', position: 'right' as const },
        ];

        return (
            <AppShell
                header={
                    <AppHeader
                        primary={<Box id="demo-header" style={{ fontWeight: 800, color: '#667eea' }}>MY-APP</Box>}
                        secondary={<Text size="sm">Workspace / Project Alpha</Text>}
                        center={<Box id="demo-search" style={{ width: 200, height: 32, backgroundColor: '#eee', borderRadius: 4 }} />}
                        actions={
                            <Box style={{ display: 'flex', gap: 8 }}>
                                <Button size="xs" onClick={() => setIsWelcomeOpen(true)}>Welcome</Button>
                                <Button variant="light" size="xs" onClick={() => startTour(demoSteps)}>Start Tour</Button>
                            </Box>
                        }
                    />
                }
                footer={
                    <AppFooter
                        left={<Text size="xs">● Connected to Server</Text>}
                        center={<Text size="xs">1920 x 1080 | Zoom 100%</Text>}
                        right={<Text size="xs">v1.2.4</Text>}
                    />
                }
                navbar={
                    <Box style={{ width: 80, height: '100%', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 16 }}>
                        {[1, 2, 3, 4].map(i => <Box key={i} style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#f0f0f0' }} />)}
                    </Box>
                }
            >
                <Box style={{ flex: 1, padding: 32, backgroundColor: 'white', minHeight: '100%' }}>
                    <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Text size="xl" fw={700}>Dashboard Overview</Text>
                        <div ref={tipAnchorRef}>
                            <Button id="demo-tip-trigger" size="xs" variant="outline" onClick={() => setIsTipOpen(true)}>Info</Button>
                        </div>
                    </Box>

                    <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                        {[1, 2, 3].map(i => (
                            <Box key={i} style={{ height: 120, borderRadius: 12, border: '1px solid #eee', padding: 16 }}>
                                <Text size="xs" fw={700} c="#999">WIDGET {i}</Text>
                            </Box>
                        ))}
                    </Box>
                </Box>

                <WelcomeModal
                    isOpen={isWelcomeOpen}
                    onClose={() => setIsWelcomeOpen(false)}
                    title="Welcome to the New Interface"
                    message="We've upgraded our workspace to provide a more streamlined and powerful designing experience."
                    primaryActionLabel="Let's Go"
                />

                <Tour />

                <FeatureTip
                    isOpen={isTipOpen}
                    onClose={() => setIsTipOpen(false)}
                    anchorRef={tipAnchorRef}
                    tips={[
                        { id: '1', title: 'Shortcut Keys', description: 'Press SPACE to pan and CMD+D to duplicate any item on the canvas.' },
                        { id: '2', title: 'Exporting', description: 'Use the export button in the header to save your work as PNG or JPG.' }
                    ]}
                />
            </AppShell>
        );
    }
};

export const OnboardingPopup: StoryObj = {
    render: () => {
        const [isOpen, setIsOpen] = useState(true);
        return (
            <Box style={{ padding: 40, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Button onClick={() => setIsOpen(true)}>Open Welcome Modal</Button>
                <WelcomeModal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="Unlock Your Productivity"
                    message="Welcome to the next generation of layout design. Our new toolset is faster, lighter, and more powerful than ever."
                    primaryActionLabel="Start Exploring"
                    image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop"
                />
            </Box>
        );
    }
};

export const VideoOnboarding: StoryObj = {
    render: () => {
        const [isOpen, setIsOpen] = useState(true);
        return (
            <Box style={{ padding: 40, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Button onClick={() => setIsOpen(true)}>Open Video Welcome</Button>
                <WelcomeModal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="See the Magic in Action"
                    message="Watch this quick walkthrough to see how you can transform your workflow with our new tools."
                    primaryActionLabel="Got it!"
                    video="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                />
            </Box>
        );
    }
};

export const GuidedTour: StoryObj = {
    render: () => {
        const { startTour } = useTour();
        const steps = [
            { targetId: 'step-1', title: 'The Toolbar', content: 'Access all your tools from this central location.', position: 'bottom' as const },
            { targetId: 'step-2', title: 'Workspace', content: 'This is your main creative area.', position: 'right' as const },
            { targetId: 'step-3', title: 'Profile', content: 'Manage your account and preferences here.', position: 'left' as const },
        ];

        return (
            <Box style={{ padding: 40, height: '100%', display: 'flex', flexDirection: 'column', gap: 40 }}>
                <Box style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: 20 }}>
                    <Box id="step-1" style={{ padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8 }}>Primary Logo</Box>
                    <Box id="step-3" style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#667eea' }} />
                </Box>

                <Box id="step-2" style={{ flex: 1, backgroundColor: 'white', borderRadius: 12, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Canvas Area
                </Box>

                <Box style={{ textAlign: 'center' }}>
                    <Button variant="filled" color="violet" onClick={() => startTour(steps)}>Launch Guided Tour</Button>
                </Box>

                <Tour />
            </Box>
        );
    }
};

export const FeatureTips: StoryObj = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false);
        const anchorRef = useRef<HTMLDivElement>(null);

        return (
            <Box style={{ padding: 100, display: 'flex', justifyContent: 'center' }}>
                <div ref={anchorRef}>
                    <Button id="tip-trigger" onClick={() => setIsOpen(true)}>Show Feature Tip</Button>
                </div>
                <FeatureTip
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    anchorRef={anchorRef}
                    tips={[
                        { id: '1', title: 'Pro Tip: Multi-Select', description: 'Hold down the SHIFT key and click multiple items to select them all at once.' },
                        { id: '2', title: 'Dynamic Guides', description: 'Smart guides appear automatically when you drag items, helping you align everything perfectly.' }
                    ]}
                />
            </Box>
        );
    }
};
