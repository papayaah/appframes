import React from 'react';
import { useLayout } from '../context/LayoutContext';

export interface FloatingToolbarProps {
    children: React.ReactNode;
    position?: 'top' | 'bottom';
    offset?: number;
    className?: string;
    style?: React.CSSProperties;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
    children,
    position = 'bottom',
    offset = 24,
    className,
    style,
}) => {
    const { preset } = useLayout();
    const { Box } = preset!;

    return (
        <Box
            className={className}
            style={{
                position: 'fixed',
                [position]: offset,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 100,
                backgroundColor: 'white',
                borderRadius: 100,
                padding: '6px 12px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e9ecef',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                pointerEvents: 'auto',
                ...style,
            }}
        >
            {children}
        </Box>
    );
};
