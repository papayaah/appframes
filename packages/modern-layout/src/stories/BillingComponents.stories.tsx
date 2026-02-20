import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { LayoutProvider } from '../context/LayoutContext';
import { mantinePreset } from '../presets/mantine';
import { ProBadge } from '../components/billing/ProBadge';
import { UpgradeCTA } from '../components/billing/UpgradeCTA';
import { PricingCard } from '../components/billing/PricingCard';

const meta: Meta<typeof ProBadge> = {
    title: 'Billing/Components',
    decorators: [
        (Story) => (
            <LayoutProvider preset={mantinePreset}>
                <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
                    <Story />
                </div>
            </LayoutProvider>
        ),
    ],
};

export default meta;

export const AllComponents: StoryObj = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <section>
                <h3 style={{ marginBottom: 16 }}>Pro Badges</h3>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <ProBadge variant="gold" size="xs" />
                    <ProBadge variant="purple" size="sm" />
                    <ProBadge variant="silver" size="md" />
                </div>
            </section>

            <section>
                <h3 style={{ marginBottom: 16 }}>Upgrade CTA (Sidebar style)</h3>
                <div style={{ width: 280 }}>
                    <UpgradeCTA />
                </div>
            </section>

            <section>
                <h3 style={{ marginBottom: 16 }}>Pricing Card</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <PricingCard
                        title="Early Bird"
                        price="49"
                        isPopular={false}
                        features={['All frames', 'Standard exports']}
                    />
                    <PricingCard />
                </div>
            </section>
        </div>
    ),
};
