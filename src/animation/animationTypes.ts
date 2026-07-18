import type {
  CharacterAction,
  CharacterEmotion,
  CharacterPose,
  EntrySide,
  Gait,
  StagePositionName,
} from '../engine/storyTypes';

export type CharacterPosition = StagePositionName;

export interface AnimationOptions {
  durationMs?: number;
}

export type ActingMotion = 'none' | 'settle' | 'talk' | 'laugh' | 'recoil' | 'dance';

export interface PoseTransitionOptions extends AnimationOptions {
  motion?: ActingMotion;
  /** Prefer a configured full-body sprite; adapters fall back to their clean pose implementation. */
  preferSprite?: boolean;
}

/**
 * The contract between the director and any character technology.
 * The director only ever talks to this interface — an SVG rig, a Spine
 * character, a sprite sheet, or a WebM clip all look the same from above.
 */
export interface CharacterAnimationAdapter {
  mount(container: HTMLElement): void;
  unmount(): void;

  /** Walk/run to a named stage position. */
  setPosition(position: CharacterPosition, options?: MoveOptions): Promise<void>;
  setEmotion(emotion: CharacterEmotion, options?: AnimationOptions): Promise<void>;

  playAction(action: CharacterAction, options?: AnimationOptions): Promise<void>;

  /** Transition to a named acting pose. Returns false only when the adapter has no clean representation. */
  transitionToPose?(pose: CharacterPose, options?: PoseTransitionOptions): Promise<boolean>;

  /** Enter from just offstage and travel to a position. */
  enterFrom(side: EntrySide, to: CharacterPosition, gait: Gait): Promise<void>;
  /** Travel offstage and hide. */
  exitTo(side: EntrySide, gait: Gait): Promise<void>;
  /** Appear instantly at a position (no travel). */
  appearAt(position: CharacterPosition): void;

  startIdle?(): void;
  stopIdle?(): void;

  startTalking?(): void;
  stopTalking?(): void;

  setFacing?(direction: EntrySide): void;

  /** Current stage x as a fraction of stage width (for bubbles/camera). */
  getStageFraction(): number;
  /** Root element on stage, or null when unmounted (for bubble anchoring). */
  getElement(): HTMLElement | null;
}

export interface MoveOptions extends AnimationOptions {
  gait?: Gait;
}
