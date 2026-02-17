const loadedFontKeys = new Set<string>();

const GOOGLE_FONT_URLS: Record<string, string> = {
  // Default UI font in this app (keep pretty broad weights so sliders feel responsive)
  Inter:
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',

  // Serif
  'EB Garamond':
    'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap',
  'Playfair Display':
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap',

  // Popular UI/marketing sans fonts
  Roboto: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap',
  'Roboto Condensed': 'https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@300;400;700&display=swap',
  'Roboto Mono': 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500;600;700&display=swap',
  'Open Sans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap',
  Montserrat: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap',
  Poppins: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap',
  Lato: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap',
  Raleway: 'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700;800;900&display=swap',
  Nunito: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800;900&display=swap',
  Oswald: 'https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap',
  'Noto Sans': 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300;400;500;600;700;800;900&display=swap',
};

const WEB_SAFE = new Set<string>([
  'system-ui',
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS',
]);

/**
 * Ensure a font is available before using it.
 *
 * - Google Fonts: inject a `<link rel="stylesheet">` once per family (lazy-load).
 * - Web-safe fonts: no-op.
 * - Self-hosted fonts (e.g. via `@font-face` in `globals.css`): no-op.
 */
export function ensureFontLoaded(fontFamily: string | null | undefined) {
  const family = (fontFamily ?? '').trim();
  if (!family) return;
  if (WEB_SAFE.has(family)) return;

  const href = GOOGLE_FONT_URLS[family];
  if (!href) return;

  // SSR guard
  if (typeof document === 'undefined') return;

  const key = `google:${family}`;
  if (loadedFontKeys.has(key)) return;

  // If something else already loaded it, record and move on.
  const existing = document.querySelector<HTMLLinkElement>(`link[data-font-key="${key}"]`);
  if (existing) {
    loadedFontKeys.add(key);
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.crossOrigin = 'anonymous';
  link.setAttribute('data-font-key', key);
  document.head.appendChild(link);
  loadedFontKeys.add(key);
}

