'use client';

import { useCallback, useRef, useState } from 'react';
import { Box, Text, Stack, Select, Slider, Group, Tooltip } from '@mantine/core';
import { IconLayout, IconDeviceMobile, IconPhoto, IconTypography, IconSettings, IconStack } from '@tabler/icons-react';
import { Sidebar } from './Sidebar';
import { DeviceTab } from './DeviceTab';
import { TextTab } from './TextTab';
import { LayersTab } from './LayersTab';
import { MediaLibrary } from './MediaLibrary';
import { CanvasSettings, Screen } from './AppFrames';

interface SidebarTabsProps {
  settings: CanvasSettings;
  setSettings: (settings: CanvasSettings) => void;
  screens: Screen[];
  selectedFrameIndex?: number;
  onMediaSelect?: (mediaId: number) => void;
  onPanelToggle?: (isOpen: boolean, animate?: boolean) => void;
  downloadFormat: 'png' | 'jpg';
  onDownloadFormatChange: (format: 'png' | 'jpg') => void;
  downloadJpegQuality: number;
  onDownloadJpegQualityChange: (quality: number) => void;
}

type TabId = 'layout' | 'device' | 'text' | 'layers' | 'media' | 'settings';

const tabs: { id: TabId; icon: typeof IconLayout; label: string }[] = [
  { id: 'layout', icon: IconLayout, label: 'Layout' },
  { id: 'device', icon: IconDeviceMobile, label: 'Frame' },
  { id: 'text', icon: IconTypography, label: 'Text' },
  { id: 'layers', icon: IconStack, label: 'Layers' },
  { id: 'media', icon: IconPhoto, label: 'Media' },
  { id: 'settings', icon: IconSettings, label: 'Settings' },
];

const TRANSITION = 'width 0.2s ease, min-width 0.2s ease, max-width 0.2s ease';

