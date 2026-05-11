import { defineConfig } from 'vite';

export default defineConfig({
  // Root directory for source files
  root: '.',

  // Public assets directory (served at /)
  publicDir: 'public',

  build: {
    // Output directory for production build
    outDir: 'dist',
    // Clear the output directory before each build
    emptyOutDir: true,
  },

  server: {
    // Development server port
    port: 5173,
    // Automatically open browser on start
    open: true,
  },
});
