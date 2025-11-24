# Project Structure

## Root Layout

```
├── app/                    # Next.js App Router
├── components/             # React components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and libraries
├── docs/                   # Documentation
├── public/                 # Static assets
├── test-utils/             # Testing utilities
├── .storybook/             # Storybook configuration
└── [config files]          # Root-level configs
```

## App Directory (Next.js 16 App Router)

```
app/
├── layout.tsx              # Root layout with MantineProvider
├── page.tsx                # Home page (renders AppFrames)
└── globals.css             # Global styles
```

- Uses App Router (not Pages Router)
- `layout.tsx` wraps entire app with Mantine theme
- `page.tsx` is the entry point
- All pages are server components by default

## Components Directory

```
components/
├── AppFrames/              # Main application components
│   ├── AppFrames.tsx       # Root container with state management
│   ├── Header.tsx          # Top header with export button
│   ├── Sidebar.tsx         # Left sidebar (deprecated, use SidebarTabs)
│   ├── SidebarTabs.tsx     # Tabbed sidebar (Layout/Device/Media)
│   ├── Canvas.tsx          # Main canvas with drag-drop
│   ├── DeviceFrame.tsx     # Device mockup frames
│   ├── DeviceTab.tsx       # Device selection tab
│   ├── ScreensPanel.tsx    # Bottom panel for screen management
│   ├── MediaLibrary.tsx    # Media library tab
│   └── WelcomeState.tsx    # Empty state component
├── ColorSchemeToggle/      # Theme toggle (template component)
└── Welcome/                # Welcome component (template component)
```

### Component Patterns

- **AppFrames.tsx** - Main container, manages all state
  - Screens array (list of screenshots)
  - Settings object (all canvas/composition settings)
  - Handlers for add/remove/replace screens
  
- **Client Components** - All AppFrames components use 'use client'
- **Props Pattern** - Pass settings + setSettings for two-way binding
- **Mantine Components** - Use AppShell, Box, Stack, Group, Button, etc.

## Lib Directory

```
lib/
├── db.ts                   # Dexie IndexedDB setup
└── opfs.ts                 # OPFS file system utilities
```

- `db.ts` - Defines mediaFiles table schema
- `opfs.ts` - OPFSManager class for file operations
- Both use async/await patterns

## Hooks Directory

```
hooks/
└── useMediaImage.ts        # Hook to load images from OPFS
```

- Custom hooks for reusable logic
- Follow `use*` naming convention

## Data Models

### Screen Interface
```typescript
interface Screen {
  id: string;              // Unique identifier
  mediaId?: number;        // Reference to media library
  image?: string;          // Base64 image (legacy)
  name: string;            // Display name
}
```

### CanvasSettings Interface
```typescript
interface CanvasSettings {
  canvasSize: string;           // Export dimensions
  deviceFrame: string;          // Visual frame type
  composition: string;          // Layout type
  compositionScale: number;     // 50-100
  captionVertical: number;      // 0-100
  captionHorizontal: number;    // 0-100
  selectedScreenIndex: number;  // Currently selected screen
  screenScale: number;          // 0-100
  screenPanX: number;           // 0-100
  screenPanY: number;           // 0-100
  orientation: string;          // portrait/landscape
  backgroundColor: string;      // Hex color
  captionText: string;          // Caption content
  showCaption: boolean;         // Toggle caption
}
```

## State Management

- **No global state library** - Uses React useState in AppFrames.tsx
- **Props drilling** - Settings passed down to child components
- **Callback props** - Child components call parent handlers
- **Local storage** - Not currently implemented
- **IndexedDB** - Media metadata via Dexie

## File Naming Conventions

- **Components** - PascalCase.tsx (e.g., AppFrames.tsx)
- **Hooks** - camelCase.ts with 'use' prefix (e.g., useMediaImage.ts)
- **Utils** - camelCase.ts (e.g., db.ts, opfs.ts)
- **Styles** - ComponentName.module.css for CSS Modules
- **Tests** - ComponentName.test.tsx
- **Stories** - ComponentName.story.tsx

## Import Patterns

```typescript
// External libraries first
import { useState } from 'react';
import { Box, Button } from '@mantine/core';

// Internal imports with @/* alias
import { db } from '@/lib/db';
import { AppFrames } from '@/components/AppFrames/AppFrames';

// Relative imports last
import { Header } from './Header';
```

## Documentation Files

```
docs/
└── sizes/
    ├── README.md               # Size documentation overview
    ├── apple-app-store.md      # iOS dimensions
    ├── google-play-store.md    # Android dimensions
    └── sizes.md                # General size guide
```

Root-level docs:
- `README.md` - Main project documentation
- `QUICKSTART.md` - User guide
- `PROJECT_SUMMARY.md` - Technical overview
- `CONCEPTS.md` - Key concepts explanation
- `FEATURES.md` - Feature checklist
- `USAGE_GUIDE.md` - Detailed usage instructions
- `DEPLOYMENT.md` - Deployment guide
- `CHANGELOG.md` - Version history

## Configuration Files Location

All config files at root:
- `tsconfig.json` - TypeScript
- `next.config.mjs` - Next.js
- `eslint.config.mjs` - ESLint
- `jest.config.cjs` - Jest
- `.prettierrc.mjs` - Prettier
- `.stylelintrc.json` - Stylelint
- `postcss.config.cjs` - PostCSS
- `theme.ts` - Mantine theme

## Key Architectural Decisions

1. **Monolithic State** - All state in AppFrames.tsx, not distributed
2. **OPFS + IndexedDB** - Files in OPFS, metadata in IndexedDB
3. **No Server Components** - Main app is client-side for interactivity
4. **Mantine AppShell** - Layout structure with header/navbar/main
5. **Export via DOM** - Uses html-to-image to capture canvas element
6. **No Routing** - Single page application
