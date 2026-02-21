export { defaultPreset } from './default';

// Specialized presets are NOT exported here to avoid eager loading.
// This prevents Mantine/Tailwind from being bundled when not used.
//
// Import directly: 
// import { mantinePreset } from '@reactkits.dev/modern-layout/presets/mantine'
// import { tailwindPreset } from '@reactkits.dev/modern-layout/presets/tailwind'
