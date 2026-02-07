import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { LayoutProvider } from '../context/LayoutContext';
import { defaultPreset } from '../presets/default';
import { SettingsPanel } from './SettingsPanel';

const meta: Meta<typeof SettingsPanel> = {
    title: 'Components/SettingsPanel',
    component: SettingsPanel,
    decorators: [
        (Story) => (
            <LayoutProvider preset={defaultPreset}>
                <div style={{ height: 500, width: '100%', position: 'relative', backgroundColor: '#f5f5f5', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: 24 }}>
                        <p style={{ color: '#666' }}>Main content area - the settings panel slides over this.</p>
                    </div>
                    <Story />
                </div>
            </LayoutProvider>
        ),
    ],
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof SettingsPanel>;

export const Default: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(true);
        return (
            <>
                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        style={{ position: 'absolute', top: 16, right: 16, padding: '8px 16px', borderRadius: 6, border: '1px solid #dee2e6', cursor: 'pointer', zIndex: 10 }}
                    >
                        Open Settings
                    </button>
                )}
                <SettingsPanel
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="Settings"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <label style={{ fontSize: 14 }}>
                            <span style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Name</span>
                            <input type="text" placeholder="Enter name" style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #dee2e6', boxSizing: 'border-box' }} />
                        </label>
                        <label style={{ fontSize: 14 }}>
                            <span style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Width</span>
                            <input type="number" placeholder="320" style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #dee2e6', boxSizing: 'border-box' }} />
                        </label>
                        <label style={{ fontSize: 14 }}>
                            <span style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Color</span>
                            <input type="color" defaultValue="#667eea" style={{ width: '100%', height: 32 }} />
                        </label>
                    </div>
                </SettingsPanel>
            </>
        );
    },
};

export const LeftPosition: Story = {
    render: () => (
        <SettingsPanel
            isOpen={true}
            onClose={() => {}}
            title="Left Panel"
            position="left"
        >
            <p style={{ fontSize: 14, color: '#666' }}>Panel positioned on the left side.</p>
        </SettingsPanel>
    ),
};

export const CustomWidth: Story = {
    render: () => (
        <SettingsPanel
            isOpen={true}
            onClose={() => {}}
            title="Wide Panel"
            width={480}
        >
            <p style={{ fontSize: 14, color: '#666' }}>This panel is 480px wide.</p>
        </SettingsPanel>
    ),
};

export const WithoutNotch: Story = {
    render: () => (
        <SettingsPanel
            isOpen={true}
            onClose={() => {}}
            title="No Notch Handle"
            showNotch={false}
        >
            <p style={{ fontSize: 14, color: '#666' }}>This panel has no drag-to-close notch handle.</p>
        </SettingsPanel>
    ),
};
