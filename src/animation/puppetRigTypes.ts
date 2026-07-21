import type { CharacterEmotion } from '../engine/storyTypes';

export interface PuppetBoneDefinition {
  parent?: string;
  /** Pivot in percentages of the shared rig canvas. */
  pivot: [number, number];
  z?: number;
}

export interface PuppetLayerDefinition {
  name: string;
  bone: string;
  asset: string;
  /** left, top, width, height as percentages of the rig canvas. */
  box: [number, number, number, number];
  z?: number;
  feature?: 'brows' | 'eyes' | 'mouth' | 'headClosed' | 'headOpen';
}

export interface PuppetFaceDefinition {
  /** Mouth-only preserves the illustrated eyes and brows while dialogue animates. */
  mode?: 'full' | 'mouthOnly';
  brows: Partial<Record<CharacterEmotion, string>> & { neutral: string };
  eyes: Partial<Record<CharacterEmotion, string>> & {
    neutral: string;
    closed: string;
  };
  mouths: Partial<Record<CharacterEmotion, string>> & {
    neutral: string;
    talk: string;
  };
}

export interface PuppetRigDefinition {
  aspectRatio: number;
  /** Reuses a cast-wide skeleton while each character keeps character-specific art boxes. */
  preset?: 'episodeKid';
  /** Single-piece arms rotate from the shoulder; bent gestures use coherent pose art. */
  armStyle?: 'segmented' | 'singlePiece';
  armVariants?: {
    leftBent?: string;
    rightBent?: string;
  };
  rotationScale?: number;
  /** Two complete, aligned head layers crossfade during neutral dialogue. */
  talkingHead?: boolean;
  bones: Record<string, PuppetBoneDefinition>;
  layers: PuppetLayerDefinition[];
  face?: PuppetFaceDefinition;
}

export interface PuppetCharacterManifest {
  id: string;
  displayName: string;
  renderMode: 'hybrid' | 'poseSprites';
  rig?: PuppetRigDefinition;
}
