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
    Modal: ({ children, isOpen, onClose, title, size = 500, centered = true }) => {
        if (!isOpen) return null;
        return (
            <>
                <div
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 1999,
                    }}
                />
                <div
                    style={{
                        position: 'fixed',
                        top: centered ? '50%' : '10%',
                        left: '50%',
                        transform: 'translateX(-50%)' + (centered ? ' translateY(-50%)' : ''),
                        width: typeof size === 'number' ? size : size,
                        maxHeight: '80vh',
                        backgroundColor: 'white',
                        borderRadius: 8,
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                        zIndex: 2000,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {title && (
                        <div style={{ padding: 16, borderBottom: '1px solid #e9ecef', fontWeight: 600 }}>
                            {title}
                        </div>
                    )}
                    <div style={{ padding: 16, overflow: 'auto' }}>
                        {children}
                    </div>
                </div>
            </>
        );
    },

    Skeleton: ({ width = '100%', height = 20, circle, radius = 4, animate = true }) => (
        <div
            style={{
                width: width,
                height: height,
                borderRadius: circle ? '50%' : radius,
                backgroundColor: '#e9ecef',
                animation: animate ? 'pulse 1.5s infinite ease-in-out' : 'none',
            }}
        />
    ),

    Overlay: ({ color = 'rgba(0,0,0,0.5)', opacity, blur, zIndex = 100, onClick, children }) => (
        <div
            onClick={onClick}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: color,
                opacity: opacity,
                backdropFilter: blur ? `blur(${blur}px)` : 'none',
                zIndex: zIndex,
            }}
        >
            {children}
        </div>
    ),

    Input: ({ value, onChange, placeholder, label, type = 'text', disabled }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {label && <label style={{ fontSize: 13, fontWeight: 500 }}>{label}</label>}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #dee2e6',
                    fontSize: 14,
                }}
            />
        </div>
    ),

    Header: ({ children, height = 45, fixed = true, border = true }) => (
        <header
            style={{
                height,
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                backgroundColor: 'white',
                borderBottom: border ? '1px solid #e9ecef' : 'none',
                position: fixed ? 'sticky' : 'relative',
                top: 0,
                zIndex: 10,
            }}
        >
            {children}
        </header>
    ),

    Footer: ({ children, height = 40, fixed = true, border = true }) => (
        <footer
            style={{
                height,
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                backgroundColor: 'white',
                borderTop: border ? '1px solid #e9ecef' : 'none',
                position: fixed ? 'fixed' : 'relative',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 10,
            }}
        >
            {children}
        </footer>
    ),

    Text: ({ children, size = 'md', weight, bold, color, align, className, style, transform, lineHeight }) => {
        const sizeMap = {
            xs: 12,
            sm: 14,
            md: 16,
            lg: 18,
            xl: 20,
        };

        return (
            <div
                className={className}
                style={{
                    fontSize: sizeMap[size],
                    fontWeight: bold ? 700 : weight,
                    color: color || 'inherit',
                    textAlign: align,
                    textTransform: transform,
                    lineHeight: lineHeight,
                    ...style,
                }}
            >
                {children}
            </div>
        );
    },

    Button: ({ children, onClick, variant = 'primary', size = 'md', disabled, loading, fullWidth, leftSection, rightSection, className, style, type = 'button' }) => {
        const variantStyles: Record<string, React.CSSProperties> = {
            primary: { backgroundColor: '#667eea', color: 'white' },
            secondary: { backgroundColor: '#e9ecef', color: '#495057' },
            danger: { backgroundColor: '#f03e3e', color: 'white' },
            light: { backgroundColor: 'rgba(102, 126, 234, 0.1)', color: '#667eea' },
            subtle: { backgroundColor: 'transparent', color: '#667eea' },
        };

        const sizeStyles: Record<string, React.CSSProperties> = {
            xs: { padding: '4px 8px', fontSize: 12 },
            sm: { padding: '6px 12px', fontSize: 13 },
            md: { padding: '8px 16px', fontSize: 14 },
            lg: { padding: '10px 20px', fontSize: 16 },
        };

        return (
            <button
                type={type}
                onClick={onClick}
                disabled={disabled || loading}
                className={className}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderRadius: 6,
                    border: 'none',
                    cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
                    width: fullWidth ? '100%' : 'auto',
                    opacity: (disabled || loading) ? 0.6 : 1,
                    transition: 'all 0.15s',
                    ...variantStyles[variant],
                    ...sizeStyles[size],
                    ...style,
                }}
            >
                {loading ? '...' : (
                    <>
                        {leftSection}
                        {children}
                        {rightSection}
                    </>
                )}
            </button>
        );
    },
};
