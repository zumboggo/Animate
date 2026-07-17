import type { CastAppearance } from '../engine/storyTypes';
import { FaceController, type FaceElements } from './faces';
import { getPaperDollParts, type PaperDollParts, type PaperDollPartName } from './paperDollAssets';
import { BONE_DEFS, VIEW_H, VIEW_W } from './svgSkeleton';

const SVG_NS = 'http://www.w3.org/2000/svg';
const INK = '#26201d';

const DEFAULTS: Required<CastAppearance> = {
  skin: '#f2c9a0',
  hair: 'short',
  hairColor: '#2b1b12',
  shirtColor: '#5aa9e6',
  pantsColor: '#39415c',
  outfit: 'shirt',
  dressColor: '#5aa9e6',
  pattern: 'plain',
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
export function buildRigCharacter(appearanceIn: CastAppearance = {}, asset?: string): RigCharacter {
  const a = { ...DEFAULTS, ...appearanceIn };
  const isDress = a.outfit === 'dress';
  const isOnesie = a.outfit === 'onesie';
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

  const paperDoll = getPaperDollParts(asset);
  if (paperDoll) addPaperDoll(bones, paperDoll);
  const headBone = bones.get('head')!;
  const head = el('g', {
    transform: 'translate(100 112) scale(1.22) translate(-100 -112)',
  });
  while (headBone.firstChild) head.appendChild(headBone.firstChild);
  headBone.appendChild(head);

  if (!paperDoll) {

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
  if (isDress) {
    const dress = el('g');
    dress.append(
      el('rect', { x: 65, y: 112, width: 70, height: 59, rx: 20, fill: a.shirtColor }),
      el('rect', { x: 65, y: 155, width: 70, height: 17, rx: 5, fill: a.dressColor }),
      el('path', {
        d: 'M66,164 Q100,174 134,164 L151,228 Q100,242 49,228 Z',
        fill: a.dressColor,
      }),
      el('path', {
        d: 'M58,226 Q100,238 142,226',
        fill: 'none',
        stroke: '#5f1234',
        'stroke-width': 3,
        opacity: 0.35,
      }),
    );
    if (a.pattern === 'roses') {
      addRose(dress, 79, 133, 0.72);
      addRose(dress, 105, 124, 0.64);
      addRose(dress, 121, 146, 0.74);
      addRose(dress, 94, 151, 0.55);
    }
    torso.insertBefore(dress, torso.firstChild);
  } else if (isOnesie) {
    const onesie = el('g');
    onesie.append(
      el('rect', { x: 64, y: 111, width: 72, height: 92, rx: 25, fill: a.shirtColor }),
      el('path', { d: 'M69,187 Q100,200 131,187 L128,220 L105,220 L100,205 L95,220 L72,220 Z', fill: a.shirtColor }),
    );
    addHeart(onesie, 100, 151, 0.75, a.dressColor);
    torso.insertBefore(onesie, torso.firstChild);
  } else {
    torso.insertBefore(
      el('rect', { x: 66, y: 112, width: 68, height: 100, rx: 22, fill: a.shirtColor }),
      torso.firstChild,
    );
    if (a.pattern === 'stripes') addStripes(torso);
    if (a.pattern === 'cat') addCat(torso);
  }

  // ---- Head ----
  if (a.hair === 'pigtails') {
    head.append(
      el('path', {
        d: 'M61,42 Q35,26 31,49 Q29,66 49,73 Q39,82 52,91 Q68,82 66,57 Z',
        fill: a.hairColor,
      }),
      el('path', {
        d: 'M139,42 Q165,26 169,49 Q171,66 151,73 Q161,82 148,91 Q132,82 134,57 Z',
        fill: a.hairColor,
      }),
      el('circle', { cx: 57, cy: 42, r: 5, fill: '#77a765' }),
      el('circle', { cx: 143, cy: 42, r: 5, fill: '#77a765' }),
    );
  }
  if (a.hair === 'sidePonytail') {
    head.append(
      el('path', {
        d: 'M138,42 Q164,43 168,65 Q171,83 151,99 Q158,78 143,70 Z',
        fill: a.hairColor,
      }),
      el('path', {
        d: 'M148,54 Q166,62 159,87 Q153,103 141,107 Q151,84 137,67 Z',
        fill: a.hairColor,
      }),
      el('circle', { cx: 144, cy: 51, r: 6, fill: a.dressColor }),
    );
  }
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
  if (a.hair === 'curlyPonytail') {
    head.append(
      el('circle', { cx: 142, cy: 38, r: 15, fill: a.hairColor }),
      el('circle', { cx: 155, cy: 49, r: 13, fill: a.hairColor }),
      el('circle', { cx: 145, cy: 61, r: 12, fill: a.hairColor }),
      el('circle', { cx: 139, cy: 39, r: 5, fill: '#d6b4d8' }),
    );
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
  if (a.hair === 'curlyPonytail') {
    for (const [cx, cy, r] of [[61, 50, 11], [72, 38, 12], [88, 31, 12], [105, 30, 12], [122, 35, 11], [136, 48, 10]]) {
      head.appendChild(el('circle', { cx, cy, r, fill: a.hairColor }));
    }
  } else if (a.hair === 'babyWisps') {
    head.append(
      el('path', { d: 'M78,34 Q88,18 98,34', fill: 'none', stroke: a.hairColor, 'stroke-width': 5, 'stroke-linecap': 'round' }),
      el('path', { d: 'M96,31 Q106,17 114,35', fill: 'none', stroke: a.hairColor, 'stroke-width': 5, 'stroke-linecap': 'round' }),
      el('path', { d: 'M62,55 Q70,41 81,42', fill: 'none', stroke: a.hairColor, 'stroke-width': 5, 'stroke-linecap': 'round' }),
    );
  } else {
    head.appendChild(el('path', {
      d: 'M55,68 A45,45 0 0 1 145,68 Q137,48 100,48 Q63,48 55,68 Z',
      fill: a.hairColor,
    }));
  }
  if (a.hair === 'pigtails' || a.hair === 'sidePonytail') {
    head.appendChild(el('path', {
      d: a.hair === 'sidePonytail'
        ? 'M58,61 Q73,28 112,29 Q100,42 91,53 Q78,51 64,68 Z'
        : 'M57,64 Q73,31 102,31 Q91,42 88,55 Q73,53 61,69 Z',
      fill: a.hairColor,
    }));
  }
  }

  // ---- Face ----
  const faceGroup = el('g');
  head.appendChild(faceGroup);

  // Generated heads carry their likeness in the printed eyes and brows. We
  // replace only the mouth so dialogue lip-sync remains animated without
  // painting a conspicuous flat patch across the character's face.
  if (paperDoll) {
    faceGroup.append(el('ellipse', { cx: 100, cy: 89, rx: 16, ry: 11, fill: a.skin }));
  }

  const strokeAttrs = {
    fill: 'none',
    stroke: INK,
    'stroke-width': 3.4,
    'stroke-linecap': 'round',
  } as const;

  const browL = el('path', { ...strokeAttrs, d: 'M75,51 Q84,47 93,51' });
  const browR = el('path', { ...strokeAttrs, d: 'M107,51 Q116,47 125,51' });
  if (paperDoll) {
    browL.setAttribute('opacity', '0');
    browR.setAttribute('opacity', '0');
  }
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

  if (paperDoll) {
    eyeDots.setAttribute('opacity', '0');
    eyeWide.setAttribute('opacity', '0');
    eyeHappy.setAttribute('opacity', '0');
    eyeClosed.setAttribute('opacity', '0');
  }

  if (!paperDoll) {
    faceGroup.appendChild(el('path', {
      d: 'M100,72 q3,4 0,7',
      fill: 'none',
      stroke: INK,
      'stroke-width': 2,
      'stroke-linecap': 'round',
    }));
  }

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

  if (!paperDoll) {
  // ---- Arms (drawn over the torso) ----
  const upperArmColor = isDress ? a.skin : a.shirtColor;
  const leftUpper = bones.get('leftUpperArm')!;
  leftUpper.insertBefore(limb(64, 133, 64, 170, upperArmColor, 13), bones.get('leftForearm')!);
  if (isDress) leftUpper.appendChild(el('circle', { cx: 64, cy: 134, r: 10, fill: a.dressColor }));
  const leftFore = bones.get('leftForearm')!;
  leftFore.appendChild(limb(64, 170, 64, 200, a.skin, 11));
  leftFore.appendChild(el('circle', { cx: 64, cy: 205, r: 7.5, fill: a.skin }));

  const rightUpper = bones.get('rightUpperArm')!;
  rightUpper.insertBefore(limb(136, 133, 136, 170, upperArmColor, 13), bones.get('rightForearm')!);
  if (isDress) rightUpper.appendChild(el('circle', { cx: 136, cy: 134, r: 10, fill: a.dressColor }));
  const rightFore = bones.get('rightForearm')!;
  rightFore.appendChild(limb(136, 170, 136, 200, a.skin, 11));
  rightFore.appendChild(el('circle', { cx: 136, cy: 205, r: 7.5, fill: a.skin }));
  }

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

interface PartPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PART_PLACEMENTS: Record<PaperDollPartName, PartPlacement> = {
  head: { x: 44, y: 18, width: 112, height: 96 },
  torso: { x: 48, y: 104, width: 104, height: 132 },
  leftUpperArm: { x: 43, y: 124, width: 42, height: 53 },
  leftForearm: { x: 43, y: 163, width: 42, height: 51 },
  rightUpperArm: { x: 115, y: 124, width: 42, height: 53 },
  rightForearm: { x: 115, y: 163, width: 42, height: 51 },
  leftThigh: { x: 66, y: 200, width: 38, height: 60 },
  leftShin: { x: 64, y: 247, width: 42, height: 70 },
  rightThigh: { x: 96, y: 200, width: 38, height: 60 },
  rightShin: { x: 94, y: 247, width: 42, height: 70 },
};

function addPaperDoll(bones: Map<string, SVGGElement>, parts: PaperDollParts): void {
  const part = (name: PaperDollPartName) => {
    const placement = PART_PLACEMENTS[name];
    return el('image', {
      href: parts[name],
      ...placement,
      preserveAspectRatio: 'xMidYMid meet',
    });
  };

  bones.get('leftThigh')!.insertBefore(part('leftThigh'), bones.get('leftShin')!);
  bones.get('leftShin')!.appendChild(part('leftShin'));
  bones.get('rightThigh')!.insertBefore(part('rightThigh'), bones.get('rightShin')!);
  bones.get('rightShin')!.appendChild(part('rightShin'));

  const torso = bones.get('torso')!;
  torso.insertBefore(part('torso'), torso.firstChild);
  bones.get('head')!.appendChild(part('head'));
  bones.get('leftUpperArm')!.insertBefore(part('leftUpperArm'), bones.get('leftForearm')!);
  bones.get('leftForearm')!.appendChild(part('leftForearm'));
  bones.get('rightUpperArm')!.insertBefore(part('rightUpperArm'), bones.get('rightForearm')!);
  bones.get('rightForearm')!.appendChild(part('rightForearm'));
}

function addRose(parent: SVGElement, cx: number, cy: number, scale: number): void {
  const rose = el('g', { transform: `translate(${cx} ${cy}) scale(${scale})` });
  rose.append(
    el('ellipse', { cx: -7, cy: 7, rx: 6, ry: 3, fill: '#4d8065', transform: 'rotate(30)' }),
    el('circle', { cx: 0, cy: 0, r: 9, fill: '#a72e55' }),
    el('circle', { cx: -3, cy: -1, r: 5, fill: '#e46b82' }),
    el('circle', { cx: 3, cy: 2, r: 4, fill: '#c44567' }),
    el('circle', { cx: 0, cy: 0, r: 2.2, fill: '#f5b0b7' }),
  );
  parent.appendChild(rose);
}

function addStripes(parent: SVGElement): void {
  for (const y of [124, 140, 156, 172, 188]) {
    parent.appendChild(el('rect', { x: 67, y, width: 66, height: 6, rx: 2, fill: '#244c78' }));
  }
  parent.appendChild(el('rect', { x: 94, y: 112, width: 12, height: 28, rx: 4, fill: '#244c78' }));
  parent.appendChild(el('circle', { cx: 100, cy: 121, r: 2.2, fill: '#dbe5ef' }));
  parent.appendChild(el('circle', { cx: 100, cy: 130, r: 2.2, fill: '#dbe5ef' }));
}

function addCat(parent: SVGElement): void {
  const cat = el('g');
  cat.append(
    el('path', { d: 'M77,139 L83,126 L91,137 Q100,132 109,137 L117,126 L123,139 L120,161 Q100,173 80,161 Z', fill: '#d8d0c9', stroke: '#746b68', 'stroke-width': 2 }),
    el('circle', { cx: 91, cy: 148, r: 2.2, fill: INK }),
    el('circle', { cx: 109, cy: 148, r: 2.2, fill: INK }),
    el('path', { d: 'M96,156 Q100,160 104,156', fill: 'none', stroke: '#c86c83', 'stroke-width': 2, 'stroke-linecap': 'round' }),
  );
  for (const [cx, cy] of [[78, 189], [91, 198], [111, 188], [123, 202]]) {
    cat.appendChild(el('ellipse', { cx, cy, rx: 4.5, ry: 3, fill: '#8e817c', opacity: 0.65 }));
  }
  parent.appendChild(cat);
}

function addHeart(parent: SVGElement, cx: number, cy: number, scale: number, color: string): void {
  parent.appendChild(el('path', {
    d: 'M0,8 C-20,-4 -23,19 0,34 C23,19 20,-4 0,8 Z',
    fill: color,
    transform: `translate(${cx} ${cy}) scale(${scale}) translate(0 -17)`,
  }));
}
