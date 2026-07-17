export type StagePositionName = 'farLeft' | 'left' | 'center' | 'right' | 'farRight';
export type EntrySide = 'left' | 'right';
export type Gait = 'walk' | 'run';

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
  | 'tremble'
  | 'point'
  | 'dance'
  | 'fall'
  | 'turnAround'
  | 'laugh'
  | 'cry'
  | 'actScared';

export type CharacterEmotion =
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'scared'
  | 'surprised'
  | 'laughing'
  | 'confused';

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
  hair?: 'short' | 'curly' | 'spiky' | 'long' | 'pigtails' | 'sidePonytail';
  hairColor?: string;
  shirtColor?: string;
  pantsColor?: string;
  outfit?: 'shirt' | 'dress';
  dressColor?: string;
  pattern?: 'plain' | 'roses';
  height?: number;
  build?: 'small' | 'average' | 'broad';
}

export interface CastEntry {
  displayName: string;
  adapter: string;
  appearance?: CastAppearance;
  /** For asset-backed adapters (sprites, Spine, Live2D, WebM). */
  asset?: string;
  /** Maps engine action names to technology-specific animation names. */
  animationMap?: Partial<Record<CharacterAction, string>>;
}

export type Cast = Record<string, CastEntry>;
