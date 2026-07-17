import type { CastEntry } from '../../engine/storyTypes';
import { warnOnce } from './baseAdapter';
import { StaticSpriteAdapter } from './staticSpriteAdapter';

/**
 * M3 placeholder. The real version will swap between transparent WebM video
 * clips (one per engine action, resolved via the cast entry's animationMap).
 * Until then it behaves like a static sprite so stories still play.
 */
export class WebmClipAdapter extends StaticSpriteAdapter {
  constructor(entry: CastEntry) {
    super(entry);
    warnOnce('webm-stub', 'The WebM clip adapter is not implemented yet — falling back to static sprite behaviour.');
  }
}
