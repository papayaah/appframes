export interface ScreenImage {
  image?: string; // Base64 image (legacy support)
  mediaId?: number; // Reference to media library
  deviceFrame?: string; // Device frame type for this specific frame
  /** If true, this slot is intentionally cleared (render nothing). */
  cleared?: boolean;
  // Per-frame image pan (position of image inside the frame)
  panX?: number; // 0-100, default 50 (centered)
  panY?: number; // 0-100, default 50 (centered)
  /** Image rotation inside the frame (0-360 degrees, default 0) */
  imageRotation?: number;
  // Per-frame position on canvas (offset from default layout position)
  frameX?: number; // Offset in pixels from default position
  frameY?: number; // Offset in pixels from default position

  // Per-frame transforms (applied by CompositionRenderer wrapper)
  /** -60 to 60 degrees, default 0 */
  tiltX?: number;
  /** -60 to 60 degrees, default 0 */
  tiltY?: number;
  /** -180 to 180 degrees, default 0 */
  rotateZ?: number;
  /** 20 to 200 percent, default 100 */
  frameScale?: number;

  // Per-frame appearance
  /** Custom frame color (overrides device default). If undefined, uses device default. */
  frameColor?: string;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  backgroundPadding: number;
  backgroundRadius: number;
  textAlign: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
  textShadow: boolean;
  textShadowColor: string;
  textShadowBlur: number;
  textShadowOffsetX: number;
  textShadowOffsetY: number;
  italic: boolean;
  uppercase: boolean;
  maxWidth: number; // percentage of canvas width
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Inter',
  fontSize: 32,
  fontWeight: 700,
  color: '#1a1a1a',
  backgroundColor: 'transparent',
  backgroundOpacity: 100,
  backgroundPadding: 16,
  backgroundRadius: 8,
  textAlign: 'center',
  letterSpacing: 0,
  lineHeight: 1.4,
  textShadow: true,
  textShadowColor: 'rgba(0,0,0,0.1)',
  textShadowBlur: 4,
  textShadowOffsetX: 0,
  textShadowOffsetY: 2,
  italic: false,
  uppercase: false,
  maxWidth: 80,
};

export interface TextElement {
  id: string; // Unique identifier
  content: string; // Markdown-supported text content
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  rotation: number; // degrees
  style: TextStyle;
  visible: boolean;
  name: string;
  zIndex: number; // higher renders above
}

export interface CanvasSettings {
  canvasSize: string; // Export dimensions (App Store requirements)
  composition: 'single' | 'dual' | 'stack' | 'triple' | 'fan';
  selectedScreenIndex: number;
  selectedTextId?: string; // Currently selected text element (per screen)
  screenScale: number;
  screenPanX: number;
  screenPanY: number;
  orientation: 'portrait' | 'landscape';
  backgroundColor: string;
  canvasBackgroundMediaId?: number; // Full-canvas background image (optional)
}

export interface Screen {
  id: string;
  images: ScreenImage[]; // Array of images for this screen's composition (1 for single, 2 for dual/stack, 3 for triple/fan)
  name: string;
  settings: Omit<CanvasSettings, 'selectedScreenIndex'>; // Each screen has its own settings
  textElements: TextElement[]; // New multi-text system
}

export interface AppFramesActions {
  addScreen: (image: string) => void;
  replaceScreen: (index: number, image: string) => void;
  removeScreen: (id: string) => void;
}

export type FrameTransformProperty = 'tiltX' | 'tiltY' | 'rotateZ' | 'frameScale';

export function clampFrameTransform(value: number, property: FrameTransformProperty): number {
  if (!Number.isFinite(value)) return property === 'frameScale' ? 100 : 0;

  switch (property) {
    case 'rotateZ':
      return Math.max(-180, Math.min(180, value));
    case 'frameScale':
      return Math.max(20, Math.min(200, value));
    case 'tiltX':
    case 'tiltY':
    default:
      return Math.max(-60, Math.min(60, value));
  }
}


