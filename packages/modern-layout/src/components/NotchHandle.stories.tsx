import type { Meta, StoryObj } from '@storybook/react';
import { LayoutProvider } from '../context/LayoutContext';
import { defaultPreset } from '../presets/default';
import { NotchHandle } from './NotchHandle';

const meta: Meta<typeof NotchHandle> = {
    title: 'Components/NotchHandle',
    component: NotchHandle,
    decorators: [
        (Story) => (
            <LayoutProvider preset={defaultPreset}>
                <div style={{ height: 300, width: 400, position: 'relative', backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#999', fontSize: 14 }}>Panel content area</span>
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
type Story = StoryObj<typeof NotchHandle>;

export const LeftPosition: Story = {
    args: {
        position: 'left',
        onClick: () => console.log('Notch clicked'),
    },
};

export const RightPosition: Story = {
    args: {
        position: 'right',
        onClick: () => console.log('Notch clicked'),
    },
};
