import type { CastAppearance } from '../engine/storyTypes';
import { FaceController, type FaceElements } from './faces';
import { BONE_DEFS, VIEW_H, VIEW_W } from './svgSkeleton';

const SVG_NS = 'http://www.w3.org/2000/svg';
const INK = '#3b2f2a';
const SHOE = '#4a4652';

const DEFAULTS: Required<CastAppearance> = {
  skin: '#f2c9a0',
  hair: 'short',
  hairColor: '#2b1b12',
  shirtColor: '#5aa9e6',
  pantsColor: '#39415c',
  outfit: 'shirt',
  dressColor: '#5aa9e6',
  pattern: 'plain',
  eyeColor: '#5b4632',
  freckles: false,
  height: 1,
  build: 'average',
};

// Limb thickness. Both segments of a limb share one radius, and each joint is
// the shared round cap centered exactly on the bone pivot — that coincident
// circle is what keeps elbows and knees seamless at every bend angle.
const ARM_R = 9;
const LEG_R = 10.5;

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

/** A filled capsule: a fat round-capped stroke between two joint centers. */
function capsule(x1: number, y1: number, x2: number, y2: number, fill: string, r: number) {
  return el('line', {
    x1, y1, x2, y2,
    stroke: fill,
    'stroke-width': r * 2,
    'stroke-linecap': 'round',
  });
}

