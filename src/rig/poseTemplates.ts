import type { CharacterPose } from '../engine/storyTypes';
import type { ActingMotion } from '../animation/animationTypes';
import type { BoneFrame } from './svgAnimator';

export interface RigPoseTemplate {
  bones: Record<string, BoneFrame>;
  /** A restrained whole-body presentation transform that adds a slight 3/4-view lean. */
  presentation: string;
  motion?: ActingMotion;
}

export const RIG_POSES: Record<CharacterPose, RigPoseTemplate> = {
  idle: {
    bones: {},
    presentation: 'translateX(1.5%) rotate(-0.8deg) scaleX(0.965)',
  },
  talkNeutral: {
    bones: { torso: { rotate: -1 }, head: { rotate: 1 } },
    presentation: 'translateX(2%) rotate(-1.2deg) scaleX(0.96)',
    motion: 'talk',
  },
  talkHappy: {
    bones: { torso: { rotate: -2, ty: -1 }, head: { rotate: 3, ty: -1 } },
    presentation: 'translateX(2.5%) translateY(-1%) rotate(-1.8deg) scaleX(0.96)',
    motion: 'talk',
  },
  talkAngry: {
    bones: { torso: { rotate: 2 }, head: { rotate: -2 }, leftUpperArm: { rotate: -4 }, rightUpperArm: { rotate: 4 } },
    presentation: 'translateX(1%) rotate(1.2deg) scaleX(0.97)',
    motion: 'talk',
  },
  scared: {
    bones: { root: { tx: -3 }, torso: { rotate: -3 }, head: { rotate: 4 }, leftUpperArm: { rotate: 10 }, rightUpperArm: { rotate: -10 } },
    presentation: 'translateX(-2%) rotate(-2deg) scale(0.98)',
    motion: 'recoil',
  },
  laugh: {
    bones: { torso: { rotate: 2, ty: 2 }, head: { rotate: -7, ty: -2 }, leftUpperArm: { rotate: 5 }, rightUpperArm: { rotate: -5 } },
    presentation: 'translateX(1%) rotate(-2.2deg) scaleX(0.97)',
    motion: 'laugh',
  },
  sit: {
    bones: { root: { ty: 38 }, torso: { rotate: 2 }, leftThigh: { rotate: 8 }, leftShin: { rotate: -6 }, rightThigh: { rotate: -8 }, rightShin: { rotate: 6 }, leftUpperArm: { rotate: 4 }, rightUpperArm: { rotate: -4 } },
    presentation: 'translateX(1%) scaleX(0.97)',
  },
  point: {
    bones: { rightUpperArm: { rotate: -46 }, rightForearm: { rotate: -6 }, head: { rotate: -3 }, torso: { rotate: -1 } },
    presentation: 'translateX(2%) rotate(-1.4deg) scaleX(0.96)',
  },
  handsOnHips: {
    bones: { leftUpperArm: { rotate: -18 }, leftForearm: { rotate: 42 }, rightUpperArm: { rotate: 18 }, rightForearm: { rotate: -42 }, torso: { rotate: 1 } },
    presentation: 'translateX(1%) rotate(0.8deg) scaleX(0.97)',
  },
  surprised: {
    bones: { root: { ty: -3 }, head: { ty: -2 }, leftUpperArm: { rotate: 9 }, rightUpperArm: { rotate: -9 } },
    presentation: 'translateX(1%) translateY(-1%) rotate(0.8deg) scaleX(0.97)',
  },
  fall: {
    bones: { root: { rotate: 78, ty: 40 }, torso: { rotate: 2 }, leftUpperArm: { rotate: 8 }, rightUpperArm: { rotate: -8 } },
    presentation: 'translateX(-3%) scaleX(0.97)',
  },
  dance: {
    bones: { root: { tx: -5, ty: -3 }, torso: { rotate: -4 }, head: { rotate: 4 }, leftUpperArm: { rotate: 14 }, rightUpperArm: { rotate: -14 }, leftThigh: { rotate: 4 }, rightThigh: { rotate: -4 } },
    presentation: 'translateX(1%) rotate(-1.5deg) scaleX(0.97)',
    motion: 'dance',
  },
};

