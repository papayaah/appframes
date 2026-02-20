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
}

export const AppHeader: React.FC<AppHeaderProps> = ({
    primary,
    secondary,
    center,
    actions,
    height,
    className,
    style,
}) => {
    const { preset } = useLayout();
    const { Header, Box } = preset!;

    return (
        <Header height={height} className={className} style={style}>
            <Box style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                {/* Left Section */}
                <Box style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {primary}
                    {secondary && (
                        <>
                            <Box style={{ width: 1, height: 20, backgroundColor: '#eee' }} />
                            {secondary}
                        </>
                    )}
                </Box>

                {/* Center Section */}
                <Box style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    {center}
                </Box>

                {/* Right Section */}
                <Box style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {actions}
                </Box>
            </Box>
        </Header>
    );
};
