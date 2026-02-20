import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            // Allow the demo to import the parent modern-layout package
            '@reactkits.dev/modern-layout': resolve(__dirname, '../src')
        }
    }
});
