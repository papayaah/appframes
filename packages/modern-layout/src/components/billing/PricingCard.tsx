import React from 'react';
import { useLayout } from '../../context/LayoutContext';

export interface PricingCardProps {
    title?: string;
    price?: string;
    currency?: string;
    period?: string;
    features?: string[];
    isPopular?: boolean;
    onSelect?: () => void;
    loading?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Pricing Card Component
 * A premium card for displaying a subscription or one-time fee plan.
 */
export const PricingCard: React.FC<PricingCardProps> = ({
    title = 'Lifetime Pro',
    price = '99',
    currency = '₱',
    period = 'once',
    features = [
        'Access to all device frames',
        'Unlimited high-res exports',
        'Custom backgrounds & glassmorphism',
        'Priority support'
    ],
    isPopular = true,
    onSelect,
    loading = false,
    className,
    style,
}) => {
    const { preset } = useLayout();
    if (!preset) return null;

    const { Box, Text, Button, Divider } = preset;

    return (
        <Box
            className={className}
            style={{
                padding: 32,
                borderRadius: 20,
                backgroundColor: 'var(--mantine-color-body, white)',
                border: isPopular ? '2px solid #667eea' : '1px solid var(--mantine-color-gray-3, #eee)',
                boxShadow: isPopular ? '0 12px 24px rgba(102, 126, 234, 0.12)' : '0 4px 12px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                position: 'relative',
                transition: 'transform 0.2s ease',
                ...style,
            }}
        >
            {isPopular && (
                <Box
                    style={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#667eea',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                    }}
                >
                    Most Popular
                </Box>
            )}

            <Box>
                <Text size="lg" weight={700} style={{ marginBottom: 4 }}>{title}</Text>
                <Box style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <Text size="xl" weight={800} style={{ fontSize: 32 }}>{currency}{price}</Text>
                    <Text size="sm" color="var(--mantine-color-dimmed)">/ {period}</Text>
                </Box>
            </Box>

            <Divider />

            <Box style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {features.map((feature, i) => (
                    <Box key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Box style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(51, 203, 114, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#33cb72" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </Box>
                        <Text size="sm">{feature}</Text>
                    </Box>
                ))}
            </Box>

            <Button
                size="md"
                variant={isPopular ? 'primary' : 'secondary'}
                fullWidth
                onClick={onSelect}
                loading={loading}
                style={{
                    height: 48,
                    fontSize: 16,
                    fontWeight: 600,
                    background: isPopular ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : undefined,
                    border: 'none'
                }}
            >
                Get Lifetime Access
            </Button>
        </Box>
    );
};
