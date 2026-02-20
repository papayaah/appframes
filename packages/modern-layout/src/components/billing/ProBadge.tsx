import React from 'react';
import { useLayout } from '../../context/LayoutContext';

export interface ProBadgeProps {
    label?: string;
    variant?: 'gold' | 'silver' | 'purple';
    size?: 'xs' | 'sm' | 'md';
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Pro Badge Component
 * A high-end badge to indicate premium status or features.
 */
export const ProBadge: React.FC<ProBadgeProps> = ({
    label = 'PRO',
    variant = 'gold',
    size = 'xs',
    className,
    style,
}) => {
    const { preset } = useLayout();
    if (!preset) return null;

    const { Box, Text } = preset;

    const colors = {
        gold: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
        silver: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)',
        purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    };

    const sizes = {
        xs: { padding: '1px 6px', fontSize: 10 },
        sm: { padding: '2px 8px', fontSize: 12 },
        md: { padding: '4px 12px', fontSize: 14 },
    };

    return (
        <Box
            className={className}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: colors[variant],
                color: 'white',
                borderRadius: 4,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                ...sizes[size],
                ...style,
            }}
        >
            <Text size={size} weight={700} style={{ color: 'inherit', lineHeight: 1 }}>
                {label}
            </Text>
        </Box>
    );
};
