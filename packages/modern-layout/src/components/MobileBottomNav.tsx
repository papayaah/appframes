'use client';

import { memo } from 'react';
import { useLayout } from '../context/LayoutContext';
import type { SidebarTabDefinition } from '../types';

export interface MobileBottomNavProps {
    tabs: SidebarTabDefinition[];
    activeTabId: string | null;
    onTabClick: (tabId: string) => void;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Mobile Bottom Navigation
 *
 * A horizontal navigation bar for mobile devices, typically pinned to the bottom.
 * Follows the "Mobile Native" pattern found in Canva or Figma.
 */
export const MobileBottomNav = memo(function MobileBottomNav({
    tabs,
    activeTabId,
    onTabClick,
    className,
    style,
}: MobileBottomNavProps) {
    const { preset } = useLayout();

    if (!preset) return null;
    const { Box, IconButton, Badge } = preset;

    return (
        <Box
            className={className}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                height: 64,
                width: '100%',
                backgroundColor: 'var(--mantine-color-body, #fff)',
                borderTop: '1px solid var(--mantine-color-gray-3, #dee2e6)',
                paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
                zIndex: 5000,
                ...style,
            }}
        >
            {tabs.map((tab) => (
                <Box
                    key={tab.id}
                    style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                    }}
                    onClick={() => onTabClick(tab.id)}
                >
                    <IconButton
                        icon={tab.icon}
                        isActive={activeTabId === tab.id}
                        aria-label={tab.label}
                        size="md"
                    />

                    {/* Optional Label for Canva-style navigation */}
                    <Box style={{
                        fontSize: 10,
                        fontWeight: activeTabId === tab.id ? 600 : 400,
                        color: activeTabId === tab.id ? 'var(--mantine-color-violet-filled, #667eea)' : 'var(--mantine-color-gray-6, #868e96)',
                        marginTop: -4
                    }}>
                        {tab.label}
                    </Box>

                    {tab.badge !== undefined && tab.badge > 0 && (
                        <Box
                            style={{
                                position: 'absolute',
                                top: 4,
                                right: '25%',
                                pointerEvents: 'none',
                            }}
                        >
                            <Badge variant="primary" size="sm">
                                {tab.badge > 99 ? '99+' : tab.badge}
                            </Badge>
                        </Box>
                    )}
                </Box>
            ))}
        </Box>
    );
});
