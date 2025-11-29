export interface ScreenImage {
  image?: string; // Base64 image (legacy support)
  mediaId?: number; // Reference to media library
  // Per-frame image pan (position of image inside the frame)
  panX?: number; // 0-100, default 50 (centered)
  panY?: number; // 0-100, default 50 (centered)
  // Per-frame position on canvas (offset from default layout position)
  frameX?: number; // Offset in pixels from default position
  frameY?: number; // Offset in pixels from default position
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

export interface CanvasSettings {
  canvasSize: string; // Export dimensions (App Store requirements)
  deviceFrame: string; // Visual frame type
  composition: 'single' | 'dual' | 'stack' | 'triple' | 'fan';
  compositionScale: number;
  captionVertical: number;
  captionHorizontal: number;
  selectedScreenIndex: number;
  screenScale: number;
  screenPanX: number;
  screenPanY: number;
  orientation: 'portrait' | 'landscape';
  backgroundColor: string;
  captionText: string;
  showCaption: boolean;
  captionStyle: TextStyle;
}

export interface Screen {
  id: string;
  images: ScreenImage[]; // Array of images for this screen's composition (1 for single, 2 for dual/stack, 3 for triple/fan)
  name: string;
  settings: Omit<CanvasSettings, 'selectedScreenIndex'>; // Each screen has its own settings
}

export interface ScreensStudioActions {
  addScreen: (image: string) => void;
  replaceScreen: (index: number, image: string) => void;
  removeScreen: (id: string) => void;
}

