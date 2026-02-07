'use client';

import { memo } from 'react';
import { useLayout } from '../context/LayoutContext';
import { NotchHandle } from './NotchHandle';
import type { PanelProps } from '../types';

/**
 * Settings Panel Component
 *
 * A slide-out panel that overlays the main content. Typically used for
 * settings, properties, or details panels on the right side.
 *
 * Features:
 * - Slide-in animation
 * - Notch handle for drag-to-close
 * - Responsive: drawer on mobile
 *
 * @example
 * ```tsx
 * <SettingsPanel
 *   isOpen={showSettings}
 *   onClose={() => setShowSettings(false)}
 *   title="Frame Settings"
 * >
 *   <MySettingsContent />
 * </SettingsPanel>
 * ```
 */
export const SettingsPanel = memo(function SettingsPanel({
    children,
    isOpen,
    onClose,
    title,
    width = 320,
    position = 'right',
    showNotch = true,
    className,
    style,
}: PanelProps) {
    const { preset, isMobile } = useLayout();

    // On mobile, use drawer instead
    if (isMobile && preset?.Drawer) {
        return (
            <preset.Drawer
                isOpen={isOpen}
                onClose={onClose ?? (() => {})}
                position="bottom"
                size="70%"
                title={title}
            >
                {children}
            </preset.Drawer>
        );
    }

    if (!isOpen) return null;

    // Fallback Box if no preset
    const Box = preset?.Box ?? (({ children, style, ...props }: any) => (
        <div style={style} {...props}>{children}</div>
    ));

    const ScrollArea = preset?.ScrollArea ?? (({ children, style }: any) => (
        <div style={{ overflow: 'auto', ...style }}>{children}</div>
    ));

    const panelWidth = typeof width === 'number' ? `${width}px` : width;

    return (
        <Box
            className={className}
            data-export-hide="true"
            style={{
                position: 'absolute',
                top: 0,
                [position]: 0,
                width: panelWidth,
                height: '100%',
                backgroundColor: 'var(--mantine-color-body, white)',
                boxShadow: position === 'right'
                    ? '-4px 0 12px rgba(0, 0, 0, 0.08)'
                    : '4px 0 12px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 100,
                // Animation
                animation: 'slideIn 0.2s ease-out',
                ...style,
            }}
        >
            {/* Notch Handle */}
            {showNotch && onClose && (
                <NotchHandle
                    position={position === 'right' ? 'left' : 'right'}
                    onClick={onClose}
                />
            )}

            {/* Header */}
            {title && (
                <Box
                    style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--mantine-color-gray-3, #dee2e6)',
                        fontWeight: 500,
                        fontSize: 14,
                    }}
                >
                    {title}
                </Box>
            )}

            {/* Content */}
            <ScrollArea
                style={{
                    flex: 1,
                    padding: 16,
                }}
            >
                {children}
            </ScrollArea>

            {/* Keyframe animation (injected once) */}
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(${position === 'right' ? '100%' : '-100%'});
                    }
                    to {
                        transform: translateX(0);
                    }
                }
            `}</style>
        </Box>
    );
});
