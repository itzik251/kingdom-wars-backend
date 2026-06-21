import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig({
  plugins: [react(), nodePolyfills({ include: ['buffer', 'crypto'] })],
  resolve: {
    alias: {
      // allows: import '../../packages/shared' from frontend/src/**
      // (relative imports work automatically; this alias is a safety net)
    },
  },
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
  server: {
    port: Number(process.env.PORT) || 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