/** Builds a chibi vector character in rest pose from an appearance sheet. */
export function buildRigCharacter(appearanceIn: CastAppearance = {}): RigCharacter {
  const a = { ...DEFAULTS, ...appearanceIn };
  const isDress = a.outfit === 'dress';
  const isOnesie = a.outfit === 'onesie';
  const svg = el('svg', {
    viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
    preserveAspectRatio: 'xMidYMax meet',
  });
  svg.style.overflow = 'visible';

  // Non-bone wrapper used only for the build (body width) scale, so the
  // animator can freely overwrite every bone's transform each frame.
  const fit = el('g');
  const buildScale = a.build === 'small' ? 0.94 : a.build === 'broad' ? 1.08 : 1;
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

  // Stage order inside `fit`/`root`: legs, then torso (whose group also holds
  // the head), then arms on top. Limb roots start inside the torso silhouette
  // so no rotation can ever open a gap at a shoulder or hip.

  // ---- Legs ----
  bones.get('leftThigh')!.insertBefore(
    capsule(84, 234, 84, 272, a.pantsColor, LEG_R),
    bones.get('leftShin')!,
  );
  const leftShin = bones.get('leftShin')!;
  leftShin.appendChild(capsule(84, 272, 84, 302, a.pantsColor, LEG_R));
  leftShin.appendChild(el('ellipse', { cx: 80, cy: 309, rx: 14.5, ry: 8, fill: SHOE }));

  bones.get('rightThigh')!.insertBefore(
    capsule(116, 234, 116, 272, a.pantsColor, LEG_R),
    bones.get('rightShin')!,
  );
  const rightShin = bones.get('rightShin')!;
  rightShin.appendChild(capsule(116, 272, 116, 302, a.pantsColor, LEG_R));
  rightShin.appendChild(el('ellipse', { cx: 120, cy: 309, rx: 14.5, ry: 8, fill: SHOE }));

  // ---- Torso / outfit ----
  const torso = bones.get('torso')!;
  const outfitGroup = el('g');
  if (isDress) {
    outfitGroup.append(
      el('rect', { x: 66, y: 132, width: 68, height: 58, rx: 22, fill: a.shirtColor }),
      el('rect', { x: 66, y: 174, width: 68, height: 13, rx: 5, fill: a.dressColor }),
      el('path', {
        d: 'M64,182 Q100,192 136,182 L152,240 Q100,254 48,240 Z',
        fill: a.dressColor,
      }),
      el('path', {
        d: 'M56,238 Q100,250 144,238',
        fill: 'none',
        stroke: '#000',
        'stroke-width': 3,
        opacity: 0.18,
      }),
    );
    if (a.pattern === 'roses') {
      addRose(outfitGroup, 82, 152, 0.66);
      addRose(outfitGroup, 110, 144, 0.58);
      addRose(outfitGroup, 121, 168, 0.66);
      addRose(outfitGroup, 91, 172, 0.5);
      addRose(outfitGroup, 74, 216, 0.6);
      addRose(outfitGroup, 126, 220, 0.62);
    }
  } else if (isOnesie) {
    outfitGroup.append(
      el('rect', { x: 62, y: 132, width: 76, height: 96, rx: 30, fill: a.shirtColor }),
      el('path', {
        d: 'M70,212 Q100,226 130,212 L127,244 L106,244 L100,230 L94,244 L73,244 Z',
        fill: a.shirtColor,
      }),
    );
    if (a.pattern === 'heart') addHeart(outfitGroup, 100, 168, 0.7, a.dressColor);
  } else {
    outfitGroup.appendChild(
      el('rect', { x: 64, y: 132, width: 72, height: 106, rx: 26, fill: a.shirtColor }),
    );
    if (a.pattern === 'stripes') addStripes(outfitGroup);
    if (a.pattern === 'cat') addCat(outfitGroup);
    if (a.pattern === 'heart') addHeart(outfitGroup, 100, 168, 0.7, a.dressColor);
  }
  torso.insertBefore(outfitGroup, torso.firstChild);

  // ---- Head ----
  const head = bones.get('head')!;
  const backHair = el('g');
  head.appendChild(backHair);
  addBackHair(backHair, a);

  head.appendChild(el('circle', { cx: 100, cy: 74, r: 56, fill: a.skin }));

  const topHair = el('g');
  head.appendChild(topHair);
  addTopHair(topHair, a);

  const faceEls = addFace(head, a);

  // ---- Arms (topmost, so hands can cover the face when crying) ----
  // Sleeves always match the torso color so the arm root disappears into the
  // body silhouette — no visible seam at the shoulder, at any rotation.
  const sleeveColor = a.shirtColor;

  const leftUpper = bones.get('leftUpperArm')!;
  leftUpper.insertBefore(
    capsule(72, 150, 60, 188, sleeveColor, ARM_R),
    bones.get('leftForearm')!,
  );
  const leftFore = bones.get('leftForearm')!;
  leftFore.appendChild(capsule(60, 188, 54, 208, a.skin, ARM_R));
  leftFore.appendChild(el('circle', { cx: 53, cy: 212, r: 10.5, fill: a.skin }));

  const rightUpper = bones.get('rightUpperArm')!;
  rightUpper.insertBefore(
    capsule(128, 150, 140, 188, sleeveColor, ARM_R),
    bones.get('rightForearm')!,
  );
  const rightFore = bones.get('rightForearm')!;
  rightFore.appendChild(capsule(140, 188, 146, 208, a.skin, ARM_R));
  rightFore.appendChild(el('circle', { cx: 147, cy: 212, r: 10.5, fill: a.skin }));

  return { svg, bones, face: new FaceController(faceEls), appearance: a };
}

// ---------------------------------------------------------------------------
// Face
// ---------------------------------------------------------------------------

