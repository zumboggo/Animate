import type { CastAppearance } from '../engine/storyTypes';
import { FaceController, type FaceElements } from './faces';
import { BONE_DEFS, VIEW_H, VIEW_W } from './svgSkeleton';

const SVG_NS = 'http://www.w3.org/2000/svg';
const INK = '#26201d';

const DEFAULTS: Required<CastAppearance> = {
  skin: '#f2c9a0',
  hair: 'short',
  hairColor: '#2b1b12',
  shirtColor: '#5aa9e6',
  pantsColor: '#39415c',
  height: 1,
  build: 'average',
};

export interface RigCharacter {
  svg: SVGSVGElement;
  bones: Map<string, SVGGElement>;
  face: FaceController;
  appearance: Required<CastAppearance>;
}

function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function limb(x1: number, y1: number, x2: number, y2: number, stroke: string, width: number) {
  return el('line', {
    x1, y1, x2, y2,
    stroke,
    'stroke-width': width,
    'stroke-linecap': 'round',
  });
}

/** Builds a chibi vector character in rest pose from an appearance sheet. */
export function buildRigCharacter(appearanceIn: CastAppearance = {}): RigCharacter {
  const a = { ...DEFAULTS, ...appearanceIn };
  const svg = el('svg', {
    viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
    preserveAspectRatio: 'xMidYMax meet',
  });

  // Non-bone wrapper used only for the build (body width) scale, so the
  // animator can freely overwrite every bone's transform each frame.
  const fit = el('g');
  const buildScale = a.build === 'small' ? 0.92 : a.build === 'broad' ? 1.1 : 1;
  if (buildScale !== 1) {
    fit.setAttribute('transform', `translate(100 0) scale(${buildScale} 1) translate(-100 0)`);
  }
  svg.appendChild(fit);

  const bones = new Map<string, SVGGElement>();
  for (const def of BONE_DEFS) {
    const g = el('g');
    g.dataset.bone = def.name;
    bones.set(def.name, g);
    (def.parent ? bones.get(def.parent)! : fit).appendChild(g);
  }

  // ---- Legs (drawn under the torso) ----
  bones.get('leftThigh')!.insertBefore(limb(85, 208, 85, 253, a.pantsColor, 17), bones.get('leftShin')!);
  const leftShin = bones.get('leftShin')!;
  leftShin.appendChild(limb(85, 253, 85, 300, a.pantsColor, 15));
  leftShin.appendChild(el('ellipse', { cx: 82, cy: 309, rx: 13, ry: 7, fill: '#3a3a3a' }));

  bones.get('rightThigh')!.insertBefore(limb(115, 208, 115, 253, a.pantsColor, 17), bones.get('rightShin')!);
  const rightShin = bones.get('rightShin')!;
  rightShin.appendChild(limb(115, 253, 115, 300, a.pantsColor, 15));
  rightShin.appendChild(el('ellipse', { cx: 118, cy: 309, rx: 13, ry: 7, fill: '#3a3a3a' }));

  // ---- Torso ----
  const torso = bones.get('torso')!;
  torso.insertBefore(
    el('rect', { x: 66, y: 112, width: 68, height: 100, rx: 22, fill: a.shirtColor }),
    torso.firstChild,
  );

  // ---- Head ----
  const head = bones.get('head')!;
  if (a.hair === 'long') {
    head.appendChild(el('path', {
      d: 'M57,58 Q46,110 58,140 Q68,146 76,140 Q66,105 68,70 Z',
      fill: a.hairColor,
    }));
    head.appendChild(el('path', {
      d: 'M143,58 Q154,110 142,140 Q132,146 124,140 Q134,105 132,70 Z',
      fill: a.hairColor,
    }));
  }
  head.appendChild(el('circle', { cx: 100, cy: 68, r: 45, fill: a.skin }));

  if (a.hair === 'spiky') {
    head.appendChild(el('path', {
      d: 'M58,62 L70,30 L82,48 L96,22 L108,46 L122,28 L134,50 L142,62 Z',
      fill: a.hairColor,
    }));
  }
  if (a.hair === 'curly') {
    for (const [cx, cy, r] of [[62, 45, 13], [82, 32, 14], [103, 28, 14], [122, 34, 13], [138, 48, 12]]) {
      head.appendChild(el('circle', { cx, cy, r, fill: a.hairColor }));
    }
  }
  head.appendChild(el('path', {
    d: 'M55,68 A45,45 0 0 1 145,68 Q137,48 100,48 Q63,48 55,68 Z',
    fill: a.hairColor,
  }));

  // ---- Face ----
  const faceGroup = el('g');
  head.appendChild(faceGroup);

  const strokeAttrs = {
    fill: 'none',
    stroke: INK,
    'stroke-width': 3.4,
    'stroke-linecap': 'round',
  } as const;

  const browL = el('path', { ...strokeAttrs, d: 'M75,51 Q84,47 93,51' });
  const browR = el('path', { ...strokeAttrs, d: 'M107,51 Q116,47 125,51' });
  faceGroup.append(browL, browR);

  const eyeDots = el('g');
  eyeDots.append(
    el('circle', { cx: 84, cy: 64, r: 4.5, fill: INK }),
    el('circle', { cx: 116, cy: 64, r: 4.5, fill: INK }),
  );

  const eyeWide = el('g');
  for (const cx of [84, 116]) {
    eyeWide.append(
      el('circle', { cx, cy: 64, r: 8, fill: '#fff', stroke: INK, 'stroke-width': 1.6 }),
      el('circle', { cx, cy: 64, r: 3.6, fill: INK }),
    );
  }

  const eyeHappy = el('g');
  eyeHappy.append(
    el('path', { ...strokeAttrs, d: 'M75,66 Q84,57 93,66' }),
    el('path', { ...strokeAttrs, d: 'M107,66 Q116,57 125,66' }),
  );

  const eyeClosed = el('g');
  eyeClosed.append(
    el('path', { ...strokeAttrs, d: 'M76,65 L92,65' }),
    el('path', { ...strokeAttrs, d: 'M108,65 L124,65' }),
  );

  faceGroup.append(eyeDots, eyeWide, eyeHappy, eyeClosed);

  faceGroup.appendChild(el('path', {
    d: 'M100,72 q3,4 0,7',
    fill: 'none',
    stroke: INK,
    'stroke-width': 2,
    'stroke-linecap': 'round',
  }));

  const tears = el('g');
  tears.style.display = 'none';
  tears.append(
    el('ellipse', { cx: 84, cy: 79, rx: 2.6, ry: 4.4, fill: '#7ec8ff' }),
    el('ellipse', { cx: 116, cy: 79, rx: 2.6, ry: 4.4, fill: '#7ec8ff' }),
  );
  faceGroup.appendChild(tears);

  const mouth = el('path', {
    d: 'M91,89 Q100,93 109,89',
    fill: 'none',
    stroke: INK,
    'stroke-width': 3.2,
    'stroke-linecap': 'round',
  });
  faceGroup.appendChild(mouth);

  // ---- Arms (drawn over the torso) ----
  const leftUpper = bones.get('leftUpperArm')!;
  leftUpper.insertBefore(limb(64, 133, 64, 170, a.shirtColor, 13), bones.get('leftForearm')!);
  const leftFore = bones.get('leftForearm')!;
  leftFore.appendChild(limb(64, 170, 64, 200, a.skin, 11));
  leftFore.appendChild(el('circle', { cx: 64, cy: 205, r: 7.5, fill: a.skin }));

  const rightUpper = bones.get('rightUpperArm')!;
  rightUpper.insertBefore(limb(136, 133, 136, 170, a.shirtColor, 13), bones.get('rightForearm')!);
  const rightFore = bones.get('rightForearm')!;
  rightFore.appendChild(limb(136, 170, 136, 200, a.skin, 11));
  rightFore.appendChild(el('circle', { cx: 136, cy: 205, r: 7.5, fill: a.skin }));

  const faceEls: FaceElements = {
    browL,
    browR,
    eyeGroups: { dots: eyeDots, wide: eyeWide, happyArcs: eyeHappy, closed: eyeClosed },
    mouth,
    tears,
    inkColor: INK,
  };

  return { svg, bones, face: new FaceController(faceEls), appearance: a };
}
