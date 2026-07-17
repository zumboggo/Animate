import type { BoneName } from './svgSkeleton';

export type PaperDollPartName = Exclude<BoneName, 'root'>;
export type PaperDollParts = Record<PaperDollPartName, string>;

const urls = import.meta.glob<string>(
  '../../assets/characters/paper-doll/**/*.webp',
  { eager: true, query: '?url', import: 'default' },
);

const PART_NAMES: PaperDollPartName[] = [
  'head',
  'torso',
  'leftUpperArm',
  'leftForearm',
  'rightUpperArm',
  'rightForearm',
  'leftThigh',
  'leftShin',
  'rightThigh',
  'rightShin',
];

/** Resolves a cast asset such as `paper-doll/anna` into Vite-bundled URLs. */
export function getPaperDollParts(asset?: string): PaperDollParts | undefined {
  if (!asset?.startsWith('paper-doll/')) return undefined;

  const prefix = `../../assets/characters/${asset}/`;
  const entries = PART_NAMES.map((name) => [name, urls[`${prefix}${name}.webp`]] as const);
  if (entries.some(([, url]) => !url)) {
    console.warn(`Paper-doll asset "${asset}" is incomplete; using the vector fallback.`);
    return undefined;
  }

  return Object.fromEntries(entries) as PaperDollParts;
}
