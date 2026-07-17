import type { CastEntry } from '../engine/storyTypes';
import type { CharacterAnimationAdapter } from './animationTypes';
import { warnOnce } from './adapters/baseAdapter';
import { Live2dAdapter } from './adapters/live2dAdapter.stub';
import { SpineAdapter } from './adapters/spineAdapter.stub';
import { SpriteSheetAdapter } from './adapters/spriteSheetAdapter';
import { StaticSpriteAdapter } from './adapters/staticSpriteAdapter';
import { SvgRigAdapter } from './adapters/svgRigAdapter';
import { WebmClipAdapter } from './adapters/webmClipAdapter';

type AdapterFactory = (entry: CastEntry) => CharacterAnimationAdapter;

const REGISTRY: Record<string, AdapterFactory> = {
  svgRig: (entry) => new SvgRigAdapter(entry),
  staticSprite: (entry) => new StaticSpriteAdapter(entry),
  spriteSheet: (entry) => new SpriteSheetAdapter(entry),
  webmClip: (entry) => new WebmClipAdapter(entry),
  spine: (entry) => new SpineAdapter(entry),
  live2d: (entry) => new Live2dAdapter(entry),
};

export function createAdapter(entry: CastEntry): CharacterAnimationAdapter {
  const factory = REGISTRY[entry.adapter];
  if (factory) return factory(entry);
  warnOnce(
    `adapter-${entry.adapter}`,
    `Unknown adapter "${entry.adapter}" for ${entry.displayName} — using the SVG rig instead.`,
  );
  return new SvgRigAdapter(entry);
}
