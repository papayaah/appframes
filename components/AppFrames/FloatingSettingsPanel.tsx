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
}

const PANEL_MARGIN = 20;
const DEFAULT_WIDTH = 280;
const DEFAULT_ANCHOR_OFFSET = { x: 20, y: 0 };

function calculateInitialPosition(
  anchorElement: HTMLElement | null,
  panelWidth: number,
  panelHeight: number,
  viewport: { width: number; height: number },
  anchorOffset: { x: number; y: number }
): { x: number; y: number } {
  if (!anchorElement) {
    // Center of viewport
    return {
      x: Math.max(PANEL_MARGIN, (viewport.width - panelWidth) / 2),
      y: Math.max(PANEL_MARGIN, (viewport.height - panelHeight) / 2),
    };
  }

  const rect = anchorElement.getBoundingClientRect();

  // Try to position to the right of the anchor element
  let anchorX = rect.right + anchorOffset.x;
  let anchorY = rect.top + anchorOffset.y;

  // If panel would overflow right edge, try positioning to the left
  if (anchorX + panelWidth + PANEL_MARGIN > viewport.width) {
    anchorX = rect.left - panelWidth - anchorOffset.x;
  }

  // Clamp to viewport bounds
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
}: FloatingSettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [hasUserDragged, setHasUserDragged] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Drag state refs (for rAF pattern)
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; panelX: number; panelY: number } | null>(null);
  const pendingPositionRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const gestureTokenRef = useRef<string | null>(null);

  const { begin, end } = useInteractionLock();

  // For SSR safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate position when panel opens or anchor changes
  useEffect(() => {
    if (!isOpen || !mounted) return;

    // If user has manually dragged, don't reposition
    if (hasUserDragged && position) return;

    // Check for stored position
    if (positionKey && !hasUserDragged) {
      const stored = getStoredPosition(positionKey);
      if (stored) {
        // Validate stored position is still within viewport
        const viewport = { width: window.innerWidth, height: window.innerHeight };
        if (
          stored.x >= PANEL_MARGIN &&
          stored.x <= viewport.width - width - PANEL_MARGIN &&
          stored.y >= PANEL_MARGIN &&
          stored.y <= viewport.height - 100
        ) {
          setPosition(stored);
          setHasUserDragged(true);
          return;
        }
      }
    }

    // Use initialPosition if provided
    if (initialPosition) {
      setPosition(initialPosition);
      return;
    }

    // Calculate position based on anchor element
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const panelHeight = panelRef.current?.offsetHeight || 200;
    const newPosition = calculateInitialPosition(
      anchorToElement || null,
      width,
      panelHeight,
      viewport,
      anchorOffset
    );
    setPosition(newPosition);
  }, [isOpen, mounted, anchorToElement, initialPosition, width, anchorOffset, positionKey, hasUserDragged, position]);

  // Reset hasUserDragged when panel closes
  useEffect(() => {
    if (!isOpen) {
      // Don't reset hasUserDragged - we want to remember the position
    }
  }, [isOpen]);

  // Apply visual position via rAF
  const applyPositionVisual = useCallback((x: number, y: number) => {
    const el = panelRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const schedulePositionUpdate = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const pending = pendingPositionRef.current;
      if (!pending) return;
      applyPositionVisual(pending.x, pending.y);
    });
  }, [applyPositionVisual]);

  // Mouse/pointer event handlers for dragging
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

    // Capture pointer for smooth dragging
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position, begin]);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || !dragStartRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const panelHeight = panelRef.current?.offsetHeight || 200;

    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    // Calculate new position with viewport clamping
    const newX = Math.max(
      PANEL_MARGIN,
      Math.min(dragStartRef.current.panelX + deltaX, viewport.width - width - PANEL_MARGIN)
    );
    const newY = Math.max(
      PANEL_MARGIN,
      Math.min(dragStartRef.current.panelY + deltaY, viewport.height - panelHeight - PANEL_MARGIN)
    );

    pendingPositionRef.current = { x: newX, y: newY };
    schedulePositionUpdate();
  }, [width, schedulePositionUpdate]);

  const handleDragEnd = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    isDraggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // Commit final position to React state
    const finalPosition = pendingPositionRef.current;
    if (finalPosition) {
      setPosition(finalPosition);
      setHasUserDragged(true);

      // Persist to localStorage
      if (positionKey) {
        storePosition(positionKey, finalPosition);
      }

      // Notify parent
      onPositionChange?.(finalPosition);
    }

    // Release interaction lock
    if (gestureTokenRef.current) {
      end(gestureTokenRef.current);
      gestureTokenRef.current = null;
    }

    dragStartRef.current = null;
    pendingPositionRef.current = null;
  }, [positionKey, onPositionChange, end]);

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

  // Don't render if not open or not mounted (SSR)
  if (!isOpen || !mounted) return null;

  // Render via portal
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
        width,
        maxHeight,
        overflow: maxHeight ? 'auto' : undefined,
        zIndex: 1000,
        willChange: 'transform',
        opacity: isDraggingRef.current ? 0.9 : 1,
        transition: isDraggingRef.current ? 'none' : 'opacity 0.2s',
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
      <Box p="sm">{children}</Box>
    </Paper>
  );

  return createPortal(panelContent, document.body);
}
