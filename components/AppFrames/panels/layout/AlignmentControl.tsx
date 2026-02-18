
import { useState, useRef, useCallback } from 'react';
import { Box, Text } from '@mantine/core';

// Visual 3×3 alignment trackpad — drag the knob or click anywhere to set position.
// Snaps to nearest grid position (top/center/bottom × left/center/right).
const ALIGN_PAD = 90;
const ALIGN_KNOB = 16;
const ALIGN_DOT = 6;
const ALIGN_INSET = 10; // padding so knob doesn't clip at edges

const vMap: ('top' | 'center' | 'bottom')[] = ['top', 'center', 'bottom'];
const hMap: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];

function alignToXY(h: 'left' | 'center' | 'right', v: 'top' | 'center' | 'bottom') {
    const x = h === 'left' ? ALIGN_INSET : h === 'right' ? ALIGN_PAD - ALIGN_INSET : ALIGN_PAD / 2;
    const y = v === 'top' ? ALIGN_INSET : v === 'bottom' ? ALIGN_PAD - ALIGN_INSET : ALIGN_PAD / 2;
    return { x, y };
}

function snapToGrid(clientX: number, clientY: number, rect: DOMRect) {
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;
    // Map to 0-2 grid index based on thirds
    const col = Math.max(0, Math.min(2, Math.round(((relX / ALIGN_PAD) * 2))));
    const row = Math.max(0, Math.min(2, Math.round(((relY / ALIGN_PAD) * 2))));
    return { h: hMap[col], v: vMap[row] };
}

export function AlignmentControl({
    vertical,
    horizontal,
    onVerticalChange,
    onHorizontalChange,
}: {
    vertical: 'top' | 'center' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
    onVerticalChange: (v: 'top' | 'center' | 'bottom') => void;
    onHorizontalChange: (h: 'left' | 'center' | 'right') => void;
}) {
    const padRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const applySnap = useCallback((clientX: number, clientY: number) => {
        if (!padRef.current) return;
        const { h, v } = snapToGrid(clientX, clientY, padRef.current.getBoundingClientRect());
        if (h !== horizontal) onHorizontalChange(h);
        if (v !== vertical) onVerticalChange(v);
    }, [horizontal, vertical, onHorizontalChange, onVerticalChange]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        setIsDragging(true);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        applySnap(e.clientX, e.clientY);
    }, [applySnap]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        applySnap(e.clientX, e.clientY);
    }, [isDragging, applySnap]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        setIsDragging(false);
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }, []);

    const knobPos = alignToXY(horizontal, vertical);

    return (
        <Box>
            <Text size="xs" c="dimmed" mb={4} tt="uppercase" ta="center">Alignment</Text>
            <Box style={{ display: 'flex', justifyContent: 'center' }}>
                <Box
                    ref={padRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    style={{
                        position: 'relative',
                        width: ALIGN_PAD,
                        height: ALIGN_PAD,
                        borderRadius: 8,
                        border: '2px solid #e9ecef',
                        backgroundColor: '#f8f9fa',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        touchAction: 'none',
                        overflow: 'hidden',
                    }}
                >
                    {/* Grid lines */}
                    <Box style={{ position: 'absolute', top: '50%', left: 8, right: 8, height: 1, backgroundColor: '#dee2e6', pointerEvents: 'none' }} />
                    <Box style={{ position: 'absolute', left: '50%', top: 8, bottom: 8, width: 1, backgroundColor: '#dee2e6', pointerEvents: 'none' }} />

                    {/* 9 anchor dots */}
                    {vMap.map((v) =>
                        hMap.map((h) => {
                            const pos = alignToXY(h, v);
                            const isActive = v === vertical && h === horizontal;
                            if (isActive) return null; // knob covers this
                            return (
                                <Box
                                    key={`${v}-${h}`}
                                    style={{
                                        position: 'absolute',
                                        left: pos.x - ALIGN_DOT / 2,
                                        top: pos.y - ALIGN_DOT / 2,
                                        width: ALIGN_DOT,
                                        height: ALIGN_DOT,
                                        borderRadius: '50%',
                                        backgroundColor: '#ced4da',
                                        pointerEvents: 'none',
                                    }}
                                />
                            );
                        })
                    )}

                    {/* Draggable knob */}
                    <Box
                        style={{
                            position: 'absolute',
                            left: knobPos.x - ALIGN_KNOB / 2,
                            top: knobPos.y - ALIGN_KNOB / 2,
                            width: ALIGN_KNOB,
                            height: ALIGN_KNOB,
                            borderRadius: '50%',
                            backgroundColor: '#667eea',
                            boxShadow: '0 2px 6px rgba(102,126,234,0.4)',
                            transition: isDragging ? 'none' : 'all 0.15s ease-out',
                            pointerEvents: 'none',
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
}