export function SidebarTabs({
  settings,
  setSettings,
  screens,
  selectedFrameIndex = 0,
  onMediaSelect,
  onPanelToggle,
  downloadFormat,
  onDownloadFormatChange,
  downloadJpegQuality,
  onDownloadJpegQualityChange,
}: SidebarTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [animate, setAnimate] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveringRef = useRef(false);
  const activeTabRef = useRef<TabId | null>(null);
  const isPinnedRef = useRef(false);

  const clearHoverTimeout = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const handleTabClick = useCallback((tabId: TabId) => {
    clearHoverTimeout();

    const currentActiveTab = activeTabRef.current;
    const currentIsPinned = isPinnedRef.current;

    // Clicking the same tab that's already pinned = close/unpin
    if (currentActiveTab === tabId && currentIsPinned) {
      isPinnedRef.current = false;
      activeTabRef.current = null;
      setAnimate(true);
      setActiveTab(null);
      setIsPinned(false);
      onPanelToggle?.(false, true);
      return;
    }

    const isNewPanel = currentActiveTab === null;
    // Animate only when opening from collapsed (toggle), not when pinning from hover
    const shouldAnimate = isNewPanel;

    activeTabRef.current = tabId;
    isPinnedRef.current = true;

    setAnimate(shouldAnimate);
    setActiveTab(tabId);
    setIsPinned(true);

    if (!currentIsPinned) {
      onPanelToggle?.(true, shouldAnimate);
    }
  }, [clearHoverTimeout, onPanelToggle]);

  const handleTabHover = useCallback((tabId: TabId) => {
    if (isPinnedRef.current) return;
    clearHoverTimeout();
    isHoveringRef.current = true;
    activeTabRef.current = tabId;
    setActiveTab(tabId);
  }, [clearHoverTimeout]);

  const handleTabLeave = useCallback(() => {
    if (isPinnedRef.current) return;
    isHoveringRef.current = false;
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current && !isPinnedRef.current) {
        setActiveTab(null);
      }
    }, 300);
  }, []);

  const handlePanelHover = useCallback(() => {
    if (isPinnedRef.current) return;
    clearHoverTimeout();
    isHoveringRef.current = true;
  }, [clearHoverTimeout]);

  const handlePanelLeave = useCallback(() => {
    if (isPinnedRef.current) return;
    isHoveringRef.current = false;
    hoverTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current && !isPinnedRef.current) {
        setActiveTab(null);
      }
    }, 200);
  }, []);

  const renderPanelContent = (tabId: TabId) => {
    switch (tabId) {
      case 'layout':
        return <Sidebar settings={settings} setSettings={setSettings} screens={screens} />;
      case 'device':
        return <DeviceTab />;
      case 'text':
        return <TextTab />;
      case 'layers':
        return <LayersTab />;
      case 'media':
        return (
          <MediaLibrary
            onSelectMedia={(mediaId) => onMediaSelect && onMediaSelect(mediaId)}
            selectedSlot={settings.selectedScreenIndex}
          />
        );
      case 'settings':
        return (
          <Box style={{ height: '100%', overflow: 'auto' }} className="scroll-on-hover">
            <Stack gap="md" p="md">
              <Text fw={700}>Download</Text>
              <Select
                label="Format"
                description="PNG can preserve transparency; JPG flattens the image (no alpha)."
                value={downloadFormat}
                onChange={(v) => {
                  if (v === 'png' || v === 'jpg') onDownloadFormatChange(v);
                }}
                data={[
                  { value: 'png', label: 'PNG (transparency supported)' },
                  { value: 'jpg', label: 'JPG (no transparency)' },
                ]}
              />
              {downloadFormat === 'jpg' && (
                <Box>
                  <Group justify="space-between" mb={6}>
                    <Text size="sm" fw={600}>JPG quality</Text>
                    <Text size="sm" c="dimmed">{downloadJpegQuality}</Text>
                  </Group>
                  <Slider
                    value={downloadJpegQuality}
                    onChange={onDownloadJpegQualityChange}
                    min={0}
                    max={100}
                    step={1}
                    label={(v) => `${v}`}
                  />
                </Box>
              )}
              <Text size="xs" c="dimmed">
                Tip: App Store screenshot uploads often reject alpha. Use JPG or set a solid Background Color.
              </Text>
            </Stack>
          </Box>
        );
    }
  };

  const sidebarWidth = isPinned && activeTab ? 360 : 80;

  return (
    <Box style={{ display: 'flex', width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth, height: '100%', position: 'relative', flexShrink: 0, transition: animate ? TRANSITION : 'none' }}>
      {/* Icon Rail */}
      <Box
        style={{
          width: 80,
          height: '100%',
          borderRight: '1px solid #E5E7EB',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 0',
          gap: 8,
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <Tooltip key={id} label={label} position="right" withArrow>
              <Box
                onClick={() => handleTabClick(id)}
                onMouseEnter={() => handleTabHover(id)}
                onMouseLeave={handleTabLeave}
                style={{
                  width: 64,
                  height: 64,
                  padding: 0,
                  borderRadius: 8,
                  backgroundColor: isActive
                    ? isPinned
                      ? '#f0f0ff'
                      : '#f5f5f5'
                    : 'transparent',
                  color: isActive
                    ? isPinned
                      ? '#667eea'
                      : '#444'
                    : '#666',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={24} />
                <Text size="xs">{label}</Text>
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* Floating/Pinned Panel */}
      {activeTab && (
        <Box
          onMouseEnter={handlePanelHover}
          onMouseLeave={handlePanelLeave}
          style={{
            width: 280,
            height: '100%',
            position: isPinned ? 'relative' : 'absolute',
            left: isPinned ? 0 : 80,
            top: 0,
            zIndex: isPinned ? 1 : 200,
            backgroundColor: 'white',
            borderRight: '1px solid #E5E7EB',
            boxShadow: isPinned ? 'none' : '4px 0 12px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Panel Content */}
          <Box style={{ flex: 1, overflow: 'auto', minHeight: 0 }} className="scroll-on-hover">
            {renderPanelContent(activeTab)}
          </Box>
        </Box>
      )}
    </Box>
  );
}
