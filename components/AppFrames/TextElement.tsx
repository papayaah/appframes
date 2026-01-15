'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionIcon, Box, Textarea } from '@mantine/core';
import { IconRotate, IconTrash } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import type { TextElement as TextElementModel, TextStyle } from './types';
import { useInteractionLock } from './InteractionLockContext';
import { ensureFontLoaded } from './fontLoader';

// Decode HTML entities like &gt; &lt; &amp; etc.
const decodeHtmlEntities = (text: string): string => {
  const textarea = typeof document !== 'undefined' ? document.createElement('textarea') : null;
  if (textarea) {
    textarea.innerHTML = text;
    return textarea.value;
  }
  // Fallback for SSR - decode common entities manually
  return text
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
};

// Helper to convert hex color + opacity to rgba
const hexToRgba = (hex: string, opacity: number): string => {
  if (hex === 'transparent') {
    return 'transparent';
  }
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
  }
  return hex;
};

const normalizeRotation = (deg: number) => ((deg % 360) + 360) % 360;

const snapRotation = (deg: number, snapPoints: number[], thresholdDeg: number) => {
  const a = normalizeRotation(deg);
  for (const p of snapPoints) {
    const b = normalizeRotation(p);
    const diff = Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
    if (diff <= thresholdDeg) return b;
  }
  return a;
};

type TextResizeHandle = 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const degToRad = (deg: number) => (deg * Math.PI) / 180;
const rotatePoint = (p: { x: number; y: number }, deg: number) => {
  const r = degToRad(deg);
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
};

const MIN_TEXT_BOX_WIDTH_PCT = 2; // allow very small boxes (Canva-like)
const MAX_TEXT_BOX_WIDTH_PCT = 100;
const MIN_TEXT_FONT_SIZE = 8;
const MAX_TEXT_FONT_SIZE = 240;

const HANDLE_SIZE = 10;
const HANDLE_OFFSET = -8;

const getTextHandleCursor = (handle: TextResizeHandle): string => {
  switch (handle) {
    case 'left':
    case 'right':
      return 'ew-resize';
    case 'top-left':
    case 'bottom-right':
      return 'nwse-resize';
    case 'top-right':
    case 'bottom-left':
      return 'nesw-resize';
    default:
      return 'pointer';
  }
};

const getTextHandleStyle = (handle: TextResizeHandle): React.CSSProperties => {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: 999,
    backgroundColor: 'white',
    border: '2px solid #7950f2',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    pointerEvents: 'auto',
    zIndex: 51,
  };

  switch (handle) {
    case 'top-left':
      return { ...base, top: HANDLE_OFFSET, left: HANDLE_OFFSET };
    case 'top-right':
      return { ...base, top: HANDLE_OFFSET, right: HANDLE_OFFSET };
    case 'bottom-left':
      return { ...base, bottom: HANDLE_OFFSET, left: HANDLE_OFFSET };
    case 'bottom-right':
      return { ...base, bottom: HANDLE_OFFSET, right: HANDLE_OFFSET };
    case 'left':
      return { ...base, left: HANDLE_OFFSET, top: '50%', transform: 'translateY(-50%)' };
    case 'right':
      return { ...base, right: HANDLE_OFFSET, top: '50%', transform: 'translateY(-50%)' };
    default:
      return base;
  }
};

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!target || !(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return !!target.closest('input, textarea, [contenteditable="true"], [role="textbox"]');
};

interface TextElementProps {
  element: TextElementModel;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onUpdate: (updates: Omit<Partial<TextElementModel>, 'style'> & { style?: Partial<TextStyle> }) => void;
  onDelete: () => void;
}

