'use client';

import React, { memo, useState } from 'react';
import { useDragToClose } from '../hooks/useDragToClose';
import { useLayout } from '../context/LayoutContext';
import type { NotchHandleProps } from '../types';

/**
 * Notch Handle Component
 *
 * A drag handle that appears at the edge of panels. Users can click to close
 * or drag to close with visual feedback.
 *
 * @example
 * ```tsx
 * <NotchHandle
 *   position="left"
 *   onClick={() => setIsOpen(false)}
 *   onDragEnd={(delta) => {
 *     if (Math.abs(delta) > 60) setIsOpen(false);
 *   }}
 * />
 * ```
 */
export const NotchHandle = memo(function NotchHandle({
    position,
    onClick,
    className,
}: NotchHandleProps) {
    const { preset } = useLayout();
    const [isHovered, setIsHovered] = useState(false);

    const { isDragging, handlers, dragStyle } = useDragToClose({
        direction: position === 'left' ? 'right' : 'left',
        threshold: 60,
        onClose: onClick ?? (() => {}),
    });

    // Fallback Box if no preset
    const Box = preset?.Box ?? (({ children, style, ...props }: any) => (
        <div style={style} {...props}>{children}</div>
    ));

    const handleStyles: React.CSSProperties = {
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        [position === 'left' ? 'right' : 'left']: -10,
        width: 12,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        borderRadius: position === 'left' ? '0 6px 6px 0' : '6px 0 0 6px',
        backgroundColor: isHovered || isDragging ? '#667eea' : 'rgba(0, 0, 0, 0.08)',
        transition: isDragging ? 'none' : 'background-color 0.15s',
        zIndex: 10,
        ...dragStyle,
    };

    const gripLineStyles: React.CSSProperties = {
        width: 3,
        height: 16,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    };

    const lineStyle: React.CSSProperties = {
        width: '100%',
        height: 2,
        borderRadius: 1,
        backgroundColor: isHovered || isDragging ? 'white' : 'rgba(0, 0, 0, 0.3)',
        transition: isDragging ? 'none' : 'background-color 0.15s',
    };

    return (
        <Box
            className={className}
            style={handleStyles}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e: React.MouseEvent) => {
                // Only trigger click if not dragging
                if (!isDragging) {
                    e.stopPropagation();
                    onClick?.();
                }
            }}
            {...handlers}
        >
            <div style={gripLineStyles}>
                <div style={lineStyle} />
                <div style={lineStyle} />
                <div style={lineStyle} />
            </div>
        </Box>
    );
});
