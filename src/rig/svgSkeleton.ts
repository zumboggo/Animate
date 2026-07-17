/**
 * The shared skeleton every SVG-rigged character uses. All coordinates are in
 * the rest-pose viewBox (0 0 200 330, feet on the ground at y≈315).
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
  { name: 'root', parent: null, pivotX: 100, pivotY: 207 },
  { name: 'leftThigh', parent: 'root', pivotX: 85, pivotY: 208 },
  { name: 'leftShin', parent: 'leftThigh', pivotX: 85, pivotY: 253 },
  { name: 'rightThigh', parent: 'root', pivotX: 115, pivotY: 208 },
  { name: 'rightShin', parent: 'rightThigh', pivotX: 115, pivotY: 253 },
  { name: 'torso', parent: 'root', pivotX: 100, pivotY: 207 },
  { name: 'head', parent: 'torso', pivotX: 100, pivotY: 112 },
  { name: 'leftUpperArm', parent: 'torso', pivotX: 64, pivotY: 133 },
  { name: 'leftForearm', parent: 'leftUpperArm', pivotX: 64, pivotY: 170 },
  { name: 'rightUpperArm', parent: 'torso', pivotX: 136, pivotY: 133 },
  { name: 'rightForearm', parent: 'rightUpperArm', pivotX: 136, pivotY: 170 },
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
