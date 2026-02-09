import type { DIYTemplate, DIYDeviceType, DeviceBrand } from './types';

export const DIY_TEMPLATES: DIYTemplate[] = [
  // Phone Templates
  {
    id: 'iphone-pro',
    name: 'iPhone Pro',
    category: 'phone',
    brand: 'apple',
    description: 'Dynamic Island',
    options: {
      type: 'phone',
      view: 'front',
      bezel: 'thin',
      topCutout: 'dynamic-island',
      bottom: 'none',
      corners: 'rounded',
      cameraLayout: 'island-square',
      flash: true,
    },
  },
  {
    id: 'iphone',
    name: 'iPhone',
    category: 'phone',
    brand: 'apple',
    description: 'Notch',
    options: {
      type: 'phone',
      view: 'front',
      bezel: 'thin',
      topCutout: 'notch',
      bottom: 'none',
      corners: 'rounded',
      cameraLayout: 'triple-triangle',
      flash: true,
    },
  },
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    category: 'phone',
    brand: 'apple',
    description: 'Home Button',
    options: {
      type: 'phone',
      view: 'front',
      bezel: 'thick',
      topCutout: 'none',
      bottom: 'home-button',
      corners: 'rounded',
      cameraLayout: 'single',
      flash: true,
    },
  },
  {
    id: 'pixel',
    name: 'Pixel',
    category: 'phone',
    brand: 'other',
    description: 'Punch Hole (left)',
    options: {
      type: 'phone',
      view: 'front',
      bezel: 'thin',
      topCutout: 'punch-hole-left',
      bottom: 'none',
      corners: 'rounded',
      cameraLayout: 'island-circle',
      flash: true,
    },
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    category: 'phone',
    brand: 'samsung',
    description: 'Punch Hole (center)',
    options: {
      type: 'phone',
      view: 'front',
      bezel: 'thin',
      topCutout: 'punch-hole-center',
      bottom: 'none',
      corners: 'rounded',
      cameraLayout: 'triple-vertical',
      flash: true,
    },
  },

  // Flip Template
  {
    id: 'galaxy-z-flip',
    name: 'Galaxy Z Flip',
    category: 'flip',
    brand: 'samsung',
    description: 'Cover Screen',
    options: {
      type: 'flip',
      view: 'front',
      bezel: 'thin',
      coverScreen: true,
      corners: 'rounded',
    },
  },

  // Foldable Template
  {
    id: 'galaxy-z-fold',
    name: 'Galaxy Z Fold',
    category: 'foldable',
    brand: 'samsung',
    description: 'Unfolded',
    options: {
      type: 'foldable',
      view: 'front',
      state: 'unfolded',
      bezel: 'thin',
      corners: 'rounded',
    },
  },

  // Tablet Templates
  {
    id: 'ipad-pro',
    name: 'iPad Pro',
    category: 'tablet',
    brand: 'apple',
    description: 'Thin Bezel',
    options: {
      type: 'tablet',
      view: 'front',
      bezel: 'thin',
      topCutout: 'none',
      bottom: 'none',
      corners: 'rounded',
      cameraLayout: 'dual-horizontal',
      flash: true,
    },
  },
  {
    id: 'ipad',
    name: 'iPad',
    category: 'tablet',
    brand: 'apple',
    description: 'Standard Bezel',
    options: {
      type: 'tablet',
      view: 'front',
      bezel: 'standard',
      topCutout: 'none',
      bottom: 'none',
      corners: 'rounded',
      cameraLayout: 'single',
      flash: false,
    },
  },
  {
    id: 'ipad-mini',
    name: 'iPad Mini',
    category: 'tablet',
    brand: 'apple',
    description: 'Compact',
    options: {
      type: 'tablet',
      view: 'front',
      bezel: 'standard',
      topCutout: 'none',
      bottom: 'none',
      corners: 'rounded',
      cameraLayout: 'single',
      flash: false,
    },
  },
  {
    id: 'galaxy-tab',
    name: 'Galaxy Tab',
    category: 'tablet',
    brand: 'samsung',
    description: 'Standard Bezel',
    options: {
      type: 'tablet',
      view: 'front',
      bezel: 'standard',
      topCutout: 'none',
      bottom: 'none',
      corners: 'rounded',
      cameraLayout: 'dual-vertical',
      flash: true,
    },
  },

  // Laptop Templates
  {
    id: 'macbook-pro',
    name: 'MacBook Pro',
    category: 'laptop',
    brand: 'apple',
    description: 'Notch',
    options: {
      type: 'laptop',
      bezel: 'thin',
      topCutout: 'notch',
      corners: 'rounded',
      baseStyle: 'standard',
      hinge: 'hidden',
    },
  },
  {
    id: 'macbook-air',
    name: 'MacBook Air',
    category: 'laptop',
    brand: 'apple',
    description: 'No Notch',
    options: {
      type: 'laptop',
      bezel: 'thin',
      topCutout: 'none',
      corners: 'rounded',
      baseStyle: 'standard',
      hinge: 'hidden',
    },
  },
  {
    id: 'surface-laptop',
    name: 'Surface Laptop',
    category: 'laptop',
    brand: 'other',
    description: 'Fabric Base',
    options: {
      type: 'laptop',
      bezel: 'thin',
      topCutout: 'none',
      corners: 'rounded',
      baseStyle: 'fabric',
      hinge: 'visible',
    },
  },

  // Desktop Templates
  {
    id: 'monitor',
    name: 'Monitor',
    category: 'desktop',
    brand: 'other',
    description: 'Simple Stand',
    options: {
      type: 'desktop',
      bezel: 'standard',
      stand: 'simple',
      corners: 'rounded',
      chin: 'none',
      allInOne: false,
    },
  },
  {
    id: 'imac',
    name: 'iMac',
    category: 'desktop',
    brand: 'apple',
    description: 'All-in-One',
    options: {
      type: 'desktop',
      bezel: 'thin',
      stand: 'apple-style',
      corners: 'rounded',
      chin: 'large',
      allInOne: true,
    },
  },
  {
    id: 'studio-display',
    name: 'Studio Display',
    category: 'desktop',
    brand: 'apple',
    description: 'Apple Stand',
    options: {
      type: 'desktop',
      bezel: 'thin',
      stand: 'apple-style',
      corners: 'rounded',
      chin: 'none',
      allInOne: false,
    },
  },
  {
    id: 'pro-display-xdr',
    name: 'Pro Display XDR',
    category: 'desktop',
    brand: 'apple',
    description: 'Thick Bezel',
    options: {
      type: 'desktop',
      bezel: 'thick',
      stand: 'apple-style',
      corners: 'rounded',
      chin: 'none',
      allInOne: false,
    },
  },
];

