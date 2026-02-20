import React, { useEffect, useState } from 'react';
import { useLayout } from '../../context/LayoutContext';
import { TourStep } from './TourProvider';

interface TourTooltipProps {
    step: TourStep;
    currentStepIndex: number;
    totalSteps: number;
    onNext: () => void;
    onPrev?: () => void;
    onClose: () => void;
    isLastStep: boolean;
    isActive: boolean;
    zIndex?: number;
}

export const TourTooltip: React.FC<TourTooltipProps> = ({
    step,
    currentStepIndex,
    totalSteps,
    onNext,
    onPrev,
    onClose,
    isLastStep,
    isActive,
    zIndex = 10001,
}) => {
    const { preset } = useLayout();
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number; } | null>(null);

    const { Box, Text, Button, IconButton } = preset!;

    useEffect(() => {
        if (!isActive || !step.targetId) return;

        const updateCoords = () => {
            const el = document.getElementById(step.targetId);
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
    }, [isActive, step.targetId]);

    const getTooltipStyle = (): React.CSSProperties => {
        if (!coords) {
            return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
            };
        }

        const margin = 16;
        const style: React.CSSProperties = { position: 'fixed', zIndex, transition: 'all 0.3s ease' };

        switch (step.position) {
            case 'right':
                style.top = coords.top + coords.height / 2;
                style.left = coords.left + coords.width + margin;
                style.transform = 'translateY(-50%)';
                break;
            case 'left':
                style.top = coords.top + coords.height / 2;
                style.left = coords.left - margin;
                style.transform = 'translate(-100%, -50%)';
                break;
            case 'top':
                style.top = coords.top - margin;
                style.left = coords.left + coords.width / 2;
                style.transform = 'translate(-50%, -100%)';
                break;
            case 'bottom':
                style.top = coords.top + coords.height + margin;
                style.left = coords.left + coords.width / 2;
                style.transform = 'translate(-50%, 0)';
                break;
        }

        return style;
    };

    if (!isActive) return null;

    return (
        <Box style={getTooltipStyle()}>
            <Box
                style={{
                    width: 300,
                    borderRadius: 12,
                    backgroundColor: 'white',
                    padding: 16,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    position: 'relative',
                }}
            >
                <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text size="xs" bold color="#667eea" transform="uppercase">
                        Step {currentStepIndex + 1} of {totalSteps}
                    </Text>
                    <IconButton icon={<span>×</span>} size="sm" onClick={onClose} aria-label="Skip" />
                </Box>

                <Box>
                    <Text bold size="md">{step.title}</Text>
                    <Text size="sm" color="#666" style={{ marginTop: 4 }}>
                        {step.content}
                    </Text>
                </Box>

                <Box style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                    {onPrev && currentStepIndex > 0 && (
                        <Button variant="secondary" size="sm" onClick={onPrev}>
                            Back
                        </Button>
                    )}
                    <Button variant="primary" size="sm" onClick={onNext}>
                        {isLastStep ? 'Finish' : 'Next'}
                    </Button>
                </Box>

                {coords && (
                    <Box
                        style={{
                            position: 'absolute',
                            width: 0,
                            height: 0,
                            borderStyle: 'solid',
                            ...(step.position === 'right' ? {
                                left: -8,
                                top: '50%',
                                marginTop: -8,
                                borderWidth: '8px 8px 8px 0',
                                borderColor: 'transparent white transparent transparent',
                            } : step.position === 'top' ? {
                                bottom: -8,
                                left: '50%',
                                marginLeft: -8,
                                borderWidth: '8px 8px 0 8px',
                                borderColor: 'white transparent transparent transparent',
                            } : step.position === 'bottom' ? {
                                top: -8,
                                left: '50%',
                                marginLeft: -8,
                                borderWidth: '0 8px 8px 8px',
                                borderColor: 'transparent transparent white transparent',
                            } : {
                                right: -8,
                                top: '50%',
                                marginTop: -8,
                                borderWidth: '8px 0 8px 8px',
                                borderColor: 'transparent transparent transparent white',
                            })
                        }}
                    />
                )}
            </Box>
        </Box>
    );
};
