import type { CastEntry } from '../../engine/storyTypes';
import { warnOnce } from './baseAdapter';
import { StaticSpriteAdapter } from './staticSpriteAdapter';

/**
 * M3 placeholder. The real version will play frame-based animations from a
 * sprite sheet image, using the cast entry's animationMap to pick row/frame
 * ranges per engine action. Until then it behaves like a static sprite so
 * stories still play.
 */
export class SpriteSheetAdapter extends StaticSpriteAdapter {
  constructor(entry: CastEntry) {
    super(entry);
    warnOnce('spriteSheet-stub', 'The sprite sheet adapter is not implemented yet — falling back to static sprite behaviour.');
  }
}
