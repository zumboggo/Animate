import type {
  CharacterAction,
  CharacterEmotion,
  CharacterPose,
} from '../engine/storyTypes';
import type { ActingMotion } from './animationTypes';

export interface ActingCue {
  pose: CharacterPose;
  emotion?: CharacterEmotion;
  motion: ActingMotion;
  durationMs: number;
  holdMs: number;
  holdPose?: boolean;
  preferSprite?: boolean;
}

const DEFAULT_DIALOGUE: ActingCue = {
  pose: 'talkNeutral',
  motion: 'talk',
  durationMs: 260,
  holdMs: 0,
};

/** Turns a plain dialogue emotion into readable acting without exposing animation syntax. */
export function dialogueCue(emotion: CharacterEmotion = 'neutral'): ActingCue {
  switch (emotion) {
    case 'happy':
    case 'laughing':
      return { ...DEFAULT_DIALOGUE, pose: 'talkHappy', emotion };
    case 'angry':
      return { ...DEFAULT_DIALOGUE, pose: 'talkAngry', emotion };
    case 'scared':
      return { ...DEFAULT_DIALOGUE, pose: 'scared', emotion, motion: 'recoil' };
    case 'surprised':
      return { ...DEFAULT_DIALOGUE, pose: 'surprised', emotion, motion: 'settle' };
    default:
      return { ...DEFAULT_DIALOGUE, emotion };
  }
}

/** Emotional beats use the same reusable pose vocabulary as spoken dialogue. */
export function expressionCue(emotion: CharacterEmotion): ActingCue {
  const cue = dialogueCue(emotion);
  return {
    ...cue,
    pose: cue.pose.startsWith('talk') ? 'idle' : cue.pose,
    motion: emotion === 'scared' ? 'recoil' : 'settle',
    holdMs: 320,
  };
}

const ACTION_CUES: Partial<Record<CharacterAction, ActingCue>> = {
  handsOnHips: {
    pose: 'handsOnHips', motion: 'settle', durationMs: 300, holdMs: 520, preferSprite: true,
  },
  sit: {
    pose: 'sit', motion: 'settle', durationMs: 420, holdMs: 0, holdPose: true, preferSprite: true,
  },
  point: {
    pose: 'point', motion: 'settle', durationMs: 300, holdMs: 380, preferSprite: true,
  },
  laugh: {
    pose: 'laugh', emotion: 'laughing', motion: 'laugh', durationMs: 280, holdMs: 180, preferSprite: true,
  },
  actScared: {
    pose: 'scared', emotion: 'scared', motion: 'recoil', durationMs: 240, holdMs: 160, preferSprite: true,
  },
  fall: {
    pose: 'fall', motion: 'settle', durationMs: 460, holdMs: 0, holdPose: true, preferSprite: true,
  },
  dance: {
    pose: 'dance', emotion: 'happy', motion: 'dance', durationMs: 280, holdMs: 220, preferSprite: true,
  },
};

export function actionCue(
  action: CharacterAction,
  override?: CharacterPose,
): ActingCue | undefined {
  const base = ACTION_CUES[action];
  if (!base && !override) return undefined;
  if (base) return override ? { ...base, pose: override } : { ...base };
  return {
    pose: override!, motion: 'settle', durationMs: 280, holdMs: 520, preferSprite: true,
  };
}
