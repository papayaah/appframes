# Tech Stack

## Framework & Core

- **React 19.2.0** - Latest React with improved performance
- **Next.js 16.0.3** - App Router (not Pages Router)
- **TypeScript 5.9.3** - Strict mode enabled
- **Node.js 24+** required (minimum version)

## UI & Styling

- **Mantine 8.3.9** - Primary component library (@mantine/core, @mantine/hooks, @mantine/dropzone)
- **Tabler Icons** - Icon set (@tabler/icons-react)
- **PostCSS** - CSS processing with postcss-preset-mantine
- **CSS Modules** - Component-scoped styles

## Data & Storage

- **Dexie 4.2.1** - IndexedDB wrapper for media metadata
- **OPFS (Origin Private File System)** - Browser file storage for images
- **React useState** - Local state management (no Redux/Zustand)

## Build & Development

- **npm** - Package manager
- **ESLint 9** - Linting with eslint-config-mantine
- **Prettier 3.6.2** - Code formatting with import sorting
- **Stylelint 16** - CSS linting
- **Jest 30** - Testing with @testing-library/react
- **Storybook 10** - Component development

## Utilities

- **html-to-image** - Canvas export to PNG
- **@next/bundle-analyzer** - Bundle size analysis

## Common Commands

```bash
# Development
npm run dev                 # Start dev server (localhost:3000)
npm run build               # Production build
npm start                   # Start production server

# Code Quality
npm run typecheck           # TypeScript type checking
npm run lint                # Run ESLint + Stylelint
npm run eslint              # ESLint only
npm run stylelint           # Stylelint only
npm run prettier:check      # Check formatting
npm run prettier:write      # Fix formatting

# Testing
npm run jest                # Run tests once
npm run jest:watch          # Run tests in watch mode
npm test                    # Full test suite (types + lint + jest)

# Storybook
npm run storybook           # Start Storybook (localhost:6006)
npm run storybook:build     # Build Storybook

# Analysis
npm run analyze             # Bundle size analysis
```

## Configuration Files

- `tsconfig.json` - TypeScript config with strict mode, path aliases (@/*)
- `next.config.mjs` - Next.js config with bundle analyzer, optimizePackageImports
- `eslint.config.mjs` - ESLint flat config with typescript-eslint
- `jest.config.cjs` - Jest with jsdom environment
- `.prettierrc.mjs` - Prettier with import sorting plugin
- `.stylelintrc.json` - Stylelint with SCSS config
- `theme.ts` - Mantine theme customization

## Code Style

- **Strict TypeScript** - No implicit any, strict null checks
- **Functional Components** - Use hooks, no class components
- **Client Components** - Mark with 'use client' when using hooks/browser APIs
- **Import Sorting** - Automatic via @ianvs/prettier-plugin-sort-imports
- **No semicolons** - Prettier configured without semicolons (check .prettierrc.mjs)
- **Path Aliases** - Use @/* for root imports (configured in tsconfig.json)

## Browser APIs Used

- **OPFS** - File storage (requires HTTPS or localhost)
- **IndexedDB** - Metadata storage via Dexie
- **Canvas API** - Image export via html-to-image
- **File API** - Drag & drop, file uploads
- **createImageBitmap** - Image dimension detection

## Performance Optimizations

- Static site generation (SSG) where possible
- optimizePackageImports for Mantine tree-shaking
- 2x pixel ratio for high-quality exports
- Thumbnail generation for media library
- React 19 automatic batching
