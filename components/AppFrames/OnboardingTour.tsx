'use client';

import { useEffect, useState, useRef } from 'react';
import { Box, Text, Button, Paper, Group, Stack, Portal, Transition, ThemeIcon } from '@mantine/core';
import { IconArrowRight, IconCheck, IconSearch, IconX } from '@tabler/icons-react';
import { useAppStore } from '@/stores/useAppStore';

interface TourStep {
    targetId: string;
    title: string;
    content: string;
    position: 'right' | 'left' | 'top' | 'bottom';
}

const TOUR_STEPS: TourStep[] = [
    {
        targetId: 'tab-layout',
        title: 'Manage Your Screens',
        content: 'Open the Layout panel to add, remove, or organize multiple screens for different device sizes.',
        position: 'right',
    },
    {
        targetId: 'btn-add-screen',
        title: 'Add a New Canvas',
        content: 'Click here to create a new blank screen. You can have different devices on the same background!',
        position: 'top',
    },
    {
        targetId: 'tab-device',
        title: 'Choose a Frame',
        content: 'Switch to the Frame tab to select from our huge library of realistic device mockups.',
        position: 'right',
    },
    {
        targetId: 'device-iphone-pro',
        title: 'Realistic Mockups',
        content: 'Pick a template like the iPhone Pro. You can customize the bezel and colors too!',
        position: 'right',
    },
    {
        targetId: 'tab-media',
        title: 'Add Your Artwork',
        content: 'Upload your screenshots here, or simply drag and drop them directly onto any device frame.',
        position: 'right',
    },
    {
        targetId: 'tab-settings',
        title: 'Fine-Tune Everything',
        content: 'Adjust the zoom, rotation, and position of your images to get that perfect composition.',
        position: 'right',
    },
    {
        targetId: 'control-rotation',
        title: 'Master Rotation',
        content: 'Use this dial to rotate your image inside the frame for a dynamic marketing look.',
        position: 'right',
    },
];

export function OnboardingTour() {
    const { tutorialActive, tutorialStep, setTutorialStep, completeTutorial, stopTutorial } = useAppStore();
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number; } | null>(null);

    const currentStep = TOUR_STEPS[tutorialStep - 1];

    useEffect(() => {
        if (!tutorialActive || !currentStep) return;

        const updateCoords = () => {
            const el = document.getElementById(currentStep.targetId);
            if (el) {
                const rect = el.getBoundingClientRect();
                setCoords({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                });

                // Ensure element is visible (e.g. if it's inside a sidebar that needs opening)
                // Note: For a more advanced tour we could trigger clicks here, but for now
                // we assume the user follows instructions or the panel is already open.
            } else {
                setCoords(null);
            }
        };

        updateCoords();
        const timer = setInterval(updateCoords, 100); // Poll for layout changes
        window.addEventListener('resize', updateCoords);

        return () => {
            clearInterval(timer);
            window.removeEventListener('resize', updateCoords);
        };
    }, [tutorialActive, currentStep]);

    if (!tutorialActive || !currentStep) return null;

    const isLastStep = tutorialStep === TOUR_STEPS.length;

    const handleNext = () => {
        if (isLastStep) {
            completeTutorial();
        } else {
            setTutorialStep(tutorialStep + 1);
        }
    };

    const handleSkip = () => {
        stopTutorial();
    };

    // Tooltip position math
    const getTooltipStyle = () => {
        if (!coords) {
            return {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
            };
        }

        const margin = 16;
        if (currentStep.position === 'right') {
            return {
                top: coords.top + coords.height / 2,
                left: coords.left + coords.width + margin,
                transform: 'translateY(-50%)',
            };
        }
        if (currentStep.position === 'top') {
            return {
                top: coords.top - margin,
                left: coords.left + coords.width / 2,
                transform: 'translate(-50%, -100%)',
            };
        }
        return {};
    };

    return (
        <Portal>
            {coords && (
                <Box
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 10000,
                        pointerEvents: 'none',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        // Spotlight effect using clip-path
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
            )}

            {!coords && (
                <Box
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 10000,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(2px)',
                    }}
                />
            )}

            <Box
                style={{
                    position: 'fixed',
                    pointerEvents: 'auto',
                    zIndex: 10001,
                    ...getTooltipStyle(),
                    transition: 'all 0.3s ease',
                }}
            >
                <Paper
                    shadow="xl"
                    p="md"
                    withBorder
                    style={{
                        width: 300,
                        borderRadius: 12,
                        backgroundColor: 'white',
                    }}
                >
                    <Stack gap="xs">
                        <Group justify="space-between" align="center">
                            <Text fw={700} color="violet.7" size="sm" tt="uppercase">Step {tutorialStep} of {TOUR_STEPS.length}</Text>
                            <Button variant="subtle" color="gray" size="compact-xs" onClick={handleSkip}>
                                <IconX size={14} />
                            </Button>
                        </Group>

                        <Text fw={700} size="md">{currentStep.title}</Text>
                        <Text size="sm" c="dimmed">{currentStep.content}</Text>

                        <Group justify="flex-end" mt="sm">
                            <Button
                                onClick={handleNext}
                                variant="filled"
                                color="violet"
                                size="sm"
                                rightSection={isLastStep ? <IconCheck size={16} /> : <IconArrowRight size={16} />}
                            >
                                {isLastStep ? 'Finish' : 'Next'}
                            </Button>
                        </Group>
                    </Stack>
                </Paper>

                {/* Small arrow pointing to the element */}
                {coords && (
                    <Box
                        style={{
                            position: 'absolute',
                            width: 0,
                            height: 0,
                            borderStyle: 'solid',
                            ...(currentStep.position === 'right' ? {
                                left: -8,
                                top: '50%',
                                marginTop: -8,
                                borderWidth: '8px 8px 8px 0',
                                borderColor: 'transparent white transparent transparent',
                            } : {
                                bottom: -8,
                                left: '50%',
                                marginLeft: -8,
                                borderWidth: '8px 8px 0 8px',
                                borderColor: 'white transparent transparent transparent',
                            })
                        }}
                    />
                )}
            </Box>
        </Portal>
    );
}
