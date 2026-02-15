import type { DIYOptions } from './diy-frames/types';

export interface ScreenImage {
  image?: string; // Base64 image (legacy support - not used for sync)
  mediaId?: number; // Reference to local media library (OPFS)
  serverMediaPath?: string; // Server-side media path (for cross-device sync)
  /** DIY device options for this frame */
  diyOptions?: DIYOptions;
  /** Template ID that was used (for UI display) */
  diyTemplateId?: string;
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
  /** 20 to 500 percent, default 100 */
  frameScale?: number;

  // Per-frame appearance
  /** Custom frame color (overrides device default). If undefined, uses device default. */
  frameColor?: string;
  /** Per-frame visual effects (shadow, glow, opacity) */
  frameEffects?: FrameEffects;
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

export interface BackgroundEffects {
  blur: number;              // 0-50 px
  overlayColor: string;      // hex color
  overlayOpacity: number;    // 0-100%
  vignetteIntensity: number; // 0-100%
  noiseIntensity: number;    // 0-100%
}

export const DEFAULT_BACKGROUND_EFFECTS: BackgroundEffects = {
  blur: 0,
  overlayColor: '#000000',
  overlayOpacity: 0,
  vignetteIntensity: 0,
  noiseIntensity: 0,
};

export interface FrameEffects {
  shadowEnabled: boolean;
  shadowBlur: number;       // 0-50 px
  shadowOffsetX: number;    // -50 to 50 px
  shadowOffsetY: number;    // -50 to 50 px
  shadowColor: string;      // hex color
  shadowOpacity: number;    // 0-100%
  glowEnabled: boolean;
  glowColor: string;        // hex color
  glowBlur: number;         // 0-60 px
  glowIntensity: number;    // 0-100%
  opacity: number;          // 0-100%, default 100
  outlineEnabled: boolean;
  outlineWidth: number;     // 1-10 px
  outlineColor: string;     // hex color
  outlineOffset: number;    // 0-20 px
}

export const DEFAULT_FRAME_EFFECTS: FrameEffects = {
  shadowEnabled: false,
  shadowBlur: 20,
  shadowOffsetX: 0,
  shadowOffsetY: 10,
  shadowColor: '#000000',
  shadowOpacity: 25,
  glowEnabled: false,
  glowColor: '#667eea',
  glowBlur: 30,
  glowIntensity: 50,
  opacity: 100,
  outlineEnabled: false,
  outlineWidth: 2,
  outlineColor: '#ffffff',
  outlineOffset: 4,
};

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
  canvasBackgroundServerPath?: string; // Server-side path for canvas background (set during sync)
  backgroundEffects?: BackgroundEffects;
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

// Shared Background - spans across multiple screens for panoramic effect
export interface SharedBackground {
  enabled?: boolean;  // Deprecated — kept for backward compat with saved data
  screenIds: string[];  // Participating screens in visual order
  type: 'gradient' | 'image';
  // For gradient type
  gradient?: {
    stops: Array<{ color: string; position: number }>;  // position: 0-100
    direction: 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up';
  };
  // For image type
  mediaId?: number;  // References media library
  serverMediaPath?: string; // Server-side media path (for cross-device sync & export)
  imageFit?: 'fill' | 'fit';  // Default: 'fill'
  imageVerticalAlign?: 'top' | 'center' | 'bottom';  // Default: 'center'
  imageHorizontalAlign?: 'left' | 'center' | 'right';  // Default: 'center'
}

export type FrameTransformProperty = 'tiltX' | 'tiltY' | 'rotateZ' | 'frameScale';

export function clampFrameTransform(value: number, property: FrameTransformProperty): number {
  if (!Number.isFinite(value)) return property === 'frameScale' ? 100 : 0;

  switch (property) {
    case 'rotateZ':
      return Math.max(-180, Math.min(180, value));
    case 'frameScale':
      return Math.max(20, Math.min(500, value));
    case 'tiltX':
    case 'tiltY':
    default:
      return Math.max(-60, Math.min(60, value));
  }
}


