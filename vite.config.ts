/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      // .story files are imported with ?raw; make sure edits trigger a reload
      ignored: ['!**/stories/**'],
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
