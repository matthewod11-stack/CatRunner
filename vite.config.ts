import path from 'path';
import type { Plugin } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createDevApiMiddleware } from './server/devApiMiddleware';

function localApiPlugin(): Plugin {
  return {
    name: 'local-gemini-api',
    configureServer(server) {
      server.middlewares.use(createDevApiMiddleware());
    },
    configurePreviewServer(server) {
      server.middlewares.use(createDevApiMiddleware());
    },
  };
}

export default defineConfig(({ mode }) => {
  // .env / .env.local are not on process.env for Node by default; middleware uses GEMINI_API_KEY.
  const fileEnv = loadEnv(mode, process.cwd(), '');
  if (fileEnv.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = fileEnv.GEMINI_API_KEY;
  }

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), localApiPlugin()],
    optimizeDeps: {
      include: ['phaser'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    test: {
      environment: 'node',
      include: ['**/*.{test,spec}.ts'],
      exclude: ['playwright/**'],
    },
  };
});
