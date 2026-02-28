import path from 'path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
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

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), localApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
