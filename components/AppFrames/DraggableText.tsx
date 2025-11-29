'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Textarea } from '@mantine/core';

interface DraggableTextProps {
  text: string;
  positionX: number; // 0-100 percentage
  positionY: number; // 0-100 percentage
  onPositionChange: (x: number, y: number) => void;
  onTextChange: (text: string) => void;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
}

export function DraggableText({
  text,
  positionX,
  positionY,
  onPositionChange,
  onTextChange,
  fontSize = 32,
  fontWeight = 700,
  color = '#1a1a1a',
}: DraggableTextProps) {
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
                fontSize,
                fontWeight,
                color,
                textAlign: 'center',
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
            padding: '8px 16px',
            borderRadius: 8,
            backgroundColor: isHovered || isDragging ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
            border: isHovered || isDragging ? '2px dashed #667eea' : '2px dashed transparent',
            transition: 'all 0.15s ease',
          }}
        >
          <Box
            style={{
              color,
              fontSize,
              fontWeight,
              textAlign: 'center',
              maxWidth: '80vw',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {text}
          </Box>
          {isHovered && !isDragging && (
            <Box
              style={{
                position: 'absolute',
                bottom: -20,
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
