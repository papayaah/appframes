import { useState, useCallback, useRef, useEffect, CSSProperties } from 'react';
import type { UseDragToCloseOptions, UseDragToCloseReturn } from '../types';

/**
 * Hook for implementing drag-to-close behavior on panel edges.
 *
 * Features:
 * - Smooth drag tracking with rAF optimization
 * - Configurable threshold for close trigger
 * - Progress callback for visual feedback
 * - Touch support for mobile
 *
 * @example
 * ```tsx
 * const { isDragging, dragStyle, handlers } = useDragToClose({
 *   direction: 'left',
 *   threshold: 60,
 *   onClose: () => setIsOpen(false),
 * });
 *
 * <div
 *   style={{ ...baseStyle, ...dragStyle }}
 *   {...handlers}
 * />
 * ```
 */
export function useDragToClose(options: UseDragToCloseOptions): UseDragToCloseReturn {
    const { direction, threshold = 60, onClose, onDragProgress } = options;

    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);

    const startPosRef = useRef<{ x: number; y: number } | null>(null);
    const rafRef = useRef<number | null>(null);
    const pendingOffsetRef = useRef<number>(0);

    // Determine which axis to track based on direction
    const isHorizontal = direction === 'left' || direction === 'right';
    const isPositive = direction === 'right' || direction === 'down';

    const scheduleUpdate = useCallback(() => {
        if (rafRef.current !== null) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            setDragOffset(pendingOffsetRef.current);

            // Calculate progress (0-1) based on threshold
            if (onDragProgress) {
                const progress = Math.min(1, Math.abs(pendingOffsetRef.current) / threshold);
                onDragProgress(progress);
            }
        });
    }, [threshold, onDragProgress]);

    const handleMove = useCallback((clientX: number, clientY: number) => {
        if (!startPosRef.current) return;

        const delta = isHorizontal
            ? clientX - startPosRef.current.x
            : clientY - startPosRef.current.y;

        // Only allow drag in the specified direction
        const constrainedDelta = isPositive
            ? Math.max(0, delta)
            : Math.min(0, delta);

        pendingOffsetRef.current = constrainedDelta;
        scheduleUpdate();
    }, [isHorizontal, isPositive, scheduleUpdate]);

    const handleEnd = useCallback(() => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }

        const finalOffset = Math.abs(pendingOffsetRef.current);
        const shouldClose = finalOffset >= threshold;

        setIsDragging(false);
        setDragOffset(0);
        pendingOffsetRef.current = 0;
        startPosRef.current = null;

        if (shouldClose) {
            onClose();
        }
    }, [threshold, onClose]);

    // Mouse event handlers
    const onMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        startPosRef.current = { x: e.clientX, y: e.clientY };
        setIsDragging(true);

        const onMouseMove = (moveEvent: MouseEvent) => {
            handleMove(moveEvent.clientX, moveEvent.clientY);
        };

        const onMouseUp = () => {
            handleEnd();
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [handleMove, handleEnd]);

    // Touch event handlers
    const onTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        startPosRef.current = { x: touch.clientX, y: touch.clientY };
        setIsDragging(true);

        const onTouchMove = (moveEvent: TouchEvent) => {
            const touch = moveEvent.touches[0];
            handleMove(touch.clientX, touch.clientY);
        };

        const onTouchEnd = () => {
            handleEnd();
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        };

        document.addEventListener('touchmove', onTouchMove, { passive: true });
        document.addEventListener('touchend', onTouchEnd);
    }, [handleMove, handleEnd]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    // Generate transform style based on drag offset
    const dragStyle: CSSProperties = isDragging
        ? {
            transform: isHorizontal
                ? `translateX(${dragOffset}px)`
                : `translateY(${dragOffset}px)`,
            transition: 'none',
            willChange: 'transform',
        }
        : {
            transition: 'transform 0.2s ease',
        };

    return {
        isDragging,
        dragOffset,
        handlers: {
            onMouseDown,
            onTouchStart,
        },
        dragStyle,
    };
}
