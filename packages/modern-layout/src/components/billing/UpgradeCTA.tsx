import React from 'react';
import { useLayout } from '../../context/LayoutContext';

export interface UpgradeCTAProps {
    title?: string;
    description?: string;
    buttonLabel?: string;
    onUpgrade?: () => void;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Upgrade CTA Component
 * A stylized card designed to fit into sidebars or secondary panels to promote pro features.
 */
export const UpgradeCTA: React.FC<UpgradeCTAProps> = ({
    title = 'Go Pro',
    description = 'Unlock all frames and unlimited exports.',
    buttonLabel = 'Upgrade Now',
    onUpgrade,
    className,
    style,
}) => {
    const { preset } = useLayout();
    if (!preset) return null;

    const { Box, Text, Button } = preset;

    return (
        <Box
            className={className}
            style={{
                padding: 16,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                border: '1px solid rgba(102, 126, 234, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                ...style,
            }}
        >
            <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text weight={600} size="sm">{title}</Text>
                <Box style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#667eea',
                    animation: 'pulse 2s infinite'
                }} />
            </Box>
            <Text size="xs" color="var(--mantine-color-dimmed)" style={{ lineHeight: 1.4 }}>
                {description}
            </Text>
            <Button
                size="xs"
                variant="light"
                fullWidth
                onClick={onUpgrade}
                style={{ marginTop: 4 }}
            >
                {buttonLabel}
            </Button>

            <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
      `}</style>
        </Box>
    );
};
