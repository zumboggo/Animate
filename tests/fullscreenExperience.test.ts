import { describe, expect, it } from 'vitest';
import mainSource from '../src/main.ts?raw';

describe('mobile stage fullscreen', () => {
  it('provides a dedicated close control and best-effort landscape locking', () => {
    expect(mainSource).toContain("fullscreenClose.className = 'fullscreen-close'");
    expect(mainSource).toContain("lock?.('landscape')");
    expect(mainSource).toContain('event.stopPropagation()');
  });

  it('keeps native and fallback fullscreen state synchronized', () => {
    expect(mainSource).toContain("previewPanel.classList.toggle('fullscreen-fallback', active)");
    expect(mainSource).toContain("document.documentElement.classList.toggle('stage-fullscreen-active'");
    expect(mainSource).toContain("new Event('storysproutfullscreenchange')");
  });
});
