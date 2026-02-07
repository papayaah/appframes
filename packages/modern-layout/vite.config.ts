import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        react(),
        dts({
            insertTypesEntry: false,
        }),
    ],
    build: {
        lib: {
            entry: {
                index: resolve(__dirname, 'src/index.ts'),
                'presets/mantine': resolve(__dirname, 'src/presets/mantine.tsx'),
            },
            formats: ['es', 'cjs'],
            fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'mjs' : 'js'}`,
        },
        rollupOptions: {
            external: [
                'react',
                'react-dom',
                'react/jsx-runtime',
                // Mantine (optional peer dependency)
                '@mantine/core',
                '@mantine/hooks',
                // Tabler icons (optional)
                '@tabler/icons-react',
            ],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                    '@mantine/core': 'MantineCore',
                    '@mantine/hooks': 'MantineHooks',
                },
            },
        },
    },
});
