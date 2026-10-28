import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The preview environment proxies the dev server from a sandbox host, so the
// server binds to all interfaces and accepts forwarded Host headers.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
});
