import type { CastEntry } from '../../engine/storyTypes';
import { warnOnce } from './baseAdapter';
import { StaticSpriteAdapter } from './staticSpriteAdapter';

/**
 * M3 placeholder for pre-rigged Spine characters. The real version will load
 * the runtime + skeleton file from the cast entry's `asset` and map engine
 * actions to Spine animation names via `animationMap`. Until then it behaves
 * like a static sprite so stories still play.
 */
export class SpineAdapter extends StaticSpriteAdapter {
  constructor(entry: CastEntry) {
    super(entry);
    warnOnce('spine-stub', 'The Spine adapter is not implemented yet — falling back to static sprite behaviour.');
  }
}
