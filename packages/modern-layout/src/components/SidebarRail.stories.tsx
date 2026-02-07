import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { LayoutProvider } from '../context/LayoutContext';
import { defaultPreset } from '../presets/default';
import { SidebarRail } from './SidebarRail';

// Simple SVG icons for stories (no external dependency)
const IconLayout = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
);

const IconSettings = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
);

const IconLayers = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
    </svg>
);

const IconUser = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const sampleTabs = [
    { id: 'layout', icon: <IconLayout />, label: 'Layout' },
    { id: 'layers', icon: <IconLayers />, label: 'Layers' },
    { id: 'settings', icon: <IconSettings />, label: 'Settings' },
    { id: 'users', icon: <IconUser />, label: 'Users' },
];

const meta: Meta<typeof SidebarRail> = {
    title: 'Components/SidebarRail',
    component: SidebarRail,
    decorators: [
        (Story) => (
            <LayoutProvider preset={defaultPreset}>
                <div style={{ height: 500, display: 'flex', border: '1px solid #dee2e6', borderRadius: 8 }}>
                    <Story />
                </div>
            </LayoutProvider>
        ),
    ],
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj<typeof SidebarRail>;

export const Default: Story = {
    render: () => {
        const [activeTab, setActiveTab] = useState<string | null>('layout');
        return (
            <SidebarRail
                tabs={sampleTabs}
                activeTabId={activeTab}
                onTabClick={setActiveTab}
                isPinned={false}
            />
        );
    },
};

export const WithPinnedTab: Story = {
    render: () => {
        const [activeTab, setActiveTab] = useState<string | null>('layout');
        return (
            <SidebarRail
                tabs={sampleTabs}
                activeTabId={activeTab}
                onTabClick={setActiveTab}
                isPinned={true}
            />
        );
    },
};

export const WithBadges: Story = {
    render: () => {
        const [activeTab, setActiveTab] = useState<string | null>('layout');
        const tabsWithBadges = [
            { id: 'layout', icon: <IconLayout />, label: 'Layout' },
            { id: 'layers', icon: <IconLayers />, label: 'Layers', badge: 3 },
            { id: 'settings', icon: <IconSettings />, label: 'Settings' },
            { id: 'users', icon: <IconUser />, label: 'Users', badge: 12 },
        ];
        return (
            <SidebarRail
                tabs={tabsWithBadges}
                activeTabId={activeTab}
                onTabClick={setActiveTab}
                isPinned={false}
            />
        );
    },
};

export const WithDisabledTab: Story = {
    render: () => {
        const [activeTab, setActiveTab] = useState<string | null>('layout');
        const tabsWithDisabled = [
            { id: 'layout', icon: <IconLayout />, label: 'Layout' },
            { id: 'layers', icon: <IconLayers />, label: 'Layers' },
            { id: 'settings', icon: <IconSettings />, label: 'Settings', disabled: true },
            { id: 'users', icon: <IconUser />, label: 'Users' },
        ];
        return (
            <SidebarRail
                tabs={tabsWithDisabled}
                activeTabId={activeTab}
                onTabClick={setActiveTab}
                isPinned={false}
            />
        );
    },
};

export const RightPosition: Story = {
    render: () => {
        const [activeTab, setActiveTab] = useState<string | null>('layout');
        return (
            <SidebarRail
                tabs={sampleTabs}
                activeTabId={activeTab}
                onTabClick={setActiveTab}
                isPinned={false}
                position="right"
            />
        );
    },
};
