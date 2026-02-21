import { ReactNode, CSSProperties, RefObject } from 'react';

// ============================================================================
// Layout Shell Types
// ============================================================================

export interface LayoutShellConfig {
    /** Default collapsed width for left sidebar rail (default: 80) */
    collapsedNavWidth?: number;
    /** Expanded width for left sidebar panel (default: 360) */
    expandedNavWidth?: number;
    /** Right settings panel width (default: 320) */
    settingsPanelWidth?: number;
    /** Header height (default: 45) */
    headerHeight?: number;
    /** Mobile breakpoint in pixels (default: 768) */
    mobileBreakpoint?: number;
    /** Enable localStorage persistence for panel states (default: true) */
    persistState?: boolean;
    /** Storage key prefix for localStorage (default: 'modern-layout') */
    storageKeyPrefix?: string;
}

export interface LayoutState {
    /** Current left nav width */
    navWidth: number;
    /** Whether left panel is open/pinned */
    leftPanelOpen: boolean;
    /** Currently active tab ID in left sidebar */
    activeTabId: string | null;
    /** Whether right settings panel is open */
    settingsPanelOpen: boolean;
    /** Whether we're on mobile viewport */
    isMobile: boolean;
    /** Whether mobile drawer is open */
    mobileDrawerOpen: boolean;
    /** Active mobile drawer tab */
    mobileDrawerTab: string | null;
}

export interface LayoutActions {
    setNavWidth: (width: number) => void;
    setLeftPanelOpen: (open: boolean) => void;
    setActiveTabId: (tabId: string | null) => void;
    toggleLeftPanel: (tabId?: string) => void;
    setSettingsPanelOpen: (open: boolean) => void;
    toggleSettingsPanel: () => void;
    setMobileDrawerOpen: (open: boolean) => void;
    setMobileDrawerTab: (tabId: string | null) => void;
}

// ============================================================================
// Sidebar Rail Types
// ============================================================================

export interface SidebarTabDefinition {
    id: string;
    icon: ReactNode;
    label: string;
    /** Optional badge count */
    badge?: number;
    /** Disabled state */
    disabled?: boolean;
}

export interface SidebarRailProps {
    /** Tab definitions */
    tabs: SidebarTabDefinition[];
    /** Currently active tab */
    activeTabId: string | null;
    /** Called when tab is clicked */
    onTabClick: (tabId: string) => void;
    /** Whether a panel is currently pinned open */
    isPinned: boolean;
    /** Position: left or right */
    position?: 'left' | 'right';
    /** Custom class name */
    className?: string;
    /** Custom styles */
    style?: CSSProperties;
    children?: ReactNode;
}

export interface SidebarTabProps {
    /** Tab definition */
    tab: SidebarTabDefinition;
    /** Whether this tab is active */
    isActive: boolean;
    /** Called when clicked */
    onClick: () => void;
    /** Called on mouse enter (for hover preview) */
    onMouseEnter?: () => void;
    /** Called on mouse leave */
    onMouseLeave?: () => void;
    /** Custom class name */
    className?: string;
}

// ============================================================================
// Panel Types
// ============================================================================

export interface PanelProps {
    /** Panel content */
    children: ReactNode;
    /** Whether panel is visible */
    isOpen: boolean;
    /** Called to close panel */
    onClose?: () => void;
    /** Panel title */
    title?: string;
    /** Panel width */
    width?: number | string;
    /** Panel position */
    position?: 'left' | 'right';
    /** Show notch handle for drag-to-close */
    showNotch?: boolean;
    /** Custom class name */
    className?: string;
    /** Custom styles */
    style?: CSSProperties;
}

export interface NotchHandleProps {
    /** Position relative to panel */
    position: 'left' | 'right';
    /** Called when notch is clicked */
    onClick?: () => void;
    /** Called when drag starts */
    onDragStart?: () => void;
    /** Called during drag with delta */
    onDrag?: (deltaX: number) => void;
    /** Called when drag ends */
    onDragEnd?: (deltaX: number) => void;
    /** Whether currently dragging */
    isDragging?: boolean;
    /** Custom class name */
    className?: string;
}

// ============================================================================
// Floating Panel Types
// ============================================================================

export interface FloatingPanelProps {
    /** Unique panel ID for position persistence */
    id: string;
    /** Panel content */
    children: ReactNode;
    /** Whether panel is visible */
    isOpen: boolean;
    /** Called to close panel */
    onClose?: () => void;
    /** Panel title */
    title?: string;
    /** Initial position */
    initialPosition?: { x: number; y: number };
    /** Initial size */
    initialSize?: { width: number; height: number };
    /** Minimum size constraints */
    minSize?: { width: number; height: number };
    /** Maximum size constraints */
    maxSize?: { width: number; height: number };
    /** Whether panel is draggable */
    draggable?: boolean;
    /** Whether panel is resizable */
    resizable?: boolean;
    /** Anchor element ref (for positioning near an element) */
    anchorRef?: RefObject<HTMLElement>;
    /** Offset from anchor element */
    anchorOffset?: { x: number; y: number };
    /** Z-index */
    zIndex?: number;
    /** Custom class name */
    className?: string;
}

