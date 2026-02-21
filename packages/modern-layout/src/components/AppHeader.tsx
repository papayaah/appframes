import React from 'react';
import { useLayout } from '../context/LayoutContext';

export interface AppHeaderProps {
    /** Primary slot (Logo / App Switcher) */
    primary?: React.ReactNode;
    /** Secondary slot (Breadcrumbs / Title) */
    secondary?: React.ReactNode;
    /** Center slot (Search / Tools) */
    center?: React.ReactNode;
    /** Actions slot (User Profile / Export) */
    actions?: React.ReactNode;
    /** Custom height (default: 45) */
    height?: number | string;
    /** Custom class name */
    className?: string;
    /** Custom style */
    style?: React.CSSProperties;
    /** Optional ID for testing or targeting */
    id?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
    primary,
    secondary,
    center,
    actions,
    height = 45,
    className,
    style,
    id,
}) => {
    const { preset, isMobile } = useLayout();
    const { Header, Box } = preset!;

    return (
        <Header height={height} className={className} style={{ position: 'relative', ...style }} id={id}>
            <Box style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: isMobile ? '0 4px' : '0'
            }}>
                {/* Left Section */}
                <Box style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flexShrink: 0 }}>
                    {primary}
                    {!isMobile && secondary && (
                        <>
                            <Box style={{ width: 1, height: 20, backgroundColor: '#eee' }} />
                            {secondary}
                        </>
                    )}
                </Box>

                {/* Center Section - Hidden on mobile to prevent overlaps */}
                {!isMobile && center && (
                    <Box style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                        {center}
                    </Box>
                )}

                {/* Right Section */}
                <Box style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 12, flexShrink: 0 }}>
                    {actions}
                </Box>
            </Box>
        </Header>
    );
};
