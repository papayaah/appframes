'use client';

import { memo, useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useFloatingPosition } from '../hooks/useFloatingPosition';
import { useLayout } from '../context/LayoutContext';
import type { FloatingPanelProps } from '../types';

/**
 * Floating Panel Component
 *
 * A draggable, resizable floating panel that can be positioned anywhere on screen.
 * Position and size are persisted to localStorage.
 *
 * Performance optimizations:
 * - Uses rAF for smooth drag/resize
 * - Portal rendering to avoid layout thrashing
 * - will-change hints for GPU acceleration
 * - Memoized to prevent unnecessary re-renders
 *
 * @example
 * ```tsx
 * <FloatingPanel
 *   id="inspector"
 *   isOpen={showInspector}
 *   onClose={() => setShowInspector(false)}
 *   title="Inspector"
 *   initialPosition={{ x: 100, y: 100 }}
 *   initialSize={{ width: 300, height: 400 }}
 * >
 *   <MyInspectorContent />
 * </FloatingPanel>
 * ```
 */
export const FloatingPanel = memo(function FloatingPanel({
    id,
    children,
    isOpen,
    onClose,
    title,
    initialPosition = { x: 100, y: 100 },
    initialSize = { width: 300, height: 400 },
    minSize = { width: 200, height: 150 },
    maxSize = { width: 600, height: 800 },
    draggable = true,
    resizable = true,
    zIndex = 1000,
    className,
}: FloatingPanelProps) {
    const { preset, icons } = useLayout();
    const portalRoot = useRef<HTMLElement | null>(null);

    const {
        position,
        size,
        dragHandlers,
        resizeHandlers,
        isDragging,
        isResizing,
    } = useFloatingPosition({
        id,
        initialPosition,
        initialSize,
        minSize,
        maxSize,
        constrainToViewport: true,
        persist: true,
    });

    // Get portal root
    useEffect(() => {
        if (typeof document !== 'undefined') {
            portalRoot.current = document.body;
        }
    }, []);

    if (!isOpen || !portalRoot.current) return null;

    // Fallback IconButton if no preset
    const IconButton = preset?.IconButton ?? (({ icon, onClick }: { icon: ReactNode; onClick?: () => void }) => (
        <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            {icon}
        </button>
    ));

    const panelContent = (
        <div
            className={className}
            data-export-hide="true"
            style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                backgroundColor: 'var(--mantine-color-body, white)',
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex,
                willChange: isDragging || isResizing ? 'transform, width, height' : 'auto',
                // Disable transitions during drag/resize for smoothness
                transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--mantine-color-gray-3, #dee2e6)',
                    cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    userSelect: 'none',
                }}
                {...(draggable ? dragHandlers : {})}
            >
                <span style={{ fontWeight: 500, fontSize: 14 }}>{title}</span>
                {onClose && (
                    <IconButton
                        icon={typeof icons.close === 'function' ? icons.close({ size: 16 }) : (icons.close ?? '×')}
                        onClick={onClose}
                        aria-label="Close panel"
                        size="sm"
                    />
                )}
            </div>

            {/* Content */}
            <div
                style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: 12,
                }}
            >
                {children}
            </div>

            {/* Resize Handle */}
            {resizable && (
                <div
                    style={{
                        position: 'absolute',
                        right: 0,
                        bottom: 0,
                        width: 16,
                        height: 16,
                        cursor: 'nwse-resize',
                        // Visual indicator
                        background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%)',
                        borderRadius: '0 0 12px 0',
                    }}
                    {...resizeHandlers}
                />
            )}
        </div>
    );

    return createPortal(panelContent, portalRoot.current);
});
