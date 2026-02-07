import { useState, useCallback, useRef, useEffect } from 'react';
import type { UseFloatingPositionOptions, UseFloatingPositionReturn } from '../types';

const DEFAULT_MIN_SIZE = { width: 200, height: 150 };
const DEFAULT_MAX_SIZE = { width: 800, height: 600 };

/**
 * Hook for managing floating panel position and size with drag/resize support.
 *
 * Features:
 * - Drag to reposition
 * - Resize from corner
 * - Viewport collision detection
 * - localStorage persistence
 * - rAF optimization for smooth dragging
 *
 * @example
 * ```tsx
 * const floating = useFloatingPosition({
 *   id: 'inspector-panel',
 *   initialPosition: { x: 100, y: 100 },
 *   initialSize: { width: 300, height: 400 },
 * });
 *
 * <div
 *   style={{
 *     position: 'fixed',
 *     left: floating.position.x,
 *     top: floating.position.y,
 *     width: floating.size.width,
 *     height: floating.size.height,
 *   }}
 * >
 *   <div {...floating.dragHandlers}>Drag Header</div>
 *   <div {...floating.resizeHandlers}>Resize Handle</div>
 * </div>
 * ```
 */
export function useFloatingPosition(options: UseFloatingPositionOptions): UseFloatingPositionReturn {
    const {
        id,
        initialPosition = { x: 100, y: 100 },
        initialSize = { width: 300, height: 400 },
        minSize = DEFAULT_MIN_SIZE,
        maxSize = DEFAULT_MAX_SIZE,
        constrainToViewport = true,
        persist = true,
    } = options;

    const storageKey = `modern-layout-floating-${id}`;

    // Load from storage or use initial values
    const getInitialState = useCallback(() => {
        if (persist && typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    return JSON.parse(stored);
                }
            } catch {
                // Ignore storage errors
            }
        }
        return { position: initialPosition, size: initialSize };
    }, [storageKey, initialPosition, initialSize, persist]);

    const initial = getInitialState();
    const [position, setPositionState] = useState(initial.position);
    const [size, setSizeState] = useState(initial.size);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    const rafRef = useRef<number | null>(null);
    const pendingPosRef = useRef(position);
    const pendingSizeRef = useRef(size);

    // Persist changes
    useEffect(() => {
        if (persist && typeof window !== 'undefined') {
            try {
                localStorage.setItem(storageKey, JSON.stringify({ position, size }));
            } catch {
                // Ignore storage errors
            }
        }
    }, [position, size, storageKey, persist]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    const constrainPosition = useCallback((pos: { x: number; y: number }) => {
        if (!constrainToViewport || typeof window === 'undefined') return pos;

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        return {
            x: Math.max(0, Math.min(pos.x, vw - size.width)),
            y: Math.max(0, Math.min(pos.y, vh - size.height)),
        };
    }, [constrainToViewport, size]);

    const constrainSize = useCallback((s: { width: number; height: number }) => {
        return {
            width: Math.max(minSize.width, Math.min(maxSize.width, s.width)),
            height: Math.max(minSize.height, Math.min(maxSize.height, s.height)),
        };
    }, [minSize, maxSize]);

    const setPosition = useCallback((pos: { x: number; y: number }) => {
        setPositionState(constrainPosition(pos));
    }, [constrainPosition]);

    const setSize = useCallback((s: { width: number; height: number }) => {
        setSizeState(constrainSize(s));
    }, [constrainSize]);

    // Drag handlers
    const onDragMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const startPos = { ...position };

        setIsDragging(true);

        const scheduleUpdate = () => {
            if (rafRef.current !== null) return;
            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null;
                setPositionState(constrainPosition(pendingPosRef.current));
            });
        };

        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            pendingPosRef.current = {
                x: startPos.x + deltaX,
                y: startPos.y + deltaY,
            };
            scheduleUpdate();
        };

        const onMouseUp = () => {
            setIsDragging(false);
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            setPositionState(constrainPosition(pendingPosRef.current));
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [position, constrainPosition]);

    // Resize handlers
    const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const startSize = { ...size };

        setIsResizing(true);

        const scheduleUpdate = () => {
            if (rafRef.current !== null) return;
            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null;
                setSizeState(constrainSize(pendingSizeRef.current));
            });
        };

        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            pendingSizeRef.current = {
                width: startSize.width + deltaX,
                height: startSize.height + deltaY,
            };
            scheduleUpdate();
        };

        const onMouseUp = () => {
            setIsResizing(false);
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            setSizeState(constrainSize(pendingSizeRef.current));
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [size, constrainSize]);

    return {
        position,
        size,
        setPosition,
        setSize,
        dragHandlers: {
            onMouseDown: onDragMouseDown,
        },
        resizeHandlers: {
            onMouseDown: onResizeMouseDown,
        },
        isDragging,
        isResizing,
    };
}
