# Undo/Redo system (history) for AppFrames

## Goals

- **Undo/redo for “real edits”**: add/remove/reorder screens, replace media, move/scale/rotate frames, edit text (move/resize/rotate/content/style), canvas settings that materially change output.
- **Keep interactions buttery**: preserve the existing “preview in rAF, commit on end” technique (no history writes during pointer-move).
- **Simple mental model**: Cmd/Ctrl+Z undoes the last committed edit; Cmd/Ctrl+Shift+Z (or Cmd/Ctrl+Y on Windows) redoes.
- **Safe with persistence**: undo/redo should just be another commit that flows through IndexedDB persistence (no special casing required).

## Non-goals (v1)

- Persisting undo history across page reloads (session-only is fine).
- Collaborative merge / CRDT / time-travel across devices.
- Perfect “per-keystroke” undo inside text editing (v1 can treat a text edit as “commit on blur/Enter” which matches current UI).

## Current state (as of now)

- Editor state is owned in `components/AppFrames/FramesContext.tsx` via multiple `useState` values:
  - Document-ish: `screensByCanvasSize`, `currentCanvasSize`, `selectedScreenIndices`, `selectedFrameIndex`, `zoom`, `currentProjectName`
  - UI-ish (not part of undo): sidebar prefs, media cache, saveStatus
- There’s no explicit history stack.
- Many interactions already “commit once”:
  - `TextElement` commits on drag end / resize end / rotate end / blur/Enter for content.
  - Device frame pan/drag/resize flows similarly (imperative preview, commit at end).

## Recommendation

### Use patch-based history with `immer`

Add `immer` and record changes as **patches + inverse patches**.

- **Why patches**: storing full snapshots of `screensByCanvasSize` can get large quickly (and copying it repeatedly is slow). Patches are usually much smaller.
- **Why `immer`**: works well with plain React `useReducer`/`useState` (no Redux/Zustand required) and can produce inverse patches automatically.

Key API we want:

- `commit(label, updater)` → applies a document update and pushes an undo entry
- `undo()` → applies inverse patches and pushes to redo stack
- `redo()` → applies patches and pushes back to undo stack
- `canUndo`, `canRedo` for UI/keyboard gating

## What is “the document” (undoable state)

Define a single “document state” object for undo purposes:

```ts
type DocumentState = {
  screensByCanvasSize: Record<string, Screen[]>;
  currentCanvasSize: string;
  selectedScreenIndices: number[];
  selectedFrameIndex: number;
  zoom: number;
  currentProjectName: string;
};
```

Keep **out** of undo:

- `saveStatus` (derived), `mediaCache` (ephemeral URLs), sidebar/nav prefs, any hover/drag preview refs.

## Where history entries are created (transaction boundaries)

Only record history on “commit points”, never during rAF previews:

- **Screen operations**: add/remove/reorder screens, replace media, change composition, change orientation, change background.
- **Frame operations**: commit frame position/scale/rotate/tilt/pan at pointer-up.
- **Text operations**: commit on:
  - drag end
  - resize end
  - rotate end
  - edit end (blur / Enter)
  - delete / duplicate / reorder
- **Canvas size switch**:
  - Usually should be undoable only if it changes output (e.g. edits a screen setting).
  - Pure “navigation” changes (switching which size you’re viewing) can be excluded from history to reduce noise.

## Integration approach (best)

### Step 1: stop splitting document state across many `useState`s

Undo is simplest and safest if document writes are centralized.

Refactor `FramesContext` to use:

- `useReducer` for the undoable `DocumentState`
- a `HistoryController` that wraps document updates via `immer` patches

This also allows removing the current bi-directional syncing effects that compare `JSON.stringify(screens)` and `JSON.stringify(screensForCurrentSize)`.

### Step 2: implement `commit()` and make all “edit” functions use it

In `FramesContext`, functions like `addScreen`, `replaceScreen`, `updateTextElement`, etc. should call:

- `commit('Replace image', (draft) => { ...mutate draft... })`

Important: `commit()` should clear the redo stack.

### Step 3: add keyboard shortcuts

At a high-level:

- Cmd/Ctrl+Z → `undo()`
- Cmd/Ctrl+Shift+Z → `redo()` (also support Ctrl+Y on Windows)
- Don’t hijack when the user is typing in an input/textarea/contenteditable.

### Step 4: history lifetime and limits

Recommended defaults:

- keep last **100** entries (drop oldest)
- optionally coalesce very frequent “same kind” commits (e.g. repeated nudges) by time window (v2)
- clear history on `switchProject()` and on `loadProjectIntoState()`

## Data structures (suggested)

```ts
type HistoryEntry = {
  label: string;
  at: number;
  patches: import('immer').Patch[];
  inversePatches: import('immer').Patch[];
};

type HistoryState = {
  past: HistoryEntry[];
  future: HistoryEntry[];
};
```

Undo/redo mechanics:

- `commit`:
  - compute `[nextState, patches, inversePatches]` using `produceWithPatches`
  - push `{ patches, inversePatches }` onto `past`
  - clear `future`
- `undo`:
  - pop last `entry` from `past`
  - `nextState = applyPatches(state, entry.inversePatches)`
  - push `entry` onto `future`
- `redo`:
  - pop from `future`
  - apply `entry.patches`
  - push back onto `past`

## How this plays with “preview in rAF, commit on end”

- Pointer-move previews should continue to write to the DOM only.
- On pointer-up, the final values are committed to React state once.
- The undo system should record **only that final commit** (one history entry), preserving performance.

## Implementation plan (concrete)

1) Add dependency:
   - `immer` (latest)

2) Create a small history helper (inside `FramesContext.tsx` or extracted to `lib/history.ts`):
   - `commit(label, updater)`
   - `undo`, `redo`, `canUndo`, `canRedo`

3) Refactor `FramesContext` to centralize undoable document state:
   - Introduce `DocumentState` shape and initialize it from persisted project.
   - Remove `screens` as an independent source of truth; derive `screens` from `screensByCanvasSize[currentCanvasSize]` or keep `screens` but ensure *all* writes are routed through `commit()`.

4) Update all editing APIs to use `commit()`:
   - `addScreen`, `removeScreen`, `replaceScreen`, `reorderScreens`
   - `updateSelectedScreenSettings` (only when it changes output; exclude pure selection if desired)
   - `addTextElement`, `updateTextElement`, `deleteTextElement`, `duplicateTextElement`, `reorderTextElements`
   - frame commit functions (where frameX/frameY/frameScale/rotateZ/etc. are written)

5) Add keyboard handling at a top-level client component (likely `components/AppFrames/AppFrames.tsx`):
   - register `keydown` listener
   - ignore when an editable element is focused
   - call undo/redo from context

6) (Optional) Add UI affordances:
   - disabled Undo/Redo buttons in header with tooltips showing latest entry label.

## Alternatives considered

- **Snapshot history (`use-undo`, custom stacks of deep clones)**:
  - simplest to code, but memory + CPU cost grows quickly with large `screensByCanvasSize`.
  - tends to cause more React GC pressure.
- **State library history (Redux/Zustand + middleware like zundo)**:
  - good if we were already on that stack; currently we’re plain React state, so it adds more architectural weight than necessary.

