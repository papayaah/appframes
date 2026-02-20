import React from 'react';
import { useLayout } from '../context/LayoutContext';

export interface AppFooterProps {
    /** Left slot (Status indicators) */
    left?: React.ReactNode;
    /** Center slot (Coordinates / Mini tools) */
    center?: React.ReactNode;
    /** Right slot (Zoom / Preview controls) */
    right?: React.ReactNode;
    /** Custom height (default: 40) */
    height?: number | string;
    /** Custom class name */
    className?: string;
    /** Custom style */
    style?: React.CSSProperties;
}

export const AppFooter: React.FC<AppFooterProps> = ({
    left,
    center,
    right,
    height,
    className,
    style,
}) => {
    const { preset } = useLayout();
    const { Footer, Box } = preset!;

    return (
        <Footer height={height} className={className} style={style}>
            <Box style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                <Box style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {left}
                </Box>

                <Box style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                    {center}
                </Box>

                <Box style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {right}
                </Box>
            </Box>
        </Footer>
    );
};
