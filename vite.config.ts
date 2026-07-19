import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // relative paths so the build works at any URL (GitHub Pages subpath included)
  server: {
    port: 5183,
    strictPort: true,
  },
});
