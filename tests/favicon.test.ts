import { describe, expect, it } from 'vitest';
import html from '../index.html?raw';
import favicon from '../public/favicon.svg?raw';
import manifestText from '../public/site.webmanifest?raw';

describe('installable site identity', () => {
  it('links a bookmark icon and web app manifest', () => {
    expect(html).toContain('rel="icon" href="/favicon.svg"');
    expect(html).toContain('rel="manifest" href="/site.webmanifest"');
    expect(favicon).toContain('aria-label="Animate"');
    expect(JSON.parse(manifestText).short_name).toBe('Animate');
  });
});
