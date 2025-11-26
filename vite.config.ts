import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';

// https://vitejs.dev/config/
const viteConfig = defineConfig({
    plugins: [react()],
    css: {
        preprocessorOptions: {
            scss: {
                quietDeps: true,
            },
        },
    },
});

const vitestConfig = defineVitestConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        css: false,
    },
});

export default mergeConfig(viteConfig, vitestConfig);
