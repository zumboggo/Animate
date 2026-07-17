/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];

  return {
    base: process.env.GITHUB_ACTIONS === 'true' && repositoryName ? `/${repositoryName}/` : '/',
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
