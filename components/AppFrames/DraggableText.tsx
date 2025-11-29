'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Textarea } from '@mantine/core';
import { TextStyle, DEFAULT_TEXT_STYLE } from './types';

interface DraggableTextProps {
  text: string;
  positionX: number; // 0-100 percentage
  positionY: number; // 0-100 percentage
  onPositionChange: (x: number, y: number) => void;
  onTextChange: (text: string) => void;
  style?: Partial<TextStyle>;
}

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

export function DraggableText({
  text,
  positionX,
  positionY,
  onPositionChange,
  onTextChange,
  style: styleProp,
}: DraggableTextProps) {
  // Merge provided style with defaults
  const style: TextStyle = { ...DEFAULT_TEXT_STYLE, ...styleProp };

  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [editText, setEditText] = useState(text);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync edit text when prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditText(text);
    }
  }, [text, isEditing]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const parent = containerRef.current?.parentElement;
    if (!parent) {
      return;
    }

    setIsDragging(true);
    setIsHovered(false);

    const parentRect = parent.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = positionX;
    const startPosY = positionY;

    const handleMove = (moveEvent: MouseEvent) => {
      const deltaX = ((moveEvent.clientX - startX) / parentRect.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / parentRect.height) * 100;

      const newX = Math.max(0, Math.min(100, startPosX + deltaX));
      const newY = Math.max(0, Math.min(100, startPosY + deltaY));

      onPositionChange(newX, newY);
    };

    const handleEnd = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
    setEditText(text);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editText !== text) {
      onTextChange(editText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(text); // Revert changes
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  // Build text shadow CSS
  const textShadowCss = style.textShadow
    ? `${style.textShadowOffsetX}px ${style.textShadowOffsetY}px ${style.textShadowBlur}px ${style.textShadowColor}`
    : 'none';

  // Build background color with opacity
  const bgColor = style.backgroundColor !== 'transparent'
    ? hexToRgba(style.backgroundColor, style.backgroundOpacity)
    : 'transparent';

  // Display text (apply uppercase if needed)
  const displayText = style.uppercase ? text.toUpperCase() : text;

  return (
    <Box
      ref={containerRef}
      style={{
        position: 'absolute',
        top: `${positionY}%`,
        left: `${positionX}%`,
        transform: 'translate(-50%, -50%)',
        cursor: isEditing ? 'text' : isDragging ? 'grabbing' : 'grab',
        userSelect: isEditing ? 'text' : 'none',
        zIndex: isEditing ? 100 : 10,
        maxWidth: `${style.maxWidth}%`,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => { if (!isDragging) { setIsHovered(true); } }}
      onMouseLeave={() => { if (!isDragging) { setIsHovered(false); } }}
    >
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
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autosize
            minRows={1}
            maxRows={5}
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
            }}
          >
            Press Enter to save, Esc to cancel
          </Box>
        </Box>
      ) : (
        <Box
          style={{
            position: 'relative',
          }}
        >
          {/* Highlight border when hovered/dragging */}
          <Box
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: style.backgroundRadius + 4,
              border: isHovered || isDragging ? '2px dashed #667eea' : '2px dashed transparent',
              backgroundColor: isHovered || isDragging ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
              transition: 'all 0.15s ease',
              pointerEvents: 'none',
            }}
          />
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
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {displayText}
            </Box>
          </Box>
          {isHovered && !isDragging && (
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
