# AppFrames

A modern web application for creating beautiful app screenshots and mockups with device frames. Built with React 19, Next.js 16, and Mantine 8.

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
  - Multiple text layers (add, drag, rotate, style, reorder, hide/show)
  - Portrait/Landscape orientation
- **Export Functionality**: Export from the Preview page as high-quality PNG/JPG (single or ZIP)

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

## Database

### Database Console (Rails-like REPL)

Query the database interactively using Node.js REPL with your database connection loaded:

```bash
# Using tsx for TypeScript support (recommended)
npx tsx -r dotenv/config -e "
import { db } from './db/index';
import * as schema from './db/schema';
import { eq, and, or, desc, asc, sql } from 'drizzle-orm';
const repl = require('repl');
const r = repl.start('db> ');
r.context.db = db;
r.context.schema = schema;
r.context.eq = eq;
r.context.and = and;
r.context.or = or;
r.context.desc = desc;
r.context.asc = asc;
r.context.sql = sql;
"
```

**Example queries:**
```javascript
// Get all users
await db.select().from(schema.user);

// Get user by email
await db.select().from(schema.user).where(eq(schema.user.email, 'user@example.com'));

// Get all accounts for a user
await db.select().from(schema.account).where(eq(schema.account.userId, 'user-id'));

// Get all sessions with user info
await db.select().from(schema.session).innerJoin(schema.user, eq(schema.session.userId, schema.user.id));

// Count users
const result = await db.select({ count: sql\`count(*)\` }).from(schema.user);
```

### Drizzle Studio (Database UI)

Launch Drizzle Studio to visually browse and edit your database:

```bash
npx drizzle-kit studio
```

This will:
- Open a web UI at `http://localhost:4983` (default port)
- Show all tables from your schema
- Allow you to browse, filter, and edit data
- Support running SQL queries

**Note:** Make sure `DATABASE_URL` is set in your `.env` file before running Studio.

### Database Migrations

```bash
# Generate migration files from schema changes
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit migrate

# Push schema changes directly (use with caution in production)
npx drizzle-kit push
```

### Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for a detailed guide on using the app.

## Usage

1. **Select Canvas Size**: Choose from official App Store dimensions (Layout tab)
2. **Add Screenshots**: Drag and drop your app screenshots onto the canvas or use the "NEW SCREEN" button
3. **Choose Device Frame**: Select a device mockup from the Device tab
4. **Choose Layout**: Select a composition style (Single, Dual, Stack, Triple, or Fan)
5. **Customize**: Adjust the scale, position, and appearance using the sidebar controls
6. **Add Text**: Add multiple text layers, double-click to edit, drag to position, rotate, and manage layers
7. **Export**: Go to Preview and export selected canvas sizes (single file or ZIP)

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
│   └── AppFrames/
│       ├── AppFrames.tsx       # Main component
│       ├── Header.tsx          # Top header with export
│       ├── SidebarTabs.tsx     # Left sidebar controls
│       ├── Canvas.tsx          # Main canvas area
│       ├── DeviceFrame.tsx     # Device frame component
│       └── ScreensPanel.tsx    # Bottom screens panel
└── theme.ts                # Mantine theme configuration
```

## License

MIT
