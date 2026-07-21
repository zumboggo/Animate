export type StagePositionName = 'farLeft' | 'left' | 'center' | 'right' | 'farRight';
export type EntrySide = 'left' | 'right';
export type Gait = 'walk' | 'run' | 'swim';

export type StageEffectName =
  | 'screenShake'
  | 'fadeToBlack'
  | 'fadeIn'
  | 'cameraZoom'
  | 'cameraReset';

export interface StoryError {
  line: number;
  message: string;
}

/** Syntax-level output of the parser. Names/verbs/emotions are unvalidated strings. */
export type RawCommand =
  | { kind: 'scene'; scene: string; line: number }
  | { kind: 'dialogue'; character: string; emotion?: string; text: string; line: number }
  | { kind: 'expression'; character: string; emotion: string; line: number }
  | {
      kind: 'action';
      character: string;
      emotion?: string;
      verb: string;
      from?: EntrySide;
      to?: StagePositionName;
      line: number;
    }
  | { kind: 'wait'; ms: number; line: number }
  | { kind: 'effect'; effect: StageEffectName; target?: string; line: number };

export interface ParseResult {
  title?: string;
  commands: RawCommand[];
  errors: StoryError[];
}

/** Normalized engine action names — the vocabulary adapters implement. */
export type CharacterAction =
  | 'idle'
  | 'walkIn'
  | 'runIn'
  | 'walkOut'
  | 'runOut'
  | 'walkTo'
  | 'sit'
  | 'stand'
  | 'nod'
  | 'shakeHead'
  | 'wave'
  | 'jump'
  | 'bounce'
  | 'recoil'
  | 'tremble'
  | 'point'
  | 'dance'
  | 'fall'
  | 'turnAround'
  | 'laugh'
  | 'cry'
  | 'actScared'
  | 'treePose'
  | 'handsOnHips';

export type CharacterEmotion =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'scared'
  | 'surprised'
  | 'laughing'
  | 'confused';

/** Director-level acting poses. Adapters may render these with a rig or a full-body sprite. */
export type CharacterPose =
  | 'idle'
  | 'talkNeutral'
  | 'talkHappy'
  | 'talkAngry'
  | 'scared'
  | 'laugh'
  | 'sit'
  | 'point'
  | 'handsOnHips'
  | 'surprised'
  | 'fall'
  | 'dance';

/** Validated, normalized commands the director executes. */
export type StoryCommand =
  | { kind: 'scene'; scene: string; line: number }
  | { kind: 'dialogue'; character: string; emotion?: CharacterEmotion; text: string; line: number }
  | { kind: 'expression'; character: string; emotion: CharacterEmotion; line: number }
  | {
      kind: 'action';
      character: string;
      action: CharacterAction;
      emotion?: CharacterEmotion;
      gait: Gait;
      from?: EntrySide;
      to?: StagePositionName;
      line: number;
    }
  | { kind: 'wait'; ms: number; line: number }
  | { kind: 'effect'; effect: StageEffectName; target?: string; line: number };

export interface Story {
  title: string;
  commands: StoryCommand[];
}

export interface CastAppearance {
  skin?: string;
  hair?: 'short' | 'curly' | 'spiky' | 'long' | 'pigtails' | 'sidePonytail' | 'curlyPonytail' | 'babyWisps';
  hairColor?: string;
  shirtColor?: string;
  pantsColor?: string;
  outfit?: 'shirt' | 'dress' | 'onesie';
  dressColor?: string;
  pattern?: 'plain' | 'roses' | 'stripes' | 'cat' | 'heart';
  eyeColor?: string;
  freckles?: boolean;
  height?: number;
  build?: 'small' | 'average' | 'broad';
  /** Most characters keep their arms behind clothing; front is available for special designs. */
  armLayer?: 'back' | 'front';
}

export interface CastEntry {
  displayName: string;
  adapter: string;
  /** Optional facial-animation restraint for characters with detailed illustrated faces. */
  faceAnimation?: 'full' | 'mouthOnly';
  /** Character-relative stage height; 1 is the standard cast height. */
  scale?: number;
  appearance?: CastAppearance;
  /** For asset-backed adapters (sprites, Spine, Live2D, WebM). */
  asset?: string;
  /** Maps engine action names to technology-specific animation names. */
  animationMap?: Partial<Record<CharacterAction, string>>;
  /** Optional full-body pose art. Missing poses cleanly fall back to the reusable rig template. */
  poseAssets?: Partial<Record<CharacterPose, string>>;
  /** Expression sprites used by pose-first characters when a named acting pose is unavailable. */
  emotionAssets?: Partial<Record<CharacterEmotion, string>>;
  /** Relative pose height, useful for seated/crouched art trimmed from a shared source sheet. */
  poseScales?: Partial<Record<CharacterPose, number>>;
  /** Human-readable asset manifest used for authoring and rig tuning. */
  assetManifest?: string;
  /** Optional per-character override for the director's default action-to-pose choice. */
  poseMap?: Partial<Record<CharacterAction, CharacterPose>>;
}

export type Cast = Record<string, CastEntry>;
