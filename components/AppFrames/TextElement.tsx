'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionIcon, Box, Textarea } from '@mantine/core';
import { IconRotate, IconTrash } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import type { TextElement as TextElementModel, TextStyle } from './types';
import { useInteractionLock } from './InteractionLockContext';

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
    };
  }, []);

  const style = element.style;

  const textShadowCss = style.textShadow
    ? `${style.textShadowOffsetX}px ${style.textShadowOffsetY}px ${style.textShadowBlur}px ${style.textShadowColor}`
    : 'none';

  const bgColor = style.backgroundColor !== 'transparent'
    ? hexToRgba(style.backgroundColor, style.backgroundOpacity)
    : 'transparent';

  const decodedText = useMemo(() => decodeHtmlEntities(element.content), [element.content]);
  const displayText = style.uppercase ? decodedText.toUpperCase() : decodedText;

  const effectiveRotation = rotationPreview ?? element.rotation;

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

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    if (isEditing || isRotating || isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect();

    const parent = rootRef.current?.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const startX = e.clientX;
    const startMaxWidth = element.style.maxWidth;

    setIsResizing(true);
    if (!gestureTokenRef.current) {
      gestureTokenRef.current = begin(ownerKey, 'text-resize');
    }

    const handleMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaPct = (deltaX / parentRect.width) * 100;
      const next = Math.max(10, Math.min(100, startMaxWidth + deltaPct));
      onUpdate({ style: { maxWidth: next } });
    };

    const handleEnd = () => {
      setIsResizing(false);
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
        maxWidth: `${style.maxWidth}%`,
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
        style={{
          position: 'absolute',
          inset: -6,
          borderRadius: style.backgroundRadius + 6,
          border: selected
            ? '2px solid #7950f2'
            : (isHovered || isDragging)
              ? '2px dashed #667eea'
              : '2px dashed transparent',
          backgroundColor: (isHovered || isDragging) && !selected ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
          transition: 'all 0.15s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Rotation handle */}
      {selected && !isEditing && (
        <Box
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
      {selected && !isEditing && (
        <ActionIcon
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

      {/* Resize handle (adjusts maxWidth to control wrapping) */}
      {selected && !isEditing && (
        <Box
          onMouseDown={handleResizeMouseDown}
          style={{
            position: 'absolute',
            right: -10,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 10,
            height: 22,
            borderRadius: 6,
            backgroundColor: 'rgba(121, 80, 242, 0.95)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            cursor: 'ew-resize',
          }}
          title="Drag to resize text box"
        />
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
                fontSize: style.fontSize,
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
                minWidth: 200,
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
              padding: style.backgroundPadding,
              borderRadius: style.backgroundRadius,
              backgroundColor: bgColor,
            }}
          >
            <Box
              style={{
                fontFamily: style.fontFamily,
                fontSize: style.fontSize,
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


