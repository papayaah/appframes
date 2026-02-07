import React from 'react';
import type { LayoutComponentPreset } from '../types';

/**
 * Default Headless Preset
 *
 * Minimal implementations using plain HTML elements.
 * Use this as a starting point to build your own preset.
 */
export const defaultPreset: LayoutComponentPreset = {
    Box: ({ children, className, style, onClick, onMouseEnter, onMouseLeave, onMouseDown, ref, ...props }) => (
        <div
            ref={ref as React.Ref<HTMLDivElement>}
            className={className}
            style={style}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onMouseDown={onMouseDown}
            {...props}
        >
            {children}
        </div>
    ),

    IconButton: ({ icon, onClick, isActive, disabled, size = 'md', tooltip, className, 'aria-label': ariaLabel }) => {
        const sizeMap = { sm: 32, md: 40, lg: 48 };
        const buttonSize = sizeMap[size];

        return (
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                aria-label={ariaLabel || tooltip}
                title={tooltip}
                className={className}
                style={{
                    width: buttonSize,
                    height: buttonSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    borderRadius: 8,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    backgroundColor: isActive ? 'rgba(102, 126, 234, 0.15)' : 'transparent',
                    color: isActive ? '#667eea' : 'inherit',
                    opacity: disabled ? 0.5 : 1,
                    transition: 'background-color 0.15s, color 0.15s',
                }}
            >
                {icon}
            </button>
        );
    },

    Tooltip: ({ children, label, disabled }) => {
        // Simple title-based tooltip for default preset
        if (disabled) return <>{children}</>;
        return (
            <span title={label}>
                {children}
            </span>
        );
    },

    Drawer: ({ children, isOpen, onClose, position = 'right', size = 320, title, withOverlay = true, closeOnClickOutside = true }) => {
        if (!isOpen) return null;

        const positionStyles: Record<string, React.CSSProperties> = {
            left: { left: 0, top: 0, bottom: 0, width: typeof size === 'number' ? size : size },
            right: { right: 0, top: 0, bottom: 0, width: typeof size === 'number' ? size : size },
            bottom: { left: 0, right: 0, bottom: 0, height: typeof size === 'number' ? size : size },
        };

        return (
            <>
                {withOverlay && (
                    <div
                        onClick={closeOnClickOutside ? onClose : undefined}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 999,
                        }}
                    />
                )}
                <div
                    style={{
                        position: 'fixed',
                        ...positionStyles[position],
                        backgroundColor: 'white',
                        boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {title && (
                        <div style={{ padding: 16, borderBottom: '1px solid #e9ecef', fontWeight: 500 }}>
                            {title}
                        </div>
                    )}
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        {children}
                    </div>
                </div>
            </>
        );
    },

    Divider: ({ orientation = 'horizontal', className }) => (
        <hr
            className={className}
            style={{
                border: 'none',
                backgroundColor: '#e9ecef',
                margin: orientation === 'horizontal' ? '8px 0' : '0 8px',
                ...(orientation === 'horizontal'
                    ? { height: 1, width: '100%' }
                    : { width: 1, height: '100%' }),
            }}
        />
    ),

    Badge: ({ children, variant = 'default', size = 'sm', className }) => {
        const variantStyles: Record<string, React.CSSProperties> = {
            default: { backgroundColor: '#e9ecef', color: '#495057' },
            primary: { backgroundColor: '#667eea', color: 'white' },
            secondary: { backgroundColor: 'transparent', color: '#667eea', border: '1px solid #667eea' },
        };

        const sizeStyles: Record<string, React.CSSProperties> = {
            sm: { fontSize: 10, padding: '2px 6px' },
            md: { fontSize: 12, padding: '4px 8px' },
        };

        return (
            <span
                className={className}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 999,
                    fontWeight: 500,
                    ...variantStyles[variant],
                    ...sizeStyles[size],
                }}
            >
                {children}
            </span>
        );
    },

    ScrollArea: ({ children, maxHeight, className, style }) => (
        <div
            className={className}
            style={{
                overflow: 'auto',
                maxHeight,
                ...style,
            }}
        >
            {children}
        </div>
    ),
};
