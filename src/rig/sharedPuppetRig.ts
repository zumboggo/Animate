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

export function applySharedRigPreset(definition: PuppetRigDefinition): PuppetRigDefinition {
  if (definition.preset !== 'episodeKid') return definition;
  return {
    ...definition,
    bones: Object.fromEntries(
      Object.entries(definition.bones).map(([name, bone]) => [
        name,
        EPISODE_KID_BONES[name] ? { ...bone, ...EPISODE_KID_BONES[name] } : bone,
      ]),
    ),
  };
}
