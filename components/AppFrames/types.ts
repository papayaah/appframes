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

export interface CanvasSettings {
  canvasSize: string; // Export dimensions (App Store requirements)
  deviceFrame: string; // Visual frame type
  composition: 'single' | 'dual' | 'stack' | 'triple' | 'fan' | 'split';
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
  tilt: 'none' | 'left' | 'right';
}

export interface Screen {
  id: string;
  images: ScreenImage[]; // Array of images for this screen's composition (1 for single, 2 for dual/stack, 3 for triple/fan)
  name: string;
  settings: Omit<CanvasSettings, 'selectedScreenIndex'>; // Each screen has its own settings
  splitPairId?: string;
}

export interface ScreensStudioActions {
  addScreen: (image: string) => void;
  replaceScreen: (index: number, image: string) => void;
  removeScreen: (id: string) => void;
}