export interface FloatingPanelState {
    position: { x: number; y: number };
    size: { width: number; height: number };
    isDragging: boolean;
    isResizing: boolean;
}

// ============================================================================
// Mobile Drawer Types
// ============================================================================

export interface MobileDrawerProps {
    /** Drawer content */
    children: ReactNode;
    /** Whether drawer is open */
    isOpen: boolean;
    /** Called to close drawer */
    onClose: () => void;
    /** Drawer title */
    title?: string;
    /** Drawer height as percentage (default: 70) */
    heightPercent?: number;
    /** Enable swipe to close */
    swipeToClose?: boolean;
    /** Custom class name */
    className?: string;
}

export interface MobileBottomNavProps {
    /** Tab definitions */
    tabs: SidebarTabDefinition[];
    /** Currently active tab */
    activeTabId: string | null;
    /** Called when tab is clicked */
    onTabClick: (tabId: string) => void;
    /** Custom class name */
    className?: string;
}

// ============================================================================
// Component Preset Types (Headless UI Pattern)
// ============================================================================

export interface BoxProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
    onClick?: (e: React.MouseEvent) => void;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
    onMouseDown?: (e: React.MouseEvent) => void;
    ref?: RefObject<HTMLDivElement>;
    'data-export-hide'?: string;
    id?: string;
}

export interface TextProps {
    children: ReactNode;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    weight?: number | string;
    bold?: boolean;
    color?: string;
    align?: 'left' | 'center' | 'right';
    className?: string;
    style?: CSSProperties;
    /** Transform text to uppercase, lowercase, etc. */
    transform?: 'uppercase' | 'capitalize' | 'lowercase' | 'none';
    /** Line height */
    lineHeight?: number | string;
}

export interface IconButtonProps {
    icon: ReactNode;
    onClick?: () => void;
    isActive?: boolean;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    tooltip?: string;
    className?: string;
    'aria-label'?: string;
}

export interface ButtonProps {
    children: ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'light' | 'subtle';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    leftSection?: ReactNode;
    rightSection?: ReactNode;
    className?: string;
    style?: CSSProperties;
    type?: 'button' | 'submit' | 'reset';
}

export interface TooltipProps {
    children: ReactNode;
    label: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    disabled?: boolean;
}

export interface DrawerProps {
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
    position?: 'left' | 'right' | 'bottom';
    size?: number | string;
    title?: string;
    withOverlay?: boolean;
    closeOnClickOutside?: boolean;
    className?: string;
}

export interface DividerProps {
    orientation?: 'horizontal' | 'vertical';
    className?: string;
}

export interface BadgeProps {
    children: ReactNode;
    variant?: 'default' | 'primary' | 'secondary';
    size?: 'sm' | 'md';
    className?: string;
}

export interface ScrollAreaProps {
    children: ReactNode;
    maxHeight?: number | string;
    className?: string;
    style?: CSSProperties;
}

export interface AppShellProps {
    children: ReactNode;
    header?: ReactNode;
    navbar?: ReactNode;
    aside?: ReactNode;
    footer?: ReactNode;
    /** Navbar width */
    navbarWidth?: number;
    /** Aside width */
    asideWidth?: number;
    /** Header height */
    headerHeight?: number;
    /** Padding for main content */
    padding?: number | string;
    className?: string;
}

export interface ModalProps {
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: number | string;
    centered?: boolean;
    withOverlay?: boolean;
    closeOnClickOutside?: boolean;
    className?: string;
}

export interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    circle?: boolean;
    radius?: number | string;
    animate?: boolean;
    className?: string;
    style?: CSSProperties;
}

export interface OverlayProps {
    color?: string;
    opacity?: number;
    blur?: number;
    zIndex?: number;
    onClick?: () => void;
    className?: string;
    children?: ReactNode;
}

export interface InputProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    description?: string;
    error?: ReactNode;
    disabled?: boolean;
    type?: string;
    leftSection?: ReactNode;
    rightSection?: ReactNode;
    className?: string;
}

export interface HeaderProps {
    children: ReactNode;
    height?: number | string;
    fixed?: boolean;
    border?: boolean;
    className?: string;
    style?: CSSProperties;
    id?: string;
}

export interface FooterProps {
    children: ReactNode;
    height?: number | string;
    fixed?: boolean;
    border?: boolean;
    className?: string;
    style?: CSSProperties;
    id?: string;
}