// Helper to get templates by category
export const getTemplatesByCategory = (category: DIYDeviceType): DIYTemplate[] =>
  DIY_TEMPLATES.filter((t) => t.category === category);

// Helper to find a template by ID
export const getTemplateById = (id: string): DIYTemplate | undefined =>
  DIY_TEMPLATES.find((t) => t.id === id);

// Helper to get templates by brand
export const getTemplatesByBrand = (brand: DeviceBrand): DIYTemplate[] =>
  DIY_TEMPLATES.filter((t) => t.brand === brand);

// Find which brand a template belongs to
export const findBrandForTemplate = (templateId: string): DeviceBrand | undefined =>
  DIY_TEMPLATES.find((t) => t.id === templateId)?.brand;

// Base type definitions for the selector
export const BASE_TYPES: { id: DIYDeviceType; name: string; description: string }[] = [
  { id: 'phone', name: 'Phone', description: 'Standard mobile' },
  { id: 'flip', name: 'Flip', description: 'Vertical foldable' },
  { id: 'foldable', name: 'Foldable', description: 'Horizontal foldable' },
  { id: 'tablet', name: 'Tablet', description: 'Large touch device' },
  { id: 'laptop', name: 'Laptop', description: 'With keyboard' },
  { id: 'desktop', name: 'Desktop', description: 'Monitor/display' },
];

// Category display order
export const TEMPLATE_CATEGORIES: DIYDeviceType[] = [
  'phone',
  'flip',
  'foldable',
  'tablet',
  'laptop',
  'desktop',
];

// Brand configuration (mirroring Sidebar.tsx's StoreConfig pattern)
export interface BrandConfig {
  id: DeviceBrand;
  label: string;
  categories: {
    category: DIYDeviceType;
    label: string;
    templates: DIYTemplate[];
  }[];
}

const CATEGORY_ORDER: DIYDeviceType[] = ['phone', 'flip', 'foldable', 'tablet', 'laptop', 'desktop'];
const CATEGORY_LABELS: Record<DIYDeviceType, string> = {
  phone: 'Phone',
  flip: 'Flip',
  foldable: 'Foldable',
  tablet: 'Tablet',
  laptop: 'Laptop',
  desktop: 'Desktop',
};

function buildBrands(): BrandConfig[] {
  const brandMeta: { id: DeviceBrand; label: string }[] = [
    { id: 'apple', label: 'Apple' },
    { id: 'samsung', label: 'Samsung' },
    { id: 'other', label: 'Other' },
  ];

  return brandMeta.map(({ id, label }) => {
    const brandTemplates = DIY_TEMPLATES.filter((t) => t.brand === id);
    const categories = CATEGORY_ORDER
      .map((cat) => ({
        category: cat,
        label: CATEGORY_LABELS[cat],
        templates: brandTemplates.filter((t) => t.category === cat),
      }))
      .filter((c) => c.templates.length > 0);

    return { id, label, categories };
  });
}

export const BRANDS: BrandConfig[] = buildBrands();
