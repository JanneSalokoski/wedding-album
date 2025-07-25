import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

import path from 'path';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
            '/api': {
                target: 'http://backend:8000',
                changeOrigin: true,
            }
        },
    },
    resolve: {
        alias: {
            '@components': path.resolve(__dirname, 'src/components'),
            '@api': path.resolve(__dirname, 'src/api'),
            '@utils': path.resolve(__dirname, 'src/utils'),
            '@types': path.resolve(__dirname, 'src/types'),
            '@pages': path.resolve(__dirname, 'src/pages'),
        }
    }
});
