import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { LayoutProvider } from '../context/LayoutContext';
import { defaultPreset } from '../presets/default';
import { FloatingPanel } from './FloatingPanel';

const meta: Meta<typeof FloatingPanel> = {
    title: 'Components/FloatingPanel',
    component: FloatingPanel,
    decorators: [
        (Story) => (
            <LayoutProvider preset={defaultPreset}>
                <div style={{ height: 600, width: '100%', position: 'relative', backgroundColor: '#f5f5f5', borderRadius: 8 }}>
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
type Story = StoryObj<typeof FloatingPanel>;

export const Default: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(true);
        return (
            <>
                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        style={{ margin: 16, padding: '8px 16px', borderRadius: 6, border: '1px solid #dee2e6', cursor: 'pointer' }}
                    >
                        Open Panel
                    </button>
                )}
                <FloatingPanel
                    id="demo-panel"
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="Inspector"
                    initialPosition={{ x: 50, y: 50 }}
                    initialSize={{ width: 320, height: 400 }}
                >
                    <div style={{ padding: 8 }}>
                        <h4 style={{ margin: '0 0 8px' }}>Panel Content</h4>
                        <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
                            This panel can be dragged by its header and resized from the bottom-right corner.
                            Position and size are persisted to localStorage.
                        </p>
                    </div>
                </FloatingPanel>
            </>
        );
    },
};

export const NotDraggable: Story = {
    render: () => (
        <FloatingPanel
            id="static-panel"
            isOpen={true}
            onClose={() => {}}
            title="Static Panel"
            draggable={false}
            initialPosition={{ x: 50, y: 50 }}
            initialSize={{ width: 300, height: 300 }}
        >
            <p style={{ fontSize: 14, color: '#666' }}>This panel cannot be dragged.</p>
        </FloatingPanel>
    ),
};

export const NotResizable: Story = {
    render: () => (
        <FloatingPanel
            id="fixed-size-panel"
            isOpen={true}
            onClose={() => {}}
            title="Fixed Size"
            resizable={false}
            initialPosition={{ x: 50, y: 50 }}
            initialSize={{ width: 280, height: 200 }}
        >
            <p style={{ fontSize: 14, color: '#666' }}>This panel cannot be resized.</p>
        </FloatingPanel>
    ),
};

export const MultiplePanels: Story = {
    render: () => (
        <>
            <FloatingPanel
                id="panel-a"
                isOpen={true}
                title="Panel A"
                initialPosition={{ x: 30, y: 30 }}
                initialSize={{ width: 260, height: 200 }}
            >
                <p style={{ fontSize: 14, color: '#666' }}>First floating panel</p>
            </FloatingPanel>
            <FloatingPanel
                id="panel-b"
                isOpen={true}
                title="Panel B"
                initialPosition={{ x: 320, y: 80 }}
                initialSize={{ width: 260, height: 200 }}
                zIndex={1001}
            >
                <p style={{ fontSize: 14, color: '#666' }}>Second floating panel</p>
            </FloatingPanel>
        </>
    ),
};
