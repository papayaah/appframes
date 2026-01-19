# Media Library: AI Image Generation (via `@reactkits.dev/ai-connect` + Replicate)

## Goal

Add an **AI “Generate Image”** capability that:

- Feels native inside the Media Library UI (Mantine/Tailwind presets).
- Keeps **secrets server-side** (Replicate token never reaches the browser).
- Imports generated images into the existing offline storage model (**OPFS + IndexedDB**).
- Uses `@reactkits.dev/ai-connect` as the integration layer (provider-agnostic), with Replicate as an initial provider.

## Constraints / assumptions

- `@reactkits.dev/react-media-library` is a reusable, headless package. It **must not** depend directly on Replicate SDK or app-specific auth.
- The app is Next.js App Router; server routes live under `app/api/*`.
- `packages/ai-connect` is currently a submodule and may not be checked out in this workspace snapshot; the design must work even if the concrete API differs by exposing a small adapter surface.

## Non-goals (v1)

- Storing prompts/models as first-class, queryable fields in a remote DB.
- Real-time streaming previews.
- Cross-device syncing of AI assets (local-first only, like other media assets).

## Proposed UX (v1)

- Add a **Generate** entry point in the media library header (or in the Upload card area).
- User enters:
  - prompt
  - size (width/height; provide a few presets)
  - model (default to SDXL)
  - optional “negative prompt” and “steps” (advanced panel)
- Click **Generate**
  - Show progress state + cancel (best-effort).
  - On success, the generated image appears at the top of the library as a normal image asset.

## Storybook-driven development (recommended)

Because this is a headless UI package, we should support two modes in Storybook:

### Mode A: Mock AI generator (default; safe)

- Story uses a **mock** `ai.generateImages()` that returns a `File` created from:
  - a tiny bundled fixture image, or
  - an in-memory `Blob` (deterministic, fast, free).
- This is the default because it:
  - avoids secrets
  - avoids provider cost
  - makes stories stable in CI/screenshots

### Mode B: Real backend (optional; for maintainers)

- Storybook should **not** accept provider API keys in the UI (it runs in the browser).
- Instead, allow an optional endpoint override, e.g.:
  - env var: `STORYBOOK_AI_GENERATE_URL=http://localhost:3000/api/ai/images/generate`
  - or a Storybook toolbar control for *URL only* (not keys)
- Storybook calls that URL, and the **server** holds keys and talks to Replicate/Gemini/etc.

### End-to-end playground: `packages/media-library/demo`

- The demo app is the “everything wired together” place:
  - real server route(s)
  - real `@reactkits.dev/ai-connect` integration
  - provider keys via `.env.local`

## Architecture (two layers)

### 1) `@reactkits.dev/react-media-library` (browser package)

Media Library should remain provider-agnostic. Add an optional “AI generator” capability via dependency injection:

#### New types (package)

```ts
export type MediaAIGenerateRequest = {
  prompt: string;
  width: number;
  height: number;
  model?: string;
  negativePrompt?: string;
  steps?: number;
  seed?: number;
  // optional: style presets, etc.
};

export type MediaAIGeneratedImage = {
  file: File; // browser File to be stored in OPFS
  metadata?: {
    provider?: string;      // "replicate"
    model?: string;         // "stability-ai/sdxl:..."
    prompt?: string;
    negativePrompt?: string;
    seed?: number;
    steps?: number;
    width?: number;
    height?: number;
    createdAt?: number;
  };
};

export type MediaAIGenerator = {
  generateImages: (req: MediaAIGenerateRequest) => Promise<MediaAIGeneratedImage[]>;
};
```

#### Provider wiring (package)

- Extend `MediaLibraryProvider` to accept:

```ts
type MediaLibraryProviderProps = {
  // existing props...
  ai?: MediaAIGenerator;
};
```

- Extend the `useMediaLibrary()` hook (or provider context) to expose:
  - `generateImages(req)` (only if `ai` provided)
  - `aiGenerating`, `aiError` state

#### Import path (package)

When images are generated:

- Convert result(s) to `File` objects (this occurs in the injected generator or in the hook).
- Call the existing internal pipeline (same as uploads):
  - `saveFileToOpfs(file)` → `addAssetToDB(...)` → update `assets[]`

#### Optional: metadata on `MediaAsset`

Add optional fields (non-breaking) to allow displaying “AI-generated” badges later:

```ts
type MediaAssetSource =
  | { type: "upload" }
  | { type: "ai"; provider?: string; model?: string; prompt?: string };

export interface MediaAsset {
  // existing fields...
  source?: MediaAssetSource;
  sourceMeta?: Record<string, unknown>; // flexible v1 escape hatch
}
```

