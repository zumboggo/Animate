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
  feature?: 'brows' | 'eyes' | 'mouth';
}

export interface PuppetFaceDefinition {
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
  rotationScale?: number;
  bones: Record<string, PuppetBoneDefinition>;
  layers: PuppetLayerDefinition[];
  face: PuppetFaceDefinition;
}

export interface PuppetCharacterManifest {
  id: string;
  displayName: string;
  renderMode: 'hybrid' | 'poseSprites';
  rig?: PuppetRigDefinition;
}
