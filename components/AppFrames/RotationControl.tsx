'use client';

import { useCallback, useRef, useState } from 'react';
import { Box, Text } from '@mantine/core';

interface RotationControlProps {
    rotation: number;
    onRotationChange: (value: number) => void;
    label?: string;
    size?: number;
}

const KNOB_SIZE = 12;

export function RotationControl({
    rotation,
    onRotationChange,
    label = 'Rotation',
    size = 64,
}: RotationControlProps) {
    const dialRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const getKnobPosition = (angle: number) => {
        const radians = ((angle - 90) * Math.PI) / 180;
        const radius = (size - KNOB_SIZE) / 2;
        return {
            x: Math.cos(radians) * radius + size / 2 - KNOB_SIZE / 2,
            y: Math.sin(radians) * radius + size / 2 - KNOB_SIZE / 2,
        };
    };

    const getAngleFromPosition = (clientX: number, clientY: number) => {
        if (!dialRef.current) return rotation;
        const rect = dialRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = clientX - centerX;
        const dy = clientY - centerY;
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        if (angle < 0) angle += 360;
        return Math.round(angle) % 360;
    };

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        onRotationChange(getAngleFromPosition(e.clientX, e.clientY));
    }, [onRotationChange, rotation]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        onRotationChange(getAngleFromPosition(e.clientX, e.clientY));
    }, [isDragging, onRotationChange]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }, []);

    const knobPos = getKnobPosition(rotation);

    return (
        <Box>
            <Text size="xs" c="dimmed" mb={4} tt="uppercase" ta="center">
                {label}
            </Text>
            <Box
                ref={dialRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    border: '2px solid #e9ecef',
                    backgroundColor: '#f8f9fa',
                    position: 'relative',
                    cursor: 'grab',
                    touchAction: 'none',
                    margin: '0 auto',
                }}
            >
                {/* Center dot */}
                <Box
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: '#adb5bd',
                    }}
                />
                {/* Tick marks at 0, 90, 180, 270 */}
                {[0, 90, 180, 270].map((angle) => {
                    const rad = ((angle - 90) * Math.PI) / 180;
                    const innerR = size / 2 - 8;
                    const outerR = size / 2 - 4;
                    return (
                        <Box
                            key={angle}
                            style={{
                                position: 'absolute',
                                left: Math.cos(rad) * innerR + size / 2,
                                top: Math.sin(rad) * innerR + size / 2,
                                width: outerR - innerR,
                                height: 2,
                                backgroundColor: '#dee2e6',
                                transform: `rotate(${angle}deg)`,
                                transformOrigin: 'left center',
                            }}
                        />
                    );
                })}
                {/* Knob */}
                <Box
                    style={{
                        position: 'absolute',
                        left: knobPos.x,
                        top: knobPos.y,
                        width: KNOB_SIZE,
                        height: KNOB_SIZE,
                        borderRadius: '50%',
                        backgroundColor: '#228be6',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                />
            </Box>
            <Text size="xs" c="dimmed" ta="center" mt={4}>
                {Math.round(rotation)}°
            </Text>
        </Box>
    );
}