// ============================================================================
// Component Preset Interface
// ============================================================================

export interface LayoutComponentPreset {
    /** Basic container/box component */
    Box: React.FC<BoxProps>;
    /** Icon button component */
    IconButton: React.FC<IconButtonProps>;
    /** Tooltip wrapper */
    Tooltip: React.FC<TooltipProps>;
    /** Drawer/slide-out panel */
    Drawer: React.FC<DrawerProps>;
    /** Divider line */
    Divider: React.FC<DividerProps>;
    /** Badge/pill */
    Badge: React.FC<BadgeProps>;
    /** Scrollable area */
    ScrollArea: React.FC<ScrollAreaProps>;
    /** App shell layout (optional - for full layout preset) */
    AppShell?: React.FC<AppShellProps>;
    /** Modal/Dialog component */
    Modal: React.FC<ModalProps>;
    /** Loading placeholder */
    Skeleton: React.FC<SkeletonProps>;
    /** Transparent overlay */
    Overlay: React.FC<OverlayProps>;
    /** Generic text input */
    Input: React.FC<InputProps>;
    /** App header */
    Header: React.FC<HeaderProps>;
    /** App footer */
    Footer: React.FC<FooterProps>;
    /** Typography component */
    Text: React.FC<TextProps>;
    /** Generic button component */
    Button: React.FC<ButtonProps>;
}

// ============================================================================
// Icon Types
// ============================================================================

export interface IconComponent {
    (props: { size?: number | string;[key: string]: unknown }): ReactNode;
}

export interface LayoutIcons {
    /** Grip/drag handle icon */
    gripVertical?: IconComponent | ReactNode;
    /** Close/X icon */
    close?: IconComponent | ReactNode;
    /** Menu/hamburger icon */
    menu?: IconComponent | ReactNode;
    /** Chevron left */
    chevronLeft?: IconComponent | ReactNode;
    /** Chevron right */
    chevronRight?: IconComponent | ReactNode;
    /** Settings/gear icon */
    settings?: IconComponent | ReactNode;
    /** Pin icon */
    pin?: IconComponent | ReactNode;
    /** Unpin icon */
    pinOff?: IconComponent | ReactNode;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UsePanelStateOptions {
    /** Initial open state */
    defaultOpen?: boolean;
    /** Initial pinned state */
    defaultPinned?: boolean;
    /** Hover delay in ms before showing preview */
    hoverDelay?: number;
    /** Delay before hiding on mouse leave */
    hideDelay?: number;
    /** Storage key for persistence */
    storageKey?: string;
}

export interface UsePanelStateReturn {
    isOpen: boolean;
    isPinned: boolean;
    isHovering: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
    pin: () => void;
    unpin: () => void;
    togglePin: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

export interface UseDragToCloseOptions {
    /** Direction to drag for closing */
    direction: 'left' | 'right' | 'up' | 'down';
    /** Threshold in pixels to trigger close */
    threshold?: number;
    /** Called when close is triggered */
    onClose: () => void;
    /** Called during drag with progress (0-1) */
    onDragProgress?: (progress: number) => void;
}

export interface UseDragToCloseReturn {
    isDragging: boolean;
    dragOffset: number;
    handlers: {
        onMouseDown: (e: React.MouseEvent) => void;
        onTouchStart: (e: React.TouchEvent) => void;
    };
    /** Style to apply for drag transform */
    dragStyle: CSSProperties;
}

export interface UseFloatingPositionOptions {
    /** Unique ID for persistence */
    id: string;
    /** Initial position */
    initialPosition?: { x: number; y: number };
    /** Initial size */
    initialSize?: { width: number; height: number };
    /** Minimum size */
    minSize?: { width: number; height: number };
    /** Maximum size */
    maxSize?: { width: number; height: number };
    /** Keep within viewport bounds */
    constrainToViewport?: boolean;
    /** Enable position persistence */
    persist?: boolean;
}

export interface UseFloatingPositionReturn {
    position: { x: number; y: number };
    size: { width: number; height: number };
    setPosition: (pos: { x: number; y: number }) => void;
    setSize: (size: { width: number; height: number }) => void;
    /** Handlers for drag */
    dragHandlers: {
        onMouseDown: (e: React.MouseEvent) => void;
    };
    /** Handlers for resize */
    resizeHandlers: {
        onMouseDown: (e: React.MouseEvent) => void;
    };
    isDragging: boolean;
    isResizing: boolean;
}

export interface UseResponsiveLayoutOptions {
    /** Mobile breakpoint in pixels */
    breakpoint?: number;
    /** Callback when breakpoint changes */
    onChange?: (isMobile: boolean) => void;
}

export interface UseResponsiveLayoutReturn {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    width: number;
    height: number;
}
