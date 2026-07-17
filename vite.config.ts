/// <reference types="vitest/config" />
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import { chirpPlugin } from './server/chirpPlugin';

export default defineConfig(({ mode }) => {
  const projectEnv = loadEnv(mode, process.cwd(), '');
  const documentsEnv = loadEnv(mode, path.resolve(process.cwd(), '..'), '');
  const googleApiKey = projectEnv.GOOGLE_CLOUD_API_KEY || documentsEnv.GOOGLE_CLOUD_API_KEY;

  return {
    plugins: [chirpPlugin(googleApiKey)],
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
  };
});
