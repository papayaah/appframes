# Media Library: Freepik Integration

## Overview

Integrate Freepik's Stock Content API into the `media-library` package, providing users access to:
- **Search and features**: Search for photos, vectors, and illustrations (300 requests/day, full access)
- **Icons**: Browse and download free icons (25 downloads/day, free resources only)

This follows the same headless, provider-injection pattern as Pexels and AI generation.

## Architecture

The package handles **all API logic**. The consumer app only needs to:
1. Provide the API key (via environment variable)
2. Create simple backend routes that use the package's helper functions
3. Pass a provider that calls those backend routes

### Freepik API Response Types (matching actual API)

Based on the actual Freepik API documentation:

```typescript
// Icon response structure (from /v1/icons endpoint)
export type FreepikIconResponse = {
    data: Array<{
        id: number;
        name: string;
        slug: string;
        free_svg: boolean;
        created: string;
        author: {
            id: number;
            name: string;
            slug: string;
            avatar: string;
            assets: number;
        };
        style: {
            id: number;
            name: string;
        };
        family: {
            id: number;
            name: string;
            total: number;
        };
        thumbnails: Array<{
            url: string;
            width: number;
            height: number;
        }>;
        tags: Array<{
            name: string;
            slug: string;
        }>;
    }>;
    meta: {
        pagination: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
};

// Download response structure (from /v1/icons/{id}/download)
export type FreepikDownloadResponse = {
    data: {
        filename: string;
        url: string;
    };
};

// Normalized content type for the package
export type FreepikContent = {
    id: string;
    name: string;
    thumbnailUrl: string; // From thumbnails[0].url
    type: 'icon' | 'photo' | 'vector';
    isFree: boolean; // From free_svg for icons
    metadata?: {
        author?: {
            id: number;
            name: string;
            slug: string;
        };
        style?: {
            id: number;
            name: string;
        };
        family?: {
            id: number;
            name: string;
        };
        tags?: Array<{ name: string; slug: string }>;
        created?: string;
    };
};
```

### Package Helper Functions (for backend use)

The package exports helper functions that the consumer app uses in their backend routes:

```typescript
// packages/media-library/src/services/freepik-api.ts

export async function searchFreepikIcons(options: {
    apiKey: string;
    query?: string;
    order?: 'relevance' | 'popularity' | 'date';
    page?: number;
    perPage?: number;
}): Promise<FreepikIconResponse> {
    const params = new URLSearchParams();
    if (options.query) params.set('term', options.query); // API uses 'term', not 'q'
    if (options.order) params.set('order', options.order);
    if (options.page) params.set('page', String(options.page));
    if (options.perPage) params.set('per_page', String(options.perPage));
    
    const res = await fetch(`https://api.freepik.com/v1/icons?${params}`, {
        headers: {
            'x-freepik-api-key': options.apiKey,
        },
    });
    if (!res.ok) throw new Error(`Freepik API error: ${res.statusText}`);
    return res.json();
}

export async function downloadFreepikIcon(options: {
    apiKey: string;
    iconId: string;
    pngSize?: number; // e.g., 512, 256, 128, 64
}): Promise<FreepikDownloadResponse> {
    const params = new URLSearchParams();
    if (options.pngSize) params.set('png_size', String(options.pngSize));
    
    const res = await fetch(
        `https://api.freepik.com/v1/icons/${options.iconId}/download?${params}`,
        {
            headers: {
                'x-freepik-api-key': options.apiKey,
            },
        }
    );
    if (!res.ok) throw new Error(`Freepik download error: ${res.statusText}`);
    return res.json();
}

