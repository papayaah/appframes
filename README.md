# ScreensStudio

A modern web application for creating beautiful app screenshots and mockups with device frames. Built with React 19, Next.js 16, and Mantine 17.

## Features

- **App Store Ready**: All official Apple App Store screenshot dimensions included
- **Drag & Drop Interface**: Easily add screenshots by dragging and dropping images
- **Multiple Compositions**: Choose from Single, Dual, Stack, Triple, and Fan layouts
- **Device Frames**: Realistic device mockup frames (iPhone, iPad, Watch, etc.)
- **Customizable Settings**:
  - Adjustable composition scale
  - Image positioning (pan X/Y)
  - Image scale control
  - Background color selection
  - Caption text with positioning
  - Portrait/Landscape orientation
- **Export Functionality**: Export your mockups as high-quality images

## Getting Started

### Prerequisites

- Node.js 18+ 
- Yarn 4.x

### Installation

```bash
# Install dependencies
yarn install

# Run development server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build for Production

```bash
yarn build
yarn start
```

### Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for a detailed guide on using the app.

## Usage

1. **Select Canvas Size**: Choose from official App Store dimensions (Layout tab)
2. **Add Screenshots**: Drag and drop your app screenshots onto the canvas or use the "NEW SCREEN" button
3. **Choose Device Frame**: Select a device mockup from the Device tab
4. **Choose Layout**: Select a composition style (Single, Dual, Stack, Triple, or Fan)
5. **Customize**: Adjust the scale, position, and appearance using the sidebar controls
6. **Add Caption**: Toggle caption on/off and customize the text and position
7. **Export**: Click the Export button to download your mockup - ready for App Store submission!

See [APP_STORE_SIZES.md](./APP_STORE_SIZES.md) for complete list of supported dimensions.

## Tech Stack

- **React 19** - Latest React with improved performance
- **Next.js 16** - React framework with App Router
- **Mantine 17** - Modern React component library
- **TypeScript** - Type-safe development
- **Tabler Icons** - Beautiful icon set

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with Mantine provider
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/
│   └── ScreensStudio/
│       ├── ScreensStudio.tsx   # Main component
│       ├── Header.tsx          # Top header with export
│       ├── Sidebar.tsx         # Left sidebar controls
│       ├── Canvas.tsx          # Main canvas area
│       ├── DeviceFrame.tsx     # iPhone frame component
│       └── ScreensPanel.tsx    # Bottom screens panel
└── theme.ts                # Mantine theme configuration
```

## License

MIT