function addFace(head: SVGGElement, a: Required<CastAppearance>): FaceElements {
  const faceGroup = el('g');
  head.appendChild(faceGroup);

  const browAttrs = {
    fill: 'none',
    stroke: a.hairColor,
    'stroke-width': 4.2,
    'stroke-linecap': 'round',
  } as const;
  const browL = el('path', { ...browAttrs, d: 'M66,49 Q78,44 90,49' });
  const browR = el('path', { ...browAttrs, d: 'M110,49 Q122,44 134,49' });
  faceGroup.append(browL, browR);

  // Big sparkly chibi eyes — static apart from the blink.
  const eyesOpen = el('g');
  for (const cx of [78, 122]) {
    eyesOpen.append(
      el('ellipse', { cx, cy: 73, rx: 13.5, ry: 16.5, fill: '#fff' }),
      el('circle', { cx, cy: 76, r: 8.8, fill: a.eyeColor }),
      el('circle', { cx, cy: 77, r: 4.6, fill: '#2c2320' }),
      el('circle', { cx: cx - 3.4, cy: 70.5, r: 3.1, fill: '#fff' }),
      el('circle', { cx: cx + 3.6, cy: 80, r: 1.7, fill: '#fff' }),
      el('path', {
        d: `M${cx - 13.5},67 Q${cx},57.5 ${cx + 13.5},67`,
        fill: 'none',
        stroke: INK,
        'stroke-width': 2.4,
        'stroke-linecap': 'round',
      }),
    );
  }

  const eyesClosed = el('g');
  eyesClosed.style.display = 'none';
  eyesClosed.append(
    el('path', {
      d: 'M65,74 Q78,82 91,74',
      fill: 'none', stroke: INK, 'stroke-width': 3.6, 'stroke-linecap': 'round',
    }),
    el('path', {
      d: 'M109,74 Q122,82 135,74',
      fill: 'none', stroke: INK, 'stroke-width': 3.6, 'stroke-linecap': 'round',
    }),
  );
  faceGroup.append(eyesOpen, eyesClosed);

  faceGroup.appendChild(el('path', {
    d: 'M96,90 q4,3.5 8,0',
    fill: 'none',
    stroke: INK,
    'stroke-width': 2.2,
    'stroke-linecap': 'round',
    opacity: 0.4,
  }));

  faceGroup.append(
    el('ellipse', { cx: 58, cy: 94, rx: 8.5, ry: 5.5, fill: '#f79bb0', opacity: 0.45 }),
    el('ellipse', { cx: 142, cy: 94, rx: 8.5, ry: 5.5, fill: '#f79bb0', opacity: 0.45 }),
  );

  if (a.freckles) {
    for (const [cx, cy] of [[62, 88], [68, 92], [57, 92.5], [138, 88], [132, 92], [143, 92.5]]) {
      faceGroup.appendChild(el('circle', { cx, cy, r: 1.5, fill: '#c08355', opacity: 0.8 }));
    }
  }

  const tears = el('g');
  tears.style.display = 'none';
  tears.append(
    el('ellipse', { cx: 78, cy: 96, rx: 3.2, ry: 5.4, fill: '#7ec8ff' }),
    el('ellipse', { cx: 122, cy: 96, rx: 3.2, ry: 5.4, fill: '#7ec8ff' }),
  );
  faceGroup.appendChild(tears);

  const mouth = el('path', {
    d: 'M92,101 Q100,107 108,101',
    fill: 'none',
    stroke: INK,
    'stroke-width': 3.4,
    'stroke-linecap': 'round',
  });
  faceGroup.appendChild(mouth);

  return { browL, browR, eyesOpen, eyesClosed, mouth, tears, inkColor: INK };
}

// ---------------------------------------------------------------------------
// Hair (head circle: center (100,74), r=56 — top y=18, sides x=44/156)
// ---------------------------------------------------------------------------

/** The classic fringe cap most styles build on. */
function hairCap(color: string) {
  return el('path', {
    d: 'M44,74 A56,56 0 0 1 156,74 Q147,46 100,46 Q53,46 44,74 Z',
    fill: color,
  });
}

function addBackHair(g: SVGGElement, a: Required<CastAppearance>): void {
  const c = a.hairColor;
  switch (a.hair) {
    case 'pigtails':
      g.append(
        el('circle', { cx: 33, cy: 50, r: 17, fill: c }),
        el('circle', { cx: 26, cy: 72, r: 13, fill: c }),
        el('circle', { cx: 167, cy: 50, r: 17, fill: c }),
        el('circle', { cx: 174, cy: 72, r: 13, fill: c }),
      );
      return;
    case 'sidePonytail':
      g.append(
        el('circle', { cx: 162, cy: 52, r: 16, fill: c }),
        el('circle', { cx: 170, cy: 74, r: 13, fill: c }),
        el('circle', { cx: 165, cy: 95, r: 11, fill: c }),
      );
      return;
    case 'curlyPonytail':
      g.append(
        el('circle', { cx: 156, cy: 44, r: 15, fill: c }),
        el('circle', { cx: 166, cy: 62, r: 13, fill: c }),
        el('circle', { cx: 158, cy: 80, r: 11, fill: c }),
      );
      return;
    case 'long':
      g.append(
        el('path', { d: 'M45,60 Q30,130 45,170 Q60,178 72,168 Q58,115 60,80 Z', fill: c }),
        el('path', { d: 'M155,60 Q170,130 155,170 Q140,178 128,168 Q142,115 140,80 Z', fill: c }),
      );
      return;
    default:
      return;
  }
}