// Similar functions for photos/vectors (using /v1/resources endpoint)
export async function searchFreepikResources(options: {
    apiKey: string;
    query?: string;
    type?: 'photo' | 'vector' | 'psd';
    order?: string;
    page?: number;
    perPage?: number;
}): Promise<any> {
    // Implementation similar to searchFreepikIcons
}
```

### Provider Interface (for client-side use)

```typescript
export type MediaFreepikProvider = {
    /**
     * Search for icons. Calls consumer's backend route.
     */
    searchIcons: (options: {
        query?: string;
        order?: 'relevance' | 'popularity' | 'date';
        page?: number;
        perPage?: number;
    }) => Promise<FreepikContent[]>;
    
    /**
     * Search for photos/vectors/resources. Calls consumer's backend route.
     */
    searchResources?: (options: {
        query?: string;
        type?: 'photo' | 'vector' | 'psd';
        order?: string;
        page?: number;
        perPage?: number;
    }) => Promise<FreepikContent[]>;
    
    /**
     * Download content. Calls consumer's backend route which returns a File.
     */
    downloadContent: (content: FreepikContent, options?: {
        pngSize?: number; // For icons
        format?: string; // For resources
    }) => Promise<File>;
};
```

### Component Preset Extension

```typescript
export interface FreepikContentPickerProps {
    isOpen: boolean;
    onClose: () => void;
    
    // Content state
    content: FreepikContent[];
    loading: boolean;
    
    // Search state
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    searchType: 'photo' | 'vector' | 'icon' | 'all';
    onSearchTypeChange: (type: 'photo' | 'vector' | 'icon' | 'all') => void;
    onSearch: () => void;
    
