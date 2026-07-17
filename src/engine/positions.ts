import type { EntrySide, StagePositionName } from './storyTypes';

/** Named stage positions as fractions of the stage width. */
export const POSITIONS: Record<StagePositionName, number> = {
  farLeft: 0.12,
  left: 0.3,
  center: 0.5,
  right: 0.7,
  farRight: 0.88,
};

/** Just past the stage edge, where characters wait before entering. */
export const OFFSTAGE: Record<EntrySide, number> = {
  left: -0.14,
  right: 1.14,
};

/** Where a character ends up when they enter without a stated destination. */
export function defaultEntryTarget(side: EntrySide): StagePositionName {
  return side === 'left' ? 'left' : 'right';
}
