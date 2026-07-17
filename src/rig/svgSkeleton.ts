/**
 * The shared skeleton every SVG-rigged character uses. All coordinates are in
 * the rest-pose viewBox (0 0 200 330, feet on the ground at y≈316).
 *
 * Chibi proportions: the head is nearly half the character's height, limbs
 * are short and stubby, and every joint pivot sits at the exact shared center
 * of the two capsule ends that meet there — which is what keeps elbows and
 * knees seamless at any bend angle.
 *
 * Bones are nested <g> elements; each rotates around its pivot, expressed in
 * rest-pose coordinates. Because children live inside their parent's group,
 * rotations compose naturally (bend the torso and the head/arms follow).
 */

export const VIEW_W = 200;
export const VIEW_H = 330;

export interface BoneDef {
  name: string;
  parent: string | null;
  pivotX: number;
  pivotY: number;
}

export const BONE_DEFS: BoneDef[] = [
  { name: 'root', parent: null, pivotX: 100, pivotY: 234 },
  { name: 'leftThigh', parent: 'root', pivotX: 84, pivotY: 222 },
  { name: 'leftShin', parent: 'leftThigh', pivotX: 84, pivotY: 272 },
  { name: 'rightThigh', parent: 'root', pivotX: 116, pivotY: 222 },
  { name: 'rightShin', parent: 'rightThigh', pivotX: 116, pivotY: 272 },
  { name: 'torso', parent: 'root', pivotX: 100, pivotY: 234 },
  { name: 'head', parent: 'torso', pivotX: 100, pivotY: 132 },
  { name: 'leftUpperArm', parent: 'torso', pivotX: 79, pivotY: 150 },
  { name: 'leftForearm', parent: 'leftUpperArm', pivotX: 60, pivotY: 188 },
  { name: 'rightUpperArm', parent: 'torso', pivotX: 121, pivotY: 150 },
  { name: 'rightForearm', parent: 'rightUpperArm', pivotX: 140, pivotY: 188 },
];

export type BoneName =
  | 'root'
  | 'leftThigh'
  | 'leftShin'
  | 'rightThigh'
  | 'rightShin'
  | 'torso'
  | 'head'
  | 'leftUpperArm'
  | 'leftForearm'
  | 'rightUpperArm'
  | 'rightForearm';
