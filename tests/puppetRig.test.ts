import { describe, expect, it } from 'vitest';
import { CLIPS } from '../src/rig/clips';
import { BONE_DEFS } from '../src/rig/svgSkeleton';

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
});
