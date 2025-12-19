# agents.md

This is a brand new app. No need for backward compatibility. 

- **Project**: Brand new Next.js (App Router) + TypeScript app.
- **UI**: Mantine components.
- **Persistence**: Uses browser **IndexedDB** (see `lib/PersistenceDB.ts` and `hooks/usePersistence.ts`).
- **Dev constraints**: Do **not** start/run the dev server from the agent.
- **Testing**: No tests needed for changes right now.
- **Conventions**: Prefer editing existing files; keep canvas size presets centralized in `components/AppFrames/FramesContext.tsx`.
