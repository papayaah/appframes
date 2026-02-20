import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLayout } from '../context/LayoutContext';

export interface TipItem {
    /** Unique identifier for the tip content */
    id: string;
    /** Title text */
    title: string;
    /** Description text */
    description: string;
    /** Optional animation data or identifier */
    animation?: any;
}

export interface FeatureTipProps {
    /** Whether to show the tip */
    isOpen: boolean;
    /** Called when dismissed */
    onClose: () => void;
    /** Array of tip pages */
    tips: TipItem[];
    /** Position relative to anchor */
    position?: 'top' | 'bottom' | 'left' | 'right';
    /** Anchor element ref */
    anchorRef?: React.RefObject<HTMLElement | null>;
    /** Optional function to render the animation/media slot */
    renderAnimation?: (tip: TipItem, phase: 'reveal' | 'pause' | 'loop', onComplete: () => void) => React.ReactNode;
    /** Pause duration in ms between loop cycles (default: 1500) */
    loopPause?: number;
    /** Z-index override */
    zIndex?: number;
}

export const FeatureTip: React.FC<FeatureTipProps> = ({
    isOpen,
    onClose,
    tips,
    position = 'right',
    anchorRef,
    renderAnimation,
    loopPause = 1500,
    zIndex = 1000,
}) => {
    const { preset } = useLayout();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [phase, setPhase] = useState<'reveal' | 'pause' | 'loop'>('reveal');
    const [posStyle, setPosStyle] = useState<React.CSSProperties>({});
    const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { Box, Text, Button, IconButton } = preset!;

    const handleAnimationComplete = useCallback(() => {
        setPhase('pause');
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = setTimeout(() => {
            setPhase('loop');
        }, loopPause);
    }, [loopPause]);

    const currentTip = tips[currentIndex];
    const isLastTip = currentIndex === tips.length - 1;

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
            setPhase('reveal');
        }
    }, [isOpen]);

    // Update position
    useEffect(() => {
        if (!isOpen || !anchorRef?.current) return;

        const updatePosition = () => {
            const anchor = anchorRef.current;
            if (!anchor) return;
            const rect = anchor.getBoundingClientRect();
            const style: React.CSSProperties = { position: 'fixed', zIndex };

            switch (position) {
                case 'right':
                    style.left = rect.right + 12;
                    style.top = rect.top + rect.height / 2;
                    style.transform = 'translateY(-50%)';
                    break;
                case 'left':
                    style.right = window.innerWidth - rect.left + 12;
                    style.top = rect.top + rect.height / 2;
                    style.transform = 'translateY(-50%)';
                    break;
                case 'top':
                    style.left = rect.left + rect.width / 2;
                    style.bottom = window.innerHeight - rect.top + 12;
                    style.transform = 'translateX(-50%)';
                    break;
                case 'bottom':
                    style.left = rect.left + rect.width / 2;
                    style.top = rect.bottom + 12;
                    style.transform = 'translateX(-50%)';
                    break;
            }

            setPosStyle(style);
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, anchorRef, position, zIndex]);

    const handleNext = () => {
        if (isLastTip) {
            onClose();
        } else {
            setCurrentIndex((i) => i + 1);
            setPhase('reveal');
        }
    };

    if (!isOpen || !currentTip) return null;

    return (
        <Box
            style={{
                ...posStyle,
                width: 280,
                backgroundColor: 'white',
                borderRadius: 12,
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
            }}
        >
            <Box style={{ position: 'absolute', top: 8, right: 8 }}>
                <IconButton
                    icon={<span>×</span>}
                    size="sm"
                    onClick={onClose}
                    aria-label="Dismiss"
                />
            </Box>

            {renderAnimation && (
                <Box style={{ height: 160, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {renderAnimation(currentTip, phase, handleAnimationComplete)}
                </Box>
            )}

            <Box style={{ textAlign: 'center' }}>
                <Text bold size="md">{currentTip.title}</Text>
                <Text size="sm" color="#666" style={{ marginTop: 4 }}>
                    {currentTip.description}
                </Text>
            </Box>

            {tips.length > 1 && (
                <Box style={{ display: 'flex', gap: 6 }}>
                    {tips.map((_, i) => (
                        <Box
                            key={i}
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: i === currentIndex ? '#667eea' : '#dee2e6',
                            }}
                        />
                    ))}
                </Box>
            )}

            <Box style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'center' }}>
                {currentIndex > 0 && (
                    <Button variant="secondary" size="sm" onClick={() => setCurrentIndex((i) => i - 1)}>
                        Back
                    </Button>
                )}
                <Button variant="primary" size="sm" onClick={handleNext}>
                    {isLastTip ? 'Got it' : 'Next'}
                </Button>
            </Box>
        </Box>
    );
};