export function TextElement({
  element,
  selected,
  disabled = false,
  onSelect,
  onUpdate,
  onDelete,
}: TextElementProps) {
  const isExporting =
    typeof document !== 'undefined' && document.body?.dataset?.appframesExporting === 'true';
  const effectiveSelected = selected && !isExporting;
  const { isLocked, isOwnerActive, begin, end } = useInteractionLock();
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [rotationPreview, setRotationPreview] = useState<number | null>(null);
  const [editText, setEditText] = useState(element.content);

  const rootRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rotationPreviewRef = useRef<number | null>(null);
  const lastClickAtRef = useRef<number>(0);
  const dragPosRef = useRef<{ x: number; y: number } | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const resizeRafRef = useRef<number | null>(null);
  const pendingVisualRef = useRef<{
    x?: number;
    y?: number;
    boxWidthPct?: number;
    fontSizePx?: number;
    paddingPx?: number;
  } | null>(null);
  const gestureTokenRef = useRef<string | null>(null);
  const ownerKey = `text:${element.id}`;

  useEffect(() => {
    if (!isEditing) {
      setEditText(element.content);
    }
  }, [element.content, isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    return () => {
      if (dragRafRef.current != null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      if (resizeRafRef.current != null) {
        cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = null;
      }
    };
  }, []);

  const style = element.style;

  // Lazy-load Google Fonts on demand (avoids fetching a big font bundle at app start).
  useEffect(() => {
    ensureFontLoaded(style?.fontFamily);
  }, [style?.fontFamily]);

  const textShadowCss = style.textShadow
    ? `${style.textShadowOffsetX}px ${style.textShadowOffsetY}px ${style.textShadowBlur}px ${style.textShadowColor}`
    : 'none';

  const bgColor = style.backgroundColor !== 'transparent'
    ? hexToRgba(style.backgroundColor, style.backgroundOpacity)
    : 'transparent';

  const decodedText = useMemo(() => decodeHtmlEntities(element.content), [element.content]);
  const displayText = style.uppercase ? decodedText.toUpperCase() : decodedText;

  const effectiveRotation = rotationPreview ?? element.rotation;

  const scheduleApplyResizeVisual = () => {
    if (resizeRafRef.current != null) return;
    resizeRafRef.current = window.requestAnimationFrame(() => {
      resizeRafRef.current = null;
      const el = rootRef.current;
      const pending = pendingVisualRef.current;
      if (!el || !pending) return;
      if (typeof pending.x === 'number') el.style.left = `${pending.x}%`;
      if (typeof pending.y === 'number') el.style.top = `${pending.y}%`;
      if (typeof pending.boxWidthPct === 'number') el.style.width = `${pending.boxWidthPct}%`;
      if (typeof pending.fontSizePx === 'number') {
        el.style.setProperty('--appframes-text-font-size', `${pending.fontSizePx}px`);
      }
      if (typeof pending.paddingPx === 'number') {
        el.style.setProperty('--appframes-text-bg-padding', `${pending.paddingPx}px`);
      }
    });
  };

  const handleSelect = (e: React.MouseEvent) => {
    if (disabled) return;
    if (isEditableTarget(e.target)) return;
    e.stopPropagation();
    onSelect();
  };

  const enterEditMode = () => {
    onSelect();
    setIsEditing(true);
    setEditText(element.content);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    if (isEditing || isRotating || isResizing) return;
    if (isEditableTarget(e.target)) return;
    // Always stop propagation so the canvas doesn't deselect between clicks
    e.stopPropagation();
    onSelect();
    // Don't start a drag on the 2nd click (we'll treat it as a potential edit)
    if (e.detail >= 2) return;

    const parent = rootRef.current?.parentElement;
    if (!parent) return;

    setIsDragging(true);
    setIsHovered(false);
    if (!gestureTokenRef.current) {
      gestureTokenRef.current = begin(ownerKey, 'text-drag');
    }

    const parentRect = parent.getBoundingClientRect();
    const selfRect = rootRef.current?.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = element.x;
    const startPosY = element.y;
    // Keep the element fully within canvas bounds (prevents clipping that can look like re-wrapping)
    const halfWPercent = selfRect ? (selfRect.width / 2 / parentRect.width) * 100 : 0;
    const halfHPercent = selfRect ? (selfRect.height / 2 / parentRect.height) * 100 : 0;

    const applyDragPos = () => {
      dragRafRef.current = null;
      const pos = dragPosRef.current;
      const el = rootRef.current;
      if (!pos || !el) return;
      // Imperative updates for buttery-smooth dragging (avoid React renders per mousemove)
      el.style.left = `${pos.x}%`;
      el.style.top = `${pos.y}%`;
    };

    const scheduleApply = () => {
      if (dragRafRef.current != null) return;
      dragRafRef.current = window.requestAnimationFrame(applyDragPos);
    };

    const handleMove = (moveEvent: MouseEvent) => {
      const deltaX = ((moveEvent.clientX - startX) / parentRect.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / parentRect.height) * 100;

      const minX = Math.max(0, halfWPercent);
      const maxX = Math.min(100, 100 - halfWPercent);
      const minY = Math.max(0, halfHPercent);
      const maxY = Math.min(100, 100 - halfHPercent);

      const newX = Math.max(minX, Math.min(maxX, startPosX + deltaX));
      const newY = Math.max(minY, Math.min(maxY, startPosY + deltaY));

      dragPosRef.current = { x: newX, y: newY };
      scheduleApply();
    };

    const handleEnd = () => {
      setIsDragging(false);
      // Commit final position to state once (keeps dragging smooth)
      const finalPos = dragPosRef.current;
      dragPosRef.current = null;
      if (dragRafRef.current != null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      if (finalPos) {
        onUpdate({ x: finalPos.x, y: finalPos.y });
      }
      if (gestureTokenRef.current) {
        end(gestureTokenRef.current);
        gestureTokenRef.current = null;
      }
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
  };

  const handleTextResizeMouseDown = (handle: TextResizeHandle) => (e: React.MouseEvent) => {
    if (disabled) return;
    if (isEditing || isRotating || isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();

    const el = rootRef.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const parentRect = parent.getBoundingClientRect();
    const selfRect = el.getBoundingClientRect();

    const startClient = { x: e.clientX, y: e.clientY };
    const start = {
      x: element.x,
      y: element.y,
      boxWidthPct: element.style.maxWidth,
      boxWidthPx: (element.style.maxWidth / 100) * parentRect.width,
      boxHeightPx: selfRect.height,
      fontSizePx: element.style.fontSize,
      paddingPx: element.style.backgroundPadding,
      rotationDeg: effectiveRotation,
    };

    setIsResizing(true);
    if (!gestureTokenRef.current) {
      gestureTokenRef.current = begin(ownerKey, 'text-resize');
    }

    const handleMove = (moveEvent: MouseEvent) => {
      const deltaScreen = { x: moveEvent.clientX - startClient.x, y: moveEvent.clientY - startClient.y };
      // Convert pointer delta into the element's local (un-rotated) space so resize feels correct when rotated.
      const deltaLocal = rotatePoint(deltaScreen, -start.rotationDeg);

      // Width resize (side handles): adjust the *box width* and shift the element center so the opposite edge stays anchored.
      if (handle === 'left' || handle === 'right') {
        const deltaWidthPct =
          handle === 'right'
            ? (deltaLocal.x / parentRect.width) * 100
            : (-deltaLocal.x / parentRect.width) * 100;

        const nextBoxWidthPct = clamp(
          start.boxWidthPct + deltaWidthPct,
          MIN_TEXT_BOX_WIDTH_PCT,
          MAX_TEXT_BOX_WIDTH_PCT
        );

        const deltaBoxWidthPx = ((nextBoxWidthPct - start.boxWidthPct) / 100) * parentRect.width;
        const centerShiftLocal = {
          x: (deltaBoxWidthPx / 2) * (handle === 'right' ? 1 : -1),
          y: 0,
        };
        const centerShiftScreen = rotatePoint(centerShiftLocal, start.rotationDeg);
        const nextX = start.x + (centerShiftScreen.x / parentRect.width) * 100;
        const nextY = start.y + (centerShiftScreen.y / parentRect.height) * 100;

        pendingVisualRef.current = { x: nextX, y: nextY, boxWidthPct: nextBoxWidthPct };
        scheduleApplyResizeVisual();
        return;
      }

      // Corner handles: "scale" the text (font size + box size) proportionally (Canva-like).
      const signX = handle.includes('right') ? 1 : -1;
      const signY = handle.includes('bottom') ? 1 : -1;
      const outwardX = signX * deltaLocal.x;
      const outwardY = signY * deltaLocal.y;
      const outward = (outwardX + outwardY) / 2;
      const magnitude = Math.max(Math.abs(outwardX), Math.abs(outwardY));
      const delta = Math.sign(outward) * magnitude;

      // Sensitivity tuned so ~100px drag ≈ ~50% size change.
      const scaleFactor = clamp(1 + delta * 0.005, 0.2, 5);

      const nextFontSizePx = clamp(start.fontSizePx * scaleFactor, MIN_TEXT_FONT_SIZE, MAX_TEXT_FONT_SIZE);
      const nextPaddingPx = clamp(start.paddingPx * scaleFactor, 0, 80);
      const nextBoxWidthPct = clamp(
        (start.boxWidthPx * scaleFactor / parentRect.width) * 100,
        MIN_TEXT_BOX_WIDTH_PCT,
        MAX_TEXT_BOX_WIDTH_PCT
      );

      const nextBoxHeightPx = start.boxHeightPx * scaleFactor;
      const deltaW = (nextBoxWidthPct - start.boxWidthPct) / 100 * parentRect.width;
      const deltaH = nextBoxHeightPx - start.boxHeightPx;

      const centerShiftLocal = { x: (signX * deltaW) / 2, y: (signY * deltaH) / 2 };
      const centerShiftScreen = rotatePoint(centerShiftLocal, start.rotationDeg);
      const nextX = start.x + (centerShiftScreen.x / parentRect.width) * 100;
      const nextY = start.y + (centerShiftScreen.y / parentRect.height) * 100;

      pendingVisualRef.current = {
        x: nextX,
        y: nextY,
        boxWidthPct: nextBoxWidthPct,
        fontSizePx: nextFontSizePx,
        paddingPx: nextPaddingPx,
      };
      scheduleApplyResizeVisual();
    };

    const handleEnd = () => {
      setIsResizing(false);

      const finalPending = pendingVisualRef.current;
      pendingVisualRef.current = null;
      if (resizeRafRef.current != null) {
        cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = null;
      }

      // Commit to React state once (persistence + re-renders happen after gesture).
      if (finalPending) {
        const updates: Omit<Partial<TextElementModel>, 'style'> & { style?: Partial<TextStyle> } = {};
        if (typeof finalPending.x === 'number') updates.x = finalPending.x;
        if (typeof finalPending.y === 'number') updates.y = finalPending.y;
        const styleUpdates: Partial<TextStyle> = {};
        if (typeof finalPending.boxWidthPct === 'number') styleUpdates.maxWidth = finalPending.boxWidthPct;
        if (typeof finalPending.fontSizePx === 'number') styleUpdates.fontSize = finalPending.fontSizePx;
        if (typeof finalPending.paddingPx === 'number') styleUpdates.backgroundPadding = finalPending.paddingPx;
        if (Object.keys(styleUpdates).length > 0) updates.style = styleUpdates;
        if (Object.keys(updates).length > 0) onUpdate(updates);
      }

      // Ensure CSS vars snap back to state-driven values after commit.
      const el = rootRef.current;
      if (el) {
        el.style.setProperty('--appframes-text-font-size', `${element.style.fontSize}px`);
        el.style.setProperty('--appframes-text-bg-padding', `${element.style.backgroundPadding}px`);
      }

      if (gestureTokenRef.current) {
        end(gestureTokenRef.current);
        gestureTokenRef.current = null;
      }
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
  };

  const commitEdit = () => {
    setIsEditing(false);
    if (editText !== element.content) {
      onUpdate({ content: editText });
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditText(element.content);
  };

  const handleRotateMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    if (isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();

    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    setIsRotating(true);
    if (!gestureTokenRef.current) {
      gestureTokenRef.current = begin(ownerKey, 'text-rotate');
    }

    const handleMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - cx;
      const dy = moveEvent.clientY - cy;
      const angleRad = Math.atan2(dy, dx);
      const angleDeg = (angleRad * 180) / Math.PI;
      // Make 0° be "upright" (mouse above = 0)
      const rawRotation = angleDeg + 90;
      const snapped = snapRotation(rawRotation, [0, 45, 90, 135, 180, 225, 270, 315], 5);
      setRotationPreview(snapped);
      rotationPreviewRef.current = snapped;
    };

    const handleEnd = () => {
      setIsRotating(false);
      const next = rotationPreviewRef.current ?? element.rotation;
      rotationPreviewRef.current = null;
      setRotationPreview(null);
      onUpdate({ rotation: next });
      if (gestureTokenRef.current) {
        end(gestureTokenRef.current);
        gestureTokenRef.current = null;
      }
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
  };

  return (
    <Box
      ref={rootRef}
      style={{
        position: 'absolute',
        top: `${element.y}%`,
        left: `${element.x}%`,
        transform: `translate(-50%, -50%) rotate(${effectiveRotation}deg)`,
        cursor: disabled
          ? 'default'
          : isEditing
            ? 'text'
            : isResizing
              ? 'ew-resize'
            : isDragging
              ? 'grabbing'
              : 'grab',
        userSelect: isEditing ? 'text' : 'none',
        pointerEvents: disabled ? 'none' : 'auto',
        zIndex: selected ? 1000 : (element.zIndex ?? 1) + 10,
        // Treat `style.maxWidth` as the editable text box width (Canva-like), not just a wrapping cap.
        width: `${style.maxWidth}%`,
        // Drive live resize previews via CSS vars (imperative updates) to avoid React rerenders per mousemove.
        ['--appframes-text-font-size' as any]: `${style.fontSize}px`,
        ['--appframes-text-bg-padding' as any]: `${style.backgroundPadding}px`,
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={(e) => {
        if (disabled) return;
        if (isDragging || isRotating || isEditing || isResizing) return;
        if (isEditableTarget(e.target)) return;
        // Robust double-click detection (some preventDefault/drag paths can swallow native dblclick)
        const now = Date.now();
        const delta = now - lastClickAtRef.current;
        lastClickAtRef.current = now;
        // Typical dblclick threshold is ~500ms; keep tighter so it doesn't feel accidental
        if (delta > 0 && delta < 320) {
          lastClickAtRef.current = 0;
          e.stopPropagation();
          enterEditMode();
        }
      }}
      onClick={handleSelect}
      onDoubleClick={(e) => {
        // Keep native dblclick too (when it does fire)
        if (disabled) return;
        e.stopPropagation();
        enterEditMode();
      }}
      onMouseEnter={() => {
        if (disabled) return;
        if (isLocked && !isOwnerActive(ownerKey)) return;
        if (!isDragging) setIsHovered(true);
      }}
      onMouseLeave={() => { if (!isDragging && !disabled) setIsHovered(false); }}
    >
      {/* Hover/selection border */}
      <Box
        data-export-hide="true"
        style={{
          position: 'absolute',
          inset: -6,
          borderRadius: style.backgroundRadius + 6,
          border: effectiveSelected
            ? '2px solid #7950f2'
            : (isHovered || isDragging)
              ? '2px dashed #667eea'
              : '2px dashed transparent',
          backgroundColor: (isHovered || isDragging) && !effectiveSelected ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
          transition: 'all 0.15s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Rotation handle */}
      {effectiveSelected && !isEditing && (
        <Box
          data-export-hide="true"
          style={{
            position: 'absolute',
            top: -34,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ActionIcon
            data-export-hide="true"
            size="sm"
            variant="filled"
            color="violet"
            onMouseDown={handleRotateMouseDown}
            aria-label="Rotate"
            title="Rotate"
            style={{ borderRadius: 999 }}
          >
            <IconRotate size={14} />
          </ActionIcon>
          {isRotating && (
            <Box
              data-export-hide="true"
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#7950f2',
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: '1px solid rgba(121,80,242,0.3)',
                borderRadius: 6,
                padding: '2px 8px',
                whiteSpace: 'nowrap',
              }}
            >
              {Math.round(effectiveRotation)}°
            </Box>
          )}
        </Box>
      )}

      {/* Delete button */}
      {effectiveSelected && !isEditing && (
        <ActionIcon
          data-export-hide="true"
          size="sm"
          variant="filled"
          color="red"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete text"
          title="Delete"
          style={{ position: 'absolute', top: -10, right: -10, borderRadius: 999 }}
        >
          <IconTrash size={14} />
        </ActionIcon>
      )}

      {/* Canva-style resize handles */}
      {effectiveSelected && !isEditing && (
        <Box
          data-export-hide="true"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50 }}
        >
          {(
            [
              'top-left',
              'top-right',
              'bottom-right',
              'bottom-left',
              'left',
              'right',
            ] as TextResizeHandle[]
          ).map((h) => (
            <Box
              key={h}
              onMouseDown={handleTextResizeMouseDown(h)}
              style={{
                ...getTextHandleStyle(h),
                cursor: getTextHandleCursor(h),
                backgroundColor: isResizing ? '#7950f2' : 'white',
              }}
              title={
                h === 'left' || h === 'right'
                  ? 'Resize text box width'
                  : 'Scale text (font size + box)'
              }
            />
          ))}
        </Box>
      )}

      {isEditing ? (
        <Box
          style={{
            position: 'relative',
            padding: 8,
            borderRadius: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 0 0 2px #667eea, 0 4px 20px rgba(102, 126, 234, 0.3)',
          }}
        >
          <Textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
              } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                commitEdit();
              }
            }}
            autosize
            minRows={1}
            maxRows={8}
            styles={{
              input: {
                fontFamily: style.fontFamily,
                fontSize: 'var(--appframes-text-font-size)',
                fontWeight: style.fontWeight,
                fontStyle: style.italic ? 'italic' : 'normal',
                color: style.color,
                textAlign: style.textAlign,
                letterSpacing: style.letterSpacing,
                lineHeight: style.lineHeight,
                textTransform: style.uppercase ? 'uppercase' : 'none',
                border: 'none',
                background: 'transparent',
                padding: 0,
                width: '100%',
                minWidth: 0,
                resize: 'none',
              },
            }}
          />
          <Box
            style={{
              position: 'absolute',
              bottom: -24,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 10,
              color: '#667eea',
              whiteSpace: 'nowrap',
              fontWeight: 500,
              backgroundColor: 'rgba(255,255,255,0.9)',
              padding: '2px 8px',
              borderRadius: 4,
            }}
          >
            Press Enter to save, Esc to cancel
          </Box>
        </Box>
      ) : (
        <Box style={{ position: 'relative' }}>
          {/* Actual text with background */}
          <Box
            style={{
              padding: 'var(--appframes-text-bg-padding)',
              borderRadius: style.backgroundRadius,
              backgroundColor: bgColor,
            }}
          >
            <Box
              style={{
                fontFamily: style.fontFamily,
                fontSize: 'var(--appframes-text-font-size)',
                fontWeight: style.fontWeight,
                fontStyle: style.italic ? 'italic' : 'normal',
                color: style.color,
                textAlign: style.textAlign,
                letterSpacing: style.letterSpacing,
                lineHeight: style.lineHeight,
                textShadow: textShadowCss,
                wordBreak: 'break-word',
              }}
              className="markdown-content"
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p style={{ margin: '0 0 0.5em 0' }}>{children}</p>,
                  h1: ({ children }) => <h1 style={{ margin: '0 0 0.5em 0', fontSize: '1.5em', fontWeight: 'bold' }}>{children}</h1>,
                  h2: ({ children }) => <h2 style={{ margin: '0 0 0.5em 0', fontSize: '1.3em', fontWeight: 'bold' }}>{children}</h2>,
                  h3: ({ children }) => <h3 style={{ margin: '0 0 0.5em 0', fontSize: '1.1em', fontWeight: 'bold' }}>{children}</h3>,
                  h4: ({ children }) => <h4 style={{ margin: '0 0 0.5em 0', fontSize: '1em', fontWeight: 'bold' }}>{children}</h4>,
                  h5: ({ children }) => <h5 style={{ margin: '0 0 0.5em 0', fontSize: '0.9em', fontWeight: 'bold' }}>{children}</h5>,
                  h6: ({ children }) => <h6 style={{ margin: '0 0 0.5em 0', fontSize: '0.85em', fontWeight: 'bold' }}>{children}</h6>,
                  ul: ({ children }) => <ul style={{ margin: '0 0 0.5em 0', paddingLeft: '1.5em' }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ margin: '0 0 0.5em 0', paddingLeft: '1.5em' }}>{children}</ol>,
                  li: ({ children }) => <li style={{ margin: '0.2em 0' }}>{children}</li>,
                  a: ({ children, href }) => <a href={href} style={{ color: 'inherit', textDecoration: 'underline' }}>{children}</a>,
                  strong: ({ children }) => <strong style={{ fontWeight: 'bold' }}>{children}</strong>,
                  em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                  code: ({ children }) => <code style={{ fontFamily: 'monospace', backgroundColor: 'rgba(0,0,0,0.1)', padding: '0.1em 0.3em', borderRadius: '3px' }}>{children}</code>,
                  blockquote: ({ children }) => <blockquote style={{ margin: '0.5em 0', paddingLeft: '1em', borderLeft: '3px solid currentColor', opacity: 0.8 }}>{children}</blockquote>,
                }}
              >
                {displayText}
              </ReactMarkdown>
            </Box>
          </Box>

          {isHovered && !isDragging && !selected && (
            <Box
              style={{
                position: 'absolute',
                bottom: -24,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 10,
                color: '#667eea',
                whiteSpace: 'nowrap',
                fontWeight: 500,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              Drag to move, double-click to edit
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}


