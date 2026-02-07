import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { LayoutProvider } from '../context/LayoutContext';
import { defaultPreset } from '../presets/default';
import { SidebarRail } from '../components/SidebarRail';
import { SettingsPanel } from '../components/SettingsPanel';
import { FloatingPanel } from '../components/FloatingPanel';

// Simple SVG icons
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

const IconInspect = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const tabs = [
    { id: 'layout', icon: <IconLayout />, label: 'Layout' },
    { id: 'layers', icon: <IconLayers />, label: 'Layers', badge: 5 },
    { id: 'inspect', icon: <IconInspect />, label: 'Inspect' },
    { id: 'settings', icon: <IconSettings />, label: 'Settings' },
];

const meta: Meta = {
    title: 'Compositions/AppShell',
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj;

export const FullLayout: Story = {
    render: () => {
        const [activeTab, setActiveTab] = useState<string | null>('layout');
        const [settingsOpen, setSettingsOpen] = useState(false);
        const [inspectorOpen, setInspectorOpen] = useState(false);

        const handleTabClick = (tabId: string) => {
            if (tabId === 'settings') {
                setSettingsOpen((prev) => !prev);
            } else if (tabId === 'inspect') {
                setInspectorOpen((prev) => !prev);
            } else {
                setActiveTab(tabId);
            }
        };

        return (
            <LayoutProvider preset={defaultPreset}>
                <div style={{ display: 'flex', height: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                    {/* Left Sidebar Rail */}
                    <SidebarRail
                        tabs={tabs}
                        activeTabId={activeTab}
                        onTabClick={handleTabClick}
                        isPinned={activeTab === 'layout'}
                    />

                    {/* Main Content */}
                    <div style={{ flex: 1, position: 'relative', backgroundColor: '#f8f9fa', overflow: 'hidden' }}>
                        {/* Header */}
                        <div style={{ height: 45, borderBottom: '1px solid #dee2e6', display: 'flex', alignItems: 'center', padding: '0 16px', backgroundColor: '#fff' }}>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>My Project</span>
                        </div>

                        {/* Canvas */}
                        <div style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100% - 45px)', boxSizing: 'border-box' }}>
                            <div style={{
                                width: 375,
                                height: 667,
                                backgroundColor: '#fff',
                                borderRadius: 12,
                                boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#999',
                                fontSize: 14,
                            }}>
                                Device Frame Preview
                            </div>
                        </div>

                        {/* Settings Panel */}
                        <SettingsPanel
                            isOpen={settingsOpen}
                            onClose={() => setSettingsOpen(false)}
                            title="Settings"
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <label style={{ fontSize: 13 }}>
                                    <span style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Project Name</span>
                                    <input type="text" defaultValue="My Project" style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #dee2e6', boxSizing: 'border-box' }} />
                                </label>
                                <label style={{ fontSize: 13 }}>
                                    <span style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Background</span>
                                    <input type="color" defaultValue="#f8f9fa" style={{ width: '100%', height: 32 }} />
                                </label>
                            </div>
                        </SettingsPanel>

                        {/* Floating Inspector */}
                        <FloatingPanel
                            id="story-inspector"
                            isOpen={inspectorOpen}
                            onClose={() => setInspectorOpen(false)}
                            title="Inspector"
                            initialPosition={{ x: 400, y: 80 }}
                            initialSize={{ width: 280, height: 320 }}
                        >
                            <div style={{ fontSize: 13, color: '#666' }}>
                                <p style={{ margin: '0 0 8px' }}>Selected: Frame 1</p>
                                <p style={{ margin: '0 0 4px' }}>Width: 375px</p>
                                <p style={{ margin: '0 0 4px' }}>Height: 667px</p>
                                <p style={{ margin: 0 }}>Scale: 1.0</p>
                            </div>
                        </FloatingPanel>
                    </div>
                </div>
            </LayoutProvider>
        );
    },
};
