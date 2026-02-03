'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Group, Text, ActionIcon, Paper } from '@mantine/core';
import { IconGripVertical, IconX } from '@tabler/icons-react';
import { useInteractionLock } from './InteractionLockContext';

export interface FloatingSettingsPanelProps {
  /** Panel title */
  title: string;
  /** Optional subtitle (e.g., "Slot 3") */
  subtitle?: string;
  /** Panel content */
  children: React.ReactNode;
  /** Whether the panel is visible */
  isOpen: boolean;
  /** Optional close handler - if provided, shows close button */
  onClose?: () => void;
  /** Initial position override */
  initialPosition?: { x: number; y: number };
  /** Element to position relative to */
  anchorToElement?: HTMLElement | null;
  /** Offset from anchor element (default: { x: 20, y: 0 }) */
  anchorOffset?: { x: number; y: number };
  /** Key for localStorage to persist position per panel type */
  positionKey?: string;
  /** Callback when position changes (after drag) */
  onPositionChange?: (position: { x: number; y: number }) => void;
  /** Panel width (default: 280) */
  width?: number;
  /** Optional max height with scroll */
  maxHeight?: number;
  /** Minimum width for resize (default: 240) */
  minWidth?: number;
  /** Minimum height for resize (default: 200) */
  minHeight?: number;
}

const PANEL_MARGIN = 20;
const DEFAULT_WIDTH = 280;
const DEFAULT_ANCHOR_OFFSET = { x: 20, y: 0 };
const MIN_WIDTH = 240;
const MIN_HEIGHT = 200;
const HEADER_HEIGHT = 52;

function calculateInitialPosition(
  anchorElement: HTMLElement | null,
  panelWidth: number,
  panelHeight: number,
  viewport: { width: number; height: number },
  anchorOffset: { x: number; y: number }
): { x: number; y: number } {
  if (!anchorElement) {
    return {
      x: Math.max(PANEL_MARGIN, (viewport.width - panelWidth) / 2),
      y: Math.max(PANEL_MARGIN, (viewport.height - panelHeight) / 2),
    };
  }

  const rect = anchorElement.getBoundingClientRect();
  let anchorX = rect.right + anchorOffset.x;
  let anchorY = rect.top + anchorOffset.y;

  if (anchorX + panelWidth + PANEL_MARGIN > viewport.width) {
    anchorX = rect.left - panelWidth - anchorOffset.x;
  }

  return {
    x: Math.max(PANEL_MARGIN, Math.min(anchorX, viewport.width - panelWidth - PANEL_MARGIN)),
    y: Math.max(PANEL_MARGIN, Math.min(anchorY, viewport.height - panelHeight - PANEL_MARGIN)),
  };
}

