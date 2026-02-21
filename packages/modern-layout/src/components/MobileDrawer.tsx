'use client';

import { memo, ReactNode } from 'react';
import { useLayout } from '../context/LayoutContext';

export interface MobileDrawerProps {
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    height?: string | number;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Mobile Drawer (Bottom Sheet)
 *
 * A specialized drawer for mobile that slides up from the bottom.
 * Includes a "Notch" or handle at the top for a native look and feel.
 */
export const MobileDrawer = memo(function MobileDrawer({
    children,
    isOpen,
    onClose,
    title,
    height = '70%',
    className,
    style,
}: MobileDrawerProps) {
    const { preset } = useLayout();

    if (!preset) return null;
    const { Drawer, Box, Text } = preset;

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            position="bottom"
            size={height}
            title={undefined} // We render our own header for more control
            className={className}
        >
            <Box
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    backgroundColor: 'var(--mantine-color-body, #fff)',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    overflow: 'hidden',
                    ...style,
                }}
            >
                {/* Native-style Grab Handle */}
                <Box
                    style={{
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                    }}
                    onClick={onClose}
                    onMouseEnter={(e: any) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'}
                    onMouseLeave={(e: any) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <Box
                        style={{
                            width: 40,
                            height: 5,
                            backgroundColor: 'var(--mantine-color-gray-3, #dee2e6)',
                            borderRadius: 10,
                            transition: 'transform 0.2s ease, background-color 0.2s ease',
                        }}
                        className="handle-bar"
                    />
                </Box>

                <style>{`
                    [onClick]:hover .handle-bar {
                        background-color: var(--mantine-color-gray-5, #adb5bd);
                        transform: scaleX(1.1);
                    }
                `}</style>

                {title && (
                    <Box
                        style={{
                            padding: '0 20px 12px 20px',
                            borderBottom: '1px solid var(--mantine-color-gray-1, #f1f3f5)',
                        }}
                    >
                        <Text weight={700} size="lg">{title}</Text>
                    </Box>
                )}

                <Box
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: 20,
                    }}
                >
                    {children}
                </Box>
            </Box>
        </Drawer>
    );
});
