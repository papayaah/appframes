'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, Text, Stack, Select, Slider, Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconLayout, IconDeviceMobile, IconPhoto, IconTypography, IconSettings, IconStack, IconPin, IconPinFilled, IconX } from '@tabler/icons-react';
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
  onPanelToggle?: (isOpen: boolean) => void;
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

const panelTitles: Record<TabId, string> = {
  layout: 'Layout',
  device: 'Device Frame',
  text: 'Text',
  layers: 'Layers',
  media: 'Media Library',
  settings: 'Settings',
};

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
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveringRef = useRef(false);
  const prevPathnameRef = useRef<string | null>(null);
  // Refs to track current state for use in callbacks (avoid stale closures)
  const activeTabRef = useRef(activeTab);
  const isPinnedRef = useRef(isPinned);
  activeTabRef.current = activeTab;
  isPinnedRef.current = isPinned;

  // Extract tab from pathname (e.g., "/layout" -> "layout", "/" -> "layout")
  const currentPathTab = pathname === '/' ? 'layout' : pathname.replace('/', '');
  const validTab = tabs.some(t => t.id === currentPathTab) ? currentPathTab as TabId : 'layout';

  // If navigation happens programmatically while sidebar is open, switch to the correct tab
  useEffect(() => {
    // Only respond to URL changes if sidebar is already open (user has interacted)
    // Don't auto-open sidebar on initial page load or URL changes when closed
    if (!activeTabRef.current) {
      prevPathnameRef.current = pathname;
      return;
    }

    if (prevPathnameRef.current === pathname) return;
    prevPathnameRef.current = pathname;

    // Switch to the correct tab if sidebar is already open
    if (validTab && activeTab !== validTab) {
      activeTabRef.current = validTab;
      isPinnedRef.current = true;
      setActiveTab(validTab);
      setIsPinned(true);
      setShouldAnimate(true);
    }
  }, [pathname, validTab, activeTab, onPanelToggle]);

  const clearHoverTimeout = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const handleTabClick = useCallback((tabId: TabId, event?: React.MouseEvent) => {
    clearHoverTimeout();

    // Only treat as explicit "pin" when this is a real user click (not synthetic/bubbled from panel content).
    // This keeps media (and other tabs) consistent: hover = float, click = pin.
    const isExplicitUserClick = !event || event?.nativeEvent?.isTrusted === true;

    // Use refs to get current state values (avoid stale closures)
    const currentActiveTab = activeTabRef.current;
    const currentIsPinned = isPinnedRef.current;

    if (currentActiveTab === tabId) {
      if (currentIsPinned) {
        // Already pinned - close it (only on real click)
        if (isExplicitUserClick) {
          isPinnedRef.current = false;
          activeTabRef.current = null;
          setActiveTab(null);
          setIsPinned(false);
          onPanelToggle?.(false);
        }
      } else {
        // Panel is floating (opened by hover) - pin to keep open, panel stays floating
        if (isExplicitUserClick) {
          isPinnedRef.current = true;
          router.push(`/${tabId}`, { scroll: false });
          setIsPinned(true);
        }
      }
    } else {
      // Different tab - open and pin
      if (isExplicitUserClick) {
        isPinnedRef.current = true;
        activeTabRef.current = tabId;
        router.push(`/${tabId}`, { scroll: false });
        setShouldAnimate(true);
        setActiveTab(tabId);
        setIsPinned(true);
      }
    }
  }, [clearHoverTimeout, router, onPanelToggle]);

  const handleTabHover = useCallback((tabId: TabId) => {
    if (isPinnedRef.current) return;
    clearHoverTimeout();
    isHoveringRef.current = true;
    // Only animate if we're opening a new panel (not already showing this tab)
    if (activeTabRef.current !== tabId) {
      setShouldAnimate(true);
    }
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

  const togglePin = useCallback(() => {
    clearHoverTimeout();
    setShouldAnimate(false);
    if (isPinnedRef.current) {
      // Unpinning - close the panel
      isPinnedRef.current = false;
      setActiveTab(null);
      setIsPinned(false);
      onPanelToggle?.(false);
    } else {
      // Pinning - keep panel open (stays floating)
      isPinnedRef.current = true;
      setIsPinned(true);
    }
  }, [clearHoverTimeout, onPanelToggle]);

  const closePanel = useCallback(() => {
    clearHoverTimeout();
    isPinnedRef.current = false;
    activeTabRef.current = null;
    setActiveTab(null);
    setIsPinned(false);
    onPanelToggle?.(false);
  }, [clearHoverTimeout, onPanelToggle]);

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

  // Panel always floats as overlay—navbar stays 80px (icon rail only)
  const sidebarWidth = 80;

  return (
    <Box style={{ display: 'flex', width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth, height: '100%', position: 'relative', flexShrink: 0 }}>
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
                onClick={(e) => handleTabClick(id, e)}
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
          onAnimationEnd={() => setShouldAnimate(false)}
          style={{
            width: 280,
            height: '100%',
            position: 'absolute',
            left: 80,
            top: 0,
            zIndex: 200,
            backgroundColor: 'white',
            borderRight: '1px solid #E5E7EB',
            boxShadow: '4px 0 12px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            animation: shouldAnimate ? 'fadeIn 0.15s ease-out' : 'none',
          }}
        >
          {/* Panel Header */}
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid #E5E7EB',
              flexShrink: 0,
            }}
          >
            <Text size="sm" fw={600}>{panelTitles[activeTab]}</Text>
            <Group gap={4}>
              <Tooltip label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'} position="bottom">
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={togglePin}
                  color={isPinned ? 'violet' : 'gray'}
                >
                  {isPinned ? <IconPinFilled size={14} /> : <IconPin size={14} />}
                </ActionIcon>
              </Tooltip>
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={closePanel}
                color="gray"
              >
                <IconX size={14} />
              </ActionIcon>
            </Group>
          </Box>

          {/* Panel Content */}
          <Box style={{ flex: 1, overflow: 'auto', minHeight: 0 }} className="scroll-on-hover">
            {renderPanelContent(activeTab)}
          </Box>
        </Box>
      )}

      {/* Add fadeIn keyframe via style tag */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  );
}
