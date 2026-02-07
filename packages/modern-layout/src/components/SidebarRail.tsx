'use client';

import { memo, FC } from 'react';
import { useLayout } from '../context/LayoutContext';
import type { SidebarRailProps, SidebarTabDefinition, IconButtonProps, BadgeProps, BoxProps } from '../types';

/**
 * Sidebar Rail Component
 *
 * A vertical icon rail for sidebar navigation. Renders tab icons that can be
 * clicked to toggle panels. Uses the preset's IconButton and Tooltip components.
 *
 * @example
 * ```tsx
 * <SidebarRail
 *   tabs={[
 *     { id: 'layout', icon: <IconLayout />, label: 'Layout' },
 *     { id: 'settings', icon: <IconSettings />, label: 'Settings' },
 *   ]}
 *   activeTabId={activeTab}
 *   onTabClick={setActiveTab}
 *   isPinned={isPinned}
 * />
 * ```
 */
export const SidebarRail = memo(function SidebarRail({
    tabs,
    activeTabId,
    onTabClick,
    isPinned,
    position = 'left',
    className,
    style,
    children,
}: SidebarRailProps) {
    const { preset, config } = useLayout();

    if (!preset) {
        console.warn('SidebarRail: No preset provided. Wrap your app with LayoutProvider and pass a preset.');
        return null;
    }

    const { Box, IconButton, Badge } = preset;

    return (
        <Box
            className={className}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: config.collapsedNavWidth,
                height: '100%',
                paddingTop: 8,
                paddingBottom: 8,
                gap: 4,
                backgroundColor: 'var(--mantine-color-body, #fff)',
                borderRight: position === 'left' ? '1px solid var(--mantine-color-gray-3, #dee2e6)' : undefined,
                borderLeft: position === 'right' ? '1px solid var(--mantine-color-gray-3, #dee2e6)' : undefined,
                ...style,
            }}
        >
            {tabs.map((tab) => (
                <SidebarTabItem
                    key={tab.id}
                    tab={tab}
                    isActive={activeTabId === tab.id}
                    isPinned={isPinned && activeTabId === tab.id}
                    onClick={() => onTabClick(tab.id)}
                    IconButton={IconButton}
                    Badge={Badge}
                    Box={Box}
                />
            ))}

            {/* Spacer to push additional children to bottom */}
            <Box style={{ flex: 1 }} />

            {children}
        </Box>
    );
});

// Memoized tab item to prevent unnecessary re-renders
const SidebarTabItem = memo(function SidebarTabItem({
    tab,
    isActive,
    isPinned,
    onClick,
    IconButton,
    Badge,
    Box,
}: {
    tab: SidebarTabDefinition;
    isActive: boolean;
    isPinned: boolean;
    onClick: () => void;
    IconButton: FC<IconButtonProps>;
    Badge: FC<BadgeProps>;
    Box: FC<BoxProps>;
}) {
    return (
        <Box
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <IconButton
                icon={tab.icon}
                onClick={onClick}
                isActive={isActive}
                disabled={tab.disabled}
                tooltip={tab.label}
                aria-label={tab.label}
            />

            {/* Badge for notification count */}
            {tab.badge !== undefined && tab.badge > 0 && (
                <Box
                    style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        pointerEvents: 'none',
                    }}
                >
                    <Badge variant="primary" size="sm">
                        {tab.badge > 99 ? '99+' : tab.badge}
                    </Badge>
                </Box>
            )}

            {/* Pin indicator */}
            {isPinned && (
                <Box
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        backgroundColor: '#667eea',
                    }}
                />
            )}
        </Box>
    );
});