    // Selection state
    selected: Set<string>; // Set of content IDs
    onToggleSelect: (id: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    
    // Import state
    importing: boolean;
    onImport: () => void;
    
    // Tab/view mode: 'icons' | 'resources'
    mode: 'icons' | 'resources';
    onModeChange: (mode: 'icons' | 'resources') => void;
    
    // Order/sort (for icons)
    order?: 'relevance' | 'popularity' | 'date';
    onOrderChange?: (order: 'relevance' | 'popularity' | 'date') => void;
}

export interface ComponentPreset {
    // ... existing components
    FreepikContentPicker?: React.FC<FreepikContentPickerProps>;
}
```

## Implementation Plan

### 1. Types & API Helpers

**`packages/media-library/src/types.ts`**:
- Add `FreepikContent`, `MediaFreepikProvider`
- Add `FreepikContentPickerProps`
- Extend `ComponentPreset` with `FreepikContentPicker`

**`packages/media-library/src/services/freepik-api.ts`** (NEW):
- Export `searchFreepikIcons()` - calls `/v1/icons` endpoint
- Export `downloadFreepikIcon()` - calls `/v1/icons/{id}/download` endpoint
- Export `searchFreepikResources()` - calls `/v1/resources` endpoint (for photos/vectors)
- Export `downloadFreepikResource()` - calls `/v1/resources/{id}/download` endpoint
- All functions take `apiKey` as parameter and handle API communication

### 2. Hook (`packages/media-library/src/hooks/useMediaLibrary.ts`)

Extend `useMediaLibrary` to accept optional `freepik` provider:

```typescript
export const useMediaLibrary = (options?: {
    ai?: MediaAIGenerator;
    pexels?: MediaPexelsProvider;
    freepik?: MediaFreepikProvider;
}) => {
    // ... existing state
    
    // Freepik state
    const [freepikContent, setFreepikContent] = useState<FreepikContent[]>([]);
    const [freepikLoading, setFreepikLoading] = useState(false);
    const [freepikSelected, setFreepikSelected] = useState<Set<string>>(new Set());
    const [freepikImporting, setFreepikImporting] = useState(false);
    const [freepikSearchQuery, setFreepikSearchQuery] = useState('');
    const [freepikSearchType, setFreepikSearchType] = useState<'photo' | 'vector' | 'icon'>('icon');
    const [freepikMode, setFreepikMode] = useState<'icons' | 'resources'>('icons');
    const [freepikOrder, setFreepikOrder] = useState<'relevance' | 'popularity' | 'date'>('relevance');
    
    // Functions
    const searchFreepikIcons = useCallback(async () => {
        if (!options?.freepik) return;
        setFreepikLoading(true);
        try {
            const results = await options.freepik.searchIcons({
                query: freepikSearchQuery || undefined,
                order: freepikOrder,
            });
            setFreepikContent(results);
        } catch (err) {
            setError('Failed to search Freepik icons.');
        } finally {
            setFreepikLoading(false);
        }
    }, [options?.freepik, freepikSearchQuery, freepikOrder]);
    
    const searchFreepikResources = useCallback(async () => {
        if (!options?.freepik?.searchResources) return;
        setFreepikLoading(true);
        try {
            const results = await options.freepik.searchResources({
                query: freepikSearchQuery || undefined,
                type: freepikSearchType === 'icon' ? undefined : freepikSearchType,
            });
            setFreepikContent(results);
        } catch (err) {
            setError('Failed to search Freepik resources.');
        } finally {
            setFreepikLoading(false);
        }
    }, [options?.freepik, freepikSearchQuery, freepikSearchType]);
    
    const importFreepikContent = useCallback(async () => {
        if (freepikSelected.size === 0 || !options?.freepik) return;
        setFreepikImporting(true);
        try {
            const files: File[] = [];
            for (const id of Array.from(freepikSelected)) {
                const content = freepikContent.find(c => c.id === id);
                if (!content) continue;
                const file = await options.freepik.downloadContent(content, {
                    pngSize: content.type === 'icon' ? 512 : undefined,
                });
                files.push(file);
            }
            await uploadFiles(files);
            setFreepikSelected(new Set());
        } catch (err) {
            setError('Failed to import Freepik content.');
        } finally {
            setFreepikImporting(false);
        }
    }, [freepikSelected, freepikContent, options?.freepik, uploadFiles]);
    
    // ... return object with freepik states and functions
};
```

### 3. Provider (`packages/media-library/src/components/MediaLibraryProvider.tsx`)

- Add `freepik` prop to `MediaLibraryProviderProps`
- Pass to `useMediaLibrary`
- Expose all Freepik-related state/functions via context

### 4. MediaGrid (`packages/media-library/src/components/MediaGrid.tsx`)

- Add "Freepik" button to actions bar (when `freepikAvailable` is true)
- Conditionally render `FreepikContentPicker` from preset (or fallback modal)
- Support both search and icons modes

### 5. Presets

#### Mantine Preset (`packages/media-library/src/presets/mantine.tsx`)

Create a `FreepikContentPicker` component with:
- Tabs for "Search" and "Icons" modes
- Search input with type selector (Photo/Vector/Icon/All)
- Grid of content items with selection checkboxes
- Import button

#### Tailwind Preset (`packages/media-library/src/presets/tailwind.tsx`)

Similar UI using Tailwind classes.

### 6. App Integration (Minimal Consumer Code)

#### Backend Routes (`app/api/freepik/*`)

The consumer app creates simple backend routes using the package's helper functions:

**`app/api/freepik/icons/route.ts`**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { searchFreepikIcons } from '@reactkits.dev/react-media-library/freepik-api';

export async function GET(request: NextRequest) {
    const apiKey = process.env.FREEPIK_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Freepik API key not configured' }, { status: 500 });
    }
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('term') || undefined; // API uses 'term', not 'q'
    const order = (searchParams.get('order') as any) || 'relevance';
    const page = Number(searchParams.get('page')) || 1;
    const perPage = Number(searchParams.get('per_page')) || 20;
    
    try {
        const result = await searchFreepikIcons({
            apiKey,
            query,
            order,
            page,
            perPage,
        });
        
        // Normalize to FreepikContent format
        const content = result.data.map((item) => ({
            id: String(item.id),
            name: item.name,
            thumbnailUrl: item.thumbnails[0]?.url || '',
            type: 'icon' as const,
            isFree: item.free_svg,
            metadata: {
                author: item.author,
                style: item.style,
                family: item.family,
                tags: item.tags,
                created: item.created,
            },
        }));
        
        return NextResponse.json({ content, pagination: result.meta.pagination });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
```

**`app/api/freepik/icons/[id]/download/route.ts`**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { downloadFreepikIcon } from '@reactkits.dev/react-media-library/freepik-api';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const apiKey = process.env.FREEPIK_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'Freepik API key not configured' }, { status: 500 });
    }
    
    const { searchParams } = new URL(request.url);
    const pngSize = searchParams.get('png_size') ? Number(searchParams.get('png_size')) : undefined;
    
    try {
        const result = await downloadFreepikIcon({
            apiKey,
            iconId: params.id,
            pngSize,
        });
        
        // Fetch the actual file from the download URL
        const fileRes = await fetch(result.data.url);
        const blob = await fileRes.blob();
        
        // Return the file as a blob response
        return new NextResponse(blob, {
            headers: {
                'Content-Type': blob.type,
                'Content-Disposition': `attachment; filename="${result.data.filename}"`,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
```

#### Client-Side Provider (`components/AppFrames/MediaLibrary.tsx`)

```typescript
const freepik = useMemo<MediaFreepikProvider>(() => ({
    async searchIcons(options) {
        const params = new URLSearchParams();
        if (options.query) params.set('term', options.query); // API uses 'term', not 'q'
        if (options.order) params.set('order', options.order);
        if (options.page) params.set('page', String(options.page));
        if (options.perPage) params.set('per_page', String(options.perPage));
        
        const res = await fetch(`/api/freepik/icons?${params}`);
        const data = await res.json();
        return data.content || [];
    },
    async downloadContent(content, downloadOptions) {
        const params = new URLSearchParams();
        if (downloadOptions?.pngSize) params.set('png_size', String(downloadOptions.pngSize));
        
        const res = await fetch(`/api/freepik/icons/${content.id}/download?${params}`);
        const blob = await res.blob();
        const ext = content.type === 'icon' ? 'svg' : content.type === 'vector' ? 'svg' : 'jpg';
        return new File([blob], `${content.name}.${ext}`, { type: blob.type });
    },
}), []);

// In mantinePreset:
FreepikContentPicker: ({ ... }) => (
    <MantineModal opened={isOpen} onClose={onClose} title="Freepik" size="xl">
        {/* Tab switcher, search UI, content grid */}
    </MantineModal>
),
```

### 7. Environment Variables

Consumer app only needs:
```env
FREEPIK_API_KEY=your-api-key-here
```

**Deployment Note**: When deploying via `deploy.sh`, the script syncs code and uses Docker Compose. Make sure to add `FREEPIK_API_KEY` to the `.env` file on the server (at `${REMOTE_BASE}/.env`). The Next.js API routes will automatically pick up environment variables from the container's environment, so the API will work correctly after deployment.

### 8. Storybook (`packages/media-library/src/stories/MediaGrid.stories.tsx`)

Add stories:
- `MantineWithFreepik` - Mock Freepik provider
- `MantineWithAllProviders` - AI + Pexels + Freepik

Mock provider returns placeholder content.

### 9. Demo (`packages/media-library/demo/src/App.tsx`)

Add mock Freepik provider to demo app.

## API Rate Limits

The integration should be aware of (but not enforce) Freepik's limits:
- **Search and features**: 300 requests/day
- **Icons**: 25 downloads/day

The backend should track usage and return appropriate errors when limits are exceeded. The UI can display warnings or disable features when approaching limits.

## UI/UX Considerations

1. **Two modes**: Search (for photos/vectors) and Icons (browse free icons)
2. **Search type selector**: Allow filtering by content type
3. **Content grid**: Show thumbnails with selection checkboxes
4. **Download vs Preview**: Some content may require separate API calls for full resolution
5. **Free vs Premium**: For icons, only show free resources (as per API tier)

## Environment Variables

Backend will need:
- `FREEPIK_API_KEY` - Freepik API key
- Optional: `FREEPIK_API_BASE_URL` - If different from default

## Testing

- Storybook with mock provider (no network)
- Optional: Storybook with real backend URL (via env var)
- Demo app with mock provider
- App integration with real backend

## Summary: Key Design Decisions

1. **Package handles all API logic**: The package exports helper functions (`searchFreepikIcons`, `downloadFreepikIcon`, etc.) that handle all the Freepik API communication details.

2. **Minimal consumer code**: The consumer app only needs to:
   - Set `FREEPIK_API_KEY` environment variable
   - Create simple backend routes that call the package's helper functions
   - Pass a provider that calls those backend routes

3. **Matches actual Freepik API**: Types and functions match the real API structure:
   - Icons: `/v1/icons` endpoint with `order`, `term` (query parameter), pagination
   - Download: `/v1/icons/{id}/download` with `png_size` parameter
   - Response structure matches actual API (with `data` array, `meta.pagination`, etc.)

4. **Two modes**: 
   - **Icons mode**: Browse/search free icons (25 downloads/day limit)
   - **Resources mode**: Search photos/vectors (300 requests/day limit)

5. **Security**: API key stays server-side. Package helpers take `apiKey` as parameter, but consumer passes it from env vars in backend routes only.
