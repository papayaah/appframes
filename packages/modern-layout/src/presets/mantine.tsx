import {
    Box as MantineBox,
    ActionIcon,
    Tooltip as MantineTooltip,
    Drawer as MantineDrawer,
    Divider as MantineDivider,
    Badge as MantineBadge,
    ScrollArea as MantineScrollArea,
    AppShell as MantineAppShell,
} from '@mantine/core';
import type { LayoutComponentPreset } from '../types';

/**
 * Mantine UI Component Preset
 *
 * Full-featured preset using Mantine components optimized for performance.
 * Import this separately to avoid bundling Mantine when not needed:
 *
 * ```tsx
 * import { mantinePreset } from '@reactkits.dev/modern-layout/presets/mantine';
 * ```
 */
export const mantinePreset: LayoutComponentPreset = {
    Box: ({ children, className, style, onClick, onMouseEnter, onMouseLeave, onMouseDown, ref, ...props }) => (
        <MantineBox
            ref={ref}
            className={className}
            style={style}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onMouseDown={onMouseDown}
            {...props}
        >
            {children}
        </MantineBox>
    ),

    IconButton: ({ icon, onClick, isActive, disabled, size = 'md', tooltip, className, 'aria-label': ariaLabel }) => {
        const sizeMap = { sm: 'sm', md: 'md', lg: 'lg' } as const;

        const button = (
            <ActionIcon
                variant={isActive ? 'light' : 'subtle'}
                color={isActive ? 'violet' : 'gray'}
                size={sizeMap[size]}
                onClick={onClick}
                disabled={disabled}
                aria-label={ariaLabel || tooltip}
                className={className}
                style={{
                    transition: 'background-color 0.15s, color 0.15s',
                }}
            >
                {icon}
            </ActionIcon>
        );

        if (tooltip && !disabled) {
            return (
                <MantineTooltip
                    label={tooltip}
                    position="right"
                    withArrow
                    transitionProps={{ duration: 150 }}
                >
                    {button}
                </MantineTooltip>
            );
        }

        return button;
    },

    Tooltip: ({ children, label, position = 'right', disabled }) => {
        if (disabled) return <>{children}</>;

        return (
            <MantineTooltip
                label={label}
                position={position}
                withArrow
                transitionProps={{ duration: 150 }}
            >
                <span>{children}</span>
            </MantineTooltip>
        );
    },

    Drawer: ({ children, isOpen, onClose, position = 'right', size = 320, title, withOverlay = true, closeOnClickOutside = true }) => (
        <MantineDrawer
            opened={isOpen}
            onClose={onClose}
            position={position as 'left' | 'right' | 'top' | 'bottom'}
            size={size}
            title={title}
            withOverlay={withOverlay}
            closeOnClickOutside={closeOnClickOutside}
            transitionProps={{ duration: 200 }}
            styles={{
                content: {
                    display: 'flex',
                    flexDirection: 'column',
                },
                body: {
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            {children}
        </MantineDrawer>
    ),

    Divider: ({ orientation = 'horizontal', className }) => (
        <MantineDivider
            orientation={orientation}
            className={className}
            my={orientation === 'horizontal' ? 'xs' : undefined}
            mx={orientation === 'vertical' ? 'xs' : undefined}
        />
    ),

    Badge: ({ children, variant = 'default', size = 'sm', className }) => {
        const variantMap = {
            default: 'light',
            primary: 'filled',
            secondary: 'outline',
        } as const;

        return (
            <MantineBadge
                variant={variantMap[variant]}
                size={size}
                color="violet"
                className={className}
            >
                {children}
            </MantineBadge>
        );
    },

    ScrollArea: ({ children, maxHeight, className, style }) => (
        <MantineScrollArea
            h={maxHeight}
            className={className}
            style={style}
            scrollbarSize={8}
            type="hover"
        >
            {children}
        </MantineScrollArea>
    ),

    AppShell: ({ children, header, navbar, aside, footer, navbarWidth, asideWidth, headerHeight, padding, className }) => (
        <MantineAppShell
            header={header ? { height: headerHeight ?? 45 } : undefined}
            navbar={navbar ? { width: navbarWidth ?? 80, breakpoint: 'sm' } : undefined}
            aside={aside ? { width: asideWidth ?? 320, breakpoint: 'md' } : undefined}
            footer={footer ? { height: 60 } : undefined}
            padding={padding ?? 0}
            className={className}
            styles={{
                main: {
                    // Performance: Use transform for GPU acceleration
                    willChange: 'padding-left, padding-right',
                    transition: 'padding-left 0.2s ease, padding-right 0.2s ease',
                },
            }}
        >
            {header && <MantineAppShell.Header>{header}</MantineAppShell.Header>}
            {navbar && <MantineAppShell.Navbar>{navbar}</MantineAppShell.Navbar>}
            <MantineAppShell.Main>{children}</MantineAppShell.Main>
            {aside && <MantineAppShell.Aside>{aside}</MantineAppShell.Aside>}
            {footer && <MantineAppShell.Footer>{footer}</MantineAppShell.Footer>}
        </MantineAppShell>
    ),
};

/**
 * Tabler Icons preset for use with Mantine
 */
export const tablerIcons = {
    gripVertical: null, // Will be provided by consumer
    close: null,
    menu: null,
    chevronLeft: null,
    chevronRight: null,
    settings: null,
    pin: null,
    pinOff: null,
};
