import React from 'react';
import { useLayout } from '../context/LayoutContext';

export interface FloatingToolbarProps {
    children?: React.ReactNode;
    position?: 'top' | 'bottom';
    offset?: number;
    className?: string;
    style?: React.CSSProperties;
    /** Optional ID for testing or targeting */
    id?: string;
    /** Whether the toolbar is visible */
    visible?: boolean;
    /** Item shortcuts (legacy/alternative to children) */
    items?: Array<{
        id: string;
        icon: React.ReactNode;
        label: string;
        onClick?: () => void;
    }>;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
    children,
    position = 'bottom',
    offset = 64,
    className,
    style,
    id,
    visible = true,
    items,
}) => {
    const { preset } = useLayout();
    const { Box, IconButton } = preset!;

    if (!visible) return null;

    return (
        <Box
            className={className}
            id={id}
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
            {items ? items.map(item => (
                <IconButton
                    key={item.id}
                    icon={item.icon}
                    onClick={item.onClick}
                    tooltip={item.label}
                    aria-label={item.label}
                    size="md"
                />
            )) : children}
        </Box>
    );
};
