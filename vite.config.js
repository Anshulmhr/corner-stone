import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * In development:  Vite proxies /api/* to the Express server on port 3001.
 * In production:   The Express server serves /api/execute directly;
 *                  Vite's build output (dist/) can be served by the same Express
 *                  server or a separate static CDN.
 *
 * There is NO Vite middleware that handles /api/execute — all execution
 * happens exclusively in server/index.js.
 */
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    open: false,

    proxy: {
      // Forward any /api/* request from the dev browser to the Express API server
      '/api': {
        target:      'http://127.0.0.1:3001',
        changeOrigin: true,
        // Optionally time out slow /api/execute requests after 20 s
        timeout:     20000,
      },
    },
  },
});
