// Base device types
export type DIYDeviceType = 'phone' | 'flip' | 'foldable' | 'tablet' | 'laptop' | 'desktop';

// Common options
export type BezelStyle = 'none' | 'thin' | 'standard' | 'thick';
export type CornerStyle = 'sharp' | 'rounded' | 'very-rounded';
export type ViewSide = 'front' | 'back';

// Phone-specific options
export type PhoneTopCutout = 'none' | 'notch' | 'dynamic-island' | 'punch-hole-center' | 'punch-hole-left' | 'punch-hole-right';
export type PhoneBottom = 'none' | 'home-button' | 'gesture-bar';
export type CameraLayout =
  | 'single'
  | 'dual-vertical'
  | 'dual-horizontal'
  | 'triple-triangle'    // Triangle pattern (iPhone style)
  | 'triple-vertical'    // 3 in a vertical line (Samsung style)
  | 'triple-horizontal'  // 3 in a horizontal line
  | 'quad-square'        // 4 cameras in 2x2 grid
  | 'quad-vertical'      // 4 in a vertical line
  | 'penta'              // 5 cameras (Nokia style)
  | 'island-square'      // iPhone Pro style island
  | 'island-circle';     // Pixel style circle island

// Foldable-specific options
export type FoldableState = 'folded' | 'unfolded';

// Tablet-specific options
export type TabletTopCutout = 'none' | 'punch-hole';
export type TabletBottom = 'none' | 'home-button';

// Laptop-specific options
export type LaptopTopCutout = 'none' | 'notch';
export type LaptopBaseStyle = 'standard' | 'fabric';
export type LaptopHinge = 'hidden' | 'visible';

// Desktop-specific options
export type DesktopStand = 'none' | 'simple' | 'apple-style' | 'vesa-mount';
export type DesktopChin = 'none' | 'standard' | 'large';

// DIY Options per device type
export interface PhoneDIYOptions {
  type: 'phone';
  view: ViewSide;
  bezel: BezelStyle;
  topCutout: PhoneTopCutout;
  bottom: PhoneBottom;
  corners: CornerStyle;
  cameraLayout?: CameraLayout;
  flash?: boolean;
}

export interface FlipDIYOptions {
  type: 'flip';
  view: ViewSide;
  bezel: 'thin' | 'standard';
  coverScreen: boolean;
  corners: 'rounded' | 'very-rounded';
}

export interface FoldableDIYOptions {
  type: 'foldable';
  view: ViewSide;
  state: FoldableState;
  bezel: 'thin' | 'standard';
  corners: 'rounded' | 'very-rounded';
}

export interface TabletDIYOptions {
  type: 'tablet';
  view: ViewSide;
  bezel: BezelStyle;
  topCutout: TabletTopCutout;
  bottom: TabletBottom;
  corners: CornerStyle;
  cameraLayout?: CameraLayout;
  flash?: boolean;
}

export interface LaptopDIYOptions {
  type: 'laptop';
  bezel: BezelStyle;
  topCutout: LaptopTopCutout;
  corners: 'sharp' | 'rounded';
  baseStyle: LaptopBaseStyle;
  hinge: LaptopHinge;
}

export interface DesktopDIYOptions {
  type: 'desktop';
  bezel: BezelStyle;
  stand: DesktopStand;
  corners: 'sharp' | 'rounded';
  chin: DesktopChin;
  allInOne: boolean;
}

export type DIYOptions =
  | PhoneDIYOptions
  | FlipDIYOptions
  | FoldableDIYOptions
  | TabletDIYOptions
  | LaptopDIYOptions
  | DesktopDIYOptions;

// Template definition
export interface DIYTemplate {
  id: string;
  name: string;
  category: DIYDeviceType;
  description: string;
  options: DIYOptions;
}

// Helper to get default options for each device type
export const getDefaultDIYOptions = (deviceType: DIYDeviceType): DIYOptions => {
  switch (deviceType) {
    case 'phone':
      return {
        type: 'phone',
        view: 'front',
        bezel: 'thin',
        topCutout: 'dynamic-island',
        bottom: 'none',
        corners: 'rounded',
      };
    case 'flip':
      return {
        type: 'flip',
        view: 'front',
        bezel: 'thin',
        coverScreen: true,
        corners: 'rounded',
      };
    case 'foldable':
      return {
        type: 'foldable',
        view: 'front',
        state: 'unfolded',
        bezel: 'thin',
        corners: 'rounded',
      };
    case 'tablet':
      return {
        type: 'tablet',
        view: 'front',
        bezel: 'thin',
        topCutout: 'none',
        bottom: 'none',
        corners: 'rounded',
      };
    case 'laptop':
      return {
        type: 'laptop',
        bezel: 'thin',
        topCutout: 'none',
        corners: 'rounded',
        baseStyle: 'standard',
        hinge: 'hidden',
      };
    case 'desktop':
      return {
        type: 'desktop',
        bezel: 'thin',
        stand: 'simple',
        corners: 'rounded',
        chin: 'none',
        allInOne: false,
      };
  }
};

// Bezel width values in pixels (at scale 1)
export const BEZEL_WIDTHS: Record<BezelStyle, number> = {
  none: 0,
  thin: 8,
  standard: 12,
  thick: 16,
};

// Corner radius values in pixels (at scale 1)
export const CORNER_RADII: Record<CornerStyle, number> = {
  sharp: 8,
  rounded: 40,
  'very-rounded': 52,
};

// Base dimensions for each device type (at scale 1)
export const BASE_DIMENSIONS: Record<DIYDeviceType, { width: number; height: number }> = {
  phone: { width: 280, height: 575 },
  flip: { width: 260, height: 640 },
  foldable: { width: 380, height: 480 },
  tablet: { width: 440, height: 580 },
  laptop: { width: 600, height: 380 },
  desktop: { width: 640, height: 360 },
};
