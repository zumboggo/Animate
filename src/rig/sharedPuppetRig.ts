import type { PuppetBoneDefinition, PuppetRigDefinition } from '../animation/puppetRigTypes';

/**
 * Shared main-cast skeleton inspired by interactive-story staging.
 * Character art stays unique, but motion originates from identical anchors so
 * poses and clips can be reused without character-by-character retuning.
 */
export const EPISODE_KID_BONES: Record<string, PuppetBoneDefinition> = {
  root: { pivot: [50, 95], z: 0 },
  pelvis: { parent: 'root', pivot: [50, 60], z: 1 },
  leftThigh: { parent: 'pelvis', pivot: [42, 62], z: -2 },
  leftShin: { parent: 'leftThigh', pivot: [41, 78], z: 1 },
  rightThigh: { parent: 'pelvis', pivot: [58, 62], z: -3 },
  rightShin: { parent: 'rightThigh', pivot: [59, 78], z: 1 },
  torso: { parent: 'root', pivot: [50, 54], z: 3 },
  leftUpperArm: { parent: 'torso', pivot: [34, 36], z: -2 },
  leftForearm: { parent: 'leftUpperArm', pivot: [25, 52], z: 1 },
  rightUpperArm: { parent: 'torso', pivot: [66, 36], z: -3 },
  rightForearm: { parent: 'rightUpperArm', pivot: [75, 52], z: 1 },
  head: { parent: 'torso', pivot: [50, 30], z: 4 },
};

export const CHILD_RIG_LAYER_SPECS = {
  'left-thigh': { box: [31, 60, 20, 26], z: 0 },
  'left-shin': { box: [29, 74, 22, 25], z: 1 },
  'right-thigh': { box: [49, 60, 20, 26], z: 0 },
  'right-shin': { box: [49, 74, 22, 25], z: 1 },
  pelvis: { box: [29, 55, 42, 20], z: 1 },
  'left-upper-arm': { box: [19, 31, 17, 25], z: 0 },
  'left-forearm': { box: [18, 46, 18, 29], z: 1 },
  'right-upper-arm': { box: [64, 31, 17, 25], z: 0 },
  'right-forearm': { box: [64, 46, 18, 29], z: 1 },
  torso: { box: [24, 27, 52, 38], z: 2 },
} as const;

export type ChildRigLayerName = keyof typeof CHILD_RIG_LAYER_SPECS;

function isChildRigLayer(name: string): name is ChildRigLayerName {
  return name in CHILD_RIG_LAYER_SPECS;
}

export function applySharedRigPreset(definition: PuppetRigDefinition): PuppetRigDefinition {
  if (definition.preset !== 'episodeKid') return definition;
  return {
    ...definition,
    aspectRatio: 0.5,
    rotationScale: 0.54,
    armStyle: 'segmented',
    bones: Object.fromEntries(
      Object.entries(definition.bones).map(([name, bone]) => [
        name,
        EPISODE_KID_BONES[name] ? { ...bone, ...EPISODE_KID_BONES[name] } : bone,
      ]),
    ),
    layers: definition.layers.map((layer) => {
      if (!isChildRigLayer(layer.name)) return layer;
      const spec = CHILD_RIG_LAYER_SPECS[layer.name];
      return {
        ...layer,
        asset: definition.skinRoot ? `${definition.skinRoot}/${layer.name}.png` : layer.asset,
        box: [...spec.box],
        z: spec.z,
      };
    }),
  };
}