function getStoredPosition(key: string): { x: number; y: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(`floating-panel-position-${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function storePosition(key: string, position: { x: number; y: number }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`floating-panel-position-${key}`, JSON.stringify(position));
  } catch {
    // Ignore storage errors
  }
}

function getStoredSize(key: string): { width: number; height: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(`floating-panel-size-${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed.width === 'number' && typeof parsed.height === 'number') {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function storeSize(key: string, size: { width: number; height: number }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`floating-panel-size-${key}`, JSON.stringify(size));
  } catch {
    // Ignore storage errors
  }
}

export function FloatingSettingsPanel({
  title,
  subtitle,
  children,
  isOpen,
  onClose,
  initialPosition,
  anchorToElement,
  anchorOffset = DEFAULT_ANCHOR_OFFSET,
  positionKey,
  onPositionChange,
  width = DEFAULT_WIDTH,
  maxHeight,
  minWidth = MIN_WIDTH,
  minHeight = MIN_HEIGHT,
}: FloatingSettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState<{ width: number; height: number | null }>({ width, height: null });
  const [hasUserDragged, setHasUserDragged] = useState(false);
  const [hasUserResized, setHasUserResized] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Drag state refs
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; panelX: number; panelY: number } | null>(null);
  const pendingPositionRef = useRef<{ x: number; y: number } | null>(null);

  // Resize state refs
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; width: number; height: number } | null>(null);
  const pendingSizeRef = useRef<{ width: number; height: number } | null>(null);

  const rafRef = useRef<number | null>(null);
  const gestureTokenRef = useRef<string | null>(null);

  const { begin, end } = useInteractionLock();

  // For SSR safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load stored size on mount
  useEffect(() => {
    if (!mounted || !positionKey) return;
    const storedSize = getStoredSize(positionKey);
    if (storedSize) {
      setSize(storedSize);
      setHasUserResized(true);
    }
  }, [mounted, positionKey]);

  // Calculate position when panel opens or anchor changes
  useEffect(() => {
    if (!isOpen || !mounted) return;
    if (hasUserDragged && position) return;

    if (positionKey && !hasUserDragged) {
      const stored = getStoredPosition(positionKey);
      if (stored) {
        const viewport = { width: window.innerWidth, height: window.innerHeight };
        const effectiveWidth = size.width || width;
        if (
          stored.x >= PANEL_MARGIN &&
          stored.x <= viewport.width - effectiveWidth - PANEL_MARGIN &&
          stored.y >= PANEL_MARGIN &&
          stored.y <= viewport.height - 100
        ) {
          setPosition(stored);
          setHasUserDragged(true);
          return;
        }
      }
    }

    if (initialPosition) {
      setPosition(initialPosition);
      return;
    }

    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const panelHeight = panelRef.current?.offsetHeight || 200;
    const effectiveWidth = size.width || width;
    const newPosition = calculateInitialPosition(
      anchorToElement || null,
      effectiveWidth,
      panelHeight,
      viewport,
      anchorOffset
    );
    setPosition(newPosition);
  }, [isOpen, mounted, anchorToElement, initialPosition, width, anchorOffset, positionKey, hasUserDragged, position, size.width]);

  // Apply visual position via rAF
  const applyPositionVisual = useCallback((x: number, y: number) => {
    const el = panelRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  // Apply visual size via rAF
  const applySizeVisual = useCallback((w: number, h: number) => {
    const el = panelRef.current;
    if (!el) return;
    el.style.width = `${w}px`;
    // Find content area and set its height
    const contentArea = el.querySelector('[data-content-area]') as HTMLElement;
    if (contentArea) {
      contentArea.style.maxHeight = `${h - HEADER_HEIGHT}px`;
    }
  }, []);

  const scheduleUpdate = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const pendingPos = pendingPositionRef.current;
      if (pendingPos) {
        applyPositionVisual(pendingPos.x, pendingPos.y);
      }
      const pendingSize = pendingSizeRef.current;
      if (pendingSize) {
        applySizeVisual(pendingSize.width, pendingSize.height);
      }
    });
  }, [applyPositionVisual, applySizeVisual]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!position) return;

    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panelX: position.x,
      panelY: position.y,
    };
    pendingPositionRef.current = position;
    gestureTokenRef.current = begin('floating-settings-panel', 'drag');
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position, begin]);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || !dragStartRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const panelHeight = panelRef.current?.offsetHeight || 200;
    const effectiveWidth = size.width || width;

    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    const newX = Math.max(
      PANEL_MARGIN,
      Math.min(dragStartRef.current.panelX + deltaX, viewport.width - effectiveWidth - PANEL_MARGIN)
    );
    const newY = Math.max(
      PANEL_MARGIN,
      Math.min(dragStartRef.current.panelY + deltaY, viewport.height - panelHeight - PANEL_MARGIN)
    );

    pendingPositionRef.current = { x: newX, y: newY };
    scheduleUpdate();
  }, [size.width, width, scheduleUpdate]);

  const handleDragEnd = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    isDraggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    const finalPosition = pendingPositionRef.current;
    if (finalPosition) {
      setPosition(finalPosition);
      setHasUserDragged(true);
      if (positionKey) {
        storePosition(positionKey, finalPosition);
      }
      onPositionChange?.(finalPosition);
    }

    if (gestureTokenRef.current) {
      end(gestureTokenRef.current);
      gestureTokenRef.current = null;
    }

    dragStartRef.current = null;
    pendingPositionRef.current = null;
  }, [positionKey, onPositionChange, end]);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const currentWidth = panelRef.current?.offsetWidth || size.width || width;
    const currentHeight = panelRef.current?.offsetHeight || 300;

    isResizingRef.current = true;
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: currentWidth,
      height: currentHeight,
    };
    pendingSizeRef.current = { width: currentWidth, height: currentHeight };
    gestureTokenRef.current = begin('floating-settings-panel', 'resize');
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [size.width, width, begin]);

  const handleResizeMove = useCallback((e: React.PointerEvent) => {
    if (!isResizingRef.current || !resizeStartRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const deltaX = e.clientX - resizeStartRef.current.mouseX;
    const deltaY = e.clientY - resizeStartRef.current.mouseY;

    const newWidth = Math.max(minWidth, Math.min(resizeStartRef.current.width + deltaX, viewport.width - PANEL_MARGIN * 2));
    const newHeight = Math.max(minHeight, Math.min(resizeStartRef.current.height + deltaY, viewport.height - PANEL_MARGIN * 2));

    pendingSizeRef.current = { width: newWidth, height: newHeight };
    scheduleUpdate();
  }, [minWidth, minHeight, scheduleUpdate]);

  const handleResizeEnd = useCallback((e: React.PointerEvent) => {
    if (!isResizingRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    isResizingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    const finalSize = pendingSizeRef.current;
    if (finalSize) {
      setSize(finalSize);
      setHasUserResized(true);
      if (positionKey) {
        storeSize(positionKey, finalSize);
      }
    }

    if (gestureTokenRef.current) {
      end(gestureTokenRef.current);
      gestureTokenRef.current = null;
    }

    resizeStartRef.current = null;
    pendingSizeRef.current = null;
  }, [positionKey, end]);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (gestureTokenRef.current) {
        end(gestureTokenRef.current);
      }
    };
  }, [end]);

  if (!isOpen || !mounted) return null;

  const effectiveWidth = size.width || width;
  const effectiveMaxHeight = size.height || maxHeight;

  const panelContent = (
    <Paper
      ref={panelRef}
      data-export-hide="true"
      shadow="md"
      radius="md"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform: position ? `translate3d(${position.x}px, ${position.y}px, 0)` : undefined,
        width: effectiveWidth,
        zIndex: 200,
        willChange: 'transform',
        opacity: isDraggingRef.current || isResizingRef.current ? 0.9 : 1,
        transition: isDraggingRef.current || isResizingRef.current ? 'none' : 'opacity 0.2s',
      }}
    >
      {/* Header with drag handle */}
      <Box
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        style={{
          cursor: 'grab',
          userSelect: 'none',
          padding: '12px 12px 8px 12px',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <Group justify="space-between" gap="xs">
          <Group gap="xs">
            <IconGripVertical size={16} color="#868e96" style={{ flexShrink: 0 }} />
            <Box>
              <Text size="sm" fw={600}>
                {title}
              </Text>
              {subtitle && (
                <Text size="xs" c="dimmed">
                  {subtitle}
                </Text>
              )}
            </Box>
          </Group>
          {onClose && (
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <IconX size={14} />
            </ActionIcon>
          )}
        </Group>
      </Box>

      {/* Content area */}
      <Box
        data-content-area
        p="sm"
        style={{
          maxHeight: effectiveMaxHeight ? effectiveMaxHeight - HEADER_HEIGHT : undefined,
          overflowY: effectiveMaxHeight ? 'auto' : undefined,
          overflowX: 'hidden',
        }}
      >
        {children}
      </Box>

      {/* Resize handle */}
      <Box
        onPointerDown={handleResizeStart}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeEnd}
        onPointerCancel={handleResizeEnd}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 16,
          height: 16,
          cursor: 'nwse-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" style={{ opacity: 0.4 }}>
          <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </Box>
    </Paper>
  );

  return createPortal(panelContent, document.body);
}
