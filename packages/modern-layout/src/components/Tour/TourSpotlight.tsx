import React, { useEffect, useState } from 'react';
import { useLayout } from '../../context/LayoutContext';

interface TourSpotlightProps {
    targetId: string;
    isActive: boolean;
    zIndex?: number;
}

export const TourSpotlight: React.FC<TourSpotlightProps> = ({
    targetId,
    isActive,
    zIndex = 10000,
}) => {
    const { preset } = useLayout();
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number; } | null>(null);

    const { Box, Overlay } = preset!;

    useEffect(() => {
        if (!isActive || !targetId) return;

        const updateCoords = () => {
            const el = document.getElementById(targetId);
            if (el) {
                const rect = el.getBoundingClientRect();
                setCoords({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                });
            } else {
                setCoords(null);
            }
        };

        updateCoords();
        const timer = setInterval(updateCoords, 100);
        window.addEventListener('resize', updateCoords);

        return () => {
            clearInterval(timer);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isActive, targetId]);

    if (!isActive) return null;

    if (!coords) {
        return <Overlay zIndex={zIndex} opacity={0.6} blur={2} />;
    }

    return (
        <Box
            style={{
                position: 'fixed',
                inset: 0,
                zIndex,
                pointerEvents: 'none',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                clipPath: `polygon(
                    0% 0%, 0% 100%, 
                    ${coords.left}px 100%, 
                    ${coords.left}px ${coords.top}px, 
                    ${coords.left + coords.width}px ${coords.top}px, 
                    ${coords.left + coords.width}px ${coords.top + coords.height}px, 
                    ${coords.left}px ${coords.top + coords.height}px, 
                    ${coords.left}px 100%, 
                    100% 100%, 100% 0%
                )`,
                transition: 'all 0.3s ease',
            }}
        />
    );
};
