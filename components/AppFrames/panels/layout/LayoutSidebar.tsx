
import { Stack } from '@mantine/core';
import { CanvasSettings, SharedBackground, Screen, BackgroundEffects } from '../../types';
import { CanvasSizeSelector } from './CanvasSizeSelector';
import { CompositionSelector } from './CompositionSelector';
import { SharedBackgroundSettings } from './SharedBackgroundSettings';

interface LayoutSidebarProps {
    settings: CanvasSettings;
    setSettings: (settings: CanvasSettings) => void;
    screens: Screen[];
    sharedBackground?: SharedBackground;
    onSharedBackgroundChange?: (sharedBg: SharedBackground | undefined) => void;
    onToggleScreenInSharedBg?: (screenId: string) => void;
    onApplyEffectsToAll?: (effects: BackgroundEffects) => void;
}

export function LayoutSidebar({
    settings,
    setSettings,
    screens,
    sharedBackground,
    onSharedBackgroundChange,
    onToggleScreenInSharedBg,
}: LayoutSidebarProps) {
    const currentScreen = screens[settings.selectedScreenIndex];
    const hasSharedBackgroundSupport = !!onSharedBackgroundChange && screens.length >= 2;

    return (
        <Stack gap="lg" style={{ overflow: 'auto', height: '100%', padding: '16px' }}>
            <CanvasSizeSelector
                settings={settings}
                setSettings={setSettings}
                currentScreen={currentScreen}
            />

            <CompositionSelector
                settings={settings}
                setSettings={setSettings}
                currentScreen={currentScreen}
            />

            {hasSharedBackgroundSupport && (
                <SharedBackgroundSettings
                    settings={settings}
                    screens={screens}
                    sharedBackground={sharedBackground}
                    onSharedBackgroundChange={onSharedBackgroundChange}
                    onToggleScreenInSharedBg={onToggleScreenInSharedBg}
                />
            )}
        </Stack>
    );
}