### 2) App integration (Next.js server routes)

AI generation should be performed on the server:

- Browser calls `POST /api/ai/images/generate`
- Server uses `@reactkits.dev/ai-connect` (preferred) to call Replicate
- Server returns image bytes (or a proxied URL) to the browser
- Browser turns the response into `File` and stores it via Media Library

#### Route: `POST /api/ai/images/generate`

Request body:

```json
{
  "prompt": "An astronaut riding a rainbow unicorn, cinematic, dramatic",
  "width": 768,
  "height": 768,
  "model": "stability-ai/sdxl:7762fd07...",
  "negativePrompt": "",
  "steps": 25,
  "seed": 123
}
```

Response (v1: simplest for browser import):

- `200 OK` with `Content-Type: image/png` (or `image/webp`) and raw bytes.
- Include metadata headers (optional):
  - `x-ai-provider`, `x-ai-model`

Alternative response if needed:

- JSON `{ "imageBase64": "...", "mimeType": "image/png", "fileName": "..." }`

#### Server-side Replicate call (conceptual)

Use Replicate with inputs similar to your snippet:

- `width`, `height`, `prompt`
- `apply_watermark: false`
- `num_inference_steps`

Important: Replicate returns delivery URLs. For best reliability (and to avoid CORS surprises), the server route should **fetch the image bytes server-side** and return them to the browser as the response body.

#### Environment variables

- `REPLICATE_API_TOKEN` (server only)

If `@reactkits.dev/ai-connect` requires its own env/config, keep it server-only as well.

## `@reactkits.dev/ai-connect` usage (adapter-based)

Because the `ai-connect` submodule may vary, the app should isolate it behind a tiny adapter:

```ts
// lib/ai/aiConnect.ts (server-only)
export async function generateImageViaAIConnect(req: {
  prompt: string;
  width: number;
  height: number;
  model?: string;
  steps?: number;
  seed?: number;
}) : Promise<{ bytes: Uint8Array; mimeType: string; provider: string; model?: string; fileName: string }> {
  // implemented with @reactkits.dev/ai-connect once available
}
```

The Next route imports this and never touches browser code.

If `ai-connect` is not available yet, the adapter can temporarily call Replicate directly.

## Media Library generator implementation (app-side)

In the app (not in the package), create the injected generator used by `MediaLibraryProvider`:

```ts
export const appAIGenerator: MediaAIGenerator = {
  async generateImages(req) {
    const res = await fetch("/api/ai/images/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error("AI generation failed");
    const blob = await res.blob();
    const ext = blob.type === "image/webp" ? "webp" : "png";
    const file = new File([blob], `ai-${Date.now()}.${ext}`, { type: blob.type });
    return [{ file, metadata: { provider: res.headers.get("x-ai-provider") ?? "replicate" } }];
  }
};
```

## Error handling & limits

- Validate `prompt` and dimensions server-side.
- Enforce max size (e.g., 1024×1024) and max steps to control latency/cost.
- Rate-limit per user/session (future), or basic IP rate-limit (v1).
- Return structured errors:
  - `400` invalid input
  - `429` rate limited
  - `500` provider errors

## Deliverables (implementation checklist)

- **`packages/media-library`**
  - Add `MediaAIGenerator` types and optional provider injection via `MediaLibraryProvider`.
  - Expose `generateImages()` in the context/hook.
  - Add a minimal preset UI slot/button for “Generate” (only when generator is provided).
  - (Optional) extend `MediaAsset` with `source` metadata.
  - Add a Storybook story that exercises AI generation with a **mock generator** (no server calls):
    - Example: `src/stories/MediaGridAIGenerate.stories.tsx`
    - Mock `ai.generateImages()` returns a `File` created from a small in-memory `Blob` (or a bundled fixture image)
    - Verify UI states: idle → generating → inserted asset → error state
  - Add an optional Storybook “real backend” mode that accepts an endpoint URL (no API keys):
    - Example env var: `STORYBOOK_AI_GENERATE_URL`
    - When set, the story calls the provided URL instead of the mock

- **AppFrames (this app)**
  - Add `POST /api/ai/images/generate` route (server only).
  - Add server adapter `lib/ai/*` that uses `@reactkits.dev/ai-connect` and Replicate.
  - Wire `MediaLibraryProvider ai={appAIGenerator}` in `components/AppFrames/MediaLibrary.tsx` (or wherever the library is used).

## Test plan (manual)

- Generate a 768×768 image; confirm it appears in the grid and persists after refresh (IndexedDB + OPFS).
- Generate with invalid params; confirm UI shows a useful error.
- Generate multiple images in a row; ensure library remains responsive and no memory leak (revoke object URLs as needed).
