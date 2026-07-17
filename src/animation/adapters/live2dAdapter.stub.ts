import type { CastEntry } from '../../engine/storyTypes';
import { warnOnce } from './baseAdapter';
import { StaticSpriteAdapter } from './staticSpriteAdapter';

/**
 * M3 placeholder for Live2D characters. The real version will load a Live2D
 * model from the cast entry's `asset` and map engine actions to motions via
 * `animationMap`. Until then it behaves like a static sprite so stories
 * still play.
 */
export class Live2dAdapter extends StaticSpriteAdapter {
  constructor(entry: CastEntry) {
    super(entry);
    warnOnce('live2d-stub', 'The Live2D adapter is not implemented yet — falling back to static sprite behaviour.');
  }
}
