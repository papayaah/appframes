import {
    Box as MantineBox,
    ActionIcon,
    Tooltip as MantineTooltip,
    Drawer as MantineDrawer,
    Divider as MantineDivider,
    Badge as MantineBadge,
    ScrollArea as MantineScrollArea,
    AppShell as MantineAppShell,
    Modal as MantineModal,
    Skeleton as MantineSkeleton,
    Overlay as MantineOverlay,
    TextInput as MantineInput,
    Text as MantineText,
    Button as MantineButton,
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
            withinPortal={true}
            zIndex={40000}
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
    Modal: ({ children, isOpen, onClose, title, size = 'md', centered = true, withOverlay = true, closeOnClickOutside = true, className }) => (
        <MantineModal
            opened={isOpen}
            onClose={onClose}
            title={title}
            size={size}
            centered={centered}
            withOverlay={withOverlay}
            closeOnClickOutside={closeOnClickOutside}
            className={className}
            withinPortal={true}
            zIndex={41000}
        >
            {children}
        </MantineModal>
    ),
    Skeleton: ({ width, height, circle, radius, animate, className, style }) => (
        <MantineSkeleton
            width={width}
            height={height}
            circle={circle}
            radius={radius}
            animate={animate}
            className={className}
            style={style}
        />
    ),
    Overlay: ({ color, opacity, blur, zIndex, onClick, className, children }) => (
        <MantineOverlay
            color={color}
            opacity={opacity}
            blur={blur}
            zIndex={zIndex}
            onClick={onClick}
            className={className}
        >
            {children}
        </MantineOverlay>
    ),
    Input: ({ value, onChange, placeholder, label, description, error, disabled, type, leftSection, rightSection, className }) => (
        <MantineInput
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            label={label}
            description={description}
            error={error}
            disabled={disabled}
            type={type}
            leftSection={leftSection}
            rightSection={rightSection}
            className={className}
        />
    ),
    Header: ({ children, height, className, style }) => (
        <MantineAppShell.Header className={className} style={{ ...style, height: height ?? 45, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
            {children}
        </MantineAppShell.Header>
    ),
    Footer: ({ children, height, className, style }) => (
        <MantineAppShell.Footer className={className} style={{ ...style, height: height ?? 40, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
            {children}
        </MantineAppShell.Footer>
    ),
    Text: ({ children, size = 'md', weight, bold, color, align, className, style, transform, lineHeight }) => (
        <MantineText
            size={size}
            fw={bold ? 700 : weight}
            c={color}
            ta={align}
            tt={transform}
            lh={lineHeight}
            className={className}
            style={style}
        >
            {children}
        </MantineText>
    ),
    Button: ({ children, onClick, variant = 'primary', size = 'md', disabled, loading, fullWidth, leftSection, rightSection, className, style, type }) => {
        const variantMap = {
            primary: 'filled',
            secondary: 'outline',
            danger: 'filled',
            light: 'light',
            subtle: 'subtle',
        } as const;

        const colorMap = {
            primary: 'violet',
            secondary: 'gray',
            danger: 'red',
            light: 'violet',
            subtle: 'violet',
        } as const;

        return (
            <MantineButton
                onClick={onClick}
                variant={variantMap[variant]}
                color={colorMap[variant]}
                size={size}
                disabled={disabled}
                loading={loading}
                fullWidth={fullWidth}
                leftSection={leftSection}
                rightSection={rightSection}
                className={className}
                style={style}
                type={type}
            >
                {children}
            </MantineButton>
        );
    },
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