function addTopHair(g: SVGGElement, a: Required<CastAppearance>): void {
  const c = a.hairColor;
  switch (a.hair) {
    case 'babyWisps': {
      const wisp = (d: string) =>
        el('path', { d, fill: 'none', stroke: c, 'stroke-width': 5.5, 'stroke-linecap': 'round' });
      g.append(
        wisp('M84,26 Q94,8 104,26'),
        wisp('M100,24 Q112,8 118,28'),
        wisp('M64,44 Q72,26 86,30'),
      );
      return;
    }
    case 'spiky':
      g.append(
        el('path', {
          d: 'M46,66 L60,30 L74,50 L94,20 L110,48 L126,26 L140,50 L152,66 Z',
          fill: c,
        }),
        hairCap(c),
      );
      return;
    case 'curly':
      for (const [cx, cy, r] of [[54, 48, 15], [74, 32, 16], [100, 26, 16], [126, 32, 16], [146, 48, 15]]) {
        g.appendChild(el('circle', { cx, cy, r, fill: c }));
      }
      g.appendChild(hairCap(c));
      return;
    case 'curlyPonytail':
      g.appendChild(hairCap(c));
      for (const [cx, cy, r] of [[52, 46, 13], [68, 32, 14], [90, 25, 14], [112, 26, 14], [132, 34, 13], [148, 46, 12]]) {
        g.appendChild(el('circle', { cx, cy, r, fill: c }));
      }
      g.appendChild(el('circle', { cx: 146, cy: 36, r: 5.5, fill: '#d6b4d8' }));
      return;
    case 'pigtails':
      g.append(
        hairCap(c),
        el('circle', { cx: 45, cy: 47, r: 5.5, fill: '#77a765' }),
        el('circle', { cx: 155, cy: 47, r: 5.5, fill: '#77a765' }),
      );
      return;
    case 'sidePonytail':
      g.append(
        hairCap(c),
        el('path', { d: 'M52,64 Q66,34 106,32 Q94,44 88,58 Q68,54 56,72 Z', fill: c }),
        el('circle', { cx: 150, cy: 43, r: 6.5, fill: a.dressColor }),
      );
      return;
    default:
      // short, long, and anything unrecognized get the fringe cap.
      g.appendChild(hairCap(c));
  }
}

// ---------------------------------------------------------------------------
// Outfit patterns
// ---------------------------------------------------------------------------

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
  for (const y of [150, 166, 182, 198, 214]) {
    parent.appendChild(el('rect', { x: 66, y, width: 68, height: 6.5, rx: 3, fill: '#244c78' }));
  }
  parent.appendChild(el('rect', { x: 94, y: 132, width: 12, height: 26, rx: 4, fill: '#244c78' }));
  parent.appendChild(el('circle', { cx: 100, cy: 141, r: 2.2, fill: '#dbe5ef' }));
  parent.appendChild(el('circle', { cx: 100, cy: 150, r: 2.2, fill: '#dbe5ef' }));
}

function addCat(parent: SVGElement): void {
  const cat = el('g', { transform: 'translate(0 32)' });
  cat.append(
    el('path', { d: 'M77,139 L83,126 L91,137 Q100,132 109,137 L117,126 L123,139 L120,161 Q100,173 80,161 Z', fill: '#d8d0c9', stroke: '#746b68', 'stroke-width': 2 }),
    el('circle', { cx: 91, cy: 148, r: 2.2, fill: INK }),
    el('circle', { cx: 109, cy: 148, r: 2.2, fill: INK }),
    el('path', { d: 'M96,156 Q100,160 104,156', fill: 'none', stroke: '#c86c83', 'stroke-width': 2, 'stroke-linecap': 'round' }),
  );
  for (const [cx, cy] of [[80, 185], [92, 193], [110, 184], [121, 195]]) {
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
