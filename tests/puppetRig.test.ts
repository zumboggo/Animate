import { describe, expect, it } from 'vitest';
import { CLIPS } from '../src/rig/clips';
import { BONE_DEFS } from '../src/rig/svgSkeleton';
import anna from '../public/assets/characters/anna/character.json';
import sarah from '../public/assets/characters/sarah/character.json';

function rotations(clipName: string, boneName: string): number[] {
  return CLIPS[clipName].keyframes.map((frame) => frame.bones[boneName]?.rotate ?? 0);
}

function maxAbs(values: number[]): number {
  return Math.max(...values.map(Math.abs));
}

describe('smooth puppet rig guardrails', () => {
  it('keeps shoulder pivots tucked inside the torso silhouette', () => {
    const byName = new Map(BONE_DEFS.map((bone) => [bone.name, bone]));
    expect(byName.get('leftUpperArm')?.pivotX).toBe(79);
    expect(byName.get('rightUpperArm')?.pivotX).toBe(121);
  });

  it('uses a restrained slide-and-bob walk', () => {
    expect(maxAbs(rotations('walk', 'leftThigh'))).toBeLessThanOrEqual(8);
    expect(maxAbs(rotations('walk', 'rightThigh'))).toBeLessThanOrEqual(8);
    expect(maxAbs(rotations('walk', 'leftUpperArm'))).toBeLessThanOrEqual(5);
    expect(maxAbs(CLIPS.walk.keyframes.map((frame) => frame.bones.root?.ty ?? 0))).toBeLessThanOrEqual(3);
  });

  it('keeps wave, point, and sit poses within seam-safe ranges', () => {
    expect(maxAbs(rotations('wave', 'rightUpperArm'))).toBeLessThanOrEqual(62);
    expect(maxAbs(rotations('point', 'rightUpperArm'))).toBeLessThanOrEqual(48);
    expect(maxAbs(rotations('sit', 'leftThigh'))).toBeLessThanOrEqual(8);
    expect(maxAbs(rotations('sit', 'rightThigh'))).toBeLessThanOrEqual(8);
  });

  it('uses exactly two rendered segments per arm and leg', () => {
    for (const manifest of [anna, sarah]) {
      expect(manifest.rig.bones.leftForearm.parent).toBe('leftUpperArm');
      expect(manifest.rig.bones.rightShin.parent).toBe('rightThigh');
      expect(manifest.rig.bones).not.toHaveProperty('leftHand');
      expect(manifest.rig.bones).not.toHaveProperty('rightHand');
      expect(manifest.rig.bones).not.toHaveProperty('leftFoot');
      expect(manifest.rig.bones).not.toHaveProperty('rightFoot');
      const limbLayers = manifest.rig.layers.filter((layer) =>
        /(?:upper-arm|forearm|thigh|shin)$/.test(layer.name),
      );
      expect(limbLayers).toHaveLength(8);
      expect(manifest.rig.layers.some((layer) => /(?:hand|foot)$/.test(layer.name))).toBe(false);
      expect(manifest.rig.bones.head.parent).toBe('torso');
    }
  });

  it('keeps screen-right wave bones on the screen-right side', () => {
    for (const manifest of [anna, sarah]) {
      expect(manifest.rig.bones.rightUpperArm.pivot[0]).toBeGreaterThan(50);
      expect(manifest.rig.bones.leftUpperArm.pivot[0]).toBeLessThan(50);
    }
  });
});
