/// <reference types="vitest/config" />
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Dev-only helper: the page can POST a base64 image to /__snap?name=foo and it
 * lands in .cache/snaps/foo.jpg. Used by tooling to capture stage stills for
 * visual review; never part of the production build.
 */
function snapSink(): Plugin {
  return {
    name: 'snap-sink',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__snap', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('POST only');
          return;
        }
        const name = (new URL(req.url ?? '/', 'http://x').searchParams.get('name') ?? 'snap')
          .replace(/[^\w-]/g, '');
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          const dir = join(server.config.root, '.cache', 'snaps');
          mkdirSync(dir, { recursive: true });
          writeFileSync(join(dir, `${name}.jpg`), Buffer.from(body, 'base64'));
          res.end('ok');
        });
      });
    },
  };
}

export default defineConfig(() => {
  const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];

  return {
    base: process.env.GITHUB_ACTIONS === 'true' && repositoryName ? `/${repositoryName}/` : '/',
    plugins: [snapSink()],
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
