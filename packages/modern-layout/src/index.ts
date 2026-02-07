// ============================================================================
// @anthropic.dev/modern-layout
// Headless Modern Layout Shell for React 19
// ============================================================================

// Context & Provider
export { LayoutProvider, useLayout, LayoutContextInternal } from './context/LayoutContext';
export type { LayoutProviderProps } from './context/LayoutContext';

// Hooks
export { usePanelState } from './hooks/usePanelState';
export { useDragToClose } from './hooks/useDragToClose';
export { useFloatingPosition } from './hooks/useFloatingPosition';
export { useResponsiveLayout } from './hooks/useResponsiveLayout';

// Components
export { SidebarRail } from './components/SidebarRail';
export { NotchHandle } from './components/NotchHandle';
export { FloatingPanel } from './components/FloatingPanel';
export { SettingsPanel } from './components/SettingsPanel';

// Presets
export { defaultPreset } from './presets';
// Note: mantinePreset is available but not exported by default to avoid bundling Mantine
// Import directly: import { mantinePreset } from '@anthropic.dev/modern-layout/presets/mantine'

// Types
export type {
    // Config
    LayoutShellConfig,
    LayoutState,
    LayoutActions,

    // Sidebar
    SidebarTabDefinition,
    SidebarRailProps,
    SidebarTabProps,

    // Panels
    PanelProps,
    NotchHandleProps,
    FloatingPanelProps,
    FloatingPanelState,

    // Mobile
    MobileDrawerProps,
    MobileBottomNavProps,

    // Preset Components
    BoxProps,
    IconButtonProps,
    TooltipProps,
    DrawerProps,
    DividerProps,
    BadgeProps,
    ScrollAreaProps,
    AppShellProps,
    LayoutComponentPreset,

    // Icons
    IconComponent,
    LayoutIcons,

    // Hook Return Types
    UsePanelStateOptions,
    UsePanelStateReturn,
    UseDragToCloseOptions,
    UseDragToCloseReturn,
    UseFloatingPositionOptions,
    UseFloatingPositionReturn,
    UseResponsiveLayoutOptions,
    UseResponsiveLayoutReturn,
} from './types';
